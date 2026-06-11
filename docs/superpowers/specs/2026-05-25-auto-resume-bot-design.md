# Auto Resume Bot — Design Spec

**Date:** 2026-05-25
**Status:** Draft

## Overview

浏览器扩展 + 本地服务架构的自动化简历投递工具。覆盖 Boss直聘、前程无忧、猎聘、智联招聘四大平台，支持全流程管理：简历管理、智能匹配、自动投递、记录追踪、数据分析。

## Architecture

```
Browser Extension (TypeScript + React + Vite)
    ├── Popup UI      → 仪表盘、概览、快速操作
    ├── Content Scripts → 每平台独立脚本，DOM 操作
    └── Background SW → 消息路由、WebSocket 客户端
           │
    WebSocket (ws://localhost:9527)
           │
Local Server (Node.js + Express + better-sqlite3)
    ├── Parser     → PDF/Word 简历解析
    ├── Matcher    → 关键词/条件匹配过滤
    ├── Scheduler  → 任务队列 + 限速 + 防检测
    ├── Analytics  → 投递统计与分析
    └── Config     → 平台账号、偏好、黑名单
```

## Components

### Browser Extension

| Component | Responsibility |
|-----------|---------------|
| Popup UI | Dashboard: overview, progress, quick actions (start/stop) |
| Content Scripts | Per-platform: login check → search → click → fill greeting → send |
| Background SW | Message routing, timer wakeup, WS connection to local server |

### Local Server

| Component | Responsibility |
|-----------|---------------|
| Resume Parser | Parse PDF/Word, extract structured fields (name, phone, email, experience, education) |
| Job Matcher | Filter by keywords/salary/city, compute match score |
| Delivery Scheduler | Task queue + rate limiting (N/min per platform configurable), avoid detection |
| Records & Analytics | SQLite persistence, delivery history, stats charts |
| Config Manager | Platform accounts, delivery preferences, company blacklist |

## Database Tables

- `resumes` — structured resume data
- `platforms` — platform credentials/config (Boss/51job/Liepin/Zhilian)
- `job_targets` — target criteria (keywords, salary range, cities)
- `applications` — delivery records (company, position, time, status)
- `blacklist` — blocked companies

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Extension | TypeScript + Vite + CRXJS | Type-safe, HMR, Manifest V3 |
| UI | React + Tailwind CSS | Lightweight enough for popup |
| Server | Node.js + Express + ws | Unified JS stack, rich ecosystem |
| Database | better-sqlite3 | Embedded, zero-config, performant |
| PDF parse | pdf-parse | Lightweight text extraction |
| Word parse | mammoth | .docx extraction |
| Protocol | WebSocket | Bidirectional real-time comms |
| Packaging | pkg → .exe | No Node.js install required for user |

## Delivery Strategy

### Per-Platform Flow

1. Check login state → notify user if not logged in
2. Search jobs by matching criteria
3. Iterate results → filter blacklist/already-applied
4. Enter job detail → click "contact" button
5. Fill preset greeting message → send
6. Record result → random delay → next job

### Anti-Detection Measures

- Random delay between actions: 30–90s (configurable)
- Weekdays only, 9:00–18:00 (configurable)
- Daily cap per platform: 50 max (configurable)
- DOM event simulation (focus/click before value assignment)
- No UA modification
- Pause on CAPTCHA, notify user for manual handling

### Greeting Template

```
${company}您好，我有${N}年${skill}经验，熟悉${skill2}，
做过${project}，想了解这个岗位的更多细节，方便聊聊吗？
```

## Source: Resume Data

- Manual form entry in extension popup
- Upload PDF/Word for auto-parsing (extract name, phone, email, work history, education)

## Scale

- Single-user personal use
- ~50–100 applications per day across all platforms

## Directory Structure

```
auto-resume/
├── extension/
│   ├── src/
│   │   ├── popup/          # React dashboard
│   │   ├── content/        # Per-platform DOM scripts
│   │   ├── background/     # Service worker
│   │   └── shared/         # Types, constants
│   ├── vite.config.ts
│   └── manifest.json
├── server/
│   ├── src/
│   │   ├── parser/         # Resume parsing
│   │   ├── matcher/        # Job matching
│   │   ├── scheduler/      # Delivery scheduler
│   │   ├── db/             # SQLite operations
│   │   └── routes/         # API/WS routes
│   └── package.json
└── shared/
    └── types.ts
```
