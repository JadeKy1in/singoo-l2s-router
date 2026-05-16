"""Pydantic request/response models for the Singoo API."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateThreadRequest(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=10_000)
    lead_source: str = Field(default="WhatsApp", max_length=50)


class ReplyRequest(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=10_000)


class ThreadSummary(BaseModel):
    session_id: str
    intent: Optional[str] = None
    status: Optional[str] = None
    thread_title: Optional[str] = None
    lead_source: Optional[str] = None
    turn_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ExtractedLeadResponse(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    country: Optional[str] = None
    purchase_intent: Optional[str] = None
    product_interest: Optional[str] = None
    lead_score: Optional[int] = None
    missing_info: list[str] = []
    notes: Optional[str] = None


class ThreadDetail(BaseModel):
    session_id: str
    intent: Optional[str] = None
    status: Optional[str] = None
    lead_source: Optional[str] = None
    turn_count: int = 0
    max_turns: int = 5
    thread_title: Optional[str] = None
    pending_human_input: bool = False
    conversation_complete: bool = False
    detected_language: Optional[str] = None
    lead_export_status: Optional[str] = None
    conversation: list[dict] = Field(default_factory=list)
    extracted_entities: Optional[ExtractedLeadResponse] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ExportResponse(BaseModel):
    session_id: str
    export_status: str
    lead: Optional[ExtractedLeadResponse] = None
