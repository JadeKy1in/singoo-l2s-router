from __future__ import annotations

import json
import re

from agents.base import BaseAgent
from agents.llm_client import llm_client
from config.settings import settings
from schemas.enums import AgentType, ThreadStatus
from schemas.state import ThreadState, ExtractedLead


class DataExtractorAgent(BaseAgent):
    """Extracts structured BANT lead data from the full conversation.

    Uses deepseek-v4-pro via plain chat completion (not structured output,
    which is incompatible with reasoning models). Asks for JSON and parses.
    """

    async def run(self, state: ThreadState) -> ThreadState:
        state.current_agent = AgentType.EXTRACTOR

        if settings.mock_mode:
            return self._mock_extract(state)

        return await self._llm_extract(state)

    def _mock_extract(self, state: ThreadState) -> ThreadState:
        lead = ExtractedLead(
            company_name="Mock Energy Corp",
            contact_name="John Mock",
            contact_email="john@mockenergy.example.com",
            country="Indonesia",
            purchase_intent="high",
            product_interest="Solar Inverter 50kW",
            lead_score=75,
            missing_info=["budget", "timeline"],
        )
        state.extracted_entities = lead
        state.status = ThreadStatus.COMPLETED
        return state

    async def _llm_extract(self, state: ThreadState) -> ThreadState:
        conversation = "\n".join(
            f"[{m.role}] {m.content}" for m in state.global_context
        )
        system_prompt = (
            "Extract B2B lead data from the conversation. "
            "Output ONLY valid JSON with these fields:\n"
            '{"company_name":null,"contact_name":null,"contact_email":null,'
            '"contact_phone":null,"country":null,"purchase_intent":"medium",'
            '"product_interest":null,"lead_score":30,"missing_info":[],'
            '"score_justification":"scoring rationale","notes":""}\n\n'
            "purchase_intent must be: high, medium, or low.\n"
            "lead_score must be an integer 0-100.\n"
            "missing_info: list any missing BANT fields (budget, authority, need, timeline, contact).\n"
            "score_justification: brief reason for the score assignment.\n"
            "Output ONLY the JSON object, no markdown, no explanation."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Conversation:\n{conversation}"},
        ]
        try:
            raw = await llm_client.chat_completion(
                messages=messages,
                model=settings.extractor_model,
                temperature=0.0,
                max_tokens=4096,
            )
            try:
                lead = self._parse_json(raw)
            except (ValueError, json.JSONDecodeError):
                # Retry: send parse error back to LLM for correction
                corrective = (
                    f"Your previous output was not valid JSON. Parse error. "
                    f"Output ONLY the corrected JSON object. Previous output:\n{raw[:500]}"
                )
                messages.append({"role": "assistant", "content": raw[:500]})
                messages.append({"role": "user", "content": corrective})
                raw2 = await llm_client.chat_completion(
                    messages=messages,
                    model=settings.extractor_model,
                    temperature=0.0,
                    max_tokens=4096,
                )
                lead = self._parse_json(raw2)
            lead = self._apply_bant_correction(lead)
            state.extracted_entities = lead
        except Exception:
            state.extracted_entities = ExtractedLead(
                purchase_intent="medium",
                lead_score=30,
                score_justification="LLM extraction failed — default fallback",
                missing_info=["budget", "authority", "need", "timeline", "contact"],
                notes="LLM extraction failed — manual review required.",
            )
        state.status = ThreadStatus.COMPLETED
        return state

    @staticmethod
    def _parse_json(raw: str) -> ExtractedLead:
        text = raw.strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = text[start : end + 1]
            candidate = re.sub(r"```(?:json)?\s*", "", candidate)
            candidate = re.sub(r"\s*```", "", candidate)
            data = json.loads(candidate)
            return ExtractedLead.model_validate(data)
        raise ValueError(f"No JSON object found in LLM output: {raw[:200]!r}")

    @staticmethod
    def _apply_bant_correction(lead: ExtractedLead) -> ExtractedLead:
        """Adjust lead_score based on BANT field coverage.

        Each missing BANT field deducts points from the LLM-assigned score.
        Budget: -15, Authority: -10, Need: -10, Timeline: -10, Contact: -15.
        """
        bant_weights = {
            "budget": 15,
            "authority": 10,
            "need": 10,
            "timeline": 10,
            "contact": 15,
        }
        base = lead.lead_score or 50
        penalty = sum(
            weight
            for field, weight in bant_weights.items()
            if field in lead.missing_info
        )
        corrected = max(0, min(100, base - penalty))
        lead.lead_score = corrected
        if not lead.score_justification:
            filled = len(bant_weights) - len(lead.missing_info)
            lead.score_justification = (
                f"Base {base}, {filled}/5 BANT filled, "
                f"-{penalty} penalty → {corrected}"
            )
        return lead
