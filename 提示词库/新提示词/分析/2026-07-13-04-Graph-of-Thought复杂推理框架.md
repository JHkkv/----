---
id: prompt-20260713-004
title: "Graph-of-Thought复杂推理框架"
category: 分析
tags: ["推理", "结构化思维", "GoT", "复杂问题"]
source: "https://futureagi.com/blog/what-is-prompt-engineering/"
source_date: 2026-07-13
added_date: 2026-07-13
status: active
complexity: 4
usability: null
generality: null
freshness: null
reliability: null
---

# Graph-of-Thought 复杂推理框架

## 提示词内容

> 请用 Graph-of-Thought (GoT) 方法分析以下复杂问题。不要用线性思维，而是将问题拆解成多个相互关联的子问题，构建推理图：
>
> ## 步骤
> 1. **问题拆解**：将主问题拆成 3-5 个可独立分析的子问题
> 2. **独立推理**：对每个子问题给出独立分析
> 3. **交叉关联**：指出子问题之间的依赖关系和数据流
> 4. **综合结论**：基于所有子问题及关联，给出综合答案
>
> ## 输出格式
> ```
> ## 主问题重述
> [一句话]
>
> ## 推理图
> [子问题1] ←→ [子问题2]
>    ↓            ↓
> [子问题3] → [综合结论]
>
> ## 子问题分析
> ### 子问题1: [标题]
> - 核心发现
> - 不确定性
>
> （依次处理所有子问题）
>
> ## 交叉关联
> - 子问题1→ 子问题2: [关键依赖]
> - 子问题3→ 综合: [决定性因素]
>
> ## 综合结论
> [不超过5句话]
> ```
>
> 现在请分析以下问题：
> [粘贴复杂问题]

## 来源说明

2026 年 top prompt 技巧之一。Graph-of-Thought 将推理表示为有向依赖图的节点，适用于非线性复杂推理。
