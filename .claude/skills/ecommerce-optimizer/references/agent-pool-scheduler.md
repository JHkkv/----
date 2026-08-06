# 子 Agent 弹性调度规则（Agent Pool Scheduler）

> 定义子 Agent 池的激活、并行、串行、超时、失败处理规则。
> 核心：**最小激活 4 个**，独立任务并行，依赖任务串行。

## 一、激活规则

### 1.1 最小激活数

每个完整流程**至少激活 4 个子 Agent**：

| 必有 Agent | 作用 |
|-----------|------|
| product-diagnostician | P2 诊断（必有） |
| market-researcher | P3 调研（必有） |
| competitor-benchmarker | P3 对标（必有） |
| content-reviewer | P7 终审（必有，产出内容后） |

### 1.2 弹性激活条件

| 激活条件 | 额外激活的 Agent |
|---------|----------------|
| 商家有投流需求 / 诊断发现投放力维度 ≤3 分 | ad-campaign-analyst |
| 平台是抖音/快手/视频号 | short-video-scriptwriter（必激活） |
| 平台是淘宝/拼多多/亚马逊 | short-video-scriptwriter（可选） |
| 完整流程（默认） | 全部 8 个 |
| 商家只要某模块（"只要文案"） | 只激活 content-optimizer + content-reviewer |

### 1.3 模块化裁剪

商家可通过控制指令裁剪模块（见 SKILL.md 控制指令表）：
- "只看竞品分析" → 激活 market-researcher + competitor-benchmarker（+ad-campaign-analyst），跳过后序
- "只要文案优化" → 激活 content-optimizer + content-reviewer
- "只要脚本" → 激活 short-video-scriptwriter + content-reviewer

**裁剪不影响 GATE 机制**：即使只做一个模块，P4 的 GATE-1（草案+提问）和 P5 的 GATE-2（回答审查）依然执行。

## 二、并行策略

### 2.1 并行组（同一阶段无依赖）

| 阶段 | 并行组 |
|------|--------|
| P3 | market-researcher ‖ competitor-benchmarker ‖ ad-campaign-analyst（可选） |
| P7 | content-optimizer ‖ short-video-scriptwriter ‖ promotion-planner |

### 2.2 串行依赖

| 前置 | 后置 | 原因 |
|------|------|------|
| P2 诊断 | P3 调研/对标 | 调研需要对标焦点 |
| P3 调研/对标 | P4 草案 | 草案要基于调研数据 |
| P4 GATE-1 | P5 GATE-2 | 先答后审 |
| P7 各生产 Agent | P7 content-reviewer | 终审要审全部产出 |
| P9 交付 | P10 归档 | 归档基于完整交付 |

### 2.3 调用方式

- 并行：一条消息内多个 Agent 工具调用（同时发出）。
- 串行：等待前置 Agent 返回后，把其输出作为后置 Agent 的输入。
- 主 Agent 负责整合所有子 Agent 输出，不把整合交给子 Agent。

## 三、并发限制

| 参数 | 值 |
|------|-----|
| 同一阶段最大并行 | 4 个 Agent |
| 单次完整流程 Agent 总数 | 4-8 个（弹性） |
| 超过 4 个并行时 | 分批（如 3+3），分批间等待 |

## 四、超时与失败处理

| 情况 | 处理 |
|------|------|
| 单个 Agent 超时（5 分钟） | 标记"部分完成"，用已产出内容继续 |
| 工具调用失败（如 WebSearch 无结果） | 标注"未检索到数据"，用可得替代源 |
| Agent 返回空/null | 重试 1 次；仍失败则跳过并标注原因 |
| 网络/反爬失败 | 降级为领域推理（可信度 C 级），标注原因 |
| 商家拒绝回答导致依赖缺失 | 标记数据缺口，缩小范围继续（见 gate-mechanism.md） |

## 五、输出回收与整合

1. 每个子 Agent 的**最终文本就是输出物**（无额外包装）。
2. 主 Agent 回收后：
   - 检查是否含免责声明（缺则补上）
   - 检查是否标注数据可信度（缺则补标注）
   - 整合为阶段交付物（按 deliverable-templates.md）
3. 子 Agent 输出之间的冲突（如调研报告与对标矩阵数据矛盾）由主 Agent 仲裁，标注冲突并取更有证据力的。

## 六、与确认门的关系

- 子 Agent 产出 → 阶段确认点（A-E）→ 商家确认后进入下一阶段。
- GATE-1/GATE-2 不由子 Agent 执行，由**主 Agent 直接执行**（这是质量闸门，不能外包给子 Agent）。
- content-reviewer 的审查是子 Agent 层，GATE-2 是主 Agent 层——两层审查互不替代。
