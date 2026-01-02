"""
LLM Client for AI Agents
Supports vLLM for high-performance inference on H100
"""

import asyncio
import json
import os
import re
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
import httpx


def extract_json_from_response(response: str) -> str:
    """
    Extract JSON from LLM responses that may contain <think> tags or other text.
    Handles Qwen3 and other models that output chain-of-thought before JSON.
    """
    # Remove <think>...</think> blocks (complete or incomplete)
    response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
    # Also remove unclosed <think> tags
    response = re.sub(r'<think>.*$', '', response, flags=re.DOTALL)

    # Find the first { and try to extract balanced JSON
    start_idx = response.find('{')
    if start_idx == -1:
        return response.strip()

    # Count braces to find matching closing brace
    depth = 0
    in_string = False
    escape_next = False

    for i, char in enumerate(response[start_idx:], start=start_idx):
        if escape_next:
            escape_next = False
            continue
        if char == '\\' and in_string:
            escape_next = True
            continue
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                json_str = response[start_idx:i+1]
                # Validate it's actual JSON
                try:
                    json.loads(json_str)
                    return json_str
                except json.JSONDecodeError:
                    # Try to clean it up
                    pass
                return json_str

    # If we couldn't find balanced braces, try regex as fallback
    json_match = re.search(r'\{.*\}', response, flags=re.DOTALL)
    if json_match:
        return json_match.group()

    # If no JSON found, return original (will fail parsing and trigger fallback)
    return response.strip()


class LLMClient(ABC):
    """Abstract base class for LLM clients"""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str, max_tokens: int = 1024) -> str:
        pass

    @abstractmethod
    async def batch_generate(self, prompts: List[Dict[str, str]], max_tokens: int = 1024) -> List[str]:
        pass


class VLLMClient(LLMClient):
    """
    vLLM client for high-performance inference on H100
    Supports continuous batching for 100+ concurrent agents
    """

    def __init__(
        self,
        base_url: str = "http://localhost:8080",
        model: str = "meta-llama/Llama-3.1-70B-Instruct",
        timeout: float = 120.0,  # Increased timeout for large batches
        max_tokens: int = 2048,  # Increased to allow thinking + JSON response
    ):
        self.base_url = base_url
        self.model = model
        self.timeout = timeout
        self.max_tokens = max_tokens
        self.client = httpx.AsyncClient(timeout=timeout)
        print(f"[VLLMClient] Initialized with base_url={base_url}, model={model}, timeout={timeout}, max_tokens={max_tokens}", flush=True)

    async def generate(self, prompt: str, system_prompt: str, max_tokens: int = None) -> str:
        """Generate a single response"""
        # Use instance max_tokens if not specified
        tokens = max_tokens if max_tokens is not None else self.max_tokens

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        try:
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": tokens,
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            # Extract JSON from response (handles <think> tags from Qwen3)
            return extract_json_from_response(content)
        except Exception as e:
            print(f"vLLM generation error: {e}")
            return json.dumps({
                "reasoning": "Error generating response",
                "action": "WAIT",
                "params": {},
                "emotion": "confused"
            })

    async def batch_generate(
        self,
        prompts: List[Dict[str, str]],
        max_tokens: int = None
    ) -> List[str]:
        """
        Batch generate responses for multiple agents
        vLLM handles continuous batching automatically for optimal GPU utilization
        """
        # Use instance max_tokens if not specified
        tokens = max_tokens if max_tokens is not None else self.max_tokens
        tasks = [
            self.generate(p["prompt"], p["system_prompt"], tokens)
            for p in prompts
        ]
        return await asyncio.gather(*tasks)

    async def close(self):
        await self.client.aclose()


class OllamaClient(LLMClient):
    """
    Ollama client for local development on MacBook
    Uses smaller models like Llama 3 8B or Mistral 7B
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3.1:8b",
        timeout: float = 120.0
    ):
        self.base_url = base_url
        self.model = model
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def generate(self, prompt: str, system_prompt: str, max_tokens: int = 1024) -> str:
        """Generate using Ollama API"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": 0.7,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
        except Exception as e:
            print(f"Ollama generation error: {e}")
            return json.dumps({
                "reasoning": "Error generating response",
                "action": "WAIT",
                "params": {},
                "emotion": "confused"
            })

    async def batch_generate(
        self,
        prompts: List[Dict[str, str]],
        max_tokens: int = 1024
    ) -> List[str]:
        """Batch generate (sequential for Ollama, parallel for vLLM)"""
        # Ollama doesn't support true batching, so we run sequentially
        # For production with many agents, use vLLM instead
        results = []
        for p in prompts:
            result = await self.generate(p["prompt"], p["system_prompt"], max_tokens)
            results.append(result)
        return results

    async def close(self):
        await self.client.aclose()


class AnthropicClient(LLMClient):
    """
    Claude API client for high-quality reasoning
    Good for complex negotiations and strategy
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-20250514",
        timeout: float = 60.0
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.model = model
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers={
                "x-api-key": self.api_key,
                "content-type": "application/json",
                "anthropic-version": "2023-06-01"
            }
        )
        self.base_url = "https://api.anthropic.com/v1"

    async def generate(self, prompt: str, system_prompt: str, max_tokens: int = 1024) -> str:
        """Generate using Claude API"""
        try:
            response = await self.client.post(
                f"{self.base_url}/messages",
                json={
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]
        except Exception as e:
            print(f"Anthropic generation error: {e}")
            return json.dumps({
                "reasoning": "Error generating response",
                "action": "WAIT",
                "params": {},
                "emotion": "confused"
            })

    async def batch_generate(
        self,
        prompts: List[Dict[str, str]],
        max_tokens: int = 1024
    ) -> List[str]:
        """Batch generate with rate limiting for API"""
        tasks = [
            self.generate(p["prompt"], p["system_prompt"], max_tokens)
            for p in prompts
        ]
        # Add small delay between requests to respect rate limits
        results = []
        for task in tasks:
            result = await task
            results.append(result)
            await asyncio.sleep(0.1)  # 100ms between requests
        return results

    async def close(self):
        await self.client.aclose()


def get_llm_client(provider: str = "vllm", **kwargs) -> LLMClient:
    """Factory function to get the appropriate LLM client"""
    providers = {
        "vllm": VLLMClient,
        "ollama": OllamaClient,
        "anthropic": AnthropicClient,
    }

    if provider not in providers:
        raise ValueError(f"Unknown provider: {provider}. Available: {list(providers.keys())}")

    return providers[provider](**kwargs)
