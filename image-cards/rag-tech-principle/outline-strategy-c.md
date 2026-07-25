---
strategy: c
name: Visual-First
style: study-notes
default_layout: balanced
image_count: 1
style_reason: "视觉优先+手写笔记风，用图解为核心，文字极简辅助，适合快速理解型的读者"
generated: 2026-07-19
---

# 大纲 C — 视觉优先：图解驱动

## 思路
以手绘架构图为核心视觉，文字被极度压缩为标注和图注。一眼看懂 RAG 的数据流，适合滑动浏览型读者。

## Image 1 of 1

**Position**: Cover+Core 合一（单张知识卡）
**Layout**: balanced（图为主，文为辅）
**Core Message**: 一张手绘流程图看懂 RAG
**Slug**: rag-visual-flow
**Filename**: 01-cover-rag-visual-flow.png

**Text Content**:
- 标题（蓝笔，页面顶部）：「RAG 是怎么工作的？」
- 核心图解区（占据页面 70% 面积）：
  - 手绘流程图，三个大框 + 箭头连接：
    ```
    [📄 知识库] ──检索──→ [🔍 Retriever]
                              │
                              ↓ 相关文档片段
    [👤 用户提问] ─────────→ [🤖 LLM Generator]
                              │
                              ↓
                          [✅ 可溯源答案]
    ```
  - 每个框用红笔标注角色名称
  - 箭头旁用蓝笔小字写「向量检索」「拼入 Prompt」
- 左侧 Margin（红笔竖写）：「核心逻辑」
  - 「先查资料 → 再回答问题」
  - 「开卷考试 📖」
- 底部总结区（黄色荧光笔横条）：「RAG = 检索(Retrieve) + 增强(Augment) + 生成(Generate)」
- 右下角（红色星标+小字）：「⭐ 没有 RAG 的 LLM = 闭卷瞎猜」

**Visual Concept**:
顶视角白底横线纸。页面主体是一个占大篇幅的手绘流程架构图——三个涂鸦风格的框用蓝笔箭头串联，红笔标出每个模块名。四周留白处有稀疏但精准的文字标注。整体视觉重心在图的逻辑流上，文字是辅助。有手写的涂改痕迹和箭头修正，增加真实笔记感。

**Swipe Hook**: N/A（单张卡片）
