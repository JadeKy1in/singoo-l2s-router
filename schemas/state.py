from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

from schemas.enums import ExportStatus, IntentType, ThreadStatus, AgentType


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(max_length=10_000)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExtractedLead(BaseModel):
    company_name: Optional[str] = Field(default=None, max_length=200)
    contact_name: Optional[str] = Field(default=None, max_length=200)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(default=None, max_length=50)
    country: Optional[str] = Field(default=None, max_length=100)
    purchase_intent: Optional[Literal["high", "medium", "low"]] = None
    product_interest: Optional[str] = Field(default=None, max_length=500)
    lead_score: Optional[int] = Field(default=None, ge=0, le=100)
    score_justification: Optional[str] = Field(default=None, max_length=500)
    missing_info: list[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None, max_length=2000)


class ThreadState(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()), max_length=36)
    lead_source: str = Field(default="WhatsApp", max_length=50)
    global_context: list[Message] = Field(default_factory=list, max_length=100)
    extracted_entities: Optional[ExtractedLead] = None
    current_agent: AgentType = AgentType.ROUTER
    status: ThreadStatus = ThreadStatus.ACTIVE
    intent: Optional[IntentType] = None
    turn_count: int = 0
    max_turns: int = 5
    rag_context: Optional[str] = None  # retrieved docs injected into Sales Agent context
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    thread_title: Optional[str] = None  # auto-generated summary label
    pending_human_input: bool = False  # True when escalated and awaiting human reply
    conversation_complete: bool = False  # SalesAgent sets when lead is fully qualified
    intent_set: bool = False  # idempotent guard: router skips LLM if True
    detected_language: Optional[str] = None  # detected from first user message (zh/en/ar/es)
    lead_export_status: Optional[ExportStatus] = None  # CRM export tracking

    def add_message(self, role: str, content: str) -> None:
        self.global_context.append(Message(role=role, content=content))
        self.updated_at = datetime.now(timezone.utc)

    def is_complete(self) -> bool:
        return self.status in (ThreadStatus.COMPLETED, ThreadStatus.ESCALATED, ThreadStatus.DISCARDED)

    def has_missing_info(self) -> bool:
        if self.extracted_entities is None:
            return True
        return len(self.extracted_entities.missing_info) > 0
