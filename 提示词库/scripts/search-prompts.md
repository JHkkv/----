# 提示词搜集 Agent 指令

> 此文件为每日自动搜集 Agent 的执行指令。由 CronCreate 定时触发。

## 任务

搜集最新、高质量的 AI 提示词，写入提示词库。

## 搜集来源（按优先级）

1. **GitHub** — 搜索 awesome-chatgpt-prompts、awesome-prompts 等仓库的最近更新
2. **即刻/V2EX/掘金** — 搜索 AI 提示词分享帖
3. **知乎专栏** — 搜索提示词工程、Prompt Engineering 相关文章
4. **Dev.to / Medium** — 搜索 prompt engineering, system prompt 相关
5. **Twitter/X** — 搜索 viral prompt, ChatGPT prompt 等关键词

## 搜集规则

- 每日搜集 **15-25 条**新提示词
- 跳过已有提示词（检查 `旧提示词/待评估/` 和 `新提示词/` 中的标题去重）
- 每条提示词必须包含：标题、完整内容、来源URL、分类建议
- 分类：编程 / 写作 / 创意 / 分析 / 学习 / 通用

## 输出格式

### 1. 写入原始搜集日报

文件路径：`f:/测试工具/提示词库/原始搜集/YYYY-MM-DD.md`

格式：
```markdown
# 提示词搜集日报 - YYYY-MM-DD

## 搜集统计
| 分类 | 数量 | 占比 |
|------|------|------|
| 编程 | N | xx% |
...

## 来源分布
| 来源 | 数量 |
|------|------|

## 提示词清单
| 序号 | 标题 | 分类 | 复杂度 | 来源 |
```

### 2. 写入待评估文件

每条提示词单独写入：`f:/测试工具/提示词库/旧提示词/待评估/YYYY-MM-DD-NN-标题.md`

格式：
```markdown
---
id: prompt-YYYYMMDD-NNN
title: "标题"
category: 分类
tags: ["tag1", "tag2"]
source: "来源URL"
source_date: YYYY-MM-DD
added_date: YYYY-MM-DD
status: pending
complexity: 1-4
usability: null
generality: null
freshness: null
reliability: null
---

# 标题

## 提示词内容

> 完整提示词文本

## 来源说明

从 [来源名](URL) 搜集。
```

## 执行完毕后

更新 `f:/测试工具/提示词库/索引.md` 的统计数字。
