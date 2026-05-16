# Singoo L2S-Router

**Multi-agent B2B lead-to-sale orchestrator. / B2B 多智能体线索到成交编排器。**

AI-powered social inquiry triage, RAG-based sales engagement, and structured CRM lead extraction. Built on LangGraph and DeepSeek V4.

基于 AI 的社媒询盘分流、RAG 销售接待与结构化 CRM 线索提取。基于 LangGraph 与 DeepSeek V4 构建。

---

## Overview / 项目概述

Chinese foreign-trade enterprises lose 40-60% of inbound leads within 72 hours. The bottleneck is not lead volume — it is the human-labor gap between marketing capture and sales response. A WhatsApp inquiry from a factory owner in Thailand arrives at 2 AM Beijing time. An overworked sales representative replies with a generic template 14 hours later. The lead has already gone cold.

中国外贸企业 72 小时内流失 40%-60% 的入站线索。瓶颈不在于线索数量，而在于营销捕获与销售响应之间的人力缺口。一位泰国工厂主通过 WhatsApp 发出的询盘在北京时间凌晨两点到达，过度劳累的销售代表 14 小时后才回复一封模板邮件，此时客户早已流失。

Singoo addresses this gap with a **3-agent orchestration pipeline / 三智能体编排管线**:

```
Social Inquiry / 社媒询盘
  --> [Router Agent / 路由智能体]
  --> [Sales Agent + RAG / 销售智能体 + 知识库]
  --> [Extractor Agent / 提取智能体]
  --> CRM JSON
```

1. **Router Agent / 路由智能体** — Classifies intent (Lead_Gen / Support / Spam) at sub-second latency, with multi-language detection covering Chinese, Arabic, Spanish, French, and English.
2. **Sales Agent / 销售智能体** — Conducts multi-turn B2B conversation, retrieving product specifications from a ChromaDB vector knowledge base and asking BANT qualifying questions (Budget, Authority, Need, Timeline).
3. **Extractor Agent / 提取智能体** — Processes the full conversation and outputs structured CRM data with lead scoring and BANT field coverage analysis.

**Support requests** are escalated to a human agent with full conversation context. **Spam** is silently discarded at zero human cost.

**售后类请求**携带完整对话上下文转接给人工客服。**垃圾消息**静默丢弃，零人力成本。

---

## Quick Start / 快速开始

```bash
# Clone and install / 克隆并安装
git clone https://github.com/JadeKy1in/singoo-l2s-router.git
cd singoo-l2s-router
pip install -r requirements.txt

# Configure LLM endpoint / 配置 LLM 接口
cp .env.example .env

# Start the server (mock mode -- no LLM cost / 零成本 mock 模式启动)
python -m singoo serve

# Dashboard: http://127.0.0.1:8000/
# API Docs:  http://127.0.0.1:8000/docs
```

### CLI Commands / 命令行

```bash
python -m singoo serve                 # Start server / 启动服务
python -m singoo test                  # Run all 89 tests / 运行全部 89 项测试
python -m singoo stats                 # Session statistics / 会话统计
python -m singoo export-all            # Dry-run lead export / 线索导出预演
python -m singoo export-all --execute  # Export to CRM webhook / 导出至 CRM
```

### Docker

```bash
docker-compose up -d
```

---

## Architecture / 架构

```
+---------------------------------------------+
|  Frontend / 前端 (replaceable / 可替换)       |
|  - Built-in Jinja2 SSR dashboard / 内建管理面板 |
|  - React/Tailwind SPA (contract in UI_Contract.md) |
+-------------------+-------------------------+
                    | JSON over HTTP
+-------------------v-------------------------+
|  FastAPI (app.py)                           |
|  api/handlers.py -- business logic / 业务逻辑 |
|  api/models.py  -- request/response models   |
+-------------------+-------------------------+
                    |
+-------------------v-------------------------+
|  LangGraph StateGraph (graph/workflow.py)    |
|                                               |
|  START --> router_node --> sales_node --> END |
|              |                |               |
|              +- Support --> escalate_node    |
|              +- Spam ----> discard_node      |
|                              |               |
|                         extractor_node       |
+-------------------+-------------------------+
                    |
+-------------------v-------------------------+
|  Agents / 智能体 (agents/)                    |
|  RouterAgent    -- deepseek-v4-flash         |
|  SalesAgent     -- deepseek-v4-pro + RAG     |
|  ExtractorAgent -- deepseek-v4-pro + BANT    |
+-------------------+-------------------------+
                    |
+-------------------v-------------------------+
|  Storage / 存储 (storage/)                    |
|  ThreadStore (JSON) / SqliteStore            |
|  KnowledgeBase (ChromaDB)                    |
+---------------------------------------------+
```

### Key Design Decisions / 核心设计决策

- **API-First / API 优先.** The backend exposes a JSON REST API. The built-in Jinja2 dashboard is an optional consumer — replace it with React, Vue, or a mobile application without modifying backend code. Contract defined in [`UI_Contract.md`](UI_Contract.md). / 后端对外暴露 JSON REST API，内建 Jinja2 管理面板只是可选的消费方之一，可替换为 React、Vue 或移动端应用而无需修改后端代码。契约定义见 [`UI_Contract.md`](UI_Contract.md)。
- **Reasoning model aware / 推理模型感知.** DeepSeek V4 generates `reasoning_content` before visible `content`. All agents allocate extra `max_tokens` and fall back to `reasoning_content` when `content` is empty. / DeepSeek V4 在可见 `content` 之前先生成 `reasoning_content`，所有智能体均分配额外 `max_tokens` 并在 `content` 为空时回退到 `reasoning_content`。
- **BANT score correction / BANT 评分修正.** The LLM assigns a base lead score; deterministic code deducts weights for each missing BANT field (Budget: -15, Authority: -10, Need: -10, Timeline: -10, Contact: -15). / LLM 给出基础评分后，确定性代码按缺失的 BANT 字段扣分。
- **Storage abstraction / 存储抽象.** A `ThreadStore` interface with swappable JSON and SQLite backends via `SINGOO_STORE_BACKEND`. / `ThreadStore` 接口支持 JSON 与 SQLite 两种后端，通过 `SINGOO_STORE_BACKEND` 切换。
- **Multi-turn by design / 原生多轮对话.** The workflow exits after each sales turn in real mode to support multi-turn API interaction. Mock mode loops to completion for zero-cost testing. / 真实模式下每轮销售对话后工作流退出以支持多轮 API 交互，Mock 模式下自动循环至结束以支持零成本测试。

### LLM vs Deterministic Code / LLM 与确定性代码的边界

| LLM Handles / LLM 负责 (Semantic / 语义) | Code Handles / 代码负责 (Structural / 结构) |
|---|---|
| Intent classification / 意图分类 | Graph routing logic / 图路由逻辑 |
| Sales conversation + RAG / 销售对话 + 知识检索 | BANT score correction formula / BANT 评分修正公式 |
| CRM field extraction / CRM 字段提取 | Language detection (CJK/Arabic regex) / 语种检测 |
| Conversation-complete signal / 对话结束信号 | Empty reply guard / 空回复保护 |
| Natural language understanding / 自然语言理解 | Retry with exponential backoff (tenacity) / 指数退避重试 |

> **LLMs handle semantic ambiguity. Code handles structural guarantees.**
> **LLM 处理语义模糊性，代码保证结构化约束。**

---

## API Endpoints / API 端点

| Method | Path | Purpose / 用途 |
|--------|------|----------------|
| `POST` | `/thread` | Create thread, router + 1 turn sales / 创建会话 |
| `POST` | `/thread/{id}/reply` | Continue conversation / 继续对话 |
| `POST` | `/thread/{id}/human-reply` | Human agent responds to escalation / 人工回复转接 |
| `POST` | `/thread/{id}/export` | Export lead to CRM webhook / 导出线索至 CRM |
| `GET` | `/` | Dashboard (session list) / 管理面板 |
| `GET` | `/view/{id}` | Conversation viewer / 对话查看器 |
| `GET` | `/threads` | List all sessions / 会话列表 |
| `GET` | `/threads/pending-export` | Unexported leads / 待导出线索 |
| `GET` | `/thread/{id}` | Full thread detail + transcript / 会话详情 |
| `GET` | `/health` | Health check / 健康检查 |

Full contract with JSON request/response schemas: [`UI_Contract.md`](UI_Contract.md) / 完整 JSON 契约见 [`UI_Contract.md`](UI_Contract.md)

---

## Project Structure / 项目结构

```
singoo-l2s-router/
├── README.md
├── UI_Contract.md              # API contract / API 契约
├── Demo_Pitch.md               # Strategic narrative / 战略叙事
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
│
├── __main__.py                 # CLI entry / 命令行入口
├── app.py                      # FastAPI endpoint registration
├── auth.py                     # Bearer token middleware / 认证中间件
├── dashboard.py                # Optional Jinja2 SSR frontend / 可选管理面板
│
├── api/
│   ├── handlers.py             # Business logic / 业务逻辑
│   └── models.py               # Pydantic request/response models
│
├── agents/
│   ├── base.py                 # BaseAgent ABC / 智能体抽象基类
│   ├── router.py               # Intent classification + language detection
│   ├── sales.py                # RAG-powered multi-turn sales / RAG 多轮销售
│   ├── extractor.py            # CRM extraction + BANT correction
│   ├── llm_client.py           # Async HTTP client with retry / 异步重试客户端
│   └── prompts.py              # Prompt templates (EN + ZH) / 提示词模板
│
├── graph/
│   └── workflow.py             # LangGraph StateGraph pipeline
│
├── rag/
│   └── knowledge_base.py       # ChromaDB vector store / 向量知识库
│
├── schemas/
│   ├── state.py                # ThreadState, Message, ExtractedLead
│   └── enums.py                # IntentType, ThreadStatus, AgentType
│
├── storage/
│   ├── thread_store.py         # JSON file-based persistence / JSON 持久化
│   └── sqlite_store.py         # SQLite persistence / SQLite 持久化
│
├── config/
│   └── settings.py             # Pydantic BaseSettings (SINGOO_ prefix)
│
├── templates/
│   ├── dashboard.html          # Session list UI / 会话列表页
│   └── viewer.html             # Conversation viewer UI / 对话查看页
│
└── tests/                      # 89 tests in 13 files / 13 个测试文件共 89 项
    ├── conftest.py
    ├── test_api.py             # End-to-end HTTP tests
    ├── test_handlers.py        # Handler unit tests
    ├── test_workflow.py        # Workflow integration tests
    ├── test_extractor.py       # Extractor + BANT correction tests
    ├── test_router_lang.py     # Language detection + classification
    ├── test_knowledge_base.py  # RAG knowledge base tests
    ├── test_llm_client.py      # LLM client tests
    ├── test_auth.py            # Auth middleware tests
    ├── test_state_schema.py    # Schema validation tests
    ├── test_thread_store.py    # JSON store tests
    └── test_sqlite_store.py    # SQLite store tests
```

---

## Configuration / 配置

All settings use the `SINGOO_` environment variable prefix. / 所有配置均使用 `SINGOO_` 环境变量前缀。

| Variable / 变量 | Default / 默认值 | Description / 说明 |
|---|---|---|
| `SINGOO_ROUTER_MODEL` | `mock` | Intent classification model / 意图分类模型 |
| `SINGOO_SALES_MODEL` | `mock` | Sales conversation model / 销售对话模型 |
| `SINGOO_EXTRACTOR_MODEL` | `mock` | CRM extraction model / CRM 提取模型 |
| `SINGOO_LLM_BASE_URL` | `http://localhost:8000/v1` | LLM API base URL / LLM API 地址 |
| `SINGOO_LLM_API_KEY` | (empty) | LLM API key / LLM API 密钥 |
| `SINGOO_HOST` | `127.0.0.1` | Server bind address / 服务绑定地址 |
| `SINGOO_PORT` | `8000` | Server port / 服务端口 |
| `SINGOO_MAX_TURNS` | `5` | Max conversation turns / 最大对话轮次 |
| `SINGOO_MOCK_MODE` | `true` | Skip LLM calls / 跳过 LLM 调用 |
| `SINGOO_STORE_BACKEND` | `json` | `json` or `sqlite` |
| `SINGOO_API_AUTH_TOKEN` | (empty) | Bearer token for `/thread*` routes / API 认证令牌 |
| `SINGOO_CRM_WEBHOOK_URL` | (empty) | Lead export webhook URL / CRM 导出回调地址 |

---

## Development / 开发

```bash
# Run tests / 运行测试
python -m singoo test

# With coverage / 含覆盖率
pip install pytest-cov
pytest tests/ --cov=. --cov-report=html

# Dev server with auto-reload / 开发模式自动重载
python -m uvicorn app:app --reload --port 8000
```

### Mock Mode / Mock 模式

Set `SINGOO_MOCK_MODE=true` (default) for zero-cost development. All 89 tests run in under 5 seconds with zero API calls. The router uses keyword matching; the sales agent returns a fixed template; the extractor returns mock lead data. To use real LLMs, set `SINGOO_MOCK_MODE=false` and configure the model names and API endpoint.

`SINGOO_MOCK_MODE=true`（默认）开启零成本开发模式。全部 89 项测试在 5 秒内完成，零 API 调用。路由使用关键词匹配，销售使用固定模板回复，提取返回 mock 数据。切换到真实 LLM 需设置 `SINGOO_MOCK_MODE=false` 并配置模型名称和 API 地址。

---

## Agent Matrix / 智能体矩阵 (Beyond This PoC / PoC 之外)

The **Router --> Domain Agent --> Extractor** pattern extends to other business verticals, sharing the same orchestration backbone, memory architecture, and human-in-the-loop protocol:

**路由 --> 领域智能体 --> 提取器** 这一模式可扩展至其他业务领域，共享相同的编排主干、记忆架构与人机协同协议：

| Vertical / 领域 | Router Classifies / 路由分类 | Domain Agent / 领域智能体 | Extractor Produces / 输出 |
|---|---|---|---|
| Customer Support / 客服 | Complaint / Inquiry / Urgent | KB RAG + escalation rules | Ticket JSON / 工单 |
| Supply Chain / 供应链 | RFQ / Order Status / Exception | Inventory-aware negotiation | Purchase Order JSON / 采购单 |
| HR Onboarding / HR 入职 | Policy / Documents / Payroll | Handbook RAG + workflow trigger | Employee Record / 员工档案 |

Singoo is the first cell in a synergistic Agent Matrix — build one, scale to ten. / Singoo 是协同智能体矩阵的第一个单元 — 构建一个，扩展至十个。

---

## Credits / 致谢

Built with Claude Code, May 2026. 89 tests. Production-ready PoC delivered in 5 phases. / 基于 Claude Code 构建，2026 年 5 月。89 项测试，5 个阶段交付生产就绪原型。
