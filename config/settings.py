from __future__ import annotations

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "SINGOO_", "env_file": ".env", "extra": "ignore"}

    # LLM endpoints
    router_model: str = "mock"
    sales_model: str = "mock"
    extractor_model: str = "mock"
    llm_base_url: str = "http://localhost:8000/v1"
    llm_api_key: SecretStr = SecretStr("")

    # RAG
    rag_docs_path: str = "data/knowledge"
    rag_collection_name: str = "singoo_products"

    # Thread store (json or sqlite)
    store_backend: str = "json"
    thread_store_dir: str = "data/threads"
    sqlite_db_path: str = "data/singoo.db"

    # Server
    host: str = "127.0.0.1"
    port: int = 8000

    # Pipeline
    max_turns: int = 5
    mock_mode: bool = True

    # API auth (empty = disabled)
    api_auth_token: SecretStr = SecretStr("")

    # CRM export
    crm_webhook_url: str = ""


settings = Settings()
