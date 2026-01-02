import jwt
import uuid
import json
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis.asyncio as aioredis
from .config import config

security = HTTPBearer()

class AuthManager:
    def __init__(self):
        self.client: Optional[aioredis.Redis] = None

    async def connect(self):
        self.client = aioredis.from_url(config.REDIS_URL, decode_responses=True)

    async def disconnect(self):
        if self.client:
            await self.client.close()

    def create_access_token(self, user_id: str, username: str) -> str:
        expire = datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS)
        payload = {
            "sub": user_id,
            "username": username,
            "exp": expire,
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)

    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(
                token,
                config.JWT_SECRET,
                algorithms=[config.JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    async def register_user(self, username: str, password: str) -> dict:
        if not self.client:
            raise HTTPException(status_code=500, detail="Database not available")

        existing = await self.client.get(f"user:{username}")
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

        user_id = str(uuid.uuid4())
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        user_data = {
            "id": user_id,
            "username": username,
            "password_hash": password_hash,
            "created_at": datetime.utcnow().isoformat(),
        }

        await self.client.set(f"user:{username}", json.dumps(user_data))

        return {
            "id": user_id,
            "username": username,
        }

    async def authenticate_user(self, username: str, password: str) -> dict:
        if not self.client:
            raise HTTPException(status_code=500, detail="Database not available")

        user_data = await self.client.get(f"user:{username}")
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = json.loads(user_data)

        if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = self.create_access_token(user["id"], user["username"])

        return {
            "token": token,
            "user_id": user["id"],
            "username": user["username"],
        }


auth_manager = AuthManager()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    token = credentials.credentials
    payload = auth_manager.verify_token(token)
    return {
        "user_id": payload["sub"],
        "username": payload["username"],
    }
