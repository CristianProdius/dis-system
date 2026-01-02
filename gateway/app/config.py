import os
from typing import List

class Config:
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "60"))

    MARKETPLACE_REPLICAS: List[str] = os.getenv(
        "MARKETPLACE_REPLICAS",
        "localhost:3001,localhost:3002,localhost:3003"
    ).split(",")

    DISCOURSE_REPLICAS: List[str] = os.getenv(
        "DISCOURSE_REPLICAS",
        "localhost:4001,localhost:4002,localhost:4003"
    ).split(",")

    REQUEST_TIMEOUT: float = float(os.getenv("REQUEST_TIMEOUT", "30.0"))

config = Config()
