# Dify 工作流搭建完全教程

> 基于 Dify 源码（`api/core/workflow/` + `web/app/components/workflow/`）的实战指南。
> 本教程共五篇：概念篇 → 节点篇 → 变量篇 → 实战篇 → 进阶篇。

---

## 目录

1. [概念篇 — 工作流架构与核心概念](01-概念篇-架构与核心概念.md)
2. [节点篇 — 28 种节点完全详解](02-节点篇-28种节点详解.md)
3. [变量篇 — 变量系统与数据传递](03-变量篇-变量系统与数据传递.md)
4. [实战篇 — 5 个真实场景完整搭建](04-实战篇-5个真实场景.md)
5. [进阶篇 — 触发器 / HITL / 循环 / 错误处理 / Agent](05-进阶篇-高级特性.md)

---

## 快速导航

### 你想搭什么？

| 场景 | 阅读顺序 |
|------|---------|
| "完全没碰过 Dify，从零开始" | 概念篇 → 节点篇 → 实战篇 #1 → 变量篇 |
| "会基本操作，想搭个客服机器人" | 节点篇（LLM + 知识检索）→ 实战篇 #2 |
| "想做自动化数据处理管线" | 节点篇（Code + HTTP + 模板）→ 实战篇 #3 |
| "想做多步骤 AI Agent" | 节点篇（Agent）→ 进阶篇 #4（错误处理）→ 实战篇 #4 |
| "想做定时任务/Webhook 触发" | 进阶篇（触发器）→ 实战篇 #5 |
| "想深入理解变量传递机制" | 变量篇 → 进阶篇（循环变量作用域） |
| "接入了人工审批节点，不太会用" | 进阶篇（HITL）→ 节点篇（HumanInput） |
| "接了外部工具/API，想了解更多" | 节点篇（Tool + HTTP）→ 进阶篇（Agent 工具绑定） |

### 各节点速查

| 想做什么 | 用什么节点 | 位置 |
|---------|----------|------|
| 调用大模型 | LLM | [节点篇 §1](02-节点篇-28种节点详解.md#1-llm—大语言模型) |
| 让 AI 搜索知识库 | 知识检索 | [节点篇 §2](02-节点篇-28种节点详解.md#2-knowledgeretrieval—知识库检索) |
| 条件分支 | IF-ELSE | [节点篇 §3](02-节点篇-28种节点详解.md#3-ifelse—条件分支) |
| 写 Python/JS 代码 | Code | [节点篇 §4](02-节点篇-28种节点详解.md#4-code—代码执行) |
| 调用外部 API | HTTP 请求 | [节点篇 §5](02-节点篇-28种节点详解.md#5-httprequest—http-请求) |
| 文本模板渲染 | 模板转换 | [节点篇 §6](02-节点篇-28种节点详解.md#6-templatetransform—模板转换) |
| 循环处理数组 | 迭代 | [进阶篇 §3](05-进阶篇-高级特性.md#3-迭代iteration与循环loop) |
| 条件循环 | 循环 | [进阶篇 §3](05-进阶篇-高级特性.md#3-迭代iteration与循环loop) |
| 提取结构化参数 | 参数提取器 | [节点篇 §12](02-节点篇-28种节点详解.md#12-parameterextractor—参数提取器) |
| 分类用户意图 | 问题分类器 | [节点篇 §11](02-节点篇-28种节点详解.md#11-questionclassifier—问题分类器) |
| 变量赋值/聚合 | 变量赋值器/聚合器 | [变量篇 §4](03-变量篇-变量系统与数据传递.md#4-变量节点的写操作) |
| 构建 AI Agent | Agent | [进阶篇 §5](05-进阶篇-高级特性.md#5-agent-节点) |
| 人工审批/表单 | 人工输入 | [进阶篇 §2](05-进阶篇-高级特性.md#2-humaninput—人工介入) |
| 定时触发 | 定时触发器 | [进阶篇 §1](05-进阶篇-高级特性.md#1-触发器trigger) |
| Webhook 触发 | Webhook 触发器 | [进阶篇 §1](05-进阶篇-高级特性.md#1-触发器trigger) |
| 外部插件触发 | 插件触发器 | [进阶篇 §1](05-进阶篇-高级特性.md#1-触发器trigger) |
| 数据源输入 | DataSource | [节点篇 §14](02-节点篇-28种节点详解.md#14-datasource—数据源) |
| 解析文档 | 文档提取器 | [节点篇 §13](02-节点篇-28种节点详解.md#13-documentextractor—文档提取器) |
| 过滤数组 | 列表操作 | [节点篇 §15](02-节点篇-28种节点详解.md#15-listfilter—列表过滤器) |

---

## 源码版本

本教程基于 Dify main 分支源码编写（2026 年 7 月），所有 API/变量名/文件路径均与实际代码对应。

### 核心源码结构

```
dify/
├── api/core/workflow/
│   ├── workflow_entry.py          ← 工作流入口，GraphEngine 驱动
│   ├── node_factory.py            ← 节点注册与解析 (resolve_workflow_node_class)
│   ├── graph_topology.py          ← 图拓扑分析 (上下游检测)
│   ├── system_variables.py        ← 系统变量定义 (sys.query, sys.user_id ...)
│   ├── variable_pool_initializer.py ← 变量池初始化
│   ├── variable_prefixes.py       ← 变量前缀常量
│   ├── nodes/
│   │   ├── agent/                 ← Agent v1 节点
│   │   ├── agent_v2/              ← Agent v2 节点 (当前主力)
│   │   ├── human_input/           ← 人工输入节点 (HITL)
│   │   ├── trigger_webhook/       ← Webhook 触发器
│   │   ├── trigger_schedule/      ← 定时触发器
│   │   ├── trigger_plugin/        ← 插件触发器
│   │   ├── knowledge_retrieval/   ← 知识库检索
│   │   └── knowledge_index/       ← 知识库索引
│   └── generator/                 ← AI 自动生成工作流
├── web/app/components/workflow/
│   ├── types.ts                   ← BlockEnum 定义 (所有节点类型)
│   ├── constants.ts               ← 全局变量 & 输出结构定义
│   ├── nodes/                     ← 前端节点面板 (每种节点一个目录)
│   │   ├── llm/                   ← LLM 配置面板
│   │   ├── code/                  ← Code 节点面板
│   │   ├── http/                  ← HTTP 配置面板
│   │   ├── iteration/             ← 迭代节点
│   │   ├── loop/                  ← 循环节点
│   │   ├── if-else/               ← 条件分支
│   │   └── ...
│   └── block-selector/            ← 节点选择器 + 预览卡片
└── web/types/workflow.ts          ← 类型定义 (NodeTracing, ExecutionMetadata)
```
