# Life Coach Skill

> **非专业心理支持对话框架**
>
> Skill ID: `life-coach`
> 归档路径: `小红书文案/life-coach-skill/`

## 触发词

说"**我想聊聊**"、"**最近有点烦**"、"**帮我梳理梳理**"即可触发。

## 工作流（4阶段）

```
WARMUP → PROFILE → PROBLEM → COUNCIL → SYNTHESIS
 暖场      人设       问题       顾问团     综合呈现
```

| 阶段 | 做什么 |
|------|--------|
| WARMUP | 暖场 + 第一处免责声明 + 确认意愿 |
| PROFILE | 5维度探索（价值观/优势/弱点/情绪/向往）→ 输出"我眼中的你" |
| PROBLEM | 聚焦具体困扰，命名→确认，不做分析 |
| COUNCIL | 6个AI顾问并行分析（知己/智者/实干家/反观者/旁观者/引路人） |
| SYNTHESIS | 共鸣识别 + 张力呈现 + 2-3条行动路径 + 完整免责声明 |

## 文件结构

```
life-coach-skill/
├── SKILL.md                           # 主入口（580行）
└── references/
    ├── dimensions.md                  # 5维度问题库
    ├── agent-profiles.md              # 6个顾问角色卡
    ├── disclaimer-templates.md        # 免责声明话术4点4面
    ├── phase-transitions.md           # 状态机详细定义
    └── conversation-style.md          # 活人感语气指南
```

## 安全协议

- 🔴 **URGENT**: 明确自伤/他伤意图 → 110/120 + 心理热线
- 🟡 **CONCERN**: 模糊高危信号 → 温和关注 + 热线信息
- 热线: 希望24热线 400-161-9995 / 北京心理危机 010-82951332 / 华师大 400-967-8920

## 维护日志

| 日期 | 内容 |
|------|------|
| 2026-07-13 | 初始创建，通过22项审查修复 |
