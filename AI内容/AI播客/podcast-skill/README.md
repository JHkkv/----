# podcast-production — 中文双人对话式播客台本制作 Skill

> 把一段播客选题做成**合规、有钩子、可交付**的中文双人对话台本。
> 多 Agent 流水线 + 阶段确认式执行，符合抖音等短视频平台发布规则。

## Skill ID

`podcast-production`（用户级，安装于 `C:\Users\ASUS\.claude\skills\podcast-production\`）

## 简介

基于 2026-08-04「经济阵痛期」双人播客实战复盘固化的内容生产流水线。用户只需给出主题，即可产出：
- 合规的双人对话台本（钩子 / 板块 / 金句 / CTA）
- 分镜与字幕提示（可直接剪映剪辑）
- Markdown + docx + PDF 三格式交付

## 触发词

做一期播客 / 播客台本 / 双人对话播客 / AI 播客 / 口播文案 / 短视频口播 / 对话式内容

## 文件结构

```
podcast-production/
├── SKILL.md                          # 主文件：触发、状态机、工作流、输出约束
├── scripts/
│   ├── html-to-pdf.js                # docx→PDF 转换脚本（puppeteer-core 驱动本机 Edge）
│   └── package.json                  # 依赖声明（puppeteer-core）
└── references/
    ├── agent-profiles.md             # 4 个子 Agent 角色卡 + Prompt 模板 + 免责声明
    ├── compliance-rules.md           # 平台合规红线（封禁级/限流级/灰色地带）
    ├── fact-check-boundaries.md      # 数据口径边界（失业率/杠杆率等易错点）
    ├── story-structure.md            # 钩子结构 + 情绪曲线 + 角色反差 + 时间模型
    └── deliverable-template.md       # 台本交付模板 + docx/PDF 生成规范
```

## 多 Agent 流水线

| 阶段 | Agent | 职责 |
|------|-------|------|
| P2 调研+资料 | market-researcher + fact-collector（并行） | 话题热度/受众焦虑/钩子/红线 + 数据弹药/口径边界 |
| P4 优化+审查 | copy-polisher + content-reviewer（并行） | 节奏/金句/情绪曲线 + 合规红线逐条查/事实核验 |

**阶段确认式**：P2 后（确认点A）、P3 后（确认点B）、P4 后（确认点C）三处暂停，用户确认后继续。可用"快速模式/跳过确认"一口气跑完。

## 使用方法

1. 说出主题 + 期望（如"做一期关于普通人如何应对经济下行的双人播客"）
2. 回答角色设定 / 内容侧重 / 交付物 三个澄清问题（或直接用默认值）
3. 依次在各确认点审核：调研方向 → 台本初稿 → 优化+审查结果
4. 收获 Markdown + docx 双格式台本

示例提示词：

```
做一期双人播客，主题是「普通人怎么在存钱、避坑、稳住心态之间平衡」，时长 3-5 分钟，要符合抖音规则
```

## 关键能力

- **合规前置**：封禁级（荐股/收益承诺/唱衰/恐慌）与限流级（绝对化/隐私诱导/高危词）红线预置，审查 Agent 逐条核对
- **数据守真**：所有数字必须有来源；找不到来源→模糊化；永不编造
- **金句引擎**：V 字情绪曲线 + 每 40-60s 情绪高点 + ≥5 处可截图金句
- **三格式交付**：Markdown + docx（officecli 生成，含页码/表格/分级标题）+ PDF（scripts/html-to-pdf.js 两步转换，无需 Word）

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.1 | 2026-08-04 | 交付改为 docx + PDF 双格式：新增 scripts/html-to-pdf.js（puppeteer-core 驱动 Edge，两步转换） |
| v1.0 | 2026-08-04 | 首版，基于「经济阵痛期」实战复盘 |

## 免责声明

本 Skill 产出的内容为创意/生活感悟类文本，不构成任何投资建议、理财建议或专业意见。所有数据以权威公开来源为准，引用时建议二次核对。任何投资决策请咨询持牌专业人士。
