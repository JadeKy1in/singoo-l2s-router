"""PICA-Unit: API handler tests (mock workflow + mock store)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from api.handlers import (
    handle_create_thread,
    handle_reply,
    handle_human_reply,
    handle_list_threads,
    handle_get_thread,
)
from schemas.enums import IntentType, ThreadStatus, AgentType
from schemas.state import ThreadState, ExtractedLead
from storage.thread_store import ThreadStore


def _make_state(**kwargs) -> ThreadState:
    defaults = {
        "session_id": "00000000-0000-0000-0000-000000000001",
        "lead_source": "WhatsApp",
        "intent": IntentType.LEAD_GEN,
        "status": ThreadStatus.IN_PROGRESS,
        "intent_set": True,
        "turn_count": 1,
    }
    defaults.update(kwargs)
    return ThreadState(**defaults)


@pytest.fixture
def mock_store():
    store = MagicMock(spec=ThreadStore)
    return store


@pytest.fixture
def mock_workflow():
    wf = MagicMock()
    wf.ainvoke = AsyncMock()
    return wf


class TestCreateThread:
    @pytest.mark.asyncio
    async def test_create_lead_gen_thread(self, mock_store, mock_workflow):
        state = _make_state()
        state.global_context = [
            MagicMock(role="user", content="Buy solar panels"),
            MagicMock(role="assistant", content="Sure, what specs?"),
        ]
        mock_workflow.ainvoke.return_value = state.model_dump()

        result = await handle_create_thread(
            "Buy solar panels", "WhatsApp", mock_store, mock_workflow
        )
        assert result["session_id"] == state.session_id
        assert result["intent"] == "Lead_Gen"
        assert result["assistant_reply"] == "Sure, what specs?"
        assert result["turn_count"] == 1
        mock_store.save.assert_called_once()


class TestReply:
    @pytest.mark.asyncio
    async def test_reply_continues_thread(self, mock_store, mock_workflow):
        existing = _make_state()
        mock_store.load.return_value = existing

        updated = _make_state(turn_count=2, status=ThreadStatus.IN_PROGRESS)
        updated.global_context = [
            MagicMock(role="user", content="Buy solar panels"),
            MagicMock(role="assistant", content="What specs?"),
            MagicMock(role="user", content="SG100CX, 70 units"),
            MagicMock(role="assistant", content="Great choice!"),
        ]
        mock_workflow.ainvoke.return_value = updated.model_dump()

        result = await handle_reply(
            existing.session_id, "SG100CX, 70 units", mock_store, mock_workflow
        )
        assert result["turn_count"] == 2
        assert result["assistant_reply"] == "Great choice!"

    @pytest.mark.asyncio
    async def test_reply_to_completed_thread_fails(self, mock_store, mock_workflow):
        existing = _make_state(status=ThreadStatus.COMPLETED)
        mock_store.load.return_value = existing

        from fastapi import HTTPException
        with pytest.raises(HTTPException, match="already complete"):
            await handle_reply(
                existing.session_id, "test", mock_store, mock_workflow
            )


class TestHumanReply:
    @pytest.mark.asyncio
    async def test_human_reply_to_escalated(self, mock_store, mock_workflow):
        existing = _make_state(
            status=ThreadStatus.ESCALATED,
            intent=IntentType.SUPPORT,
            pending_human_input=True,
        )
        mock_store.load.return_value = existing

        result = await handle_human_reply(
            existing.session_id, "I've processed the refund.", mock_store, mock_workflow
        )
        assert result["status"] == "completed"
        assert result["pending_human_input"] is False
        mock_store.save.assert_called_once()

    @pytest.mark.asyncio
    async def test_human_reply_to_non_escalated_fails(self, mock_store, mock_workflow):
        existing = _make_state(status=ThreadStatus.IN_PROGRESS)
        mock_store.load.return_value = existing

        from fastapi import HTTPException
        with pytest.raises(HTTPException, match="not escalated"):
            await handle_human_reply(
                existing.session_id, "test", mock_store, mock_workflow
            )


class TestListThreads:
    @pytest.mark.asyncio
    async def test_list_returns_summaries(self, mock_store, mock_workflow):
        mock_store.list_summaries.return_value = [
            {"session_id": "aaa", "intent": "Lead_Gen", "status": "in_progress"}
        ]
        result = await handle_list_threads(mock_store)
        assert len(result) == 1
        assert result[0]["session_id"] == "aaa"


class TestGetThread:
    @pytest.mark.asyncio
    async def test_get_returns_full_detail(self, mock_store, mock_workflow):
        state = _make_state(
            extracted_entities=ExtractedLead(
                company_name="Acme", lead_score=85, score_justification="BANT full"
            ),
            thread_title="Buy solar panels",
        )
        state.global_context = [
            MagicMock(role="user", content="Buy solar panels",
                      timestamp=MagicMock(isoformat=lambda: "2026-01-01T00:00:00")),
        ]
        mock_store.load.return_value = state

        result = await handle_get_thread(state.session_id, mock_store)
        assert result["intent"] == "Lead_Gen"
        assert len(result["conversation"]) == 1
        assert result["extracted_entities"]["company_name"] == "Acme"
        assert result["extracted_entities"]["lead_score"] == 85
