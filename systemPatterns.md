# System Architecture Patterns

## Architecture: API-First with Decoupled Frontend

**Backend exposes a JSON REST API.** All business logic (agents, workflow, extraction) is accessible exclusively through documented HTTP endpoints. The frontend is a separate concern — it can be the built-in Jinja2 SSR dashboard, a React/Tailwind SPA, a mobile app, or a third-party CRM integration. All consumers speak the same JSON contract.

### Separation Boundary

```
Frontend (replaceable)          Backend (stable)
─────────────────────────       ─────────────────────
dashboard.py (Jinja2 SSR)  ──►  api/handlers.py
React/Tailwind SPA          ──►  agents/{router,sales,extractor}.py
Mobile app                  ──►  graph/workflow.py
CRM webhook consumer        ──►  storage/{thread_store,sqlite_store}.py
```

- **Frontend responsibilities:** Render UI, capture user input, display responses, manage client-side state (current session_id, reply input visibility).
- **Backend responsibilities:** Intent classification, multi-turn sales conversation, RAG knowledge retrieval, BANT lead extraction, persistence, CRM export.
- **Contract:** `UI_Contract.md` — the authoritative reference for request/response schemas.

### Why This Matters

1. **Independent evolution.** The dashboard can be replaced with React without a single backend change.
2. **Multiple consumers.** The same API serves the web dashboard, API docs (Swagger), CLI export tool, and CRM webhook.
3. **Testable in isolation.** Backend tests (`tests/test_handlers.py`, `tests/test_api.py`) validate the JSON contract directly — no browser required.
4. **Skill-appropriate tech.** Backend uses Python/LangGraph for AI orchestration; frontend can use React/Vite/Tailwind for modern UI without impedance mismatch.

### How the Dashboard Uses the API

The built-in dashboard (`dashboard.py`) is the first consumer of the JSON API:
- `GET /` → calls `handle_list_threads()` → renders `templates/dashboard.html`
- `GET /view/{id}` → calls `handle_get_thread()` → renders `templates/viewer.html`

It calls the exact same handler functions that the REST endpoints use. If a React frontend replaces it, those handler functions remain unchanged — the React app calls them via HTTP instead of Python function calls.

---

## Architecture: Event-Driven State Graph (事件驱动的状态机网络)
* **技术选型原因:** B2B 营销链路复杂且漫长。采用类似 LangGraph 的状态图机制（State Graph）或基于事件驱动（Pub/Sub）的微服务架构。
* **业务自洽性:** 外贸业务流中，一个阶段的结束（如：询盘清洗完毕）就是下一个阶段的开始（如：分配跟进）。状态机架构不仅能维持跨 Agent 的长线上下文（解决 Token 遗忘），还能随时让人类外贸员（Human-in-the-loop）在特定节点介入（例如涉及大额打款时），极其符合星谷云提出的“人机协同机制”与“构建出海专属虚拟组织”的产品理念。

## Data Model: Document-Based Thread State (文档型会话状态表)
* **模型定义 (JSON/NoSQL):**
    ```json
    {
      "session_id": "uuid",
      "lead_source": "WhatsApp",
      "global_context": [ { "role": "user", "content": "..." } ],
      "extracted_entities": {
        "company_name": null,
        "purchase_intent": "high",
        "missing_info": ["budget", "timeline"]
      },
      "current_agent": "Sales_Agent",
      "status": "in_progress"
    }
    ```
* **选型原因:** 1. **高度敏捷:** 早期 AI 产品迭代极快，Prompt 和意图提取的字段会频繁变更。相比于死板的关系型数据库，使用 Schema-free 的文档型（如 MongoDB/JSON 流）能最大程度降低架构重构成本。
    2. **全局状态共享:** 将整个对话和提取出的变量封装在一个大 JSON Object（State）中，通过状态图在不同 Agent 之间流转传递。上游 Agent 补充缺失信息，下游 Agent 消费信息，天然契合大型外贸企业“数据流资产化”和“自动化协同”的需求。