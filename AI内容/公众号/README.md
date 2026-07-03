# AI 公众号运营目录

## 目录结构
```
AI公众号/
├── README.md              # 本文件
├── scripts/               # 采集/转换脚本
│   ├── fetch-daily.js     #   每日 AI HOT 精选
│   ├── fetch-weekly.js    #   每周全量素材
│   ├── fetch-supplement.js#   HN + arXiv + GitHub
│   └── convert-to-docx.js #   MD → DOCX 转换
├── 每日简报/              # 每日自动生成
├── 周报/                  # 每周素材 + 正式周报
├── 专题文章/              # 深度长文
├── 素材库/                # 按分类整理的原始素材
│   ├── 模型发布/ 产品动态/ 行业趋势/ 论文研究/ 技巧观点/
└── 发布队列/              # 已编辑待发布的推文
```

## 定时任务
| 任务 | 时间 | 命令 |
|------|------|------|
| AI-Daily-Fetch | 每天 08:15 | `fetch-daily.bat` |
| AI-Weekly-Fetch | 每周一 08:30 | `fetch-weekly.bat` |

## 数据源
- AI HOT (aihot.virxact.com) — 中文 AI 精选
- Hacker News — 英文开发者社区
- arXiv — 最新 AI 论文
- GitHub Trending — 热门开源项目

## 工作流
1. 每日 08:15 自动采集 → `每日简报/日期.md` + `补充-日期.md`
2. 每周一 08:30 自动采集 → `周报/素材-周一日期.md`
3. 人工精选编写 → 正式周报 + 推文
