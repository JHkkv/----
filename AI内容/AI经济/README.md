# AI+经济 交叉领域信息采集系统

> 📅 暂行项目 | 2026-07-25 至 2026-08-24（30天/10轮）
> 🤖 自动化驱动 | Claude Code 定时任务 + Node.js 多源采集

---

## 项目说明

聚焦 **AI 与经济的交叉地带**，每 3 天执行一轮多源信息采集，生成去重、分类、带来源追溯的汇报文件。

**不是泛经济新闻 → 只采集同时涉及"AI"和"经济"的信息。**

---

## 目录结构

```
AI经济/
├── README.md                    # 本文件
├── scripts/                     # 采集与处理脚本
│   ├── config.js                # 全局配置
│   ├── lib/                     # 工具模块
│   │   ├── curl-helper.js       # curl 统一封装
│   │   ├── filter-engine.js     # 两级关键词过滤
│   │   ├── dedup.js             # 去重引擎
│   │   └── conflict-resolver.js # 冲突裁决
│   ├── fetch-domestic.js        # 国内源采集 (60%)
│   ├── fetch-international.js   # 国外源采集 (40%)
│   ├── fetch-economic-indicators.js # 经济指标采集
│   ├── merge-report.js          # 合并+去重+生成汇报
│   ├── auto-push.js             # Git 自动推送
│   ├── final-review.js          # 30天复盘脚本
│   ├── run-cycle.bat            # 单轮完整采集启动器
│   └── final-review.bat         # 复盘启动器
├── data/raw/                    # 原始 JSON 数据
├── reports/                     # 汇报 Markdown 文件
├── meta/                        # 状态与历史索引
│   ├── task-status.json         # 轮次跟踪
│   ├── history.json             # 跨轮次去重索引
│   └── source-authority.json    # 权威优先级配置
```

---

## 数据源

### 国内（60%）
| 来源 | 类型 | 数据维度 |
|------|------|----------|
| 36Kr | RSS | AI创业融资、产业政策 |
| 东方财富 | REST API | AI概念板块、宏观经济日历 |
| 新浪财经 | REST API | AI个股行情 |
| 巨潮资讯 | REST API | AI概念公司公告 |

### 国外（40%）
| 来源 | 类型 | 数据维度 |
|------|------|----------|
| Hacker News | Firebase API | AI商业讨论、投资动向 |
| arXiv | Atom API | AI经济学/CS论文 |
| GitHub | Search API | AI商业/金融开源项目 |
| AI HOT | REST API | AI产品发布与商业动态 |

---

## 运行方式

### 手动单轮采集
```bash
node f:/测试工具/AI内容/AI经济/scripts/fetch-domestic.js
node f:/测试工具/AI内容/AI经济/scripts/fetch-international.js
node f:/测试工具/AI内容/AI经济/scripts/fetch-economic-indicators.js
node f:/测试工具/AI内容/AI经济/scripts/merge-report.js
node f:/测试工具/AI内容/AI经济/scripts/auto-push.js
```

或直接运行：
```bash
f:/测试工具/AI内容/AI经济/scripts/run-cycle.bat
```

### 定时自动执行
通过 `.claude/scheduled_tasks.json` 配置，每 3 天 UTC+8 08:17 自动触发。

---

## 信息质量控制

- **两级关键词过滤**：同时命中"AI"+"经济"关键词才纳入
- **多级去重**：URL精确 → 标题相似度 → 跨轮次历史去重
- **权威优先级**：同一事件多来源报道，按权威等级裁决（国家统计局 > 央行 > 巨潮 > 东方财富 > 36Kr > 新浪财经 > 自媒体）
- **每条信息标注出处URL**：确保可追溯到原始来源

---

## 标注符号

| 符号 | 含义 |
|------|------|
| 🆕 | 本轮新出现的事件 |
| 🔥 | 高热度（≥3来源同时报道） |
| ⚠️ | 风险/负面/争议 |
| 📈 | 趋势上升 |
| 📉 | 趋势下降 |
| ⚡ | 跨来源数据冲突 |

---

## 验收标准

- [ ] 所有脚本 `node` 可独立运行
- [ ] 每轮产出含来源URL的汇报文件
- [ ] 国内/国际比例偏差≤±10%
- [ ] 数据冲突按权威优先级裁决
- [ ] Git自动推送成功
- [ ] 30天10轮完成或到期自动停止
- [ ] 复盘报告生成

---

> ⚠️ 本系统所有信息均来自公开数据源。信息不可编造，不可杜撰。
> 🤖 2026-07-24 创建
