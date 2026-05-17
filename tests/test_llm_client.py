"""PICA-Unit: LLM client tests (mock network)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from agents.llm_client import LLMClient


def _mock_httpx_response(json_body: dict):
    """Build a mock httpx response. raise_for_status and json are sync."""
    resp = MagicMock()
    resp.raise_for_status = MagicMock()
    resp.json = MagicMock(return_value=json_body)
    return resp


class TestLLMClient:
    def test_constructor_reads_settings(self):
        from config.settings import settings
        client = LLMClient()
        # Verify constructor delegates to Settings, not a hardcoded value
        assert client._base_url == settings.llm_base_url.rstrip("/")
        assert "Authorization" in client._headers

    @pytest.mark.asyncio
    async def test_chat_completion_returns_content(self):
        client = LLMClient()
        mock_resp = _mock_httpx_response(
            {"choices": [{"message": {"content": "Lead_Gen"}}]}
        )
        mock_post = AsyncMock(return_value=mock_resp)

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value.post = mock_post
            result = await client.chat_completion(
                messages=[{"role": "user", "content": "I want to buy solar panels"}],
                model="test-model",
                temperature=0.0,
                max_tokens=10,
            )
            assert result == "Lead_Gen"

    @pytest.mark.asyncio
    async def test_chat_completion_posts_correct_url(self):
        client = LLMClient()
        mock_resp = _mock_httpx_response(
            {"choices": [{"message": {"content": "Support"}}]}
        )
        mock_post = AsyncMock(return_value=mock_resp)

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value.post = mock_post
            result = await client.chat_completion(
                messages=[{"role": "user", "content": "Broken inverter"}],
                model="deepseek-v4-flash",
            )
            assert result == "Support"

    @pytest.mark.asyncio
    async def test_chat_completion_raises_on_http_error(self):
        client = LLMClient()
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock(
            side_effect=Exception("HTTP 500")
        )
        mock_post = AsyncMock(return_value=mock_resp)

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value.post = mock_post
            with pytest.raises(Exception, match="HTTP 500"):
                await client.chat_completion(
                    messages=[{"role": "user", "content": "test"}],
                )
