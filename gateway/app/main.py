import time
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import config
from .auth import auth_manager, get_current_user
from .cache import cache_manager
from .proxy import proxy_manager
from .load_balancer import lb_manager
from .metrics import (
    http_requests_total,
    http_request_duration,
    get_metrics,
    get_content_type,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    lb_manager.register_service("marketplace", config.MARKETPLACE_REPLICAS)
    lb_manager.register_service("discourse", config.DISCOURSE_REPLICAS)

    await cache_manager.connect()
    await auth_manager.connect()
    await proxy_manager.start()

    print("Gateway started")
    print(f"Marketplace replicas: {config.MARKETPLACE_REPLICAS}")
    print(f"Discourse replicas: {config.DISCOURSE_REPLICAS}")

    yield

    await proxy_manager.stop()
    await cache_manager.disconnect()
    await auth_manager.disconnect()
    print("Gateway stopped")


app = FastAPI(
    title="Capitalism Simulation API Gateway",
    description="API Gateway for the Capitalism Simulation microservices",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateItemRequest(BaseModel):
    name: str
    description: str
    category: str
    price: float
    currency: Optional[str] = "USD"
    isPremium: Optional[bool] = False
    tags: Optional[list] = []


class PurchaseRequest(BaseModel):
    itemId: str


class CreateChannelRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: Optional[str] = "public"
    zone: Optional[str] = None


class CreatePostRequest(BaseModel):
    channelId: int
    content: str
    title: Optional[str] = None
    topic: Optional[str] = "general"


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time
    path = request.url.path

    http_requests_total.labels(
        method=request.method,
        path=path,
        status=response.status_code
    ).inc()

    http_request_duration.labels(
        method=request.method,
        path=path
    ).observe(duration)

    return response


@app.get("/", tags=["Health"])
async def root():
    """API Gateway root endpoint"""
    return {
        "service": "Capitalism Simulation API Gateway",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "/status",
        "endpoints": {
            "auth": ["/auth/register", "/auth/login"],
            "marketplace": ["/marketplace/list", "/marketplace/item/{id}", "/marketplace/item", "/marketplace/purchase"],
            "discourse": ["/discourse/channels", "/discourse/channel/{id}", "/discourse/channel", "/discourse/post"],
            "monitoring": ["/status", "/metrics"]
        }
    }


@app.post("/auth/register", tags=["Authentication"])
async def register(data: RegisterRequest):
    """Register a new user"""
    result = await auth_manager.register_user(data.username, data.password)
    return result


@app.post("/auth/login", tags=["Authentication"])
async def login(data: LoginRequest):
    """Login and get JWT token"""
    result = await auth_manager.authenticate_user(data.username, data.password)
    return result


async def proxy_get_with_cache(path: str, request: Request, user: dict) -> Dict[str, Any]:
    query_string = str(request.query_params) if request.query_params else ""
    cache_key = cache_manager.generate_key("GET", path, query_string)

    cached = await cache_manager.get(cache_key)
    if cached:
        return cached

    result = await proxy_manager.proxy_request(
        method="GET",
        path=path,
        user_id=user["user_id"],
        query_params=dict(request.query_params) if request.query_params else None,
    )

    if result["status_code"] == 200:
        await cache_manager.set(cache_key, result["data"])

    if result["status_code"] >= 400:
        raise HTTPException(status_code=result["status_code"], detail=result["data"])

    return result["data"]


async def proxy_post(path: str, body: dict, user: dict) -> Dict[str, Any]:
    result = await proxy_manager.proxy_request(
        method="POST",
        path=path,
        user_id=user["user_id"],
        body=body,
    )

    if result["status_code"] >= 400:
        raise HTTPException(status_code=result["status_code"], detail=result["data"])

    return result["data"]


@app.get("/marketplace/list", tags=["Marketplace"])
async def list_items(request: Request, user: dict = Depends(get_current_user)):
    """List all marketplace items (cached)"""
    return await proxy_get_with_cache("/marketplace/list", request, user)


@app.get("/marketplace/item/{item_id}", tags=["Marketplace"])
async def get_item(item_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Get a specific marketplace item (cached)"""
    return await proxy_get_with_cache(f"/marketplace/item/{item_id}", request, user)


@app.post("/marketplace/item", tags=["Marketplace"])
async def create_item(data: CreateItemRequest, user: dict = Depends(get_current_user)):
    """Create a new marketplace listing"""
    await cache_manager.invalidate_pattern("cache:GET:/marketplace/*")
    return await proxy_post("/marketplace/item", data.model_dump(), user)


@app.post("/marketplace/purchase", tags=["Marketplace"])
async def purchase_item(data: PurchaseRequest, user: dict = Depends(get_current_user)):
    """Purchase a marketplace item"""
    await cache_manager.invalidate_pattern("cache:GET:/marketplace/*")
    return await proxy_post("/marketplace/purchase", data.model_dump(), user)


@app.get("/discourse/channels", tags=["Discourse"])
async def list_channels(request: Request, user: dict = Depends(get_current_user)):
    """List all discourse channels (cached)"""
    return await proxy_get_with_cache("/discourse/channels", request, user)


@app.get("/discourse/channel/{channel_id}", tags=["Discourse"])
async def get_channel(channel_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Get a specific discourse channel with posts (cached)"""
    return await proxy_get_with_cache(f"/discourse/channel/{channel_id}", request, user)


@app.post("/discourse/channel", tags=["Discourse"])
async def create_channel(data: CreateChannelRequest, user: dict = Depends(get_current_user)):
    """Create a new discourse channel"""
    await cache_manager.invalidate_pattern("cache:GET:/discourse/*")
    return await proxy_post("/discourse/channel", data.model_dump(), user)


@app.post("/discourse/post", tags=["Discourse"])
async def create_post(data: CreatePostRequest, user: dict = Depends(get_current_user)):
    """Create a new post in a discourse channel"""
    await cache_manager.invalidate_pattern("cache:GET:/discourse/*")
    return await proxy_post("/discourse/post", data.model_dump(), user)


@app.get("/status", tags=["Health"])
async def status():
    """Gateway health check"""
    cache_stats = cache_manager.get_stats()
    lb_stats = lb_manager.get_all_stats()

    return {
        "status": "healthy",
        "service": "gateway",
        "cache": cache_stats,
        "load_balancer": lb_stats,
    }


@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=get_metrics(),
        media_type=get_content_type()
    )
