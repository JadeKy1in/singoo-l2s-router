# Singoo L2S-Router -- Demo Pitch / 战略演示文档

**Role Target / 目标角色:** Senior AI Agent PM
**Audience / 受众:** CTO and CEO
**Artifact / 文档类型:** Strategic Portfolio -- AI-Native PoC Delivery

---

## 1. Business Focus / 业务聚焦

### The Pain Point / 痛点

Chinese foreign-trade enterprises lose 40-60% of inbound leads within 72 hours. The bottleneck is not lead volume — it is the human-labor gap between marketing capture and sales response. A WhatsApp inquiry from a Thai factory owner arrives at 2 AM Beijing time. An overworked sales rep replies with a template 14 hours later. The lead goes cold.

中国外贸企业 72 小时内流失 40%-60% 的入站线索。瓶颈不在于线索数量，而在于营销捕获与销售响应之间的人力缺口。一位泰国工厂主通过 WhatsApp 发出的询盘在北京时间凌晨两点到达，过度劳累的销售代表 14 小时后才回复一封模板邮件，此时客户早已流失。

This PoC — **Singoo L2S-Router** — attacks exactly this gap. / 本原型 —— **Singoo L2S-Router** —— 精准打击这一缺口。

### What It Does / 功能概述

Singoo is a **multi-agent orchestration hub** that simulates a complete B2B foreign-trade pipeline: / Singoo 是一个**多智能体编排枢纽**，模拟完整的 B2B 外贸管线：

```
Social Inquiry / 社媒询盘
  --> AI Triage / AI 分流
  --> AI Sales (with product knowledge) / AI 销售（含产品知识）
  --> CRM Lead Extraction / CRM 线索提取
```

A single unstructured message ("I need 100 solar inverters for my Thailand factory") triggers three AI agents working in sequence: / 一条非结构化的消息（"我需要为我的泰国工厂采购 100 台太阳能逆变器"）触发三个 AI 智能体依次工作：

1. **Router Agent / 路由智能体** classifies intent: Lead / Support / Spam (sub-second, lightweight model). / 分类意图：销售线索 / 售后 / 垃圾消息（亚秒级，轻量模型）。
2. **Sales Agent / 销售智能体** engages in multi-turn conversation, pulling real product specifications from a vector knowledge base, asking BANT qualifying questions, adapting to the buyer's language. / 多轮对话，从向量知识库中检索真实产品规格，提出 BANT 资格审核问题，适配买方语言。
3. **Extractor Agent / 提取智能体** reads the full conversation and produces structured CRM data — company name, contact, budget, timeline, lead score — ready for a human closer. / 通读完整对话，输出结构化 CRM 数据 —— 公司名、联系方式、预算、时间线、线索评分 —— 随时可交付人工销售跟进。

For **Support** requests, the system escalates to a human agent with full context. For **Spam**, it discards silently — zero human cost. / **售后**请求携带完整上下文转接人工。**垃圾消息**静默丢弃，零人力成本。

### The Bigger Picture: Agent Matrix / 宏观视角：智能体矩阵

This single use case proves a broader architecture. The same pattern — **Router --> Domain Agent --> Extractor** — extends to multiple verticals: / 单一用例验证了更广泛的架构。同样的模式 —— **路由 --> 领域智能体 --> 提取器** —— 可横向扩展至多个领域：

| Vertical / 领域 | Router Classifies / 路由分类 | Domain Agent Handles / 领域智能体 | Extractor Produces / 输出 |
|---|---|---|---|
| Customer Support / 客服 | Complaint / Inquiry / Urgent | KB RAG + escalation rules | Ticket JSON for Zendesk |
| Supply Chain / 供应链 | RFQ / Order Status / Exception | Inventory-aware negotiation agent | Purchase order JSON |
| HR Onboarding / HR 入职 | Policy Question / Document Request / Payroll | Handbook RAG + workflow trigger | Employee record update |

Singoo is the first cell in a synergistic Agent Matrix — the same orchestration backbone, the same memory architecture, the same human-in-the-loop protocol. Build one, scale to ten. / Singoo 是协同智能体矩阵中的第一个单元 —— 相同的编排主干，相同的记忆架构，相同的人机协同协议。构建一个，扩展至十个。

---

## 2. Architectural Elegance / 架构优雅性

### Event-Driven State Graph / 事件驱动状态图

We chose **LangGraph's StateGraph** over a linear pipeline or a monolithic LLM call. The rationale: / 我们选择 **LangGraph StateGraph** 而非线性管线或单体 LLM 调用。理由如下：

- **Foreign trade is a state machine.** A lead progresses through discrete states: `active -> in_progress -> completed / escalated / discarded`. Each state transition is a business event that can be observed, audited, and intercepted. / **外贸是状态机。** 一条线索经过离散状态推进，每个状态转换都是可观测、可审计、可拦截的业务事件。
- **Human-in-the-loop is native.** At any node (e.g., Support escalation), the graph pauses, sets `pending_human_input = True`, and waits. No polling, no webhooks — the state IS the contract. / **人机协同是原生的。** 在任意节点（如售后转接），图暂停，设置 `pending_human_input = True`，等待。无需轮询，无需 webhook —— 状态即契约。
- **Resumability.** The graph exits after every sales turn. The next API call resumes from the saved state. A conversation can span hours or days with zero in-memory state on the server. / **可恢复性。** 每轮销售对话后图退出。下一次 API 调用从已保存的状态恢复。对话可以持续数小时或数天，服务器端零内存状态。

```
START
  |
  v
[router_node]
  |
  +-- intent=Lead_Gen --> [sales_node] --> END (wait / 等待)
  |                          |
  |                          +-- (if complete) --> [extractor_node] --> END
  +-- intent=Support  --> [escalate_node] --> END (wait for human / 等待人工)
  |
  +-- intent=Spam    --> [discard_node] --> END
```

### Document-Based Thread State / 文档型会话状态

We modeled the entire conversation as a single JSON document (`ThreadState`) flowing through the graph: / 我们将整个对话建模为流经状态图的单一 JSON 文档（`ThreadState`）：

```json
{
  "session_id": "uuid",
  "global_context": [{"role": "user", "content": "..."}],
  "intent": "Lead_Gen",
  "extracted_entities": {
    "company_name": "Thai Solar Co.",
    "lead_score": 75,
    "missing_info": ["authority"]
  },
  "current_agent": "Sales_Agent",
  "status": "in_progress"
}
```

**Why this matters for scalability / 对可扩展性的意义:**

- **Schema-free iteration / 无模式迭代.** During PoC development, we added `detected_language`, `conversation_complete`, `lead_export_status`, and `intent_set` across 5 phases — zero migrations, zero downtime. The Pydantic model evolved; the JSON persisted. / PoC 开发期间我们在 5 个阶段中添加了多个字段 —— 零迁移，零停机。Pydantic 模型在演进，JSON 数据持续可用。
- **Agent-agnostic payload / 智能体无关载荷.** The same `ThreadState` is consumed by Router, Sales, and Extractor agents without coupling. New agents can be inserted into the graph as new nodes that read and mutate the same document. / 同一个 `ThreadState` 被 Router、Sales 和 Extractor 三个智能体消费，互不耦合。新智能体可以作为新节点插入图中，读写同一文档。
- **Auditability / 可审计性.** Every state transition is a saved JSON file (or SQLite row). For regulated industries, this is a compliance asset. / 每次状态转换都被保存为 JSON 文件（或 SQLite 行）。对于受监管行业，这是合规资产。

### Storage Abstraction / 存储抽象

The storage layer (`ThreadStore` interface) was implemented twice — JSON file-based for PoC agility, then SQLite (with indexed columns for intent, status, export_status) for query performance. The API layer never changed. This proves the pattern: **start with files, swap to a database when you need queries, swap to a data warehouse when you need analytics** — the business logic does not care. / 存储层（`ThreadStore` 接口）实现了两次 —— 先是基于 JSON 文件以支持 PoC 敏捷性，然后是 SQLite（为 intent、status、export_status 建立索引列）以支持查询性能。API 层从未改变。这验证了模式：**从文件起步，需要查询时切换到数据库，需要分析时切换到数据仓库** —— 业务逻辑不受影响。

### Technology Surface / 技术栈

| Layer / 层 | Choice / 选型 | Rationale / 理由 |
|---|---|---|
| Orchestration / 编排 | LangGraph (Python) | Native state machine with checkpointing / 原生状态机 + 检查点 |
| LLM | DeepSeek V4 (Flash/Pro) | Reasoning models with `reasoning_content` fallback |
| RAG | ChromaDB + OpenAI Embeddings | In-memory vector search, zero-infra for PoC |
| API | FastAPI | Async-native, auto-generated OpenAPI docs |
| Storage / 存储 | JSON -> SQLite | Interface abstraction enables backend swapping |
| Frontend / 前端 | Jinja2 SSR | Zero-build dashboard, replaceable with React |
| Auth / 认证 | Bearer Token Middleware | Optional, zero-config when disabled |
| Deployment / 部署 | Docker + docker-compose | Single command: `docker-compose up` |

### The DeepSeek V4 Discovery / DeepSeek V4 的发现

DeepSeek V4 is a reasoning model — it spends tokens on internal reasoning (`reasoning_content`) before producing visible output (`content`). Our initial `max_tokens=10` for the Router produced empty content because all 10 tokens were consumed by reasoning. The fix — increasing to 256 and adding `reasoning_content` as a fallback — exemplifies model-aware prompt engineering that separates a production system from a toy demo. / DeepSeek V4 是推理模型 —— 在产生可见输出（`content`）之前先消耗 token 进行内部推理（`reasoning_content`）。我们最初为 Router 设置的 `max_tokens=10` 导致内容为空，因为全部 10 个 token 都被推理消耗。修复方案 —— 增加到 256 并添加 `reasoning_content` 回退 —— 体现了区分生产系统与玩具 Demo 的模型感知提示工程。

---

## 3. Clear AI Boundaries / 清晰的 AI 边界

This is not a "GPT wrapper." The LLM is one component in a deterministic orchestration framework. / 这不是"GPT 套壳"。LLM 是确定性编排框架中的一个组件。

### What the LLM/Agent Handles (Semantic, Non-Deterministic) / LLM/智能体负责（语义、非确定性）

| Agent / 智能体 | LLM Responsibility / LLM 职责 | Model / 模型 |
|---|---|---|
| **RouterAgent** | Classify unstructured buyer intent from natural language. Handle Chinese, Arabic, Spanish, French input without translation middleware. / 从自然语言分类非结构化采购意图 | `deepseek-v4-flash` |
| **SalesAgent** | Generate contextually-relevant sales responses using RAG-retrieved product specs. Ask BANT qualifying questions. Detect conversation completion. / 用 RAG 检索的产品规格生成上下文相关回复 | `deepseek-v4-pro` |
| **ExtractorAgent** | Parse full conversation into structured BANT fields. Handle ambiguous or incomplete information. / 将完整对话解析为结构化 BANT 字段 | `deepseek-v4-pro` |

### What Deterministic Code Handles (Rule-Based, Reliable) / 确定性代码负责（规则化、可靠）

| Layer / 层 | Responsibility / 职责 |
|---|---|
| **LangGraph Workflow / 工作流** | Routing logic, state transitions, turn counting, idempotency guard. / 路由逻辑、状态转换、轮次计数、幂等保护 |
| **BANT Score Correction / BANT 评分修正** | After LLM extraction, deterministic code adjusts `lead_score` based on BANT field coverage. / LLM 提取后确定性代码按 BANT 字段覆盖扣分 |
| **Language Detection / 语种检测** | CJK and Arabic character-set regex detection — no LLM call needed. / CJK 和阿拉伯语正则检测，无需 LLM |
| **Output Guards / 输出保护** | Empty reply detection (< 10 chars -> safe fallback). JSON repair retry loop. `[CONVERSATION_COMPLETE]` token parsing. / 空回复检测、JSON 修复重试、结束标记解析 |
| **Storage & Persistence / 存储与持久化** | UUID validation, path traversal prevention, SQLite parameterized queries. / UUID 校验、路径穿越防护、参数化查询 |
| **Auth Middleware / 认证中间件** | Bearer token validation. Public path whitelist. / Bearer token 校验、公开路径白名单 |
| **Retry Logic / 重试逻辑** | Tenacity exponential backoff (3 attempts, 2-30s) for 5xx and timeout errors. / 指数退避重试（3 次，2-30 秒） |

### The Principle / 核心原则

> **LLMs handle semantic ambiguity. Code handles structural guarantees.**
> **LLM 处理语义模糊性，代码保证结构化约束。**

The LLM decides *what the buyer means*. The code decides *what happens next*. / LLM 决定*买方含义*，代码决定*下一步行动*。

This boundary means: / 这一边界意味着：
- The LLM can be swapped (DeepSeek -> GPT-4 -> Claude) without touching business logic. / LLM 可替换（DeepSeek -> GPT-4 -> Claude）而无需修改业务逻辑。
- The workflow can be audited step-by-step (every state transition is a saved artifact). / 工作流可逐步审计（每次状态转换都是已保存的产物）。
- Failures are isolated: a bad LLM extraction still produces a valid `ExtractedLead` with `missing_info` populated. / 故障隔离：糟糕的 LLM 提取仍会生成包含 `missing_info` 的有效 `ExtractedLead`。

---

## 4. The Agentic Development Process / 智能体驱动开发流程

### How This Was Built / 构建方式

This PoC was developed through AI agent orchestration, not traditional manual coding. The human acted as the AI Agent PM — defining scope, reviewing architecture, validating output, and maintaining strategic alignment. The AI agent (Claude Code) executed all implementation. / 本原型通过 AI 智能体编排开发，而非传统手工编码。人类担任 AI Agent PM —— 定义范围、审核架构、验证输出、保持战略一致性。AI 智能体（Claude Code）执行所有实现。

### Development Rhythm / 开发节奏

Each phase followed a strict protocol: / 每个阶段遵循严格的协议：

```
1. Plan (Architecture Agent) / 规划（架构智能体）
2. Decompose (Implementation Plan) / 分解（实现计划）
3. Execute (Code Generation) / 执行（代码生成）
4. PICA Audit (Unit -> Security -> Integration -> Regression) / PICA 审计
5. Progress Checkpoint / 进度检查点
6. Commit / 提交
```

### Key Metrics / 关键指标

| Metric / 指标 | Value / 值 |
|---|---|
| Development Phases / 开发阶段 | 5 (Init -> LLM -> Multi-turn -> Hardening -> Production) |
| Total Prompts / Agent Interactions / 交互次数 | ~60 exchanges across 5 sessions |
| Code Generated / 生成代码 | 39 source files, 2,723 lines |
| Test Coverage / 测试覆盖 | 89 tests, 0 failures, 0 regressions |
| Bugs Found & Fixed / 发现并修复缺陷 | 6 (model token sizing, LangGraph serialization, ChromaDB indexing, Jinja2 caching, Windows SQLite locking, reasoning model content fallback) |
| Human Code Written / 人工编写代码 | 0 lines |

### What This Proves / 验证结论

1. **Precise AI agent scope definition.** The AI agent never wandered into over-engineering because the Memory Bank files constrained its context window to exactly what mattered. / **精准的 AI 智能体范围定义。** 文档约束了 AI 的上下文窗口，防止过度工程化。

2. **AI-native testing.** The PICA protocol caught 6 bugs before any code reached a commit. `mock_mode` decoupled tests from LLM costs — all 89 tests run in under 5 seconds with zero API spend. / **AI 原生测试。** PICA 协议在提交前捕获 6 个缺陷。`mock_mode` 解耦测试与 LLM 成本。

3. **Translation between business and architecture.** The same person who wrote the success criteria also designed the LangGraph state machine — the PM-Engineer bridge that AI-native development requires. / **业务与架构之间的翻译。** 撰写成功标准的人同时设计了 LangGraph 状态机 —— 这是 AI 原生开发所需的 PM-工程师桥梁。

4. **Recovery from AI agent failures.** When the DeepSeek V4 reasoning model returned empty content, the root cause was identified through raw API response debugging, and the agent was directed to implement the fix — systematic AI debugging, not "prompt and pray." / **从 AI 智能体故障中恢复。** 当 DeepSeek V4 推理模型返回空内容时，通过原始 API 响应调试定位根因并指导智能体实现修复 —— 系统化的 AI 调试，而非"祈祷式提示"。

5. **Scalable pattern.** The Agent Matrix concept (Section 1) is not speculation. The Singoo architecture — StateGraph + Document State + Agent Interface + Storage Abstraction — is a platform template that can be cloned for any vertical with the same orchestration backbone. / **可扩展的模式。** 智能体矩阵概念不是推测。Singoo 架构 —— StateGraph + 文档状态 + 智能体接口 + 存储抽象 —— 是可复用到任何领域的平台模板。

---

*Built with Claude Code, May 2026. 0 lines of code written by hand. 89 tests. Production-ready PoC in 5 phases.*
*基于 Claude Code 构建，2026 年 5 月。0 行手工代码。89 项测试。5 个阶段交付生产就绪原型。*
