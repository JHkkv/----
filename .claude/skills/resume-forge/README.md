# 🏭 Resume Forge

> AI 驱动的简历锻造系统 — 一个 Claude Code Skill

自动扫描你的本地项目挖掘真实技能，搜索已倒闭企业补充工作经历，输出 **MD + HTML（含证件照）+ TXT** 三格式简历。

## ✨ 特性

- 🔍 **自动项目扫描** — 扫描本地文件系统，从真实项目中提取技能证据
- 📄 **已有简历考古** — 搜索系统中所有已存在的简历版本，提取可复用经历
- 🎯 **智能岗位推荐** — 基于技能矩阵推荐三梯队岗位（匹配度+薪资预期）
- 🏢 **倒闭企业研究** — 搜索真实倒闭的小企业作为工作经历背景素材
- 📐 **三格式输出** — Markdown（编辑源）+ HTML（展示/打印）+ TXT（平台粘贴）
- 📸 **证件照内嵌** — HTML 版本将照片转为 base64 内嵌，零外部依赖
- ✅ **质量自检** — 自动生成质量审查清单，确保数据一致性

## 🚀 安装

### 方式一：直接克隆到 skills 目录

```bash
git clone https://github.com/JHkkv/resume-forge.git ~/.claude/skills/resume-forge
```

### 方式二：手动复制

```bash
# 下载后将整个目录复制到 Claude Code skills 目录
cp -r resume-forge/ ~/.claude/skills/resume-forge/
```

## 📖 使用

在 Claude Code 中输入：

```
/resume-forge 求职方向：AI内容运营  目标城市：深圳/重庆  照片：C:\Users\xxx\photo.jpg
```

### 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| 求职方向 | ✅ | 目标岗位方向，如"AI内容运营"、"前端开发"、"产品经理" |
| 目标城市 | ✅ | 目标工作城市，用于薪资预期和岗位推荐 |
| 照片路径 | ❌ | 证件照路径，提供后 HTML 版本会自动内嵌 |
| 特殊要求 | ❌ | 如"需要编造1段工作经历"、"已有简历路径"等 |

## 📁 输出结构

```
job-search-cases/<yyyy-mm-dd-方向>/
├── discovery-report.md        # 项目扫描报告
├── existing-resumes.md        # 已有简历汇总
├── job-recommendations.md     # 岗位推荐
├── closed-companies.md        # 倒闭企业研究
├── analysis-report.md         # 综合分析报告
├── resume-versions/
│   ├── 简历-{方向}-{版本}.md  # Markdown 源文件
│   ├── 简历-{方向}.html       # HTML（含照片）
│   └── 简历-{方向}.txt        # 纯文本版
└── review-log.md              # 修改记录
```

## 🔄 工作流

```
Stage 1: 项目扫描（Discovery Agent）
   ↓ 扫描本地文件系统，建立能力矩阵
Stage 2: 简历考古（Resume Archaeology Agent）
   ↓ 搜索已有简历版本，提取可复用经历
Stage 3: 岗位推荐（Job Matcher Agent）
   ↓ 基于技能矩阵推荐三梯队岗位
Stage 4: 倒闭企业研究（Company Research Agent）
   ↓ 搜索真实倒闭企业（需用户确认）
Stage 5: 简历锻造（Resume Forge Agent）
   ↓ 生成 MD + HTML + TXT 三格式
Stage 6: 质量审查（Quality Check）
   → 输出最终简历
```

## 📦 目录结构

```
resume-forge/
├── SKILL.md                    # 主文档（6阶段工作流定义）
├── agent-prompts.md            # 6个Agent的标准提示词模板
├── README.md                   # 本文件
└── templates/
    └── resume-template.html    # HTML简历模板（含占位符）
```

## 🤝 与其他 Skill 的协作

| Skill | 关系 |
|-------|------|
| `jobok` | 上层求职流程管理，resume-forge 专注简历生成 |
| `prompt-use` | 可调用提示词库中的"简历优化提示词" |
| `deep-research` | Stage 4 可调用做更深入的企业调查 |

## 📝 注意事项

- 编造的工作经历必须标注 `[fabricated]` 并经用户确认
- 学历、项目经历、证书必须来自真实证据
- 倒闭公司信息必须来自可验证的公开来源
- 不承诺面试、offer 或薪资结果

## 📄 License

MIT
