"""Async LLM client with retry and logging."""

from __future__ import annotations

import logging
import time

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
)

from config.settings import settings

logger = logging.getLogger("singoo.llm")


class LLMError(Exception):
    """Raised when all retries are exhausted."""


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.TimeoutException):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    return False


class LLMClient:
    def __init__(self) -> None:
        self._base_url = settings.llm_base_url.rstrip("/")
        api_key = settings.llm_api_key.get_secret_value()
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception(_is_retryable),
        reraise=True,
    )
    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        """Send a chat completion request with retry on 5xx/timeout."""
        url = f"{self._base_url}/chat/completions"
        model_name = model or settings.router_model
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        t0 = time.monotonic()
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=self._headers)
            response.raise_for_status()
            data = response.json()
        elapsed = time.monotonic() - t0
        msg = data["choices"][0]["message"]
        content = msg.get("content", "") or msg.get("reasoning_content", "")
        logger.info(
            "LLM call model=%s tokens=%s latency=%.2fs content_len=%d",
            model_name,
            data.get("usage", {}).get("total_tokens", "?"),
            elapsed,
            len(content),
        )
        return content


# Module-level singleton
llm_client = LLMClient()
