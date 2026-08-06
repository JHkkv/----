---
name: podcast-production
description: 中文双人对话式播客台本制作 Skill。当用户想做一期播客（AI播客/双人播客/对话式播客/口播文案），尤其是"普通人的经济话题/生活话题/观点类话题"，需要符合抖音等短视频平台发布规则、时长 3-5 分钟的双人对话台本时使用。触发词："做一期播客"、"播客台本"、"双人对话播客"、"AI 播客"、"口播文案"、"短视频口播"、"对话式内容"。采用多 Agent 流水线（市场调研→资料收集→文案优化→内容审查），交付带分镜/字幕提示的台本 + 可选 docx 导出。
---

# 播客制作 Skill（Podcast Production）

把一段播客选题做成**合规、有钩子、可交付**的中文双人对话台本。多 Agent 流水线 + 阶段确认式执行。

## 触发机制

**显式触发词**：做一期播客 / 播客台本 / 双人对话播客 / AI 播客 / 口播文案 / 短视频口播 / 对话式内容 / 双人对话

**隐式触发条件**：用户给出主题 + 提到"双人/对话/口播/播客/短视频文案"任一，且期望产出可录制的对话文本。

**软确认**：话题模糊时先问 3 个关键维度（见 P1），不要直接开工。

## 执行模式：阶段确认式（默认）

默认每个阶段产出后**暂停**，汇总给用户确认后再继续。用户可随时用控制指令跳过确认点进入快速模式。

### 控制指令表

| 用户说 | 效果 |
|--------|------|
| "跳过确认 / 快速模式 / 全自动" | 跳过 P2/P3/P4 的确认点，一口气跑完流水线 |
| "改角色 / 换板块 / 调时长" | 回到对应阶段调整，不重跑已完成阶段 |
| "只看台本 / 只要文字" | P6 只输出 Markdown，不生成 docx |
| "换平台" | 平台合规矩阵切换（默认抖音，可选 B站/快手/视频号） |
| "停止 / 到这吧" | 立即结束，输出当前已产出的内容 |

## 状态机

```
[触发] 用户给出主题 + 平台 + 时长（或走 P1 澄清）
   │
   ▼
P1 需求澄清 ── AskUserQuestion：①角色设定 ②内容侧重(多选) ③交付物
   │  默认：打工人甲×乙 / 全板块 / MD+docx
   ▼
P2 调研+资料（2 Agent 并行）
   │  ├─ market-researcher：话题热度/受众焦虑/爆款钩子/平台合规红线
   │  └─ fact-collector：数据事实+来源+口径边界+禁引项
   │
   ▼ ⚠ 确认点A（汇总：话题热度、受众焦虑点、可复用钩子、合规红线、数据弹药、口径边界）
P3 台本初稿（主 Agent 编写）
   │  └─ 按 story-structure.md 结构：钩子→主题→四板块→CTA
   ▼ ⚠ 确认点B（展示初稿摘要：板块结构、开头钩子、总金句数、预计时长）
P4 优化+审查（2 Agent 并行）
   │  ├─ copy-polisher：节奏/钩子/金句/情绪曲线/口语化/画面感
   │  └─ content-reviewer：合规红线逐条查+事实核验+最终裁定
   ▼ ⚠ 确认点C（展示：审查分级问题摘要、优化说明关键改动、最终裁定）
P5 合成终稿（主 Agent 合并裁决）
   │  保留有据数据+锚定来源 / 删除越界项 / 模糊敏感项
   ▼
P6 交付：Markdown（F:\测试工具\AI内容\AI播客\）+ officecli 转 docx
```

## 工作流

### P1 需求澄清

用 `AskUserQuestion`（最多 4 问）确认：
1. **角色设定**：打工人甲×乙 / 财经主播×上班族 / 长辈×年轻人 / 其他
2. **内容侧重**（多选）：现金流与消费 / 职业与抗风险 / 负债与投资 / 心态与长期主义
3. **交付物**：仅文案台本 / 台本+分镜字幕提示 / 台本+分镜+TTS音频
4. 平台（默认抖音）与时长（默认 3-5 分钟）

用户不回答时使用默认值，不反复追问。

### P2 调研 + 资料（并行 2 Agent）

并行启动 `market-researcher` 和 `fact-collector`（见 references/agent-profiles.md 的 Prompt 模板）。
两者产出后**在确认点A 汇总**：话题热度、受众焦虑点、可复用钩子、合规红线、数据弹药、口径边界。

### P3 台本初稿

主 Agent 依据 story-structure.md 编写初稿：
- 冷启动钩子（0-8s：数据冲击/身份共鸣/反常识）
- 切入主题 → 按用户选定板块展开（每板块 40-60s 一个情绪高点）
- 结尾 CTA（轻互动，不诱导隐私）
- 每个板块后附分镜/字幕提示

### P4 优化 + 审查（并行 2 Agent）

- `copy-polisher`：口语化、节奏交锋、金句浓度（≥5）、V 字情绪曲线、画面感
- `content-reviewer`：对照 references/compliance-rules.md 逐条查封禁级/限流级红线，输出分级问题清单 + 最终裁定

### P5 合成终稿（裁决原则）

| 情况 | 处理 |
|------|------|
| 数据有权威来源（央行/统计局/权威报告） | **保留 + 口播带出处锚定** |
| 审查判定越界（荐股/收益承诺/恐慌/隐私CTA） | **删除或重写** |
| 敏感但非越界（具体职业负面/中日类比） | **模糊化表述** |
| 绝对化用语（所有人/最/百分百） | 替换为限定表述 |

### P6 交付

1. 写 Markdown 到**用户指定的输出目录**（默认 `F:\测试工具\AI内容\AI播客\<标题>.md`；若该路径不存在或用户非本机，改用用户当前工作目录或询问确认）
2. 用 officecli 生成 docx（结构见 references/deliverable-template.md）
3. **docx → PDF 两步转换**（officecli 渲染 HTML → `scripts/html-to-pdf.js` 驱动本机 Edge 转 PDF；详见 deliverable-template.md"PDF 转换"）
4. QA：`officecli validate` + `view outline` 确认结构完整 + 确认 PDF 生成成功（含文本层）

## 输出约束

- **数据守真**：所有数字必须有来源；找不到来源→模糊化或删；永不编造
- **合规**：无具体理财产品/收益承诺/绝对化/恐慌/隐私诱导（见 compliance-rules.md）
- **情绪**：结尾必须给希望/行动方案，V 字型，不得全程低沉
- **金句**：全篇 ≥5 处可截图金句
- **对话感**：双人要有信息差/交锋/接梗，禁止平铺直叙念报告
- **免责声明**：子 Agent Prompt 末尾一律带免责声明（见 agent-profiles.md）

## 不做的事

- 不推荐任何具体理财产品/股票/基金（封禁级）
- 不承诺收益、不暗示"稳赚不赔"
- 不编造数据、不引用无来源的数字
- 不制造恐慌、不恶意唱衰
- 不用绝对化用语（所有人都/没人/最好/百分百）
- 不诱导观众晒个人财务隐私（存款/负债金额）
- 不输出"躺平""暴雷""崩盘""佛系"等高危词
- 不含"躺平"等可能限流的表述

## 参考文件

- [references/agent-profiles.md](references/agent-profiles.md) — 4 个子 Agent 角色卡 + Prompt 模板
- [references/compliance-rules.md](references/compliance-rules.md) — 平台合规红线 + 审查清单
- [references/fact-check-boundaries.md](references/fact-check-boundaries.md) — 数据口径边界（易错点）
- [references/story-structure.md](references/story-structure.md) — 钩子结构 + 情绪曲线 + 角色反差
- [references/deliverable-template.md](references/deliverable-template.md) — 台本交付模板（docx + PDF 生成规范）
- [scripts/html-to-pdf.js](scripts/html-to-pdf.js) — docx→PDF 转换脚本（puppeteer-core 驱动本机 Edge）
