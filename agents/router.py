from __future__ import annotations

import re

from agents.base import BaseAgent
from agents.llm_client import llm_client
from agents.prompts import ROUTER_SYSTEM_PROMPT, ROUTER_SYSTEM_PROMPT_ZH
from config.settings import settings
from schemas.enums import IntentType, AgentType
from schemas.state import ThreadState

# CJK Unicode range for Chinese detection
_CJK_RE = re.compile(r"[一-鿿㐀-䶿]")
_ARABIC_RE = re.compile(r"[؀-ۿ]")


def _detect_language(text: str) -> str:
    if _CJK_RE.search(text):
        return "zh"
    if _ARABIC_RE.search(text):
        return "ar"
    return "en"


class RouterAgent(BaseAgent):
    """Classifies incoming lead intent via lightweight LLM call."""

    async def run(self, state: ThreadState) -> ThreadState:
        state.current_agent = AgentType.ROUTER
        last_message = state.global_context[-1].content if state.global_context else ""

        # Detect language on first message
        if state.detected_language is None:
            state.detected_language = _detect_language(last_message)

        if settings.mock_mode:
            return self._mock_classify(state, last_message)
        return await self._llm_classify(state, last_message)

    def _mock_classify(self, state: ThreadState, message: str) -> ThreadState:
        lowered = message.lower()
        lead_kw = ("price", "buy", "order", "quote", "bulk", "采购", "价格", "询价",
                    "سعر", "شراء", "precio", "cotizacion", "prix", "devis")
        support_kw = ("help", "broken", "return", "refund", "售后", "退货", "维修",
                       "إصلاح", "reparar", "réparation")
        if any(kw in lowered for kw in lead_kw):
            state.intent = IntentType.LEAD_GEN
        elif any(kw in lowered for kw in support_kw):
            state.intent = IntentType.SUPPORT
        else:
            state.intent = IntentType.SPAM
        state.intent_set = True
        return state

    async def _llm_classify(self, state: ThreadState, message: str) -> ThreadState:
        prompt = ROUTER_SYSTEM_PROMPT_ZH if state.detected_language == "zh" else ROUTER_SYSTEM_PROMPT
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": message},
        ]
        try:
            raw = await llm_client.chat_completion(
                messages=messages,
                model=settings.router_model,
                temperature=0.0,
                max_tokens=256,
            )
            cleaned = raw.strip().lower()
            if "lead_gen" in cleaned or "lead gen" in cleaned:
                state.intent = IntentType.LEAD_GEN
            elif "support" in cleaned:
                state.intent = IntentType.SUPPORT
            else:
                state.intent = IntentType.SPAM
        except Exception:
            state.intent = IntentType.LEAD_GEN
        state.intent_set = True
        return state
