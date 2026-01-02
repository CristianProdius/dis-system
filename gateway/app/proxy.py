import httpx
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException
from .config import config
from .load_balancer import lb_manager

class ProxyManager:
    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None

    async def start(self):
        self.client = httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT)

    async def stop(self):
        if self.client:
            await self.client.aclose()

    def get_service_for_path(self, path: str) -> str:
        if path.startswith("/marketplace"):
            return "marketplace"
        elif path.startswith("/discourse"):
            return "discourse"
        else:
            raise HTTPException(status_code=404, detail="Service not found")

    async def proxy_request(
        self,
        method: str,
        path: str,
        user_id: Optional[str] = None,
        body: Optional[Dict[str, Any]] = None,
        query_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        if not self.client:
            raise HTTPException(status_code=500, detail="Proxy not initialized")

        service_name = self.get_service_for_path(path)
        replica = lb_manager.get_next_replica(service_name)

        url = f"http://{replica}{path}"

        request_headers = {}
        if user_id:
            request_headers["X-User-Id"] = user_id

        if headers:
            for key, value in headers.items():
                if key.lower() not in ["host", "content-length", "authorization"]:
                    request_headers[key] = value

        try:
            response = await self.client.request(
                method=method,
                url=url,
                params=query_params,
                json=body if body else None,
                headers=request_headers,
            )

            try:
                response_data = response.json()
            except:
                response_data = {"data": response.text}

            return {
                "status_code": response.status_code,
                "data": response_data,
                "replica": replica,
            }

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail=f"Request to {service_name} timed out")
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


proxy_manager = ProxyManager()
