---
tags: [流程优化, 反模式, 经验教训, Skill开发]
created: 2026-07-13
source: [[life-coach-skill]] 开发 + 双Agent审查报告
---

# Skill开发流程优化（6个改进点）

## 优化1: 架构设计与编码必须串行 ⭐⭐⭐

**反模式：** 架构设计和编码并行启动，导致编码Agent和架构师Agent输出不一致

**实际案例：** life-coach开发中，SKILL.md与phase-transitions.md的PROBLEM阶段定义矛盾，审查阶段才暴露

**改进：** 架构设计→确认→编码实现，严格串行

## 优化2: 编码后运行一致性检查 ⭐⭐⭐

**发现：** 审查发现的问题集中在交叉引用不一致：
- 状态机vs工作流阶段名不一致
- 热线号码两个名称
- 输入格式纯文本vs JSON
- 并行策略矛盾

**改进：** 编码完成后自动运行一致性检查脚本

## 优化3: 免责声明使用引用ID ⭐⭐

**反模式：** 免责声明分散在4个文件中，人工维护成本高

**改进：** 定义ID索引表，其他文件引用ID而非复制文本
```
| DISCLAIMER-A | WARMUP | 轻量 |
| DISCLAIMER-B | PROFILE后 | 中 |
| DISCLAIMER-C | COUNCIL前 | 中重 |
| DISCLAIMER-D | SYNTHESIS | 重 |
| DISCLAIMER-AGENT | Agent末尾 | 脚注 |
```

## 优化4: 安全协议独立文件 ⭐⭐

**反模式：** 热线号码分散在两个文件中，变更时易遗漏

**改进：** `references/safety-protocol.md` 作为单一数据源

## 优化5: 示例对话使用标准化标签 ⭐

**反模式：** 占位符 `（接完整免责声明）` 易被误认为普通文本

**改进：** `<!-- INSERT: DISCLAIMER-D -->` HTML注释标记

## 优化6: 归档时自动生成README ⭐

**改进：** 项目目录中缺少人类可读简介，应自动生成README

## 相关笔记

- [[Skill开发标准工作流]] — 标准8步流程
- [[AI辅助编程]] — 小步验证
- [[三层架构]] — 输入/内化/输出
