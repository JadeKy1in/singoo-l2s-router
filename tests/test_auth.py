"""PICA-Unit: Auth middleware tests."""

import pytest
from fastapi.testclient import TestClient

from config.settings import settings


class TestAuthDisabled:
    """When api_auth_token is empty, all requests pass."""

    @pytest.fixture(autouse=True)
    def _reset(self):
        # Ensure auth is disabled for these tests
        old = settings.api_auth_token.get_secret_value()
        settings.api_auth_token._secret_value = ""
        yield
        settings.api_auth_token._secret_value = old

    def test_create_thread_no_auth(self):
        from app import app
        client = TestClient(app)
        resp = client.post("/thread", json={
            "user_message": "Buy solar panels",
            "lead_source": "WhatsApp",
        })
        assert resp.status_code == 201

    def test_health_no_auth(self):
        from app import app
        client = TestClient(app)
        resp = client.get("/health")
        assert resp.status_code == 200


class TestAuthEnabled:
    """When api_auth_token is set, protected routes require auth."""

    @pytest.fixture(autouse=True)
    def _set_token(self):
        old = settings.api_auth_token.get_secret_value()
        settings.api_auth_token._secret_value = "test-token-123"
        yield
        settings.api_auth_token._secret_value = old

    def test_no_token_returns_401(self):
        from app import app
        client = TestClient(app)
        resp = client.post("/thread", json={
            "user_message": "Test",
            "lead_source": "WhatsApp",
        })
        assert resp.status_code == 401

    def test_wrong_token_returns_401(self):
        from app import app
        client = TestClient(app)
        resp = client.post("/thread", json={
            "user_message": "Test",
        }, headers={"Authorization": "Bearer wrong-token"})
        assert resp.status_code == 401

    def test_correct_token_passes(self):
        from app import app
        client = TestClient(app)
        resp = client.post("/thread", json={
            "user_message": "Buy solar panels",
            "lead_source": "WhatsApp",
        }, headers={"Authorization": "Bearer test-token-123"})
        assert resp.status_code == 201

    def test_health_always_public(self):
        from app import app
        client = TestClient(app)
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_root_returns_404_when_no_dashboard(self):
        from app import app
        client = TestClient(app)
        resp = client.get("/")
        assert resp.status_code == 404
