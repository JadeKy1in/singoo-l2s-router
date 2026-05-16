"""HTML dashboard for the Singoo L2S-Router (Frontend UI Layer).

Serves at / with Jinja2 templates showing session list and conversation viewer.
This module is an OPTIONAL SSR frontend — it calls the same API handlers that a
React/Tailwind SPA would consume. It can be removed or replaced without touching
backend logic. All data access goes through api/handlers.py.
"""

from __future__ import annotations

from pathlib import Path

import jinja2
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse

from api.handlers import handle_get_thread, handle_list_threads
from config.settings import settings

router = APIRouter()
_tpl_dir = Path(__file__).parent / "templates"
_env = jinja2.Environment(loader=jinja2.FileSystemLoader(str(_tpl_dir)), autoescape=True)


def _get_store():
    if settings.store_backend == "sqlite":
        from storage.sqlite_store import SqliteStore
        return SqliteStore(db_path=settings.sqlite_db_path)
    from storage.thread_store import ThreadStore
    return ThreadStore(base_dir=settings.thread_store_dir)


def _render(name: str, **ctx) -> HTMLResponse:
    tpl = _env.get_template(name)
    return HTMLResponse(tpl.render(**ctx))


@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    store = _get_store()
    threads = await handle_list_threads(store=store)
    return _render("dashboard.html", request=request, threads=threads, total=len(threads))


@router.get("/view/{session_id}", response_class=HTMLResponse)
async def view_thread(request: Request, session_id: str):
    store = _get_store()
    try:
        detail = await handle_get_thread(session_id=session_id, store=store)
    except HTTPException:
        return HTMLResponse("<h2>Session not found</h2>", status_code=404)

    messages = [
        {"role": m["role"], "content": m["content"], "time": m["timestamp"][11:19]}
        for m in detail["conversation"]
    ]
    return _render(
        "viewer.html",
        request=request,
        session_id=detail["session_id"],
        intent=detail["intent"],
        status=detail["status"],
        turn_count=detail["turn_count"],
        max_turns=detail["max_turns"],
        messages=messages,
        lead=detail["extracted_entities"],
    )
