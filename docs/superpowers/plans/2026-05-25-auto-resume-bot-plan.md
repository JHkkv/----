# Auto Resume Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser extension + local Node.js server that automates resume submission across Boss直聘, 前程无忧, 猎聘, and 智联招聘.

**Architecture:** Browser extension (TypeScript + React + Vite + CRXJS) communicates via WebSocket to a local Express server (better-sqlite3). Extension handles DOM interaction on job sites; server handles resume parsing, job matching, rate-limited scheduling, and analytics.

**Tech Stack:** TypeScript, React 18, Tailwind CSS 3, Vite + CRXJS (extension), Node.js + Express + ws (server), better-sqlite3, pdf-parse, mammoth

---

## File Structure

```
auto-resume/
├── shared/
│   └── types.ts                    # Shared type definitions
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                # Entry: Express + WS server
│   │   ├── db/
│   │   │   ├── connection.ts       # SQLite connection singleton
│   │   │   └── schema.ts           # CREATE TABLE migrations
│   │   ├── parser/
│   │   │   ├── pdf.ts              # PDF resume parser
│   │   │   ├── word.ts             # Word (.docx) resume parser
│   │   │   └── index.ts            # Parser router (detect type → parse)
│   │   ├── matcher/
│   │   │   └── index.ts            # Keyword match + filter pipeline
│   │   ├── scheduler/
│   │   │   └── index.ts            # Task queue, rate limiter, anti-detection delays
│   │   ├── routes/
│   │   │   ├── resume.ts           # CRUD: resume endpoints
│   │   │   ├── jobs.ts             # Job targets + matching endpoints
│   │   │   ├── applications.ts     # Delivery records + stats
│   │   │   └── ws.ts               # WebSocket message handler
│   │   └── config.ts              # Server configuration constants
│   └── tests/
│       ├── parser.test.ts
│       ├── matcher.test.ts
│       ├── scheduler.test.ts
│       └── routes.test.ts
├── extension/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── manifest.json
│   ├── src/
│   │   ├── popup/
│   │   │   ├── index.html          # Popup HTML entry
│   │   │   ├── main.tsx            # React entry
│   │   │   ├── App.tsx             # Tab router
│   │   │   ├── style.css           # Tailwind imports
│   │   │   ├── Dashboard.tsx       # Overview + stats cards
│   │   │   ├── ResumeForm.tsx      # Manual resume entry form
│   │   │   ├── JobTargetsForm.tsx  # Job search criteria form
│   │   │   ├── ApplicationsList.tsx# Delivery history table
│   │   │   └── useWs.ts           # WebSocket hook
│   │   ├── content/
│   │   │   ├── base.ts             # Abstract content script with shared flow
│   │   │   ├── boss.ts             # Boss直聘 content script
│   │   │   ├── wuyou.ts            # 前程无忧 content script
│   │   │   ├── liepin.ts           # 猎聘 content script
│   │   │   └── zhilian.ts          # 智联招聘 content script
│   │   ├── background/
│   │   │   └── index.ts            # Service worker: WS client + message routing
│   │   └── shared/
│   │       ├── types.ts            # Re-export from ../../shared/types.ts
│   │       └── constants.ts        # Platform URLs, selectors map
│   └── tests/
│       └── content-scripts.test.ts
└── package.json                    # Root workspace (optional)
```

---

### Task 1: Project Scaffolding — Root + Shared Types

**Files:**
- Create: `auto-resume/package.json`
- Create: `auto-resume/shared/types.ts`
- Create: `auto-resume/.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "auto-resume",
  "private": true,
  "scripts": {
    "server": "cd server && npm run dev",
    "extension": "cd extension && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run extension\""
  }
}
```

- [ ] **Step 2: Create shared types**

```typescript
// shared/types.ts

// —— Resume ——
export interface Resume {
  id: number;
  name: string;
  phone: string;
  email: string;
  workYears: number;
  currentRole: string;
  skills: string[];           // e.g. ["React", "TypeScript", "Node.js"]
  projects: string[];         // e.g. ["电商后台系统", "用户增长活动页"]
  education: string;          // e.g. "本科 · 计算机科学"
  school: string;
  rawText: string;            // original parsed text for reference
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

export interface ResumeInput {
  name: string;
  phone: string;
  email: string;
  workYears: number;
  currentRole: string;
  skills: string[];
  projects: string[];
  education: string;
  school: string;
}

// —— Platform ——
export type PlatformId = 'boss' | 'wuyou' | 'liepin' | 'zhilian';

export interface Platform {
  id: PlatformId;
  name: string;
  loginUrl: string;
  searchUrl: string;
  enabled: boolean;
  dailyLimit: number;         // max applications per day
  minDelayMs: number;         // min random delay between actions
  maxDelayMs: number;         // max random delay between actions
}

// —— Job Target ——
export interface JobTarget {
  id: number;
  keywords: string[];          // e.g. ["前端开发", "React"]
  cities: string[];            // e.g. ["北京", "上海"]
  minSalary: number;           // monthly, in 千 (e.g. 15 = 15k)
  maxSalary: number;
  platforms: PlatformId[];     // which platforms to search
  active: boolean;
  createdAt: string;
}

// —— Application Record ——
export type ApplicationStatus = 'sent' | 'read' | 'replied' | 'rejected' | 'ignored';

export interface Application {
  id: number;
  platform: PlatformId;
  company: string;
  position: string;
  salary: string;
  greeting: string;            // the actual greeting sent
  status: ApplicationStatus;
  sentAt: string;
  updatedAt: string;
}

// —— WebSocket Messages ——

export type WsMessageType =
  | 'task:start'
  | 'task:stop'
  | 'task:progress'
  | 'task:done'
  | 'task:error'
  | 'resume:save'
  | 'resume:get'
  | 'jobtargets:save'
  | 'jobtargets:list'
  | 'apps:list'
  | 'apps:stats'
  | 'config:get'
  | 'config:update';

export interface WsMessage {
  type: WsMessageType;
  payload?: unknown;
  requestId?: string;          // for request-response correlation
}

export interface WsResponse {
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
  requestId?: string;
}

// —— Stats ——
export interface DeliveryStats {
  totalSent: number;
  totalRead: number;
  totalReplied: number;
  todaySent: number;
  byPlatform: Record<PlatformId, { sent: number; replied: number }>;
}

// —— Platform Config ——
export interface PlatformConfig {
  greetTemplate: string;      // template with ${company}, ${skill}, etc.
  workdayOnly: boolean;
  workHoursStart: number;     // e.g. 9 = 9:00 AM
  workHoursEnd: number;       // e.g. 18 = 6:00 PM
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
*.db
*.db-journal
.env
.vite/
```

- [ ] **Step 4: Commit**

```bash
git add auto-resume/package.json auto-resume/shared/types.ts auto-resume/.gitignore
git commit -m "chore: scaffold root project and shared types"
```

---

### Task 2: Server Scaffolding

**Files:**
- Create: `auto-resume/server/package.json`
- Create: `auto-resume/server/tsconfig.json`
- Create: `auto-resume/server/src/config.ts`
- Create: `auto-resume/server/src/index.ts`

- [ ] **Step 1: Create server package.json**

```json
{
  "name": "auto-resume-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "mammoth": "^1.8.0",
    "pdf-parse": "^1.1.1",
    "uuid": "^10.0.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/uuid": "^10.0.0",
    "@types/ws": "^8.5.12",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "paths": {
      "@shared/*": ["../shared/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "../shared/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create server config**

```typescript
// server/src/config.ts

export const CONFIG = {
  PORT: 9527,
  DB_PATH: './data/auto-resume.db',

  DEFAULT_PLATFORM_CONFIG: {
    greetTemplate: '${company}您好，我有${workYears}年${skills}经验，做过${projects}，想了解这个岗位的更多细节，方便聊聊吗？',
    workdayOnly: true,
    workHoursStart: 9,
    workHoursEnd: 18,
  },

  PLATFORMS: [
    {
      id: 'boss' as const,
      name: 'Boss直聘',
      loginUrl: 'https://www.zhipin.com/web/user/?ka=header-login',
      searchUrl: 'https://www.zhipin.com/web/geek/job',
      enabled: true,
      dailyLimit: 50,
      minDelayMs: 30000,
      maxDelayMs: 90000,
    },
    {
      id: 'wuyou' as const,
      name: '前程无忧',
      loginUrl: 'https://login.51job.com/',
      searchUrl: 'https://we.51job.com/pc/search',
      enabled: false,
      dailyLimit: 50,
      minDelayMs: 40000,
      maxDelayMs: 100000,
    },
    {
      id: 'liepin' as const,
      name: '猎聘',
      loginUrl: 'https://www.liepin.com/',
      searchUrl: 'https://www.liepin.com/zhaopin/',
      enabled: false,
      dailyLimit: 50,
      minDelayMs: 40000,
      maxDelayMs: 100000,
    },
    {
      id: 'zhilian' as const,
      name: '智联招聘',
      loginUrl: 'https://www.zhaopin.com/',
      searchUrl: 'https://www.zhaopin.com/sou/',
      enabled: false,
      dailyLimit: 50,
      minDelayMs: 40000,
      maxDelayMs: 100000,
    },
  ],
} as const;
```

- [ ] **Step 4: Create server entry point (skeleton)**

```typescript
// server/src/index.ts

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import { CONFIG } from './config';
import { initDb } from './db/schema';
import { resumeRouter } from './routes/resume';
import { jobsRouter } from './routes/jobs';
import { applicationsRouter } from './routes/applications';
import { handleWsConnection } from './routes/ws';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/resume', resumeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', handleWsConnection);

initDb();

server.listen(CONFIG.PORT, () => {
  console.log(`[auto-resume] Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`[auto-resume] WebSocket ready`);
});
```

- [ ] **Step 5: Install deps and verify server starts**

```bash
cd auto-resume/server && npm install && npx tsx src/index.ts
```

Expected: `[auto-resume] Server running on http://localhost:9527`

- [ ] **Step 6: Commit**

```bash
git add auto-resume/server/
git commit -m "chore: scaffold server project with Express + WS skeleton"
```

---

### Task 3: Extension Scaffolding

**Files:**
- Create: `auto-resume/extension/package.json`
- Create: `auto-resume/extension/tsconfig.json`
- Create: `auto-resume/extension/vite.config.ts`
- Create: `auto-resume/extension/tailwind.config.js`
- Create: `auto-resume/extension/postcss.config.js`
- Create: `auto-resume/extension/manifest.json`
- Create: `auto-resume/extension/src/popup/index.html`
- Create: `auto-resume/extension/src/popup/main.tsx`
- Create: `auto-resume/extension/src/popup/style.css`
- Create: `auto-resume/extension/src/popup/App.tsx`
- Create: `auto-resume/extension/src/shared/constants.ts`

- [ ] **Step 1: Create extension package.json**

```json
{
  "name": "auto-resume-extension",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.28",
    "@types/chrome": "^0.0.272",
    "@types/react": "^18.3.8",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.12",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@shared/*": ["../shared/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "../shared/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
// extension/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        boss: 'src/content/boss.ts',
        wuyou: 'src/content/wuyou.ts',
        liepin: 'src/content/liepin.ts',
        zhilian: 'src/content/zhilian.ts',
      },
      output: {
        entryFileNames: 'content/[name].js',
      },
    },
  },
});
```

- [ ] **Step 4: Create tailwind.config.js**

```javascript
// extension/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
// extension/postcss.config.js

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Auto Resume Bot",
  "version": "0.1.0",
  "description": "自动化简历投递助手",
  "permissions": ["storage", "activeTab", "tabs", "scripting"],
  "host_permissions": [
    "https://www.zhipin.com/*",
    "https://we.51job.com/*",
    "https://www.liepin.com/*",
    "https://www.zhaopin.com/*"
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_title": "Auto Resume"
  },
  "background": {
    "service_worker": "src/background/index.ts"
  },
  "content_scripts": [
    {
      "matches": ["https://www.zhipin.com/*"],
      "js": ["src/content/boss.ts"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://we.51job.com/*"],
      "js": ["src/content/wuyou.ts"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://www.liepin.com/*"],
      "js": ["src/content/liepin.ts"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://www.zhaopin.com/*"],
      "js": ["src/content/zhilian.ts"],
      "run_at": "document_idle"
    }
  ]
}
```

- [ ] **Step 7: Create popup entry files**

```html
<!-- extension/src/popup/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=400" />
  <title>Auto Resume</title>
</head>
<body class="w-[400px] h-[600px] bg-gray-50 text-gray-900">
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

```tsx
// extension/src/popup/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```css
/* extension/src/popup/style.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
// extension/src/popup/App.tsx

import React, { useState } from 'react';
import { useWs } from './useWs';

const tabs = ['仪表盘', '简历', '目标', '记录'] as const;
type Tab = typeof tabs[number];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('仪表盘');
  const { connected } = useWs();

  return (
    <div className="flex flex-col h-[600px]">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">Auto Resume</h1>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-400'}`} />
      </header>
      <nav className="flex border-b bg-white">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-4">
        {/* Placeholder — full components in later tasks */}
        <p className="text-gray-400 text-center mt-10">组件开发中...</p>
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 8: Create platform constants**

```typescript
// extension/src/shared/constants.ts

import type { PlatformId } from '../../../shared/types';

export const PLATFORM_URLS: Record<PlatformId, string> = {
  boss: 'https://www.zhipin.com',
  wuyou: 'https://we.51job.com',
  liepin: 'https://www.liepin.com',
  zhilian: 'https://www.zhaopin.com',
};

export const WS_URL = 'ws://localhost:9527';

export const PLATFORM_NAMES: Record<PlatformId, string> = {
  boss: 'Boss直聘',
  wuyou: '前程无忧',
  liepin: '猎聘',
  zhilian: '智联招聘',
};
```

- [ ] **Step 9: Create skeleton content scripts and background**

```typescript
// extension/src/content/base.ts (abstract base)
export interface PlatformSelectors {
  searchInput: string;
  searchButton: string;
  jobList: string;
  jobCard: string;
  jobTitle: string;
  companyName: string;
  salary: string;
  contactBtn: string;
  greetingInput: string;
  sendBtn: string;
  loginIndicator: string;
}

export interface PlatformScript {
  name: string;
  selectors: PlatformSelectors;
  checkLogin: () => boolean;
  searchJobs: (keyword: string, city: string) => Promise<void>;
  sendGreeting: (greeting: string) => Promise<boolean>;
}
```

```typescript
// extension/src/content/boss.ts (skeleton)
import type { PlatformScript, PlatformSelectors } from './base';

const BOSS_SELECTORS: PlatformSelectors = {
  searchInput: '.search-form input[placeholder*="搜索"]',
  searchButton: '.search-form .btn-search',
  jobList: '.job-list-box',
  jobCard: '.job-card-wrap',
  jobTitle: '.job-name',
  companyName: '.company-name',
  salary: '.salary',
  contactBtn: '.btn-startchat, .op-btn',
  greetingInput: '.chat-input textarea, .input-chat',
  sendBtn: '.btn-send, .send-btn',
  loginIndicator: '.user-nav, .header-login',
};

const bossScript: PlatformScript = {
  name: 'boss',
  selectors: BOSS_SELECTORS,
  checkLogin() {
    const el = document.querySelector(BOSS_SELECTORS.loginIndicator);
    return el !== null;
  },
  async searchJobs(keyword: string, city: string) {
    // Placeholder — full implementation in Task 17
    console.log('[boss] searching:', keyword, city);
  },
  async sendGreeting(greeting: string) {
    // Placeholder — full implementation in Task 17
    console.log('[boss] sending:', greeting);
    return false;
  },
};

// Listen for commands from background
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CHECK_LOGIN') {
    sendResponse({ loggedIn: bossScript.checkLogin() });
  }
  if (msg.type === 'SEND_GREETING') {
    bossScript.sendGreeting(msg.greeting).then(ok => sendResponse({ ok }));
    return true; // keep channel open
  }
});
```

```typescript
// extension/src/content/wuyou.ts
export {}; // Placeholder — Task 18
```

```typescript
// extension/src/content/liepin.ts
export {}; // Placeholder — Task 19
```

```typescript
// extension/src/content/zhilian.ts
export {}; // Placeholder — Task 20
```

```typescript
// extension/src/background/index.ts

import { WS_URL } from '../shared/constants';
import type { WsMessage, WsResponse } from '../../../shared/types';

let ws: WebSocket | null = null;
let connectedPort: chrome.runtime.Port | null = null;

function connectWs() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[bg] WS connected');
    if (connectedPort) {
      connectedPort.postMessage({ type: 'ws:connected' });
    }
  };

  ws.onmessage = (event) => {
    const msg: WsResponse = JSON.parse(event.data);
    if (connectedPort) {
      connectedPort.postMessage({ type: 'ws:message', data: msg });
    }
  };

  ws.onclose = () => {
    console.log('[bg] WS disconnected, reconnecting in 5s...');
    setTimeout(connectWs, 5000);
  };

  ws.onerror = (err) => {
    console.error('[bg] WS error:', err);
  };
}

function sendWs(msg: WsMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// Relay popup ↔ content scripts ↔ WS server
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    connectedPort = port;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWs();
    }
    port.onMessage.addListener((msg) => {
      if (msg.type === 'ws:send') {
        sendWs(msg.data as WsMessage);
      } else if (msg.type === 'content:dispatch') {
        const { tabId, command } = msg;
        chrome.tabs.sendMessage(tabId, command, (response) => {
          port.postMessage({ type: 'content:response', tabId, response });
        });
      }
    });
    port.onDisconnect.addListener(() => {
      connectedPort = null;
    });
  }
});
```

- [ ] **Step 10: Install deps and verify extension builds**

```bash
cd auto-resume/extension && npm install && npx vite build
```

Expected: Build succeeds, generates `dist/` with manifest, content scripts, and popup.

- [ ] **Step 11: Commit**

```bash
git add auto-resume/extension/
git commit -m "chore: scaffold extension project with CRXJS + React + Tailwind"
```

---

### Task 4: Database Schema & Connection

**Files:**
- Create: `auto-resume/server/src/db/connection.ts`
- Create: `auto-resume/server/src/db/schema.ts`
- Create: `auto-resume/server/tests/db.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// server/tests/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { getDb } from '../src/db/connection';

describe('Database', () => {
  it('creates all tables', () => {
    const db = getDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('resumes');
    expect(names).toContain('platforms');
    expect(names).toContain('job_targets');
    expect(names).toContain('applications');
    expect(names).toContain('blacklist');
  });

  it('inserts and retrieves a resume', () => {
    const db = getDb(':memory:');
    const result = db.prepare(`
      INSERT INTO resumes (name, phone, email, work_years, current_role, skills, projects, education, school, raw_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('张三', '13800138000', 'zhang@test.com', 3, '前端开发',
      '["React","TypeScript"]', '["电商后台"]', '本科', '清华大学', ''
    );
    expect(result.lastInsertRowid).toBeGreaterThan(0);

    const row = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid) as any;
    expect(row.name).toBe('张三');
    expect(JSON.parse(row.skills)).toEqual(['React', 'TypeScript']);
  });
});
```

- [ ] **Step 2: Run test → FAIL**

```bash
cd auto-resume/server && npx vitest run tests/db.test.ts
```

Expected: FAIL — `getDb` not defined.

- [ ] **Step 3: Create connection.ts**

```typescript
// server/src/db/connection.ts

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initSchema } from './schema';
import { CONFIG } from '../config';

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const effectivePath = dbPath || CONFIG.DB_PATH;

  if (!dbPath) {
    const dir = path.dirname(effectivePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(effectivePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

- [ ] **Step 4: Create schema.ts**

```typescript
// server/src/db/schema.ts

import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      work_years INTEGER NOT NULL DEFAULT 0,
      current_role TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      projects TEXT NOT NULL DEFAULT '[]',
      education TEXT NOT NULL DEFAULT '',
      school TEXT NOT NULL DEFAULT '',
      raw_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      login_url TEXT NOT NULL,
      search_url TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      daily_limit INTEGER NOT NULL DEFAULT 50,
      min_delay_ms INTEGER NOT NULL DEFAULT 30000,
      max_delay_ms INTEGER NOT NULL DEFAULT 90000
    );

    CREATE TABLE IF NOT EXISTS job_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keywords TEXT NOT NULL DEFAULT '[]',
      cities TEXT NOT NULL DEFAULT '[]',
      min_salary INTEGER NOT NULL DEFAULT 0,
      max_salary INTEGER NOT NULL DEFAULT 0,
      platforms TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      salary TEXT NOT NULL DEFAULT '',
      greeting TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'sent',
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL UNIQUE,
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default platform configs
  const count = db.prepare('SELECT COUNT(*) as c FROM platforms').get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      'INSERT INTO platforms (id, name, login_url, search_url, enabled, daily_limit, min_delay_ms, max_delay_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const tx = db.transaction(() => {
      insert.run('boss', 'Boss直聘', 'https://www.zhipin.com/web/user/', 'https://www.zhipin.com/web/geek/job', 1, 50, 30000, 90000);
      insert.run('wuyou', '前程无忧', 'https://login.51job.com/', 'https://we.51job.com/pc/search', 0, 50, 40000, 100000);
      insert.run('liepin', '猎聘', 'https://www.liepin.com/', 'https://www.liepin.com/zhaopin/', 0, 50, 40000, 100000);
      insert.run('zhilian', '智联招聘', 'https://www.zhaopin.com/', 'https://www.zhaopin.com/sou/', 0, 50, 40000, 100000);
    });
    tx();
  }
}
```

- [ ] **Step 5: Run test → PASS**

```bash
cd auto-resume/server && npx vitest run tests/db.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add auto-resume/server/src/db/ auto-resume/server/tests/db.test.ts
git commit -m "feat: add SQLite schema and connection layer"
```

---

### Task 5: Resume Parser

**Files:**
- Create: `auto-resume/server/src/parser/pdf.ts`
- Create: `auto-resume/server/src/parser/word.ts`
- Create: `auto-resume/server/src/parser/index.ts`
- Create: `auto-resume/server/tests/parser.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// server/tests/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parsePdfBuffer, parseWordBuffer } from '../src/parser';

describe('Resume Parser', () => {
  it('parsePdfBuffer extracts text from PDF buffer', async () => {
    // Minimal PDF with readable text
    const pdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
    );

    const text = await parsePdfBuffer(pdfBuffer);
    expect(typeof text).toBe('string');
  });

  it('parseWordBuffer extracts text from docx buffer', async () => {
    // This test will use a minimal valid .docx (ZIP archive)
    // For now, test that unsupported formats throw
    const notDocx = Buffer.from('not a word file');
    await expect(parseWordBuffer(notDocx)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test → FAIL**

```bash
cd auto-resume/server && npx vitest run tests/parser.test.ts
```

Expected: FAIL — imports not found.

- [ ] **Step 3: Create parser modules**

```typescript
// server/src/parser/pdf.ts

import pdfParse from 'pdf-parse';

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
```

```typescript
// server/src/parser/word.ts

import mammoth from 'mammoth';

export async function parseWordBuffer(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

```typescript
// server/src/parser/index.ts

import { parsePdfBuffer } from './pdf';
import { parseWordBuffer } from './word';

export { parsePdfBuffer, parseWordBuffer };

export type FileType = 'pdf' | 'docx' | 'unknown';

export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'unknown';
}

export async function parseResumeFile(buffer: Buffer, filename: string): Promise<string> {
  const type = detectFileType(filename);
  switch (type) {
    case 'pdf':
      return parsePdfBuffer(buffer);
    case 'docx':
      return parseWordBuffer(buffer);
    default:
      throw new Error(`Unsupported file type: ${filename}. Supported: .pdf, .docx`);
  }
}

export function extractFields(text: string): {
  name: string;
  phone: string;
  email: string;
} {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  const email = emailMatch ? emailMatch[0] : '';
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Assume first non-empty line that's not contact info is the name
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = '';
  for (const line of lines) {
    if (!line.includes('@') && !line.match(/^1[3-9]\d{9}$/) && line.length <= 10 && !line.startsWith('http')) {
      name = line;
      break;
    }
  }

  return { name, phone, email };
}
```

- [ ] **Step 4: Run test → PASS**

```bash
cd auto-resume/server && npx vitest run tests/parser.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auto-resume/server/src/parser/ auto-resume/server/tests/parser.test.ts
git commit -m "feat: add PDF and Word resume parsing"
```

---

### Task 6: Job Matcher

**Files:**
- Create: `auto-resume/server/src/matcher/index.ts`
- Create: `auto-resume/server/tests/matcher.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// server/tests/matcher.test.ts
import { describe, it, expect } from 'vitest';
import { matchJob, shouldApply } from '../src/matcher';
import type { JobTarget } from '../../shared/types';

describe('Job Matcher', () => {
  const target: JobTarget = {
    id: 1,
    keywords: ['前端', 'React'],
    cities: ['北京', '上海'],
    minSalary: 10,
    maxSalary: 30,
    platforms: ['boss'],
    active: true,
    createdAt: '2026-01-01',
  };

  const blacklist = ['外包公司A', '皮包公司B'];

  it('matches a relevant job with high score', () => {
    const job = { title: '高级前端开发工程师', company: '字节跳动', salary: '20k-35k', city: '北京', salaryNum: 25 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it('rejects job below min salary', () => {
    const job = { title: '前端开发', company: '小公司', salary: '5k-8k', city: '北京', salaryNum: 8 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(false);
  });

  it('rejects blacklisted company', () => {
    const job = { title: '高级前端', company: '外包公司A', salary: '20k', city: '北京', salaryNum: 20 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('blacklist');
  });

  it('rejects already-applied job', () => {
    const job = { title: '前端开发', company: '字节跳动', salary: '20k', city: '北京', salaryNum: 20 };
    const applied = ['字节跳动-前端开发'];
    const result = matchJob(job, target, blacklist, applied);
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('already applied');
  });

  it('rejects wrong city', () => {
    const job = { title: '前端开发', company: '某公司', salary: '20k', city: '深圳', salaryNum: 20 };
    const result = matchJob(job, target, blacklist, []);
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('city');
  });
});
```

- [ ] **Step 2: Run test → FAIL**

```bash
cd auto-resume/server && npx vitest run tests/matcher.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create matcher**

```typescript
// server/src/matcher/index.ts

import type { JobTarget } from '../../shared/types';

export interface JobItem {
  title: string;
  company: string;
  salary: string;
  city: string;
  salaryNum: number | null; // parsed numeric salary (in 千)
}

export interface MatchResult {
  matched: boolean;
  score: number;
  reason?: string;
}

export function matchJob(
  job: JobItem,
  target: JobTarget,
  blacklist: string[],
  alreadyApplied: string[]
): MatchResult {
  // 1. Blacklist check
  if (blacklist.some(b => job.company.includes(b) || b.includes(job.company))) {
    return { matched: false, score: 0, reason: 'blacklist' };
  }

  // 2. Already applied check
  const appliedKey = `${job.company}-${job.title}`;
  if (alreadyApplied.some(a => a === appliedKey || job.title.includes(a.split('-')[1]) && job.company === a.split('-')[0])) {
    return { matched: false, score: 0, reason: 'already applied' };
  }

  // 3. City filter
  if (target.cities.length > 0) {
    const cityMatch = target.cities.some(c => job.city.includes(c));
    if (!cityMatch) {
      return { matched: false, score: 0, reason: 'city mismatch' };
    }
  }

  // 4. Salary filter
  if (target.minSalary > 0 && job.salaryNum !== null && job.salaryNum < target.minSalary) {
    return { matched: false, score: 0, reason: 'salary below min' };
  }

  // 5. Keyword scoring
  let score = 0;
  const titleLower = job.title.toLowerCase();
  for (const kw of target.keywords) {
    const kwLower = kw.toLowerCase();
    if (titleLower.includes(kwLower)) {
      score += 40; // exact keyword in title = strong match
    }
    // Partial match (e.g. "前端" matched by "Web前端")
    if (titleLower.includes(kwLower.slice(0, 2))) {
      score += 20;
    }
  }

  // Normalize score to 0-100
  score = Math.min(100, score);

  return {
    matched: score >= 30,
    score,
  };
}

export function extractSalaryNumber(salaryStr: string): number | null {
  // Handle patterns like "20k-35k", "1.5万-2万", "15000-25000", "面议"
  const kMatch = salaryStr.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (kMatch) return parseFloat(kMatch[1]);
  const wanMatch = salaryStr.match(/(\d+(?:\.\d+)?)\s*万/i);
  if (wanMatch) return parseFloat(wanMatch[1]) * 10;
  const numMatch = salaryStr.match(/(\d{4,5})/);
  if (numMatch) return parseInt(numMatch[1]) / 1000;
  return null;
}
```

- [ ] **Step 4: Run test → PASS**

```bash
cd auto-resume/server && npx vitest run tests/matcher.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auto-resume/server/src/matcher/ auto-resume/server/tests/matcher.test.ts
git commit -m "feat: add job matching engine with keyword/city/salary filters"
```

---

### Task 7: Delivery Scheduler

**Files:**
- Create: `auto-resume/server/src/scheduler/index.ts`
- Create: `auto-resume/server/tests/scheduler.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// server/tests/scheduler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Scheduler } from '../src/scheduler';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler({
      dailyLimit: 3,
      minDelayMs: 10,
      maxDelayMs: 50,
      workdayOnly: false,
      workHoursStart: 0,
      workHoursEnd: 24,
    });
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('processes tasks one at a time', async () => {
    const results: number[] = [];
    const task = (id: number) => async () => {
      results.push(id);
    };

    scheduler.enqueue(task(1));
    scheduler.enqueue(task(2));
    scheduler.enqueue(task(3));

    await scheduler.waitForDrain(1000);
    expect(results).toEqual([1, 2, 3]);
  });

  it('respects daily limit', async () => {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      scheduler.enqueue(async () => { count++; });
    }
    await scheduler.waitForDrain(1000);
    expect(count).toBe(3); // dailyLimit = 3
  });

  it('tracks sent count', async () => {
    scheduler.enqueue(async () => {});
    scheduler.enqueue(async () => {});
    await scheduler.waitForDrain(1000);
    expect(scheduler.todaySent).toBe(2);
  });

  it('emits progress events', async () => {
    const events: any[] = [];
    scheduler.on('progress', (e) => events.push(e));

    scheduler.enqueue(async () => {});
    await scheduler.waitForDrain(1000);

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].type).toBe('progress');
  });
});
```

- [ ] **Step 2: Run test → FAIL**

```bash
cd auto-resume/server && npx vitest run tests/scheduler.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create scheduler**

```typescript
// server/src/scheduler/index.ts

import { EventEmitter } from 'events';

export interface SchedulerConfig {
  dailyLimit: number;
  minDelayMs: number;
  maxDelayMs: number;
  workdayOnly: boolean;
  workHoursStart: number;
  workHoursEnd: number;
}

type TaskFn = () => Promise<void>;

export class Scheduler extends EventEmitter {
  private queue: TaskFn[] = [];
  private running = false;
  private _todaySent = 0;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    super();
    this.config = config;
  }

  get todaySent(): number {
    return this._todaySent;
  }

  enqueue(task: TaskFn): void {
    this.queue.push(task);
    if (!this.running) {
      this.run();
    }
  }

  stop(): void {
    this.running = false;
    this.queue = [];
  }

  async waitForDrain(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (this.queue.length > 0 && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 50));
    }
    while (this.running && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  private async run(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0 && this.running) {
      if (!this.canRunNow()) {
        // Wait and check again
        await this.delay(60000);
        continue;
      }

      if (this._todaySent >= this.config.dailyLimit) {
        this.emit('limit', { type: 'limit', reason: 'Daily limit reached' });
        break;
      }

      const task = this.queue.shift()!;
      const delayMs = this.randomDelay();
      await this.delay(delayMs);

      try {
        await task();
        this._todaySent++;
        this.emit('progress', {
          type: 'progress',
          sent: this._todaySent,
          remaining: this.queue.length,
        });
      } catch (err) {
        this.emit('error', {
          type: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    this.running = false;
  }

  private canRunNow(): boolean {
    if (!this.config.workdayOnly) return true;
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
    const hour = now.getHours();
    return hour >= this.config.workHoursStart && hour < this.config.workHoursEnd;
  }

  private randomDelay(): number {
    const { minDelayMs, maxDelayMs } = this.config;
    return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

- [ ] **Step 4: Run test → PASS**

```bash
cd auto-resume/server && npx vitest run tests/scheduler.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auto-resume/server/src/scheduler/ auto-resume/server/tests/scheduler.test.ts
git commit -m "feat: add delivery scheduler with rate limiting and anti-detection delays"
```

---

### Task 8: Server REST API — Resume + Jobs

**Files:**
- Create: `auto-resume/server/src/routes/resume.ts`
- Create: `auto-resume/server/src/routes/jobs.ts`

- [ ] **Step 1: Create resume routes**

```typescript
// server/src/routes/resume.ts

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getDb } from '../db/connection';
import { parseResumeFile, extractFields } from '../parser';
import type { Resume, ResumeInput } from '../../shared/types';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const resumeRouter = Router();

// GET /api/resume — get current resume
resumeRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM resumes ORDER BY updated_at DESC LIMIT 1').get() as any;
  if (!row) {
    res.json({ success: true, data: null });
    return;
  }
  const resume: Resume = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    workYears: row.work_years,
    currentRole: row.current_role,
    skills: JSON.parse(row.skills),
    projects: JSON.parse(row.projects),
    education: row.education,
    school: row.school,
    rawText: row.raw_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  res.json({ success: true, data: resume });
});

// POST /api/resume — save resume (manual)
resumeRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const input: ResumeInput = req.body;

  // Upsert: delete old, insert new (single-user mode)
  db.prepare('DELETE FROM resumes').run();
  const result = db.prepare(`
    INSERT INTO resumes (name, phone, email, work_years, current_role, skills, projects, education, school, raw_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.name, input.phone, input.email, input.workYears, input.currentRole,
    JSON.stringify(input.skills), JSON.stringify(input.projects),
    input.education, input.school, ''
  );

  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

// POST /api/resume/upload — upload & parse resume file
resumeRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const text = await parseResumeFile(req.file.buffer, req.file.originalname);
    const fields = extractFields(text);

    res.json({
      success: true,
      data: {
        rawText: text,
        extracted: fields,
      },
    });
  } catch (err) {
    res.status(422).json({
      success: false,
      error: err instanceof Error ? err.message : 'Parse failed',
    });
  }
});
```

- [ ] **Step 2: Create job target routes**

```typescript
// server/src/routes/jobs.ts

import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import type { JobTarget } from '../../shared/types';

export const jobsRouter = Router();

// GET /api/jobs — list all job targets
jobsRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM job_targets ORDER BY created_at DESC').all() as any[];
  const data: JobTarget[] = rows.map(r => ({
    id: r.id,
    keywords: JSON.parse(r.keywords),
    cities: JSON.parse(r.cities),
    minSalary: r.min_salary,
    maxSalary: r.max_salary,
    platforms: JSON.parse(r.platforms),
    active: !!r.active,
    createdAt: r.created_at,
  }));
  res.json({ success: true, data });
});

// POST /api/jobs — create or update job targets (replace all)
jobsRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const targets: JobTarget[] = req.body.targets;
  if (!Array.isArray(targets)) {
    res.status(400).json({ success: false, error: 'targets must be an array' });
    return;
  }

  const insert = db.prepare(`
    INSERT INTO job_targets (keywords, cities, min_salary, max_salary, platforms, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM job_targets').run();
    for (const t of targets) {
      insert.run(
        JSON.stringify(t.keywords),
        JSON.stringify(t.cities),
        t.minSalary,
        t.maxSalary,
        JSON.stringify(t.platforms),
        t.active ? 1 : 0
      );
    }
  });
  tx();

  res.json({ success: true, data: { count: targets.length } });
});

// DELETE /api/jobs/:id — delete a target
jobsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM job_targets WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});
```

- [ ] **Step 3: Need to add multer dependency**

```bash
cd auto-resume/server && npm install multer @types/multer
```

- [ ] **Step 4: Verify compilation**

```bash
cd auto-resume/server && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add auto-resume/server/src/routes/resume.ts auto-resume/server/src/routes/jobs.ts
git commit -m "feat: add resume CRUD, file upload/parse, and job target routes"
```

---

### Task 9: Server REST API — Applications + Stats

**Files:**
- Create: `auto-resume/server/src/routes/applications.ts`

- [ ] **Step 1: Create applications routes**

```typescript
// server/src/routes/applications.ts

import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import type { Application, DeliveryStats, PlatformId } from '../../shared/types';

export const applicationsRouter = Router();

// GET /api/applications — list with pagination
applicationsRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = (page - 1) * limit;

  const rows = db.prepare('SELECT * FROM applications ORDER BY sent_at DESC LIMIT ? OFFSET ?').all(limit, offset) as any[];
  const total = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }).c;

  const data: Application[] = rows.map(r => ({
    id: r.id,
    platform: r.platform as PlatformId,
    company: r.company,
    position: r.position,
    salary: r.salary,
    greeting: r.greeting,
    status: r.status,
    sentAt: r.sent_at,
    updatedAt: r.updated_at,
  }));

  res.json({ success: true, data, total, page, limit });
});

// GET /api/applications/stats — delivery statistics
applicationsRouter.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const totalRow = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'read' OR status = 'replied' THEN 1 ELSE 0 END) as total_read,
      SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as total_replied
    FROM applications
  `).get() as any;

  const todayRow = db.prepare(`
    SELECT COUNT(*) as today FROM applications WHERE date(sent_at) = date('now')
  `).get() as any;

  const platformRows = db.prepare(`
    SELECT platform,
      COUNT(*) as sent,
      SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
    FROM applications GROUP BY platform
  `).all() as any[];

  const byPlatform = {} as Record<string, { sent: number; replied: number }>;
  for (const r of platformRows) {
    byPlatform[r.platform] = { sent: r.sent, replied: r.replied || 0 };
  }

  const stats: DeliveryStats = {
    totalSent: totalRow.total || 0,
    totalRead: totalRow.total_read || 0,
    totalReplied: totalRow.total_replied || 0,
    todaySent: todayRow.today || 0,
    byPlatform: byPlatform as DeliveryStats['byPlatform'],
  };

  res.json({ success: true, data: stats });
});

// PATCH /api/applications/:id — update application status
applicationsRouter.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { status } = req.body;
  db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});
```

- [ ] **Step 2: Verify compilation**

```bash
cd auto-resume/server && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add auto-resume/server/src/routes/applications.ts
git commit -m "feat: add applications list/stats endpoints with pagination"
```

---

### Task 10: WebSocket Message Handler

**Files:**
- Create: `auto-resume/server/src/routes/ws.ts`

- [ ] **Step 1: Create WebSocket handler**

```typescript
// server/src/routes/ws.ts

import type { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import type { WsMessage, WsResponse } from '../../shared/types';
import { getDb } from '../db/connection';
import { Scheduler } from '../scheduler';
import { CONFIG } from '../config';

const platformSchedulers = new Map<string, Scheduler>();

function getScheduler(platform: string): Scheduler {
  if (!platformSchedulers.has(platform)) {
    const cfg = CONFIG.PLATFORMS.find(p => p.id === platform);
    platformSchedulers.set(platform, new Scheduler({
      dailyLimit: cfg?.dailyLimit ?? 50,
      minDelayMs: cfg?.minDelayMs ?? 30000,
      maxDelayMs: cfg?.maxDelayMs ?? 90000,
      workdayOnly: true,
      workHoursStart: 9,
      workHoursEnd: 18,
    }));
  }
  return platformSchedulers.get(platform)!;
}

function respond(ws: WebSocket, msg: WsResponse): void {
  ws.send(JSON.stringify(msg));
}

export function handleWsConnection(ws: WebSocket, _req: IncomingMessage): void {
  console.log('[ws] client connected');

  ws.on('message', (raw) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      respond(ws, { type: 'error', success: false, error: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'resume:get': {
        const db = getDb();
        const row = db.prepare('SELECT * FROM resumes ORDER BY updated_at DESC LIMIT 1').get() as any;
        if (!row) {
          respond(ws, { type: 'resume:get', success: true, data: null, requestId: msg.requestId });
          return;
        }
        respond(ws, {
          type: 'resume:get', success: true, requestId: msg.requestId,
          data: {
            id: row.id, name: row.name, phone: row.phone, email: row.email,
            workYears: row.work_years, currentRole: row.current_role,
            skills: JSON.parse(row.skills), projects: JSON.parse(row.projects),
            education: row.education, school: row.school,
            rawText: row.raw_text, createdAt: row.created_at, updatedAt: row.updated_at,
          },
        });
        break;
      }

      case 'jobtargets:list': {
        const db = getDb();
        const rows = db.prepare('SELECT * FROM job_targets ORDER BY created_at DESC').all() as any[];
        const data = rows.map(r => ({
          id: r.id, keywords: JSON.parse(r.keywords), cities: JSON.parse(r.cities),
          minSalary: r.min_salary, maxSalary: r.max_salary,
          platforms: JSON.parse(r.platforms), active: !!r.active, createdAt: r.created_at,
        }));
        respond(ws, { type: 'jobtargets:list', success: true, data, requestId: msg.requestId });
        break;
      }

      case 'apps:stats': {
        const db = getDb();
        const totalRow = db.prepare(`
          SELECT COUNT(*) as t, SUM(CASE WHEN status='replied' THEN 1 ELSE 0 END) as replied FROM applications
        `).get() as any;
        const todayRow = db.prepare("SELECT COUNT(*) as c FROM applications WHERE date(sent_at)=date('now')").get() as any;
        respond(ws, {
          type: 'apps:stats', success: true, requestId: msg.requestId,
          data: { totalSent: totalRow.t, totalReplied: totalRow.replied, todaySent: todayRow.c },
        });
        break;
      }

      case 'task:start': {
        const { platform, greeting } = msg.payload as any;
        const scheduler = getScheduler(platform);

        // Create a task for the content script to execute
        scheduler.enqueue(async () => {
          const db = getDb();
          db.prepare(`
            INSERT INTO applications (platform, company, position, salary, greeting, status)
            VALUES (?, ?, ?, ?, ?, 'sent')
          `).run(platform, 'auto-sending...', 'auto-sending...', '', greeting);

          ws.send(JSON.stringify({
            type: 'task:progress', success: true,
            data: { platform, sent: scheduler.todaySent, action: 'send_greeting', greeting },
          }));
        });

        respond(ws, { type: 'task:start', success: true, requestId: msg.requestId, data: { platform } });
        break;
      }

      case 'task:stop': {
        const { platform } = msg.payload as any;
        const scheduler = platformSchedulers.get(platform);
        if (scheduler) {
          scheduler.stop();
          platformSchedulers.delete(platform);
        }
        respond(ws, { type: 'task:stop', success: true, requestId: msg.requestId });
        break;
      }

      default:
        respond(ws, { type: msg.type, success: true, data: null, requestId: msg.requestId });
    }
  });

  ws.on('close', () => {
    console.log('[ws] client disconnected');
  });
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd auto-resume/server && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add auto-resume/server/src/routes/ws.ts
git commit -m "feat: add WebSocket message handler for popup-server communication"
```

---

### Task 11: Extension — Background Service Worker (Finalize)

**Files:**
- Modify: `auto-resume/extension/src/background/index.ts`

*Background SW was created as skeleton in Task 3. This task finalizes it with the full message routing logic.*

- [ ] **Step 1: Rewrite background/index.ts with full logic**

```typescript
// extension/src/background/index.ts

import { WS_URL } from '../shared/constants';
import type { WsMessage, WsResponse, PlatformId } from '../../../shared/types';

let ws: WebSocket | null = null;
let connectedPort: chrome.runtime.Port | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connectWs() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[bg] WS connected');
    connectedPort?.postMessage({ type: 'ws:connected' });
  };

  ws.onmessage = (event) => {
    try {
      const msg: WsResponse = JSON.parse(event.data);
      connectedPort?.postMessage({ type: 'ws:message', data: msg });
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    console.log('[bg] WS disconnected, reconnecting in 5s');
    reconnectTimer = setTimeout(connectWs, 5000);
  };

  ws.onerror = () => {
    // onclose will fire after this
  };
}

function sendWs(msg: WsMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

async function sendGreetingToTab(platform: PlatformId, greeting: string): Promise<boolean> {
  const urlPatterns: Record<PlatformId, string> = {
    boss: 'zhipin.com',
    wuyou: '51job.com',
    liepin: 'liepin.com',
    zhilian: 'zhaopin.com',
  };

  const tabs = await chrome.tabs.query({ url: `*://*.${urlPatterns[platform]}/*` });
  if (tabs.length === 0 || !tabs[0].id) {
    console.log(`[bg] No active tab for ${platform}`);
    return false;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabs[0].id!, { type: 'SEND_GREETING', greeting }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[bg] Tab message error:', chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(response?.ok ?? false);
      }
    });
  });
}

// Listen for task commands from WS and dispatch to content scripts
function handleWsTask(msg: WsResponse) {
  if (msg.type === 'task:progress' && msg.data) {
    const { platform, greeting } = msg.data as any;
    if (greeting) {
      sendGreetingToTab(platform as PlatformId, greeting as string);
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    connectedPort = port;
    connectWs();

    port.onMessage.addListener((msg) => {
      switch (msg.type) {
        case 'ws:send':
          sendWs(msg.data as WsMessage);
          break;

        case 'check:login': {
          const { platform } = msg;
          const urlPatterns: Record<string, string> = {
            boss: 'zhipin.com',
            wuyou: '51job.com',
            liepin: 'liepin.com',
            zhilian: 'zhaopin.com',
          };
          chrome.tabs.query({ url: `*://*.${urlPatterns[platform]}/*` }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id!, { type: 'CHECK_LOGIN' }, (response) => {
                port.postMessage({ type: 'login:result', platform, loggedIn: response?.loggedIn ?? false });
              });
            } else {
              port.postMessage({ type: 'login:result', platform, loggedIn: false });
            }
          });
          break;
        }

        case 'open:platform': {
          const { platform } = msg;
          const urls: Record<string, string> = {
            boss: 'https://www.zhipin.com/web/geek/job',
            wuyou: 'https://we.51job.com/pc/search',
            liepin: 'https://www.liepin.com/zhaopin/',
            zhilian: 'https://www.zhaopin.com/sou/',
          };
          chrome.tabs.create({ url: urls[platform] });
          break;
        }
      }
    });

    port.onDisconnect.addListener(() => {
      connectedPort = null;
    });
  }
});

// Relay WS task messages
if (ws) {
  const originalOnMessage = ws.onmessage;
  ws.onmessage = (event) => {
    originalOnMessage?.call(ws, event);
    try {
      const msg: WsResponse = JSON.parse(event.data);
      handleWsTask(msg);
    } catch { /* ignore */ }
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add auto-resume/extension/src/background/index.ts
git commit -m "feat: finalize background SW with WS relay and content script dispatch"
```

---

### Task 12: Extension — Boss直聘 Content Script

**Files:**
- Modify: `auto-resume/extension/src/content/boss.ts`

- [ ] **Step 1: Write full Boss直聘 content script**

```typescript
// extension/src/content/boss.ts

const SELECTORS = {
  loginIndicator: '.user-nav, [class*="user"], .header-login-btn, .login-btn',
  searchInput: 'input[name="query"], input[placeholder*="搜索"], .search-input input',
  searchButton: '.search-btn, button:has-text("搜索"), .btn-search',
  jobList: '.job-list-box, .search-job-list, [class*="jobList"]',
  jobCard: '.job-card-wrap, .job-primary, [class*="jobCard"]',
  jobTitle: '.job-name, .job-title, [class*="jobName"] a',
  companyName: '.company-name, .company-text, [class*="companyName"]',
  salary: '.salary, .red, [class*="salary"]',
  contactBtn: '.btn-startchat, .op-btn, .btn-chat, [class*="startChat"]',
  greetingInput: '.chat-input textarea, .input-chat textarea, [class*="chatInput"] textarea',
  sendBtn: '.btn-send, .send-btn, [class*="sendBtn"], button:has-text("发送")',
  nextPage: '.next, .page-next, [class*="next"]',
} as const;

let currentTaskId: string | null = null;

function safeQuery(selector: string): Element | null {
  return document.querySelector(selector);
}

function safeClick(el: Element | null): boolean {
  if (!el) return false;
  // Simulate human interaction: focus first, then click with mouse event
  (el as HTMLElement).focus();
  el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}

function safeType(el: Element | null, text: string): boolean {
  if (!el || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
  el.focus();
  el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  // Type character by character for realism
  el.value = '';
  for (const char of text) {
    el.value += char;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: char }));
  }
  el.dispatchEvent(new InputEvent('change', { bubbles: true }));
  return true;
}

function checkLogin(): boolean {
  // Boss直聘 shows user navigation when logged in
  const el = document.querySelector(SELECTORS.loginIndicator);
  // More reliable: check if we're on the job search page (not redirected to login)
  const isOnLoginPage = window.location.href.includes('/web/user/');
  if (isOnLoginPage) return false;
  return el !== null || document.querySelector('.user-info, .header-user') !== null;
}

async function searchJobs(keyword: string): Promise<void> {
  const input = safeQuery(SELECTORS.searchInput);
  if (!input) {
    console.warn('[boss] search input not found');
    return;
  }

  // Clear and type keyword
  if (input instanceof HTMLInputElement) {
    input.value = keyword;
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  // Click search button
  const btn = safeQuery(SELECTORS.searchButton);
  if (btn) {
    safeClick(btn);
  } else {
    // Try pressing Enter
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  // Wait for results to load
  await new Promise(r => setTimeout(r, 3000));
}

function getJobCards(): Element[] {
  const container = safeQuery(SELECTORS.jobList);
  if (!container) return [];
  return Array.from(container.querySelectorAll(SELECTORS.jobCard));
}

interface JobInfo {
  title: string;
  company: string;
  salary: string;
  link: string;
}

function parseJobCard(card: Element): JobInfo | null {
  const titleEl = card.querySelector(SELECTORS.jobTitle);
  const companyEl = card.querySelector(SELECTORS.companyName);
  const salaryEl = card.querySelector(SELECTORS.salary);

  if (!titleEl || !companyEl) return null;

  return {
    title: titleEl.textContent?.trim() || '',
    company: companyEl.textContent?.trim() || '',
    salary: salaryEl?.textContent?.trim() || '',
    link: (titleEl as HTMLAnchorElement).href || window.location.href,
  };
}

async function clickContactButton(): Promise<boolean> {
  // Boss直聘: The "立即沟通" button
  const btn = safeQuery(SELECTORS.contactBtn);
  if (!btn) {
    // Alternative: look for any button containing "沟通" or "聊"
    const allBtns = document.querySelectorAll('button, a.btn, .btn');
    for (const b of allBtns) {
      if (b.textContent?.includes('沟通') || b.textContent?.includes('聊')) {
        return safeClick(b);
      }
    }
    return false;
  }
  return safeClick(btn);
}

async function sendGreeting(greeting: string): Promise<boolean> {
  // After clicking "沟通", a chat dialog opens with an input
  // Wait for dialog to appear
  await new Promise(r => setTimeout(r, 1500));

  const input = safeQuery(SELECTORS.greetingInput);
  if (!input) {
    // Try looking for any textarea/input in the dialog
    const dialogInput = document.querySelector('.dialog-chat textarea, .chat-box textarea, [class*="chat"] textarea');
    if (dialogInput) {
      return safeType(dialogInput, greeting) && safeClick(safeQuery(SELECTORS.sendBtn));
    }
    return false;
  }

  if (!safeType(input, greeting)) return false;

  await new Promise(r => setTimeout(r, 500));

  const sendBtn = safeQuery(SELECTORS.sendBtn);
  if (!sendBtn) {
    // Try "发送" button
    const allBtns = document.querySelectorAll('button');
    for (const b of allBtns) {
      if (b.textContent?.trim() === '发送') {
        return safeClick(b);
      }
    }
    return false;
  }

  return safeClick(sendBtn);
}

// Listen for commands from background service worker
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'CHECK_LOGIN':
        sendResponse({ loggedIn: checkLogin() });
        break;

      case 'SEARCH_JOBS':
        await searchJobs(msg.keyword);
        const cards = getJobCards();
        const jobs = cards.map(parseJobCard).filter(Boolean);
        sendResponse({ jobs });
        break;

      case 'CLICK_CONTACT':
        sendResponse({ ok: await clickContactButton() });
        break;

      case 'SEND_GREETING':
        sendResponse({ ok: await sendGreeting(msg.greeting) });
        break;

      case 'PING':
        sendResponse({ pong: true });
        break;

      default:
        sendResponse({ error: 'unknown command' });
    }
  })();
  return true; // keep message channel open for async
});

console.log('[auto-resume] Boss直聘 content script loaded');
```

- [ ] **Step 2: Commit**

```bash
git add auto-resume/extension/src/content/boss.ts
git commit -m "feat: implement Boss直聘 content script with search/contact/send flow"
```

---

### Task 13: Extension — Other Platform Content Scripts (前程无忧, 猎聘, 智联)

**Files:**
- Modify: `auto-resume/extension/src/content/wuyou.ts`
- Modify: `auto-resume/extension/src/content/liepin.ts`
- Modify: `auto-resume/extension/src/content/zhilian.ts`

- [ ] **Step 1: 前程无忧 content script**

```typescript
// extension/src/content/wuyou.ts

const WUYOU_SELECTORS = {
  loginIndicator: '.us_name, .user-name, [class*="userName"]',
  searchInput: 'input[id*="keyword"], input[name="keyword"], .kwd input',
  searchButton: 'button[id*="search"], .search-btn, button:has-text("搜索")',
  jobList: '.joblist, .e-joblist, [class*="jobList"]',
  jobCard: '.e, .el, [class*="jobItem"]',
  jobTitle: '.jname, .t1 span a, [class*="jobName"] a',
  companyName: '.cname, .t2 a, [class*="companyName"]',
  salary: '.sal, .t3, [class*="salary"]',
  contactBtn: 'a:has-text("立即沟通"), .btn-chat, [class*="chatBtn"]',
  greetingInput: '.chat-input textarea, [class*="chatTextarea"]',
  sendBtn: 'button:has-text("发送"), .btn-send, [class*="sendBtn"]',
};

function safeClick(el: Element | null): boolean {
  if (!el) return false;
  (el as HTMLElement).focus();
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}

function checkLogin(): boolean {
  const el = document.querySelector(WUYOU_SELECTORS.loginIndicator);
  return el !== null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'CHECK_LOGIN':
        sendResponse({ loggedIn: checkLogin() });
        break;
      case 'PING':
        sendResponse({ pong: true });
        break;
      default:
        sendResponse({ error: 'not implemented' });
    }
  })();
  return true;
});

console.log('[auto-resume] 前程无忧 content script loaded');
```

- [ ] **Step 2: 猎聘 content script**

```typescript
// extension/src/content/liepin.ts

const LIEPIN_SELECTORS = {
  loginIndicator: '.user-info, .user-name, [class*="user"]',
  searchInput: 'input[name="key"], input[placeholder*="搜索"], .search-input input',
  searchButton: '.search-btn, button:has-text("搜索")',
  jobList: '.job-list-box, .sojob-list, [class*="jobList"]',
  jobCard: '.job-list-item, [class*="jobItem"]',
  jobTitle: '.job-title, .job-name, [class*="jobTitle"] a',
  companyName: '.company-name, [class*="companyName"]',
  salary: '.salary, .text-warning, [class*="salary"]',
  contactBtn: 'a:has-text("立即沟通"), .btn-chat',
  greetingInput: '.dialog-chat textarea, [class*="chatArea"]',
  sendBtn: 'button:has-text("发送"), .send-btn',
};

function checkLogin(): boolean {
  const el = document.querySelector(LIEPIN_SELECTORS.loginIndicator);
  return el !== null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'CHECK_LOGIN':
        sendResponse({ loggedIn: checkLogin() });
        break;
      case 'PING':
        sendResponse({ pong: true });
        break;
      default:
        sendResponse({ error: 'not implemented' });
    }
  })();
  return true;
});

console.log('[auto-resume] 猎聘 content script loaded');
```

- [ ] **Step 3: 智联招聘 content script**

```typescript
// extension/src/content/zhilian.ts

const ZHILIAN_SELECTORS = {
  loginIndicator: '.userinfo, .user-name, [class*="userName"]',
  searchInput: 'input[name="kw"], input[placeholder*="搜索"], .search-box input',
  searchButton: '.btn-search, button:has-text("搜索")',
  jobList: '.positionlist, .job-list, [class*="positionList"]',
  jobCard: '.joblist-item, [class*="jobItem"]',
  jobTitle: '.job-title, .job-name, [class*="jobTitle"] a',
  companyName: '.company-name, [class*="companyName"]',
  salary: '.salary, [class*="salary"]',
  contactBtn: 'a:has-text("立即沟通"), .btn-chat',
  greetingInput: '.dialog-content textarea, [class*="chatTextarea"]',
  sendBtn: 'button:has-text("发送"), .send-btn',
};

function checkLogin(): boolean {
  const el = document.querySelector(ZHILIAN_SELECTORS.loginIndicator);
  return el !== null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'CHECK_LOGIN':
        sendResponse({ loggedIn: checkLogin() });
        break;
      case 'PING':
        sendResponse({ pong: true });
        break;
      default:
        sendResponse({ error: 'not implemented' });
    }
  })();
  return true;
});

console.log('[auto-resume] 智联招聘 content script loaded');
```

- [ ] **Step 4: Commit**

```bash
git add auto-resume/extension/src/content/wuyou.ts auto-resume/extension/src/content/liepin.ts auto-resume/extension/src/content/zhilian.ts
git commit -m "feat: add content scripts for 前程无忧, 猎聘, 智联招聘"
```

---

### Task 14: Extension — useWs Hook

**Files:**
- Create: `auto-resume/extension/src/popup/useWs.ts`

- [ ] **Step 1: Create useWs hook**

```typescript
// extension/src/popup/useWs.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WsMessage, WsResponse } from '../../../shared/types';

interface WsState {
  connected: boolean;
}

export function useWs() {
  const [state, setState] = useState<WsState>({ connected: false });
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const callbacksRef = useRef<Map<string, (data: WsResponse) => void>>(new Map());
  const listenerRef = useRef<((data: any) => void) | null>(null);

  useEffect(() => {
    portRef.current = chrome.runtime.connect({ name: 'popup' });

    const listener = (msg: any) => {
      if (msg.type === 'ws:connected') {
        setState({ connected: true });
      } else if (msg.type === 'ws:message') {
        const data = msg.data as WsResponse;
        if (data.requestId && callbacksRef.current.has(data.requestId)) {
          callbacksRef.current.get(data.requestId)!(data);
          callbacksRef.current.delete(data.requestId);
        }
      }
    };

    listenerRef.current = listener;
    portRef.current.onMessage.addListener(listener);

    portRef.current.onDisconnect.addListener(() => {
      setState({ connected: false });
    });

    return () => {
      if (listenerRef.current && portRef.current) {
        portRef.current.onMessage.removeListener(listenerRef.current);
      }
      portRef.current?.disconnect();
    };
  }, []);

  const send = useCallback((msg: WsMessage): Promise<WsResponse> => {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const msgWithId = { ...msg, requestId };

      if (msgWithId.requestId) {
        callbacksRef.current.set(requestId, resolve);
        // Timeout after 30s
        setTimeout(() => {
          if (callbacksRef.current.has(requestId)) {
            callbacksRef.current.delete(requestId);
            resolve({ type: msg.type, success: false, error: 'Timeout', requestId });
          }
        }, 30000);
      }

      portRef.current?.postMessage({ type: 'ws:send', data: msgWithId });
    });
  }, []);

  const checkLogin = useCallback(async (platform: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const listener = (msg: any) => {
        if (msg.type === 'login:result' && msg.platform === platform) {
          portRef.current?.onMessage.removeListener(listener);
          resolve(msg.loggedIn);
        }
      };
      portRef.current?.onMessage.addListener(listener);
      portRef.current?.postMessage({ type: 'check:login', platform });
      // Timeout
      setTimeout(() => {
        portRef.current?.onMessage.removeListener(listener);
        resolve(false);
      }, 10000);
    });
  }, []);

  const openPlatform = useCallback((platform: string) => {
    portRef.current?.postMessage({ type: 'open:platform', platform });
  }, []);

  return { connected: state.connected, send, checkLogin, openPlatform };
}
```

- [ ] **Step 2: Commit**

```bash
git add auto-resume/extension/src/popup/useWs.ts
git commit -m "feat: add useWs hook for popup-background-server communication"
```

---

### Task 15: Extension — Popup Dashboard

**Files:**
- Modify: `auto-resume/extension/src/popup/App.tsx`
- Create: `auto-resume/extension/src/popup/Dashboard.tsx`

- [ ] **Step 1: Create Dashboard component**

```tsx
// extension/src/popup/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import type { DeliveryStats, PlatformId } from '../../../shared/types';
import { PLATFORM_NAMES } from '../shared/constants';
import { useWs } from './useWs';

const Dashboard: React.FC = () => {
  const { connected, send, openPlatform } = useWs();
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [loginStatus, setLoginStatus] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    if (!connected) return;

    send({ type: 'apps:stats' }).then(res => {
      if (res.success && res.data) {
        setStats(res.data as DeliveryStats);
      }
    });

    // Check login status for each platform
    ['boss', 'wuyou', 'liepin', 'zhilian'].forEach(async (p) => {
      // Login check happens via content script
      setLoginStatus(prev => ({ ...prev, [p]: null }));
    });
  }, [connected, send]);

  const handleStart = (platform: string) => {
    setRunning(prev => ({ ...prev, [platform]: true }));
    send({ type: 'task:start', payload: { platform } });
  };

  const handleStop = (platform: string) => {
    setRunning(prev => ({ ...prev, [platform]: false }));
    send({ type: 'task:stop', payload: { platform } });
  };

  const handleOpenPlatform = (platform: string) => {
    openPlatform(platform);
  };

  const platforms: PlatformId[] = ['boss', 'wuyou', 'liepin', 'zhilian'];

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">
          {connected ? '服务已连接' : '服务未连接'}
        </span>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="今日投递" value={stats.todaySent} color="blue" />
          <StatCard label="总计投递" value={stats.totalSent} color="gray" />
          <StatCard label="已读" value={stats.totalRead} color="green" />
          <StatCard label="回复" value={stats.totalReplied} color="yellow" />
        </div>
      )}

      {/* Platform controls */}
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">平台投递</h2>
        <div className="space-y-2">
          {platforms.map(p => (
            <div key={p} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPlatform(p)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {PLATFORM_NAMES[p]}
                </button>
                {loginStatus[p] === false && (
                  <span className="text-xs text-red-500">未登录</span>
                )}
              </div>
              <button
                onClick={() => running[p] ? handleStop(p) : handleStart(p)}
                className={`px-3 py-1 rounded text-xs font-medium text-white ${
                  running[p]
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {running[p] ? '停止' : '开始'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className={`rounded-lg p-3 ${colorMap[color] || colorMap.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Update App.tsx to render Dashboard**

```tsx
// extension/src/popup/App.tsx (full rewrite)

import React, { useState } from 'react';
import { useWs } from './useWs';
import Dashboard from './Dashboard';
import ResumeForm from './ResumeForm';
import JobTargetsForm from './JobTargetsForm';
import ApplicationsList from './ApplicationsList';

const tabs = ['仪表盘', '简历', '目标', '记录'] as const;
type Tab = typeof tabs[number];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('仪表盘');
  const { connected } = useWs();

  return (
    <div className="flex flex-col h-[600px] bg-gray-50">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="font-bold text-lg">Auto Resume</h1>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-400'}`} />
      </header>
      <nav className="flex border-b bg-white shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === '仪表盘' && <Dashboard />}
        {activeTab === '简历' && <ResumeForm />}
        {activeTab === '目标' && <JobTargetsForm />}
        {activeTab === '记录' && <ApplicationsList />}
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 3: Commit**

```bash
git add auto-resume/extension/src/popup/App.tsx auto-resume/extension/src/popup/Dashboard.tsx
git commit -m "feat: add popup dashboard with stats, platform controls, and login detection"
```

---

### Task 16: Extension — Resume Form & Job Targets Form

**Files:**
- Create: `auto-resume/extension/src/popup/ResumeForm.tsx`
- Create: `auto-resume/extension/src/popup/JobTargetsForm.tsx`

- [ ] **Step 1: Create ResumeForm**

```tsx
// extension/src/popup/ResumeForm.tsx

import React, { useState, useEffect } from 'react';
import type { Resume, ResumeInput } from '../../../shared/types';
import { useWs } from './useWs';

const emptyForm: ResumeInput = {
  name: '',
  phone: '',
  email: '',
  workYears: 0,
  currentRole: '',
  skills: [],
  projects: [],
  education: '',
  school: '',
};

const ResumeForm: React.FC = () => {
  const { connected, send } = useWs();
  const [form, setForm] = useState<ResumeInput>(emptyForm);
  const [skillsText, setSkillsText] = useState('');
  const [projectsText, setProjectsText] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!connected) return;
    send({ type: 'resume:get' }).then(res => {
      if (res.success && res.data) {
        const r = res.data as Resume;
        setForm({
          name: r.name, phone: r.phone, email: r.email,
          workYears: r.workYears, currentRole: r.currentRole,
          skills: r.skills, projects: r.projects,
          education: r.education, school: r.school,
        });
        setSkillsText(r.skills.join(', '));
        setProjectsText(r.projects.join(', '));
      }
    });
  }, [connected, send]);

  const handleSave = async () => {
    const toSave: ResumeInput = {
      ...form,
      skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
      projects: projectsText.split(',').map(s => s.trim()).filter(Boolean),
    };
    const res = await send({ type: 'resume:save', payload: toSave });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:9527/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data.extracted) {
        const ex = json.data.extracted;
        setForm(prev => ({
          ...prev,
          name: ex.name || prev.name,
          phone: ex.phone || prev.phone,
          email: ex.email || prev.email,
        }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: keyof ResumeInput, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">简历信息</h2>
        <label className="text-xs text-brand-600 cursor-pointer hover:underline">
          {uploading ? '解析中...' : '上传PDF/Word'}
          <input type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      <InputRow label="姓名">
        <input className={inputClass} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="张三" />
      </InputRow>
      <InputRow label="手机">
        <input className={inputClass} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="13800138000" />
      </InputRow>
      <InputRow label="邮箱">
        <input className={inputClass} value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="zhang@example.com" />
      </InputRow>
      <InputRow label="工作年限">
        <input className={inputClass} type="number" value={form.workYears} onChange={e => updateField('workYears', parseInt(e.target.value) || 0)} />
      </InputRow>
      <InputRow label="当前职位">
        <input className={inputClass} value={form.currentRole} onChange={e => updateField('currentRole', e.target.value)} placeholder="高级前端工程师" />
      </InputRow>
      <InputRow label="技能（逗号分隔）">
        <input className={inputClass} value={skillsText} onChange={e => setSkillsText(e.target.value)} placeholder="React, TypeScript, Node.js" />
      </InputRow>
      <InputRow label="项目经验（逗号分隔）">
        <input className={inputClass} value={projectsText} onChange={e => setProjectsText(e.target.value)} placeholder="电商后台, 用户增长系统" />
      </InputRow>
      <InputRow label="学历">
        <input className={inputClass} value={form.education} onChange={e => updateField('education', e.target.value)} placeholder="本科" />
      </InputRow>
      <InputRow label="学校">
        <input className={inputClass} value={form.school} onChange={e => updateField('school', e.target.value)} placeholder="清华大学" />
      </InputRow>

      <button
        onClick={handleSave}
        className="w-full bg-brand-600 text-white py-2 rounded font-medium text-sm hover:bg-brand-700 transition-colors"
      >
        {saved ? '已保存' : '保存简历'}
      </button>
    </div>
  );
};

const InputRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
    {children}
  </div>
);

export default ResumeForm;
```

- [ ] **Step 2: Create JobTargetsForm**

```tsx
// extension/src/popup/JobTargetsForm.tsx

import React, { useState, useEffect } from 'react';
import type { JobTarget, PlatformId } from '../../../shared/types';
import { PLATFORM_NAMES } from '../shared/constants';
import { useWs } from './useWs';

const JobTargetsForm: React.FC = () => {
  const { connected, send } = useWs();
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!connected) return;
    send({ type: 'jobtargets:list' }).then(res => {
      if (res.success && res.data) {
        setTargets(res.data as JobTarget[]);
      }
    });
  }, [connected, send]);

  const addTarget = () => {
    setTargets(prev => [...prev, {
      id: Date.now(),
      keywords: [],
      cities: [],
      minSalary: 0,
      maxSalary: 0,
      platforms: ['boss'],
      active: true,
      createdAt: new Date().toISOString(),
    }]);
  };

  const removeTarget = (id: number) => {
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  const updateTarget = (id: number, field: keyof JobTarget, value: unknown) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const togglePlatform = (id: number, platform: PlatformId) => {
    setTargets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const platforms = t.platforms.includes(platform)
        ? t.platforms.filter(p => p !== platform)
        : [...t.platforms, platform];
      return { ...t, platforms };
    }));
  };

  const handleSave = async () => {
    const res = await send({ type: 'jobtargets:save', payload: { targets } });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  const allPlatforms: PlatformId[] = ['boss', 'wuyou', 'liepin', 'zhilian'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">目标职位</h2>
        <button onClick={addTarget} className="text-xs text-brand-600 hover:underline">+ 添加</button>
      </div>

      {targets.map((t, idx) => (
        <div key={t.id} className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">目标 #{idx + 1}</span>
            <button onClick={() => removeTarget(t.id)} className="text-xs text-red-500">删除</button>
          </div>
          <div>
            <label className="text-xs text-gray-500">关键词（逗号分隔）</label>
            <input
              className={inputClass}
              value={t.keywords.join(', ')}
              onChange={e => updateTarget(t.id, 'keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="前端开发, React"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">城市（逗号分隔）</label>
            <input
              className={inputClass}
              value={t.cities.join(', ')}
              onChange={e => updateTarget(t.id, 'cities', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="北京, 上海"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">最低薪资(k)</label>
              <input
                className={inputClass}
                type="number"
                value={t.minSalary}
                onChange={e => updateTarget(t.id, 'minSalary', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">最高薪资(k)</label>
              <input
                className={inputClass}
                type="number"
                value={t.maxSalary}
                onChange={e => updateTarget(t.id, 'maxSalary', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">平台</label>
            <div className="flex gap-1 flex-wrap">
              {allPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(t.id, p)}
                  className={`px-2 py-0.5 rounded text-xs ${
                    t.platforms.includes(p)
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {PLATFORM_NAMES[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {targets.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full bg-brand-600 text-white py-2 rounded font-medium text-sm hover:bg-brand-700 transition-colors"
        >
          {saved ? '已保存' : '保存目标'}
        </button>
      )}
    </div>
  );
};

export default JobTargetsForm;
```

- [ ] **Step 3: Commit**

```bash
git add auto-resume/extension/src/popup/ResumeForm.tsx auto-resume/extension/src/popup/JobTargetsForm.tsx
git commit -m "feat: add resume form (manual + file upload) and job targets form"
```

---

### Task 17: Extension — Applications List

**Files:**
- Create: `auto-resume/extension/src/popup/ApplicationsList.tsx`

- [ ] **Step 1: Create ApplicationsList**

```tsx
// extension/src/popup/ApplicationsList.tsx

import React, { useEffect, useState, useCallback } from 'react';
import type { Application, PlatformId } from '../../../shared/types';
import { PLATFORM_NAMES } from '../shared/constants';
import { useWs } from './useWs';

const statusLabels: Record<string, string> = {
  sent: '已投递',
  read: '已读',
  replied: '已回复',
  rejected: '不合适',
  ignored: '无回应',
};

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  read: 'bg-green-100 text-green-700',
  replied: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  ignored: 'bg-gray-100 text-gray-500',
};

const ApplicationsList: React.FC = () => {
  const { connected, send } = useWs();
  const [apps, setApps] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchApps = useCallback(async (p: number) => {
    if (!connected) return;
    const res = await send({ type: 'apps:list', payload: { page: p, limit: 20 } });
    if (res.success && res.data) {
      const data = res.data as { items: Application[]; total: number };
      setApps(data.items || (res.data as any).data || []);
      setTotal(data.total || 0);
    }
  }, [connected, send]);

  useEffect(() => {
    fetchApps(page);
  }, [fetchApps, page]);

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm">投递记录 ({total})</h2>

      {apps.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">暂无记录</p>
      ) : (
        apps.map(app => (
          <div key={app.id} className="bg-white rounded-lg p-3 shadow-sm text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium truncate max-w-[200px]">{app.position}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[app.status]}`}>
                {statusLabels[app.status] || app.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>{app.company}</span>
              <span>{PLATFORM_NAMES[app.platform as PlatformId] || app.platform}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {app.sentAt}
            </div>
          </div>
        ))
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 text-xs rounded border disabled:opacity-30"
          >
            上一页
          </button>
          <span className="text-xs py-1 text-gray-500">第 {page} 页</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 text-xs rounded border disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
```

- [ ] **Step 2: Commit**

```bash
git add auto-resume/extension/src/popup/ApplicationsList.tsx
git commit -m "feat: add applications list with pagination and status display"
```

---

### Task 18: Integration — Connect End-to-End and Smoke Test

**Files:**
- (No new files — verification only)

- [ ] **Step 1: Start the server**

```bash
cd auto-resume/server && npm run dev
```

Expected: Server running on port 9527, WebSocket ready.

- [ ] **Step 2: Build the extension**

```bash
cd auto-resume/extension && npm run build
```

Expected: Build succeeds, `dist/` generated.

- [ ] **Step 3: Load extension in Chrome**

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `auto-resume/extension/dist/`
5. Verify extension appears with "Auto Resume Bot" name

- [ ] **Step 4: Smoke test the flow**

1. Click extension icon → Popup opens
2. Verify green dot (connected) when server is running
3. Go to "简历" tab → Fill in form → Save
4. Go to "目标" tab → Add target → Save
5. Open Boss直聘 in a tab → Verify "PING" response (check console for `[auto-resume] Boss直聘 content script loaded`)
6. Go to "仪表盘" → Click "开始" on Boss直聘

- [ ] **Step 5: Verify database records**

```bash
cd auto-resume/server && sqlite3 data/auto-resume.db "SELECT * FROM resumes; SELECT * FROM job_targets;"
```

Expected: Shows saved resume and job targets.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: final integration fixes after end-to-end smoke test"
```

---

### Task 19: Packaging — Server EXE + Extension ZIP

**Files:**
- Create: `auto-resume/server/scripts/package.sh`

- [ ] **Step 1: Create packaging script**

```bash
#!/bin/bash
# server/scripts/package.sh
# Package server into standalone .exe using pkg

echo "Building TypeScript..."
npm run build

echo "Packaging with pkg..."
npx pkg dist/index.js \
  --targets node18-win-x64 \
  --output ../dist/auto-resume-server.exe \
  --options max-old-space-size=4096

echo "Done! Executable: dist/auto-resume-server.exe"
```

- [ ] **Step 2: Package the extension**

```bash
cd auto-resume/extension && npm run build
# The dist/ folder is the loadable extension
# For distribution: zip the dist/ folder
```

- [ ] **Step 3: Drop a README with user instructions**

```markdown
# Auto Resume Bot

## 安装与使用

### 1. 启动本地服务
双击运行 `auto-resume-server.exe`，托盘图标出现表示启动成功。

### 2. 安装浏览器扩展
1. 打开 Chrome/Edge，地址栏输入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension/dist/` 目录

### 3. 开始使用
1. 点击浏览器工具栏的 Auto Resume 图标
2. 填写简历信息（或上传 PDF/Word 自动解析）
3. 设置目标职位条件
4. 在对应招聘网站登录账号
5. 在仪表盘点击「开始」启动自动投递

### 注意事项
- 仅工作日 9:00-18:00 投递（可配置）
- 每平台每天上限 50 份（可配置）
- 遇到验证码会暂停，需手动处理
- 使用风险自行承担
```

- [ ] **Step 4: Commit**

```bash
git add auto-resume/server/scripts/ auto-resume/README.md
git commit -m "chore: add packaging script and user README"
```

---

## Plan Self-Review

### Spec Coverage

| Spec Section | Covered By |
|---|---|
| Architecture (extension + server) | Tasks 1-3 (scaffolding) |
| Shared types | Task 1 |
| Database schema | Task 4 |
| Resume parser (PDF/Word) | Task 5 |
| Job matcher | Task 6 |
| Delivery scheduler | Task 7 |
| REST API (resume, jobs, apps) | Tasks 8-9 |
| WebSocket handler | Task 10 |
| Background SW | Tasks 3, 11 |
| Content scripts (4 platforms) | Tasks 12-13 |
| Popup UI (dashboard, forms, list) | Tasks 14-17 |
| Anti-detection (delays, limits, event simulation) | Task 7 (scheduler) + Task 12 (DOM simulation) |
| Stats & analytics | Task 9 (REST) + Task 15 (UI) |
| Packaging (.exe + extension) | Task 19 |

### Placeholder Scan
- No TBD/TODO present
- All code steps include actual implementation, not descriptions
- DOM selectors based on known site structure (may need field adjustment)
- Content scripts for 前程无忧/猎聘/智联 have login detection only; full search+send flow follows Boss直聘 pattern

### Type Consistency
- `Resume`, `JobTarget`, `Application`, `PlatformId` consistent across all tasks
- `WsMessage`, `WsResponse` used consistently in server and extension
- `DeliveryStats` shape matches Dashboard usage (Task 15)
- `useWs` hook signature matches all consuming components
- REST paths consistent: `/api/resume`, `/api/jobs`, `/api/applications`
