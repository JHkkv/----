---
strategy: c
name: Visual-First
style: study-notes
default_layout: balanced
image_count: 1
style_reason: "图解驱动+适度整洁的手写笔记，核心流程图占主视觉，文字精炼标注"
visual_modifier: "clean-neat"
generated: 2026-07-19
---

# 大纲 — 图解驱动：一张手绘流程图看懂 RAG

## 思路
以手绘架构图为核心视觉，文字精炼标注。整洁但保留笔记手写感，适合滑动浏览型读者一眼抓住核心逻辑。

## Image 1 of 1

**Position**: Cover+Core 合一（单张知识卡）
**Layout**: balanced（图为主，文为辅，图占 70%）
**Core Message**: 一张手绘流程图看懂 RAG：检索→增强→生成
**Slug**: rag-visual-flow
**Filename**: 01-cover-rag-visual-flow.png

**文字内容**:
- 标题（蓝笔，页面顶部居中，中等偏大）：「RAG 是怎么工作的？」
- 核心图解区（占页面 70%）：
  手绘流程图，三个大框+箭头串联：
  ```
  [ 知识库 ] ──检索──→ [ Retriever ]
                           │
                           ↓ 相关文档片段
  [ 用户提问 ] ────────→ [ LLM 生成器 ]
                           │
                           ↓
                       [ 可溯源答案 ]
  ```
  每个框蓝笔写字、红笔标角色名。箭头旁小字标注「向量检索」「拼入 Prompt」
- 左侧竖写（红笔）：「先查资料再回答 = 开卷考试」
- 底部荧光笔横条：「RAG = 检索 → 增强 → 生成」
- 右下角红色星标：「没有 RAG 的 LLM = 闭卷瞎猜」

**视觉概念**:
顶视角白底横线笔记本。页面主体是手绘流程架构图——三个涂鸦风格框用蓝笔箭头串联，红笔标模块名。
整洁但不死板：保留手写笔触的自然粗细变化和轻微倾斜，但减少涂改团、墨点、过度挤压的边注。
整体字体可辨识度高，非乱码式潦草。
