"""Simple token-based API authentication middleware."""

from __future__ import annotations

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config.settings import settings


class AuthMiddleware(BaseHTTPMiddleware):
    """Validates Bearer token on protected routes.

    Protected paths: /thread*, /threads*
    Public paths: /, /health, /docs, /openapi.json
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Public paths
        if path in ("/", "/health", "/docs", "/openapi.json", "/favicon.ico"):
            return await call_next(request)

        # Allow OPTIONS for CORS
        if request.method == "OPTIONS":
            return await call_next(request)

        # Auth disabled — skip check
        if not settings.api_auth_token:
            return await call_next(request)

        # Verify token
        auth_header = request.headers.get("Authorization", "")
        expected = f"Bearer {settings.api_auth_token.get_secret_value()}"

        if not auth_header or auth_header != expected:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or missing API token"},
            )

        return await call_next(request)
