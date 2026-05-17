"""PICA-Unit: ExtractorAgent tests — JSON parsing, BANT correction, retry."""

import pytest

from agents.extractor import DataExtractorAgent
from schemas.state import ThreadState, ExtractedLead
from schemas.enums import IntentType, ThreadStatus


class TestParseJSON:
    def test_clean_json(self):
        raw = '{"company_name":"Acme","lead_score":85}'
        lead = DataExtractorAgent._parse_json(raw)
        assert lead.company_name == "Acme"
        assert lead.lead_score == 85

    def test_json_in_code_fence(self):
        raw = '```json\n{"company_name":"Acme"}\n```'
        lead = DataExtractorAgent._parse_json(raw)
        assert lead.company_name == "Acme"

    def test_json_with_reasoning_prefix(self):
        raw = 'I think the lead is good.\n\n{"company_name":"Acme","purchase_intent":"high"}'
        lead = DataExtractorAgent._parse_json(raw)
        assert lead.company_name == "Acme"
        assert lead.purchase_intent == "high"

    def test_no_json_raises(self):
        with pytest.raises(ValueError, match="No JSON object"):
            DataExtractorAgent._parse_json("No JSON here at all.")

    def test_empty_string_raises(self):
        with pytest.raises(ValueError):
            DataExtractorAgent._parse_json("")


class TestBANTCorrection:
    def test_no_missing_info_keeps_score(self):
        lead = ExtractedLead(lead_score=90, missing_info=[])
        corrected = DataExtractorAgent._apply_bant_correction(lead)
        assert corrected.lead_score == 90

    def test_all_missing_deducts_heavily(self):
        lead = ExtractedLead(
            lead_score=80,
            missing_info=["budget", "authority", "need", "timeline", "contact"],
        )
        corrected = DataExtractorAgent._apply_bant_correction(lead)
        # 80 - (10+8+8+8+10) = 80 - 44 = 36
        assert corrected.lead_score == 36

    def test_score_never_below_zero(self):
        lead = ExtractedLead(lead_score=10, missing_info=["budget", "contact"])
        corrected = DataExtractorAgent._apply_bant_correction(lead)
        assert corrected.lead_score >= 0

    def test_score_never_above_100(self):
        lead = ExtractedLead(lead_score=95, missing_info=[])
        corrected = DataExtractorAgent._apply_bant_correction(lead)
        assert corrected.lead_score <= 100

    def test_adds_score_justification(self):
        lead = ExtractedLead(lead_score=70, missing_info=["budget", "timeline"])
        corrected = DataExtractorAgent._apply_bant_correction(lead)
        assert corrected.score_justification is not None
        assert "70" in corrected.score_justification


class TestMockExtract:
    @pytest.mark.asyncio
    async def test_mock_returns_expected(self):
        state = ThreadState()
        agent = DataExtractorAgent()
        # mock_mode is True in tests (set by conftest)
        result = await agent.run(state)
        assert result.extracted_entities is not None
        assert result.extracted_entities.company_name == "Mock Energy Corp"
        assert result.status == ThreadStatus.COMPLETED
