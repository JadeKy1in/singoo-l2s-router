# Singoo L2S-Router (Lead-to-Sale Multi-Agent Orchestrator)

## Core Requirement / 核心需求

The core objective of this project is to develop a high-conversion-oriented multi-agent collaboration hub prototype (PoC). It simulates overseas B2B marketing scenarios, connecting the full chain from "social media interaction" to "AI sales reception" to "CRM lead capture." By building an Agent Workflow with shared memory and routing distribution capabilities, it addresses the "process execution efficiency black hole" and "data silo" problems at the marketing-to-sales boundary faced by export-oriented enterprises.

本项目的核心目标是开发一个高转化导向的多智能体协同枢纽原型（PoC）。模拟 B2B 出海营销场景，打通从"社交媒体互动"到"AI 销售接待"再到"CRM 线索沉淀"的全链路。通过构建一个具备记忆共享与路由分发能力的 Agent Workflow，解决出海企业营销端与销售端流程执行的效率黑洞与数据孤岛问题。

## Success Criteria / 成功标准

1. **Multi-Agent Routing / 多级路由编排:** The system must accept simulated unstructured customer inquiry input and accurately identify intent (e.g., post-purchase support, bulk procurement, casual browsing). / 能够接收一段模拟的非结构化客户询盘输入，精准识别意图（如：售后咨询、批量采购、随便看看）。

2. **RAG-Powered Sales Interaction / 知识检索交互:** When classified as a high-potential lead, the AI Sales Agent must conduct at least 2 turns of realistic multi-language sales conversation and technical Q&A based on a mounted mock enterprise knowledge base (e.g., new energy equipment specifications). / 当判定为高潜线索时，AI Sales Agent 能够基于挂载的 Mock 企业知识库（如：某新能源设备规格），进行至少 2 轮以上的拟真多语种逼单/技术解答。

3. **Structured Asset Extraction / 结构化资产沉淀:** After the session ends, the system must automatically trigger a summarization mechanism that extracts the conversation into a standard B2B CRM lead structure (customer basic information, demand preferences, lead scoring) and output it in structured JSON format. / 会话结束后，系统能自动触发总结机制，将对话提取为标准 B2B CRM 线索结构（客户基础信息、需求偏好、线索打分），并输出结构化 JSON 格式。
