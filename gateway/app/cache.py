import json
import hashlib
from typing import Optional, Any
import redis.asyncio as redis
from .config import config

class CacheManager:
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.hits = 0
        self.misses = 0

    async def connect(self):
        self.client = redis.from_url(config.REDIS_URL, decode_responses=True)
        await self.client.ping()

    async def disconnect(self):
        if self.client:
            await self.client.close()

    def generate_key(self, method: str, path: str, query: str = "") -> str:
        key_data = f"{method}:{path}:{query}"
        hash_suffix = hashlib.md5(key_data.encode()).hexdigest()[:8]
        return f"cache:{method}:{path}:{hash_suffix}"

    async def get(self, key: str) -> Optional[Any]:
        if not self.client:
            return None

        try:
            data = await self.client.get(key)
            if data:
                self.hits += 1
                return json.loads(data)
            self.misses += 1
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            self.misses += 1
            return None

    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        if not self.client:
            return False

        try:
            ttl = ttl or config.CACHE_TTL
            await self.client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        if not self.client:
            return 0

        try:
            keys = []
            async for key in self.client.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                await self.client.delete(*keys)
            return len(keys)
        except Exception as e:
            print(f"Cache invalidate error: {e}")
            return 0

    def get_stats(self) -> dict:
        total = self.hits + self.misses
        hit_ratio = (self.hits / total * 100) if total > 0 else 0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total": total,
            "hit_ratio": round(hit_ratio, 2),
        }


cache_manager = CacheManager()
