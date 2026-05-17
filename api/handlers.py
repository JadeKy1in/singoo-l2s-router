"""API business logic — extracted from app.py to keep the entry point lean.

Each handler receives dependencies and returns response data.
"""

from __future__ import annotations

import logging

import httpx
from fastapi import HTTPException

from config.settings import settings
from schemas.enums import ExportStatus, ThreadStatus, AgentType
from schemas.state import ThreadState
from storage.thread_store import ThreadStore

logger = logging.getLogger("singoo.api")


async def handle_create_thread(
    user_message: str,
    lead_source: str,
    store: ThreadStore,
    workflow,
) -> dict:
    """Create a new thread and run router + 1 turn of sales."""
    state = ThreadState(lead_source=lead_source)
    state.add_message("user", user_message)

    # Generate a thread title from the first message
    title = user_message.strip()[:80]
    if len(user_message) > 80:
        title += "…"
    state.thread_title = title

    raw = await workflow.ainvoke(state)
    result = ThreadState.model_validate(raw)
    store.save(result)

    return _thread_response(result)


async def handle_reply(
    session_id: str,
    user_message: str,
    store: ThreadStore,
    workflow,
) -> dict:
    """Continue an existing thread with a new user message."""
    state = store.load(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.is_complete():
        raise HTTPException(status_code=400, detail="Thread is already complete")

    state.add_message("user", user_message)
    state.status = ThreadStatus.IN_PROGRESS

    raw = await workflow.ainvoke(state)
    result = ThreadState.model_validate(raw)
    store.save(result)

    return _thread_response(result)


async def handle_human_reply(
    session_id: str,
    user_message: str,
    store: ThreadStore,
    workflow,
) -> dict:
    """Human agent replies to an escalated thread."""
    state = store.load(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.status != ThreadStatus.ESCALATED:
        raise HTTPException(status_code=400, detail="Thread is not escalated")

    state.add_message("assistant", user_message)
    state.pending_human_input = False
    state.status = ThreadStatus.COMPLETED
    state.current_agent = AgentType.HUMAN
    store.save(state)

    return _thread_response(state)


async def handle_list_threads(store: ThreadStore) -> list[dict]:
    """List all session summaries, newest first."""
    return store.list_summaries()


async def handle_get_thread(session_id: str, store: ThreadStore) -> dict:
    """Get full thread detail including conversation transcript."""
    state = store.load(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")

    conversation = [
        {"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()}
        for m in state.global_context
    ]

    return {
        "session_id": state.session_id,
        "intent": state.intent,
        "status": state.status,
        "lead_source": state.lead_source,
        "turn_count": state.turn_count,
        "max_turns": state.max_turns,
        "thread_title": state.thread_title,
        "pending_human_input": state.pending_human_input,
        "conversation_complete": state.conversation_complete,
        "detected_language": state.detected_language,
        "lead_export_status": state.lead_export_status,
        "conversation": conversation,
        "extracted_entities": (
            state.extracted_entities.model_dump()
            if state.extracted_entities
            else None
        ),
        "created_at": state.created_at.isoformat(),
        "updated_at": state.updated_at.isoformat(),
    }


async def handle_export_lead(session_id: str, store: ThreadStore) -> dict:
    """Export extracted lead data to CRM webhook (if configured)."""
    state = store.load(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.extracted_entities is None:
        raise HTTPException(status_code=400, detail="No lead data to export")
    if state.lead_export_status == ExportStatus.EXPORTED:
        raise HTTPException(status_code=400, detail="Lead already exported")

    lead_data = state.extracted_entities.model_dump()

    if settings.crm_webhook_url:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(settings.crm_webhook_url, json={
                    "event": "lead_created",
                    "session_id": state.session_id,
                    "intent": state.intent,
                    "lead_source": state.lead_source,
                    "lead": lead_data,
                })
                resp.raise_for_status()
            logger.info("Lead %s exported to CRM", session_id)
        except Exception as exc:
            state.lead_export_status = ExportStatus.FAILED
            store.save(state)
            logger.error("CRM export failed for %s: %s", session_id, exc)
            raise HTTPException(status_code=502, detail=f"CRM webhook failed: {exc}")

    state.lead_export_status = ExportStatus.EXPORTED
    store.save(state)
    return {"session_id": state.session_id, "export_status": "exported", "lead": lead_data}


async def handle_list_pending_exports(store: ThreadStore) -> list[dict]:
    """List threads with unexported leads."""
    pending = []
    for summary in store.list_summaries():
        state = store.load(summary["session_id"])
        if state and state.extracted_entities and state.lead_export_status != ExportStatus.EXPORTED:
            pending.append({
                "session_id": state.session_id,
                "intent": state.intent,
                "status": state.status,
                "lead_score": state.extracted_entities.lead_score,
                "company_name": state.extracted_entities.company_name,
                "export_status": state.lead_export_status or "pending",
            })
    return pending


def _thread_response(state: ThreadState) -> dict:
    """Build standard response from thread state."""
    return {
        "session_id": state.session_id,
        "intent": state.intent,
        "status": state.status,
        "lead_source": state.lead_source,
        "turn_count": state.turn_count,
        "thread_title": state.thread_title,
        "pending_human_input": state.pending_human_input,
        "conversation_complete": state.conversation_complete,
        "detected_language": state.detected_language,
        "lead_export_status": state.lead_export_status,
        "assistant_reply": next(
            (m.content for m in reversed(state.global_context)
             if m.role == "assistant"),
            None,
        ),
        "extracted_entities": (
            state.extracted_entities.model_dump()
            if state.extracted_entities
            else None
        ),
    }
