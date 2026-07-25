---
strategy: b
name: Information-Dense
style: study-notes
default_layout: dense
image_count: 1
style_reason: "信息密集型+手写笔记风组合，适合一页讲清一个技术概念，知识密度高但不枯燥"
generated: 2026-07-19
---

# 大纲 B — 信息密集型：一页知识卡

## 思路
直击核心，价值优先。一张纸塞满 RAG 的关键知识点，结构化分层，读一张图就能讲给别人听。

## Image 1 of 1

**Position**: Cover+Core 合一（单张知识卡）
**Layout**: dense
**Core Message**: 一张图讲清 RAG：是什么 → 为什么 → 怎么做
**Slug**: rag-one-page
**Filename**: 01-cover-rag-one-page.png

**Text Content**:
- 标题（蓝笔，大号居中）：「📖 RAG 技术原理」
- 红笔圈出副标题：「Retrieval-Augmented Generation · 检索增强生成」
- 分区 1（黄色荧光笔标头）：「是什么？」
  - RAG = 让 LLM 回答前先查资料的技术架构
  - 把"闭卷考试"变成"开卷考试"
- 分区 2（红笔框起）：「为什么需要？」
  - ✗ LLM 训练完就定格 → 不知道新事
  - ✗ 幻觉：编造不存在的事实
  - ✓ RAG：给 LLM 接入外部知识库
- 分区 3（编号①→②→③ + 箭头草图）：「怎么工作？」
  - ① Query → 用户提问
  - ② Retrieve → 从知识库检索相关文档
  - ③ Generate → 文档+问题拼成 Prompt → LLM 生成答案
- 分区 4（蓝笔列表）：「三大组件」
  - 📄 Knowledge Base（知识库）：向量数据库存文档
  - 🔍 Retriever（检索器）：找到最相关的文档片段
  - 🤖 Generator（生成器）：LLM 基于检索结果生成回答
- 底部 Margin 笔记（红色挤压小字）：
  - 「→ 应用场景：企业知识库问答 / 客服机器人 / 文档助手」
  - 「→ 一句话：RAG = 让大模型学会查资料再说话」

**Visual Concept**:
顶视角，白底横线笔记本，蓝笔主体密密麻麻的手写内容分4个区块。红笔圈出关键词"开卷考试"、"幻觉"、"知识库"。黄色荧光笔涂抹分区标题。边角有蓝笔手绘的①→②→③流程图箭头，以及涂改和挤压在页边的补充小字。

**Swipe Hook**: N/A（单张卡片）
