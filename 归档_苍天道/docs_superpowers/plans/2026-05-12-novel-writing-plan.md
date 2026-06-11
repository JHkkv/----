# novel-writing 技能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建覆盖小说写作全流程的 AI 辅助技能包（续写/润色/设定管理/设定共创/自动汇总）。

**Architecture:** 单一技能 + 3 个引用文件，部署到 `~/.claude/skills/novel-writing/`。遵循 agentskills.io 规范。

**Tech Stack:** Markdown with YAML frontmatter, file-based references

---

## 文件分工

| 文件 | 职责 |
|------|------|
| SKILL.md | 核心工作流定义、触发条件、互动规则 |
| style-guide.md | 文风特征提取方法 + 用户自定义规则模板 |
| settings-schema.md | 设定文件标准结构 + 一致性检查清单 |
| chapter-template.md | 章节元数据头部模板 + 归档流程 |

---

### Task 1: 创建 SKILL.md — 头部与概述

**Files:**
- Create: `~/.claude/skills/novel-writing/SKILL.md`

- [ ] **Step 1: 写入 SKILL.md 头部和概述**

```markdown
---
name: novel-writing
description: Use when the user wants to write or continue a novel, manage novel settings or worldbuilding, polish novel prose, co-create plot elements, or manage chapter files. Triggers on: 小说, 续写, 章节, 设定, 润色, 人物, 伏笔, 大纲, 剧情, novel writing, chapter continuation, prose polishing, worldbuilding.
---

# Novel Writing Assistant

## Overview

A comprehensive novel-writing AI assistant covering continuation, editing, setting management, co-creation, and chapter aggregation. Operates as an editor/partner — executes instructions AND proactively flags issues. Core principle: **never write prose before checking setting consistency.**

## When to Use

- 续写/继续写小说章节
- 修改润色已有段落
- 查询或维护小说设定（人物、境界、势力、时间线）
- 脑暴新剧情、新角色、新支线
- 管理章节文件与汇总定稿
- Only for novel writing tasks; not for general-purpose writing

## Interaction Mode

Mixed mode: execute instructions + proactive editor behavior.
- Execute explicit commands (continue, polish, check settings)
- Proactively flag setting contradictions, style drift, pacing issues
- Ask clarifying questions when direction is unclear before taking action
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/SKILL.md
git commit -m "feat: add novel-writing SKILL.md header and overview"
```

---

### Task 2: 写入续写模块（核心）

**Files:**
- Modify: `~/.claude/skills/novel-writing/SKILL.md` — 追加续写模块

- [ ] **Step 1: 追加续写 7 步工作流**

```markdown
## Continuation Workflow

**HARD-GATE: Never write prose before completing Step 2 (Setting Audit).**

### Step 1: Context Gathering (automatic)

Before any continuation, silently read:
- The most recent 3-5 chapters
- Settings file (材料_设定.txt) for worldbuilding, characters, foreshadowing
- Chapter metadata headers for character status, active plot threads

### Step 2: Setting Audit Report (MANDATORY)

Output a setting audit before any plot discussion:

> **设定核查报告**
> - 主角当前境界/状态：[from settings file]
> - 已出场关键人物位置：[list with current locations]
> - 已埋未收伏笔：[list unchecked items from settings]
> - 时间线约束：[last known time reference]
> - 本次续写需特别注意：[specific constraints and constraints]

Wait for user acknowledgment before proceeding.

### Step 3: Plot Discussion

Propose 2-3 plot directions, each covering:
- Core conflict or event
- Connection to main storyline
- Which existing characters are involved
- How it ties into open foreshadowing

Or accept user's specified direction directly.

### Step 4: Outline Drafting

For the confirmed direction:

> **章节大纲**
> - 章节标题（暂定）：
> - 分节结构：
>   - 第1节：[关键事件] (~X字)
>   - 第2节：[关键事件] (~X字)
>   - ...
> - 预计总字数：
> - 新增设定点：[人物/地点/物品，无则写"无"]

Wait for user approval before writing prose.

### Step 5: Prose Writing

Write the chapter body:
- Reference style-guide.md for style matching
- Check settings-schema.md consistency checklist
- Mark new setting elements: <!--新设定: description-->

### Step 6: Review

After writing, self-check:

> **自查报告**
> - 设定一致性：[pass/fail per checklist item]
> - 文风匹配度：[note any deviations from style profile]
> - 伏笔处理：[which foreshadowing lines were advanced]

User provides feedback. Apply revisions.

**Conflict Detection:** If user's revision request contradicts prior settings:

> ⚠️ 冲突提醒：[具体矛盾说明]
> 建议替代方案：[alternative that preserves consistency]

### Step 6.5: Word Count Adjustment

If final word count deviates from outline target by >10%:
- Under target: expand descriptions, dialogue, or internal monologue
- Over target: tighten prose, merge redundant sections
- Present adjusted version for user confirmation

### Step 7: Archive (automatic on final approval)

Execute in order:
1. Write chapter file per chapter-template.md
2. Append to aggregate file (苍天道_全本.txt)
3. Update settings file per settings-schema.md
4. Update memory index (latest chapter, character status)
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/SKILL.md
git commit -m "feat: add continuation workflow (7-step with setting audit gate)"
```

---

### Task 3: 写入设定管理模块

**Files:**
- Modify: `~/.claude/skills/novel-writing/SKILL.md` — 追加设定管理

- [ ] **Step 1: 追加设定管理**

```markdown
## Setting Management

### Dual-Track Architecture

- **Authority source:** 材料_设定.txt — canonical file for all worldbuilding data
- **Fast index:** Claude memory — chapter pointers, character status, key foreshadowing status

Before any content-modifying action, cross-check both tracks.

### Consistency Checklist

Execute before every continuation or revision:

| # | Check | Method |
|---|-------|--------|
| 1 | 境界一致 | Character realm matches last known state in settings |
| 2 | 位置一致 | Character location follows from prior chapter or reasonable travel |
| 3 | 因果一致 | New events do not contradict established cause/effect chains |
| 4 | 伏笔扫描 | Are there unchecked `[ ]` foreshadowing items to advance |
| 5 | 时间线 | Event sequence is coherent; no timeline contradictions |

Flag any failures before proceeding. Do not write content while any check fails unresolved.

### Settings Update on Archive

After chapter finalization, update 材料_设定.txt:
- New characters → append to character registry with known attributes
- Realm changes → update character status field
- New foreshadowing → append with `[ ]` checkbox
- Resolved foreshadowing → mark `[x]` with resolution chapter reference
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/SKILL.md
git commit -m "feat: add setting management with dual-track and checklist"
```

---

### Task 4: 写入润色与文风管理模块

**Files:**
- Modify: `~/.claude/skills/novel-writing/SKILL.md` — 追加润色模块

- [ ] **Step 1: 追加润色模块**

```markdown
## Polish & Style Management

### Style Learning

Extract style profile from user-provided sample chapters (see style-guide.md for full methodology):
- Average sentence length and variation pattern
- Dialogue / description / action ratio
- Combat scene rhythm density
- Word choice and rhetorical preferences
- Paragraph length distribution

Store profile in style-guide.md. User may supplement with manual rules that override auto-extraction.

### Polish Workflow

1. User specifies passage to polish
2. Diagnose against style profile:

> **文风诊断**
> - 句式：[actual vs target sentence structure]
> - 对话占比：[actual vs target dialogue ratio]
> - 描写密度：[actual vs target description density]
> - 节奏：[actual vs target pacing]
> - 建议修改方向：[specific, actionable recommendations]

3. User confirms direction → apply revisions item by item
4. User reviews each revision → revise or approve
5. On final approval → archive updated passage

### Conflict Detection

If user's requested polish changes contradict prior settings:

> ⚠️ 冲突提醒：[具体矛盾说明]
> 建议替代方案：[alternative approach]

### Self-Learning Threshold

Track acceptance per revision type:
- Same revision type accepted ≥20 consecutive times → skip user confirmation for that type
- Announce when threshold crossed: "已自动采纳 [修改类型]，累计通过 20 次"
- Reset counter to 0 if user rejects an auto-applied revision
- Only applies to polish/revision operations; never skip confirmation for new content creation
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/SKILL.md
git commit -m "feat: add polish module with conflict detection and self-learning"
```

---

### Task 5: 写入设定共创与自动汇总模块

**Files:**
- Modify: `~/.claude/skills/novel-writing/SKILL.md` — 追加共创、汇总、贯穿规则

- [ ] **Step 1: 追加设定共创、汇总、贯穿规则**

```markdown
## Setting Co-Creation

When user proposes a new element (character, faction, storyline, item):

### Step 1: Guided Questions

Ask one question at a time (max 3), targeting:
- Relationship to main storyline
- Intended narrative effect
- Setting constraints to avoid

### Step 2: Proposal Generation

Based on user answers + existing settings, output 2-3 concrete proposals:

> **方案 A:** [description] — 与主线关联：[X]，风险：[Y]
> **方案 B:** [description] — 与主线关联：[X]，风险：[Y]
> **方案 C:** [description] — 与主线关联：[X]，风险：[Y]
> **推荐：** [choice + reasoning]

### Step 3: Integration

After user selects or combines proposals:
- Update 材料_设定.txt with new entries
- Link to existing foreshadowing where applicable
- Run consistency check for newly introduced contradictions

## Auto-Aggregation

Triggers automatically when user confirms a chapter as final.

Execute in strict order:
1. Write chapter file using metadata header from chapter-template.md
2. Append full chapter text to aggregate file in chapter order
3. Update settings file per settings-schema.md archive template
4. Update memory index: latest chapter number, character status snapshot

## Cross-Cutting Rules

1. **Setting audit BEFORE content:** Any operation that adds or modifies story content requires a setting consistency check first.
2. **Incremental confirmation:** Never output a full chapter without prior outline approval from the user.
3. **Proactive flagging:** If settings drift, style mismatch, or pacing issues are detected, flag them — do not wait for the user to notice.
4. **Self-learning guard:** Auto-skip confirmation only for revision types with ≥20 consecutive accepts. Any rejection resets the counter. Never auto-skip for new content creation.
5. **Settings file is authority:** When memory index and settings file disagree, settings file wins. Update memory to match.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing prose before checking settings | Step 2 (Setting Audit) is MANDATORY — no skip, no exception |
| Accepting user revision that contradicts canon | Run conflict check against settings file before applying any revision |
| Forgetting to update settings after new chapter | Step 7 archive includes settings update — this is not optional |
| Style drift in continuations | Re-read style-guide.md before Step 5 prose writing |
| Not tracking new foreshadowing | Mark new setup during Step 5; archive to settings in Step 7 |
| Skipping word count adjustment | Step 6.5 runs automatically if deviation >10% from outline target |
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/SKILL.md
git commit -m "feat: add co-creation, aggregation, and cross-cutting rules"
```

---

### Task 6: 创建 style-guide.md 引用文件

**Files:**
- Create: `~/.claude/skills/novel-writing/style-guide.md`

- [ ] **Step 1: 写入文风特征库**

```markdown
# Style Guide — 文风特征库

## 自动提取方法论

从样章（用户指定的代表性章节）中提取以下维度：

### 1. 句式特征
- 平均句长（字数）
- 长短句比例：短句≤10字 / 中句11-25字 / 长句≥26字
- 特殊句式使用频率（反问、排比、感叹）

### 2. 内容比例
- 动作描写占比
- 对话占比
- 心理描写占比
- 环境描写占比
- 叙述/过渡占比

### 3. 节奏特征
- 打斗场景：每招平均句数、回合描述密度
- 对话场景：对话轮次间隔中的动作穿插频率
- 高潮场景：段落长度变化趋势

### 4. 用词偏好
- 高频动词（如：喝道、冷声、运转、掐诀）
- 高频形容词/副词
- 功法/境界术语使用规范

### 5. 段落特征
- 平均段落行数
- 纯对话段落比例
- 段落首句特征

## 提取流程

1. 用户提供 2-3 个代表性章节作为样章
2. 逐章分析以上 5 个维度
3. 汇总为文风特征卡
4. 呈交用户确认/调整
5. 锁定为当前项目的文风基准

## 文风特征卡模板

```
### [书名] 文风特征卡（基于第X-Y章）

**句式：**
- 平均句长：XX字
- 短/中/长句比例：X%/X%/X%

**内容比例：**
- 动作：X% / 对话：X% / 心理：X% / 环境：X% / 叙述：X%

**打斗节奏：**
- 每招描述：1-3句
- 回合间穿插动作/心理

**用词偏好：**
- 高频动词：
- 境界术语：严格遵循设定体系

**段落：**
- 平均X行/段
- 纯对话段落比例：<X%
```

## 用户自定义规则

在此追加手动规则，优先级高于自动提取：

1. 
2. 
3. 
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/style-guide.md
git commit -m "feat: add style guide with extraction methodology and template"
```

---

### Task 7: 创建 settings-schema.md 引用文件

**Files:**
- Create: `~/.claude/skills/novel-writing/settings-schema.md`

- [ ] **Step 1: 写入设定模板**

```markdown
# Settings Schema — 设定模板与检查清单

## 设定文件标准结构

材料_设定.txt 应按以下结构维护：

```
# 世界观
- 世界名称与基本设定
- 势力分布
- 境界体系（完整等级链）
- 特殊规则（天道、法则限制等）

# 人物谱
## [角色名]
- 身份：
- 体质/资质：
- 当前境界：（随章节更新）
- 已获机缘/装备：
- 当前所在地：
- 关键人际关系：

# 伏笔清单
- [ ] [伏笔描述]（第X章埋下）
- [x] [已完结伏笔]（第X章埋下→第Y章完结）

# 时间线
- 第X章：[关键事件]
- 第Y章：[关键事件]
```

## 一致性检查清单（写作前逐条执行）

| # | 检查项 | 方法 | 
|---|--------|------|
| 1 | 境界一致 | 人物当前境界 == 设定文件的记录值 |
| 2 | 位置一致 | 人物所在地 == 上章末尾位置或可合理解释的移动 |
| 3 | 因果一致 | 新事件不矛盾于已有因果链 |
| 4 | 伏笔扫描 | 是否有 `[ ]` 状态伏笔可在本章推进 |
| 5 | 时间线 | 事件发生顺序无矛盾 |

全部通过方可动笔。任何一项失败需先向用户报告。

## 归档更新模板

每章定稿后更新设定文件：

```
新增人物：[角色名]、身份、境界（如已知）
境界变化：[角色名] → [新境界]（第X章）
新增伏笔：[ ] [描述]（第X章）
完结伏笔：[x] [描述]（第X章埋下→第Y章完结）
```
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/settings-schema.md
git commit -m "feat: add settings schema with checklist and archive template"
```

---

### Task 8: 创建 chapter-template.md 引用文件

**Files:**
- Create: `~/.claude/skills/novel-writing/chapter-template.md`

- [ ] **Step 1: 写入章节模板**

```markdown
# Chapter Template — 章节元数据模板

## 章节文件命名规范

```
第XX章_章节标题.txt
```

例：`第七十二章_林家险境.txt`

## 元数据头部（每个章节文件开头必须包含）

```yaml
---
章节: 第X章
标题: [章节标题]
字数: [实际字数]
视角人物: [本章主要视角人物]
新增人物: [本章首次出场人物，无则写"无"]
境界变化: [角色名→新境界，无则写"无"]
新增伏笔: [本章新埋的伏笔简述，无则写"无"]
已收伏笔: [本章完结的伏笔简述，无则写"无"]
关键事件: [逗号分隔的关键事件列表]
状态: 定稿
审阅次数: [本章累计审阅修改次数]
日期: YYYY-MM-DD
---
```

## 归档流程

章节定稿后按以下顺序操作：

1. **写章节文件**：使用上述模板创建单独章节文件
2. **追加全本**：按章节号顺序追加到汇总文件
3. **更新设定**：按 settings-schema.md 归档模板更新材料_设定.txt
4. **更新索引**：写入 memory（最新章节号、人物状态快照、伏笔进度）

## 全本汇总文件格式

```
═══════════════════════════════════
第XX章　[标题]
═══════════════════════════════════

[正文]

```
```

- [ ] **Step 2: 提交**

```bash
git add ~/.claude/skills/novel-writing/chapter-template.md
git commit -m "feat: add chapter metadata template and archive workflow"
```

---

### Task 9: 测试 — RED 阶段（基线测试）

**Files:** 无代码修改

- [ ] **Step 1: 设计并执行基线测试**

3 个压力场景，使用不加载 novel-writing 技能的子 agent 执行：

**场景 1: 跳过设定核查直接续写**
- 指令："帮我把第72章后续写出来"
- 不提供设定文件，不提醒核查
- 基线预期：直接写正文，不先检查设定
- 记录实际行为和 rationalization 措辞

**场景 2: 用户修改意见与前文矛盾**
- 提供设定（林静当前七品），要求"把林静境界改成三品，不改前面"
- 基线预期：直接修改，不提醒矛盾
- 记录实际行为和 rationalization 措辞

**场景 3: 文风偏离未察觉**
- 提供简洁文风样章，要求续写
- 基线预期：写出风格迥异的文字，不自查偏离
- 记录实际行为和 rationalization 措辞

- [ ] **Step 2: 提交测试记录**

```bash
git add docs/superpowers/specs/novel-writing-test-results.md
git commit -m "test: RED phase baseline results for novel-writing skill"
```

---

### Task 10: 测试 — GREEN 阶段（验证技能合规）

**Files:** 无代码修改

- [ ] **Step 1: 带技能重新执行场景**

加载 novel-writing 技能后，重新执行 Task 9 的 3 个场景：
- 场景 1：必须输出设定核查报告才写正文
- 场景 2：必须提醒修改与设定矛盾
- 场景 3：必须自查文风偏离

- [ ] **Step 2: 记录合规情况**

每个场景记录：合规/不合规、差距描述

- [ ] **Step 3: 提交验证结果**

```bash
git add docs/superpowers/specs/novel-writing-test-results.md
git commit -m "test: GREEN phase verification for novel-writing skill"
```

---

### Task 11: 测试 — REFACTOR 阶段（堵漏洞）

**Files:**
- Modify: `~/.claude/skills/novel-writing/SKILL.md`

- [ ] **Step 1: 识别并关闭漏洞**

从 GREEN 测试结果中提取：
- 子 agent 找到的绕过规则的新方式
- 被曲解的模糊表述
- 最容易被跳过的步骤

针对每个漏洞更新 SKILL.md：
- 添加显式禁止语句
- 补充到 Common Mistakes 表
- 必要时添加 HARD-GATE 标记

- [ ] **Step 2: 重新测试直到全部通过**

重复 GREEN 测试，确认所有漏洞已关闭。

- [ ] **Step 3: 提交**

```bash
git add ~/.claude/skills/novel-writing/SKILL.md
git commit -m "fix: close loopholes from REFACTOR testing for novel-writing skill"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ 续写 7 步工作流（含字数调整）→ Task 2
- ✅ 设定管理双轨 + 检查清单 → Task 3
- ✅ 润色 + 冲突检测 + 自学习 → Task 4
- ✅ 设定共创脑暴 → Task 5
- ✅ 自动汇总 → Task 5
- ✅ 文风特征库 → Task 6
- ✅ 设定模板 → Task 7
- ✅ 章节元数据 → Task 8
- ✅ TDD RED-GREEN-REFACTOR → Tasks 9-11

**2. Placeholder scan:** 无 TBD/TODO，每个步骤包含完整代码。

**3. Type consistency:** 文件路径、模块名称、引用文件名在各 Task 中保持一致。
