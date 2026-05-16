"""PICA-Unit: Router language detection + mock keyword expansion."""

import pytest

from agents.router import RouterAgent, _detect_language
from schemas.enums import IntentType, AgentType
from schemas.state import ThreadState


class TestLanguageDetection:
    def test_chinese_detected(self):
        assert _detect_language("你好，我想买太阳能逆变器") == "zh"

    def test_arabic_detected(self):
        assert _detect_language("أريد شراء محولات الطاقة الشمسية") == "ar"

    def test_english_default(self):
        assert _detect_language("I want to buy solar inverters") == "en"

    def test_mixed_falls_to_zh_if_cjk_present(self):
        assert _detect_language("Want to buy 逆变器 for my factory") == "zh"


class TestMockKeywords:
    @pytest.mark.asyncio
    async def test_chinese_lead_gen(self):
        agent = RouterAgent()
        state = ThreadState()
        state.add_message("user", "你好，我需要询价50台太阳能逆变器")
        result = await agent.run(state)
        assert result.intent == IntentType.LEAD_GEN
        assert result.detected_language == "zh"

    @pytest.mark.asyncio
    async def test_arabic_lead_gen(self):
        agent = RouterAgent()
        state = ThreadState()
        state.add_message("user", "أريد شراء محولات")
        result = await agent.run(state)
        assert result.intent == IntentType.LEAD_GEN
        assert result.detected_language == "ar"

    @pytest.mark.asyncio
    async def test_spanish_lead_gen(self):
        agent = RouterAgent()
        state = ThreadState()
        state.add_message("user", "Necesito una cotizacion para 100 paneles")
        result = await agent.run(state)
        assert result.intent == IntentType.LEAD_GEN

    @pytest.mark.asyncio
    async def test_french_support(self):
        agent = RouterAgent()
        state = ThreadState()
        state.add_message("user", "Mon onduleur est cassé, j'ai besoin d'une réparation")
        result = await agent.run(state)
        assert result.intent == IntentType.SUPPORT

    @pytest.mark.asyncio
    async def test_language_detected_on_state(self):
        agent = RouterAgent()
        state = ThreadState()
        state.add_message("user", "Hola, necesito información")
        result = await agent.run(state)
        assert result.detected_language is not None

    @pytest.mark.asyncio
    async def test_intent_set_flag(self):
        agent = RouterAgent()
        state = ThreadState()
        state.add_message("user", "Buy solar panels")
        result = await agent.run(state)
        assert result.intent_set is True
