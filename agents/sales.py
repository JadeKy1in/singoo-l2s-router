from __future__ import annotations

from agents.base import BaseAgent
from agents.llm_client import llm_client
from agents.prompts import SALES_SYSTEM_PROMPT, SALES_SYSTEM_PROMPT_ZH
from config.settings import settings
from rag.knowledge_base import KnowledgeBase
from schemas.enums import AgentType
from schemas.state import ThreadState

_kb: KnowledgeBase | None = None


def _get_kb() -> KnowledgeBase:
    global _kb
    if _kb is None:
        _kb = KnowledgeBase(
            docs_path=settings.rag_docs_path,
            collection_name=settings.rag_collection_name,
        )
    return _kb


class SalesAgent(BaseAgent):
    """RAG-powered sales agent for multi-turn B2B lead qualification.

    Injects product knowledge from ChromaDB, maintains a consultative
    sales persona, and handles multi-language conversations.

    One turn per invocation — LangGraph controls the multi-turn loop.
    """

    async def run(self, state: ThreadState) -> ThreadState:
        state.current_agent = AgentType.SALES
        state.turn_count += 1

        if settings.mock_mode:
            return self._mock_reply(state)

        return await self._llm_reply(state)

    def _mock_reply(self, state: ThreadState) -> ThreadState:
        reply = (
            "Thanks for your inquiry! We specialize in new energy equipment. "
            "Could you share your target specifications and budget range?"
        )
        state.add_message("assistant", reply)
        if state.turn_count >= state.max_turns:
            state.current_agent = AgentType.EXTRACTOR
        return state

    async def _llm_reply(self, state: ThreadState) -> ThreadState:
        kb = _get_kb()
        last_user_msg = next(
            (m.content for m in reversed(state.global_context) if m.role == "user"), ""
        )
        rag_docs = await kb.query(last_user_msg, top_k=3)
        rag_context = "\n\n".join(rag_docs)

        template = SALES_SYSTEM_PROMPT_ZH if state.detected_language == "zh" else SALES_SYSTEM_PROMPT
        system_content = template.format(rag_context=rag_context)
        # Append conversation-complete signal instruction
        system_content += (
            "\n\nWhen the lead is fully qualified (BANT covered) or the customer "
            "indicates they are done, end your reply with the token "
            "[CONVERSATION_COMPLETE] on its own line."
        )

        # Truncate context to last 10 messages to avoid context window overflow
        recent = state.global_context[-10:]
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_content}
        ]
        for msg in recent:
            messages.append({"role": msg.role, "content": msg.content})

        try:
            reply = await llm_client.chat_completion(
                messages=messages,
                model=settings.sales_model,
                temperature=0.7,
                max_tokens=512,
            )
        except Exception:
            reply = (
                "Thank you for your message. Our sales team will get back to you shortly. "
                "In the meantime, could you share your requirements and budget range?"
            )

        # Guard: detect empty or too-short replies
        if not reply or len(reply.strip()) < 10:
            reply = (
                "Thank you for your message. Our sales team will get back to you shortly. "
                "In the meantime, could you share your requirements and budget range?"
            )

        # Detect natural conversation end signal
        if "[CONVERSATION_COMPLETE]" in reply:
            state.conversation_complete = True
            reply = reply.replace("[CONVERSATION_COMPLETE]", "").strip()

        # Auto-complete if all BANT fields are covered
        if state.extracted_entities and not state.extracted_entities.missing_info:
            state.conversation_complete = True

        state.add_message("assistant", reply)
        if state.turn_count >= state.max_turns or state.conversation_complete:
            state.current_agent = AgentType.EXTRACTOR
        return state
