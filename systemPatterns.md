# System Architecture Patterns / 系统架构模式

## Architecture: API-First with Decoupled Frontend / 架构：API 优先与前后端分离

The backend exposes a JSON REST API. All business logic (agents, workflow, extraction) is accessible exclusively through documented HTTP endpoints. The frontend is a separate concern — it can be the built-in Jinja2 SSR dashboard, a React/Tailwind SPA, a mobile app, or a third-party CRM integration. All consumers speak the same JSON contract defined in `UI_Contract.md`.

后端对外暴露 JSON REST API。所有业务逻辑（智能体、工作流、数据提取）仅通过已文档化的 HTTP 端点对外暴露。前端是独立的关注点 —— 可以是内建的 Jinja2 SSR 管理面板、React/Tailwind SPA、移动应用或第三方 CRM 集成。所有消费方遵循 `UI_Contract.md` 中定义的同一 JSON 契约。

### Separation Boundary / 分离边界

```
Frontend (replaceable / 可替换)       Backend (stable / 稳定)
--------------------------------       -------------------------
dashboard.py (Jinja2 SSR)       --->  api/handlers.py
React/Tailwind SPA              --->  agents/{router,sales,extractor}.py
Mobile app                      --->  graph/workflow.py
CRM webhook consumer            --->  storage/{thread_store,sqlite_store}.py
```

- **Frontend responsibilities / 前端职责:** Render UI, capture user input, display responses, manage client-side state (current session_id, reply input visibility). / 渲染界面、捕获用户输入、展示响应、管理客户端状态。
- **Backend responsibilities / 后端职责:** Intent classification, multi-turn sales conversation, RAG knowledge retrieval, BANT lead extraction, persistence, CRM export. / 意图分类、多轮销售对话、RAG 知识检索、BANT 线索提取、持久化、CRM 导出。
- **Contract / 契约:** `UI_Contract.md` — the authoritative reference for request/response schemas. / 请求/响应模式的权威参考。

### Design Rationale / 设计理由

1. **Independent evolution / 独立演进.** The dashboard can be replaced with React without a single backend change. / 管理面板替换为 React 无需修改后端。
2. **Multiple consumers / 多消费方.** The same API serves the web dashboard, API docs (Swagger), CLI export tool, and CRM webhook. / 同一套 API 服务于 Web 面板、API 文档、CLI 工具和 CRM 回调。
3. **Testable in isolation / 可隔离测试.** Backend tests validate the JSON contract directly — no browser required. / 后端测试直接验证 JSON 契约，无需浏览器。
4. **Skill-appropriate tech / 技术栈匹配.** Backend uses Python/LangGraph for AI orchestration; frontend can use React/Vite/Tailwind for modern UI without impedance mismatch. / 后端用 Python/LangGraph 做 AI 编排，前端用 React/Vite/Tailwind 做现代 UI。

---

## Architecture: Event-Driven State Graph / 架构：事件驱动的状态机网络

**Technology selection rationale / 技术选型原因:** B2B marketing chains are complex and lengthy. A state graph mechanism (StateGraph) or event-driven (Pub/Sub) microservice architecture is appropriate. In the foreign-trade business flow, the end of one stage (e.g., inquiry cleaning completed) is the beginning of the next stage (e.g., assign follow-up). A state machine architecture not only maintains cross-agent long-term context (solving token forgetting) but also allows human foreign-trade operators (Human-in-the-loop) to intervene at specific nodes (e.g., when large payments are involved). This aligns with the product vision of "human-machine collaboration" and "building an export-dedicated virtual organization."

B2B 营销链路复杂且漫长。采用状态图机制或基于事件驱动的微服务架构。外贸业务流中，一个阶段的结束（如：询盘清洗完毕）就是下一个阶段的开始（如：分配跟进）。状态机架构不仅能维持跨 Agent 的长线上下文（解决 Token 遗忘），还能随时让人类外贸员（Human-in-the-loop）在特定节点介入（例如涉及大额打款时），极其符合"人机协同机制"与"构建出海专属虚拟组织"的产品理念。

---

## Data Model: Document-Based Thread State / 数据模型：文档型会话状态表

**Model definition (JSON):**

```json
{
  "session_id": "uuid",
  "lead_source": "WhatsApp",
  "global_context": [
    { "role": "user", "content": "..." }
  ],
  "extracted_entities": {
    "company_name": null,
    "purchase_intent": "high",
    "missing_info": ["budget", "timeline"]
  },
  "current_agent": "Sales_Agent",
  "status": "in_progress"
}
```

**Selection rationale / 选型原因:**

1. **High agility / 高度敏捷:** Early-stage AI products iterate extremely fast. Prompt and intent extraction fields change frequently. Compared to rigid relational databases, using schema-free document storage (e.g., MongoDB/JSON streams) minimizes architectural refactoring costs. / 早期 AI 产品迭代极快，Prompt 和意图提取的字段会频繁变更。相比于死板的关系型数据库，使用 Schema-free 的文档型存储能最大程度降低架构重构成本。

2. **Global state sharing / 全局状态共享:** The entire conversation and extracted variables are encapsulated in a single large JSON Object (State) that flows between different Agents through the state graph. Upstream Agents supplement missing information; downstream Agents consume that information. This naturally aligns with the needs of large foreign-trade enterprises for "data flow assetization" and "automated collaboration." / 将整个对话和提取出的变量封装在一个大 JSON Object（State）中，通过状态图在不同 Agent 之间流转传递。上游 Agent 补充缺失信息，下游 Agent 消费信息，天然契合大型外贸企业"数据流资产化"和"自动化协同"的需求。
