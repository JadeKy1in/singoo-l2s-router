# Product Context / 产品上下文

## User Stories / 用户故事

1. **As an overseas B2B buyer (End User) / 作为海外 B2B 采购商（终端用户）:** When I send a vague purchase intent through social media comments or WhatsApp, I expect to receive a technically informed response in my native language that accurately understands my business needs within 10 seconds — not a rigid auto-reply. / 当我在社交媒体评论或通过 WhatsApp 发送模糊的采购意向时，我希望能在 10 秒内收到基于我的母语、且准确理解我业务需求的技术性回复，而不是死板的自动回复。

2. **As a foreign-trade enterprise sales representative (Business User) / 作为出海企业业务员（企业用户）:** I want the AI not only to automatically receive and qualify customers on my behalf, but also to clean and refine messy chat logs into standard BANT sales leads and push them directly to my CRM system, filtering out invalid leads before I take over. / 我希望 AI 不仅能帮我自动接待和背调客户，还能在我接手前，将杂乱的聊天记录清洗提炼为标准的 BANT 销售线索，直接推送到我的 CRM 系统，剔除无效线索。

## AI Integration and Role Definition / AI 集成与角色定义

The prototype instantiates three core Agents, embodying first-principles AI architecture abstraction: / 原型将实例化以下三个核心 Agent，体现基于第一性原理的 AI 架构抽象：

- **Router Agent (Intent Classification Node) / 路由智能体（意图分类节点）:** Lightweight LLM invocation. Responsibility: receive omni-channel input, output classification enum values (Lead_Gen, Support, Spam). / 轻量级 LLM 调用。职责：接收全渠道 Input，输出分类枚举值（Lead_Gen, Support, Spam）。

- **Sales Agent (Task Execution Node) / 销售智能体（任务执行节点）:** LLM combined with RAG. Responsibility: inject persona based on the foreign-trade salesperson's chain of thought, responsible for multi-modal/multi-language communication, deal-closing, and objection handling. / 结合 RAG 的大模型。职责：根据企业外贸人员思维链注入 Persona，负责多模态/多语言沟通、逼单与异议处理。

- **Data Extractor Agent (Post-Processing Node) / 数据提取智能体（后处理节点）:** Strong instruction-following model. Responsibility: when the session is cut off or reaches a judgment threshold, read the global Thread Memory, extract structured features (country, email, phone, product of interest, lead score) for CRM consumption. / 强指令遵循模型。职责：在会话切断或达到判定阈值时，读取全局 Thread Memory，提取结构化特征（国家、邮箱、电话、意向产品、线索分值）供 CRM 消费。
