---
id: prompt-20260628-23
title: "Claude Code最佳实践指南"
category: 编程
tags: [Claude Code, AI编程, 开发工作流, 自动化, 最佳实践]
source: "https://github.com/awattar/claude-code-best-practices"
source_date: 2026-06-28
added_date: 2026-06-28
status: active
complexity: 4
usability: 3
generality: 3
freshness: 3
reliability: 3
last_used: null
use_count: 0
related: []
优化历史: []
---

## 提示词内容

> Claude Code是命令行工具，用于代理式编码。有效使用模式：
>
> 1. CLAUDE.md预加载项目上下文：在项目根目录创建CLAUDE.md文件，描述项目结构、技术栈、编码规范
> 2. 自定义斜杠命令：创建/custom-init自动生成CLAUDE.md，/commit创建规范化提交，/issue端到端解决GitHub Issue
> 3. 专业子代理：general-solution-architect（架构分析）、general-fullstack-developer（全栈开发）、general-qa（测试策略）等
> 4. Hooks自动化：PostToolUse自动格式化编辑后的文件，PreToolUse验证文件大小，Stop验证构建
> 5. 规划模式：先分析需求制定计划，确认后再执行实现

## 使用场景

- Claude Code 工具的高效使用
- AI 辅助编程工作流优化
- 开发团队 AI 工具采纳指南

## 适用模型

Claude Code（CLI 工具）

## 来源

- 仓库：https://github.com/awattar/claude-code-best-practices
- 用途：Claude Code 最佳实践集合
