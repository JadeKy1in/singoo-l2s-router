"""Singoo L2S-Router — FastAPI entry point.

B2B multi-agent lead-to-sale orchestrator PoC.
"""

from __future__ import annotations

from fastapi import FastAPI

from api.handlers import (
    handle_create_thread,
    handle_export_lead,
    handle_get_thread,
    handle_human_reply,
    handle_list_pending_exports,
    handle_list_threads,
    handle_reply,
)
from api.models import CreateThreadRequest, ReplyRequest
from auth import AuthMiddleware
from config.settings import settings
from dashboard import router as dashboard_router
from graph.workflow import create_workflow

app = FastAPI(title="Singoo L2S-Router", version="0.3.0")

# Auth middleware (no-op if api_auth_token not set)
app.add_middleware(AuthMiddleware)

# Dashboard at /
app.include_router(dashboard_router)

workflow = create_workflow().compile()


def _get_store():
    if settings.store_backend == "sqlite":
        from storage.sqlite_store import SqliteStore
        return SqliteStore(db_path=settings.sqlite_db_path)
    from storage.thread_store import ThreadStore
    return ThreadStore(base_dir=settings.thread_store_dir)


@app.post("/thread", status_code=201)
async def create_thread(req: CreateThreadRequest):
    return await handle_create_thread(
        user_message=req.user_message,
        lead_source=req.lead_source,
        store=_get_store(),
        workflow=workflow,
    )


@app.post("/thread/{session_id}/reply", status_code=200)
async def reply_to_thread(session_id: str, req: ReplyRequest):
    return await handle_reply(
        session_id=session_id,
        user_message=req.user_message,
        store=_get_store(),
        workflow=workflow,
    )


@app.post("/thread/{session_id}/human-reply", status_code=200)
async def human_reply(session_id: str, req: ReplyRequest):
    return await handle_human_reply(
        session_id=session_id,
        user_message=req.user_message,
        store=_get_store(),
        workflow=workflow,
    )


@app.get("/threads")
async def list_threads():
    return await handle_list_threads(store=_get_store())


@app.get("/thread/{session_id}")
async def get_thread(session_id: str):
    return await handle_get_thread(session_id=session_id, store=_get_store())


@app.post("/thread/{session_id}/export", status_code=200)
async def export_lead(session_id: str):
    return await handle_export_lead(session_id=session_id, store=_get_store())


@app.get("/threads/pending-export")
async def list_pending_exports():
    return await handle_list_pending_exports(store=_get_store())


@app.get("/health")
async def health():
    return {"status": "ok"}
