# Singoo L2S-Router (Lead-to-Sale Multi-Agent Orchestrator)

## Core Requirement
本项目的核心目标是开发一个高转化导向的「多智能体协同枢纽」原型（PoC）。
模拟 B2B 出海营销场景，打通从“社交媒体互动”到“AI销售接待”再到“CRM线索沉淀”的全链路。通过构建一个具备记忆共享与路由分发能力的 Agent Workflow，解决出海企业营销端与销售端“流程执行的效率黑洞”与“数据孤岛”问题。

## Success Criteria
1. **多级路由编排 (Multi-Agent Routing):** 能够接收一段模拟的非结构化客户询盘输入，精准识别意图（如：售后咨询、批量采购、随便看看）。
2. **知识检索交互 (RAG Integration):** 当判定为高潜线索时，AI Sales Agent 能够基于挂载的 Mock 企业知识库（如：某新能源设备规格），进行至少 2 轮以上的拟真多语种逼单/技术解答。
3. **结构化资产沉淀 (Data Extraction):** 会话结束后，系统能自动触发总结机制，将对话提取为标准 B2B CRM 线索结构（客户基础信息、需求偏好、线索打分），并输出结构化 JSON 格式。