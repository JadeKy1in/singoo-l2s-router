# Product Context

## User Stories
1. **作为海外 B2B 采购商 (End User):** 当我在社交媒体评论或通过 WhatsApp 发送模糊的采购意向时，我希望能在 10 秒内收到基于我的母语、且准确理解我业务需求的技术性回复，而不是死板的自动回复。
2. **作为出海企业业务员 (Business User):** 我希望 AI 不仅能帮我自动接待和背调客户，还能在我接手前，将杂乱的聊天记录清洗提炼为标准的 BANT 销售线索，直接推送到我的 CRM 系统，剔除无效线索。

## AI Integration & Role Definition
原型将实例化以下三个核心 Agent，体现基于第一性原理的 AI 架构抽象：
- **Router Agent (意图分类节点):** 轻量级 LLM 调用。职责：接收全渠道 Input，输出分类枚举值（Lead_Gen, Support, Spam）。
- **Sales Agent (任务执行节点):** 结合 RAG 的大模型。职责：根据企业外贸人员思维链注入 Persona，负责多模态/多语言沟通、逼单与异议处理。
- **Data Extractor Agent (后处理节点):** 强指令遵循模型。职责：在会话切断或达到判定阈值时，读取全局 Thread Memory，提取结构化特征（国家、邮箱、电话、意向产品、线索分值）供 CRM 消费。