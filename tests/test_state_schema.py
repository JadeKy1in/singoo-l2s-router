"""PICA-Unit: Schema validation tests."""

import json
from datetime import datetime

import pytest

from schemas.enums import IntentType, ThreadStatus, AgentType
from schemas.state import Message, ExtractedLead, ThreadState


class TestMessage:
    def test_create_message(self):
        msg = Message(role="user", content="Hello")
        assert msg.role == "user"
        assert msg.content == "Hello"
        assert isinstance(msg.timestamp, datetime)

    def test_message_serialization(self):
        msg = Message(role="assistant", content="How can I help?")
        data = msg.model_dump(mode="json")
        assert data["role"] == "assistant"
        assert "timestamp" in data


class TestExtractedLead:
    def test_empty_lead(self):
        lead = ExtractedLead()
        assert lead.company_name is None
        assert lead.missing_info == []

    def test_full_lead(self):
        lead = ExtractedLead(
            company_name="Acme Corp",
            contact_email="buyer@acme.example.com",
            country="Brazil",
            purchase_intent="high",
            lead_score=85,
            missing_info=["budget"],
        )
        assert lead.lead_score == 85
        assert "budget" in lead.missing_info

    def test_lead_serialization(self):
        lead = ExtractedLead(company_name="Test", lead_score=50)
        data = lead.model_dump()
        assert data["company_name"] == "Test"
        assert data["missing_info"] == []


class TestThreadState:
    def test_default_state(self):
        state = ThreadState()
        assert state.status == ThreadStatus.ACTIVE
        assert state.current_agent == AgentType.ROUTER
        assert state.global_context == []
        assert state.extracted_entities is None
        assert state.intent is None

    def test_add_message(self):
        state = ThreadState()
        state.add_message("user", "Do you have solar inverters?")
        assert len(state.global_context) == 1
        assert state.global_context[0].role == "user"

    def test_is_complete(self):
        state = ThreadState()
        assert not state.is_complete()
        state.status = ThreadStatus.COMPLETED
        assert state.is_complete()

    def test_has_missing_info(self):
        state = ThreadState()
        assert state.has_missing_info()  # no entities yet
        state.extracted_entities = ExtractedLead(missing_info=[])
        assert not state.has_missing_info()
        state.extracted_entities.missing_info.append("budget")
        assert state.has_missing_info()

    def test_json_roundtrip(self):
        state = ThreadState(lead_source="Facebook")
        state.add_message("user", "I need a quote for EV chargers")
        state.intent = IntentType.LEAD_GEN

        raw = state.model_dump_json()
        restored = ThreadState.model_validate_json(raw)
        assert restored.lead_source == "Facebook"
        assert restored.intent == IntentType.LEAD_GEN
        assert len(restored.global_context) == 1


class TestEnums:
    def test_intent_values(self):
        assert IntentType.LEAD_GEN == "Lead_Gen"
        assert IntentType.SUPPORT == "Support"
        assert IntentType.SPAM == "Spam"

    def test_thread_status_values(self):
        assert ThreadStatus.ACTIVE == "active"
        assert ThreadStatus.COMPLETED == "completed"
