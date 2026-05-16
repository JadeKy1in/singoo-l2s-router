"""PICA-Unit: LangGraph workflow integration tests."""

import pytest

from graph.workflow import create_workflow
from schemas.enums import IntentType, ThreadStatus, AgentType
from schemas.state import ThreadState, ExtractedLead


@pytest.fixture
def workflow():
    return create_workflow().compile()


def _parse(result) -> ThreadState:
    """LangGraph ainvoke returns a dict; convert back to ThreadState."""
    if isinstance(result, dict):
        return ThreadState.model_validate(result)
    return result


class TestWorkflowLeadGen:
    @pytest.mark.asyncio
    async def test_lead_gen_flow_completes(self, workflow):
        state = ThreadState(lead_source="WhatsApp")
        state.add_message("user", "I want to buy 100 solar inverters, what's your best price?")
        result = _parse(await workflow.ainvoke(state))
        assert result.intent == IntentType.LEAD_GEN
        assert result.status == ThreadStatus.COMPLETED
        assert result.extracted_entities is not None
        assert isinstance(result.extracted_entities.lead_score, int)

    @pytest.mark.asyncio
    async def test_lead_gen_generates_sales_messages(self, workflow):
        state = ThreadState(lead_source="WhatsApp")
        state.add_message("user", "quote for bulk order please")
        result = _parse(await workflow.ainvoke(state))
        assistant_msgs = [m for m in result.global_context if m.role == "assistant"]
        assert len(assistant_msgs) > 0


class TestWorkflowSupport:
    @pytest.mark.asyncio
    async def test_support_escalates(self, workflow):
        state = ThreadState(lead_source="Email")
        state.add_message("user", "My inverter is broken, I need a refund!")
        result = _parse(await workflow.ainvoke(state))
        assert result.intent == IntentType.SUPPORT
        assert result.status == ThreadStatus.ESCALATED
        assert result.current_agent == AgentType.HUMAN

    @pytest.mark.asyncio
    async def test_support_chinese_escalates(self, workflow):
        state = ThreadState(lead_source="WhatsApp")
        state.add_message("user", "产品坏了，我要退货退款")
        result = _parse(await workflow.ainvoke(state))
        assert result.intent == IntentType.SUPPORT
        assert result.status == ThreadStatus.ESCALATED


class TestWorkflowSpam:
    @pytest.mark.asyncio
    async def test_spam_discarded(self, workflow):
        state = ThreadState()
        state.add_message("user", "Hello, how are you?")
        result = _parse(await workflow.ainvoke(state))
        assert result.intent == IntentType.SPAM
        assert result.status == ThreadStatus.DISCARDED

    @pytest.mark.asyncio
    async def test_empty_message_discarded(self, workflow):
        state = ThreadState()
        state.add_message("user", "")
        result = _parse(await workflow.ainvoke(state))
        assert result.status == ThreadStatus.DISCARDED


class TestWorkflowStateIntegrity:
    @pytest.mark.asyncio
    async def test_session_id_preserved(self, workflow):
        state = ThreadState()
        sid = state.session_id
        state.add_message("user", "buy solar panels")
        result = _parse(await workflow.ainvoke(state))
        assert result.session_id == sid

    @pytest.mark.asyncio
    async def test_timeline_ordered(self, workflow):
        state = ThreadState()
        state.add_message("user", "quote for EV chargers")
        result = _parse(await workflow.ainvoke(state))
        timestamps = [m.timestamp for m in result.global_context]
        assert timestamps == sorted(timestamps)
