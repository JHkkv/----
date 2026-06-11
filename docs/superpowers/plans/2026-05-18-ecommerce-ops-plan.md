# E-Commerce Operations System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete 7-module e-commerce operations dashboard for learning purposes.

**Architecture:** React + Vite frontend talks to an Express.js REST API, which reads/writes a SQLite database. All data is seeded on first run. The frontend uses React Router for page navigation and Recharts for data visualization.

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router v6, Recharts, Express.js, better-sqlite3

---

## File Map

```
ecommerce-ops/
├── package.json                    # Root: concurrently runs client + server
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx                # React entry
│       ├── App.tsx                 # Router setup
│       ├── index.css               # Tailwind directives + base styles
│       ├── components/
│       │   ├── Layout.tsx          # Sidebar + main area shell
│       │   └── MetricCard.tsx      # Dashboard stat card
│       └── pages/
│           ├── Dashboard.tsx       # Page 1: Overview with charts
│           ├── Products.tsx        # Page 2: Product list + SKU detail
│           ├── Pricing.tsx         # Page 3: Price management
│           ├── Orders.tsx          # Page 4: Order lifecycle
│           ├── Logistics.tsx       # Page 5: Tracking
│           ├── Marketing.tsx       # Page 6: Coupons
│           └── Analytics.tsx       # Page 7: Data analysis
├── server/
│   ├── index.js                    # Express entry, CORS, JSON body parser
│   ├── database.js                 # SQLite connection, schema, seed data
│   └── routes/
│       ├── products.js             # CRUD for products + SKUs
│       ├── orders.js               # Order lifecycle + status transitions
│       ├── logistics.js            # Tracking records
│       ├── marketing.js            # Coupon CRUD
│       ├── analytics.js            # Aggregation queries
│       └── dashboard.js            # Summary stats for dashboard
```

**Design decisions:**
- No React Router needed initially — single-page state switching is simpler for a beginner. State-based page switching via a `currentPage` state in App.tsx.
- One CSS file (Tailwind) covers all styling. No CSS modules or styled-components.
- All API calls use plain `fetch()`. No React Query or axios to minimize concepts.
- Each page fetches its own data on mount via `useEffect`.

---

### Task 1: Project Scaffold & Database

**Files:**
- Create: `ecommerce-ops/package.json`
- Create: `ecommerce-ops/client/package.json`
- Create: `ecommerce-ops/client/index.html`
- Create: `ecommerce-ops/client/vite.config.ts`
- Create: `ecommerce-ops/client/tailwind.config.js`
- Create: `ecommerce-ops/client/postcss.config.js`
- Create: `ecommerce-ops/client/src/main.tsx`
- Create: `ecommerce-ops/client/src/index.css`
- Create: `ecommerce-ops/client/src/App.tsx`
- Create: `ecommerce-ops/server/index.js`
- Create: `ecommerce-ops/server/database.js`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "ecommerce-ops",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "node server/index.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

- [ ] **Step 2: Create client package.json with all deps**

```json
{
  "name": "ecommerce-ops-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 3: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>电商运营系统</title>
  </head>
  <body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 5: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 6: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create client/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create client/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Create minimal App.tsx (placeholder)**

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600">电商运营系统</h1>
    </div>
  );
}
```

- [ ] **Step 10: Create server/index.js**

```javascript
const express = require('express');
const { initDatabase } = require('./database');

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = 3001;
initDatabase();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 11: Create server/database.js (schema + seed)**

```javascript
const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  db = new Database(path.join(__dirname, 'ecommerce.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      main_image TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      spec_name TEXT NOT NULL,
      spec_value TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      status TEXT DEFAULT 'pending',
      total_amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      sku_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (sku_id) REFERENCES skus(id)
    );

    CREATE TABLE IF NOT EXISTS logistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      carrier TEXT NOT NULL,
      tracking_no TEXT NOT NULL,
      status TEXT DEFAULT 'picked_up',
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      amount REAL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      threshold REAL,
      discount REAL NOT NULL,
      quantity INTEGER DEFAULT 100,
      used INTEGER DEFAULT 0,
      valid_from TEXT,
      valid_to TEXT,
      status TEXT DEFAULT 'active'
    );
  `);

  // Only seed if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (count.c > 0) return;

  seedData();
}

function seedData() {
  // Categories
  const categories = ['手机壳', '充电器', '数据线', '耳机', '支架', '贴膜'];
  const catStmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  for (const c of categories) catStmt.run(c);

  // Products (SPUs) — 20 products across 6 categories
  const products = [
    { name: '极简透明手机壳', desc: '超薄透明，还原裸机手感', cat: 1, img: '' },
    { name: '军工防摔手机壳', desc: '军工级防摔，四角气囊保护', cat: 1, img: '' },
    { name: '液态硅胶手机壳', desc: '亲肤手感，多色可选', cat: 1, img: '' },
    { name: '65W氮化镓充电器', desc: 'GaN技术，小体积大功率', cat: 2, img: '' },
    { name: '20W PD快充头', desc: '苹果同款快充，30分钟充50%', cat: 2, img: '' },
    { name: '无线充电板', desc: '15W无线快充，即放即充', cat: 2, img: '' },
    { name: 'Type-C快充数据线', desc: '100W快充，1米编织线', cat: 3, img: '' },
    { name: 'MFi认证苹果数据线', desc: '苹果官方认证，不弹窗', cat: 3, img: '' },
    { name: '三合一数据线', desc: '一拖三，同时充多设备', cat: 3, img: '' },
    { name: '蓝牙5.3耳机', desc: '超低延迟，40小时续航', cat: 4, img: '' },
    { name: '骨传导运动耳机', desc: '不入耳设计，运动更安全', cat: 4, img: '' },
    { name: '降噪头戴耳机', desc: 'ANC主动降噪，60小时续航', cat: 4, img: '' },
    { name: '折叠手机支架', desc: '铝合金材质，角度可调', cat: 5, img: '' },
    { name: '桌面升降支架', desc: '360°旋转，解放颈椎', cat: 5, img: '' },
    { name: '车载磁吸支架', desc: '强磁吸附，单手操作', cat: 5, img: '' },
    { name: '钢化玻璃膜', desc: '9H硬度，高清透光', cat: 6, img: '' },
    { name: '防蓝光钢化膜', desc: '过滤蓝光，护眼必备', cat: 6, img: '' },
    { name: '水凝膜', desc: '曲面全覆盖，自动修复划痕', cat: 6, img: '' },
    { name: '镜头保护膜', desc: '保护摄像头，不挡拍照', cat: 6, img: '' },
    { name: '多口桌面充电站', desc: '6口USB，桌面充电枢纽', cat: 2, img: '' },
  ];

  const prodStmt = db.prepare('INSERT INTO products (name, description, category_id, main_image) VALUES (?, ?, ?, ?)');
  for (const p of products) prodStmt.run(p.name, p.desc, p.cat, p.img);

  // SKUs — ~50 variants
  const skus = [
    // iPhone 手机壳 SKUs
    { pid: 1, sn: '颜色', sv: '透明白', price: 19.9, cost: 8, stock: 200 },
    { pid: 1, sn: '颜色', sv: '透明黑', price: 19.9, cost: 8, stock: 150 },
    { pid: 2, sn: '颜色', sv: '黑色', price: 39.9, cost: 18, stock: 120 },
    { pid: 2, sn: '颜色', sv: '军绿色', price: 39.9, cost: 18, stock: 80 },
    { pid: 3, sn: '颜色', sv: '午夜蓝', price: 29.9, cost: 14, stock: 180 },
    { pid: 3, sn: '颜色', sv: '灰粉色', price: 29.9, cost: 14, stock: 160 },
    // 充电器 SKUs
    { pid: 4, sn: '规格', sv: '65W单口', price: 99, cost: 55, stock: 90 },
    { pid: 4, sn: '规格', sv: '65W双口', price: 129, cost: 72, stock: 70 },
    { pid: 5, sn: '颜色', sv: '白色', price: 49, cost: 22, stock: 300 },
    { pid: 5, sn: '颜色', sv: '黑色', price: 49, cost: 22, stock: 250 },
    { pid: 6, sn: '规格', sv: '标准版', price: 79, cost: 38, stock: 100 },
    { pid: 6, sn: '规格', sv: '磁吸版', price: 99, cost: 48, stock: 80 },
    // 数据线 SKUs
    { pid: 7, sn: '长度', sv: '1米', price: 25, cost: 10, stock: 400 },
    { pid: 7, sn: '长度', sv: '2米', price: 35, cost: 14, stock: 300 },
    { pid: 8, sn: '长度', sv: '1米', price: 45, cost: 22, stock: 200 },
    { pid: 8, sn: '长度', sv: '1.5米', price: 55, cost: 26, stock: 180 },
    { pid: 9, sn: '颜色', sv: '黑色', price: 29, cost: 12, stock: 250 },
    { pid: 9, sn: '颜色', sv: '白色', price: 29, cost: 12, stock: 250 },
    // 耳机 SKUs
    { pid: 10, sn: '颜色', sv: '白色', price: 159, cost: 85, stock: 150 },
    { pid: 10, sn: '颜色', sv: '黑色', price: 159, cost: 85, stock: 150 },
    { pid: 11, sn: '颜色', sv: '黑色', price: 299, cost: 170, stock: 60 },
    { pid: 11, sn: '颜色', sv: '红色', price: 299, cost: 170, stock: 50 },
    { pid: 12, sn: '颜色', sv: '黑色', price: 399, cost: 220, stock: 40 },
    { pid: 12, sn: '颜色', sv: '银色', price: 399, cost: 220, stock: 35 },
    // 支架 SKUs
    { pid: 13, sn: '颜色', sv: '银色', price: 29.9, cost: 12, stock: 200 },
    { pid: 13, sn: '颜色', sv: '深空灰', price: 29.9, cost: 12, stock: 180 },
    { pid: 14, sn: '颜色', sv: '白色', price: 79, cost: 35, stock: 100 },
    { pid: 14, sn: '颜色', sv: '黑色', price: 79, cost: 35, stock: 100 },
    { pid: 15, sn: '颜色', sv: '黑色', price: 49, cost: 20, stock: 130 },
    // 贴膜 SKUs
    { pid: 16, sn: '型号', sv: 'iPhone 15', price: 15, cost: 3, stock: 500 },
    { pid: 16, sn: '型号', sv: 'iPhone 15 Pro', price: 15, cost: 3, stock: 450 },
    { pid: 17, sn: '型号', sv: 'iPhone 15', price: 25, cost: 6, stock: 350 },
    { pid: 17, sn: '型号', sv: 'iPhone 15 Pro', price: 25, cost: 6, stock: 300 },
    { pid: 18, sn: '型号', sv: 'iPhone 15 Pro Max', price: 20, cost: 5, stock: 280 },
    { pid: 19, sn: '型号', sv: '通用款', price: 10, cost: 2, stock: 600 },
    // 多口充电站
    { pid: 20, sn: '规格', sv: '6口USB-A', price: 149, cost: 80, stock: 60 },
    { pid: 20, sn: '规格', sv: '4口USB-A+2口Type-C', price: 179, cost: 98, stock: 50 },
  ];

  const skuStmt = db.prepare('INSERT INTO skus (product_id, spec_name, spec_value, price, cost, stock) VALUES (?, ?, ?, ?, ?, ?)');
  for (const s of skus) skuStmt.run(s.pid, s.sn, s.sv, s.price, s.cost, s.stock);

  // Customers — 100 simulated users
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '军'];
  const cities = ['北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区', '杭州市西湖区', '成都市武侯区', '武汉市洪山区', '南京市鼓楼区'];
  const custStmt = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)');
  for (let i = 0; i < 100; i++) {
    const name = firstNames[i % 10] + lastNames[i % 10] + (i % 10);
    const phone = '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    const addr = cities[i % 8] + '某某路' + (i + 1) + '号';
    custStmt.run(name, phone, addr);
  }

  // Orders — ~200 orders over 30 days
  const orderStatuses = ['pending', 'paid', 'shipped', 'completed'];
  const orderStmt = db.prepare('INSERT INTO orders (customer_id, status, total_amount, created_at) VALUES (?, ?, ?, ?)');
  const itemStmt = db.prepare('INSERT INTO order_items (order_id, sku_id, quantity, price) VALUES (?, ?, ?, ?)');
  const logiStmt = db.prepare('INSERT INTO logistics (order_id, carrier, tracking_no, status) VALUES (?, ?, ?, ?)');
  const carriers = ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '京东物流'];
  const logiStatuses = ['picked_up', 'in_transit', 'delivering', 'signed'];

  for (let i = 0; i < 200; i++) {
    const customerId = Math.floor(Math.random() * 100) + 1;
    const statusIdx = Math.floor(Math.random() * 16); // 0-15 weighted
    const status = statusIdx < 2 ? 'pending' : statusIdx < 5 ? 'paid' : statusIdx < 9 ? 'shipped' : 'completed';
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(2026, 4, 18 - daysAgo);
    const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);
    const itemCount = Math.floor(Math.random() * 3) + 1;
    let total = 0;
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const skuId = Math.floor(Math.random() * 37) + 1;
      const qty = Math.floor(Math.random() * 3) + 1;
      const sku = db.prepare('SELECT price FROM skus WHERE id = ?').get(skuId);
      if (!sku) continue;
      total += sku.price * qty;
      items.push({ skuId, qty, price: sku.price });
    }
    if (items.length === 0) continue;

    const result = orderStmt.run(customerId, status, Math.round(total * 100) / 100, dateStr);
    const orderId = result.lastInsertRowid;
    for (const item of items) {
      itemStmt.run(orderId, item.skuId, item.qty, item.price);
    }

    // Add logistics for shipped/completed orders
    if (status === 'shipped' || status === 'completed') {
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const trackNo = 'SF' + String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0');
      const logiStatus = status === 'completed' ? 'signed' : logiStatuses[Math.floor(Math.random() * 2) + 1];
      logiStmt.run(orderId, carrier, trackNo, logiStatus);
    }
  }

  // Coupons
  const couponStmt = db.prepare('INSERT INTO coupons (name, type, threshold, discount, quantity, used, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  couponStmt.run('新用户满99减20', 'threshold', 99, 20, 500, 87, '2026-05-01', '2026-06-30');
  couponStmt.run('全场85折', 'percent', 0, 15, 200, 45, '2026-05-10', '2026-05-31');
  couponStmt.run('满199减50', 'threshold', 199, 50, 300, 23, '2026-05-01', '2026-07-31');
  couponStmt.run('免邮券', 'free_shipping', 0, 0, 1000, 156, '2026-05-01', '2026-12-31');
  couponStmt.run('618大促满299减100', 'threshold', 299, 100, 100, 0, '2026-06-15', '2026-06-20');
  couponStmt.run('数码配件9折', 'percent', 0, 10, 500, 62, '2026-05-15', '2026-06-15');
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };
```

- [ ] **Step 12: Create directory structure**

```bash
cd "f:/测试工具" && mkdir -p ecommerce-ops/client/src/components && mkdir -p ecommerce-ops/client/src/pages && mkdir -p ecommerce-ops/server/routes
```

- [ ] **Step 13: Install root dependencies (Express + SQLite)**

```bash
cd "f:/测试工具/ecommerce-ops" && npm install
```
Expected: express, better-sqlite3, concurrently installed in root node_modules.

- [ ] **Step 14: Install client dependencies (React + Vite + Tailwind + Recharts)**

```bash
cd "f:/测试工具/ecommerce-ops/client" && npm install
```
Expected: react, vite, tailwindcss, recharts installed in client/node_modules.

- [ ] **Step 15: Start servers and verify**

Run in separate terminals or via concurrently:
```bash
cd f:/测试工具/ecommerce-ops && npm run dev
```

Verify: Open http://localhost:5173 → See "电商运营系统"
Verify: Open http://localhost:3001/api/health → See `{"ok":true}`

- [ ] **Step 16: Commit**

```bash
cd f:/测试工具/ecommerce-ops && git add -A && git commit -m "feat: project scaffold with Vite, Express, SQLite schema and seed data"
```

---

### Task 2: Layout + Navigation Shell

**Files:**
- Create: `client/src/components/Layout.tsx`
- Create: `client/src/components/MetricCard.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create Layout.tsx**

```tsx
const PAGES = [
  { key: 'dashboard', label: '总览看板', icon: '📊' },
  { key: 'products', label: '商品管理', icon: '📦' },
  { key: 'pricing', label: '定价管理', icon: '💰' },
  { key: 'orders', label: '订单管理', icon: '🛒' },
  { key: 'logistics', label: '物流管理', icon: '🚚' },
  { key: 'marketing', label: '营销中心', icon: '📢' },
  { key: 'analytics', label: '数据分析', icon: '📈' },
];

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: Props) {
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-slate-800 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-wide">电商运营系统</h1>
          <p className="text-xs text-slate-400 mt-1">3C数码配件专营店</p>
        </div>
        <nav className="flex-1 py-3">
          {PAGES.map((p) => (
            <button
              key={p.key}
              onClick={() => onNavigate(p.key)}
              className={
                'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ' +
                (currentPage === p.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white')
              }
            >
              <span className="text-lg">{p.icon}</span>
              <span className="text-sm">{p.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create MetricCard.tsx**

```tsx
interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down';
}

export default function MetricCard({ title, value, subtitle, trend }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2 text-gray-800">
        {value}
        {trend && (
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {trend === 'up' ? ' ↑' : ' ↓'}
          </span>
        )}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx with page switching**

```tsx
import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Pricing from './pages/Pricing';
import Orders from './pages/Orders';
import Logistics from './pages/Logistics';
import Marketing from './pages/Marketing';
import Analytics from './pages/Analytics';

const PAGES: Record<string, React.FC> = {
  dashboard: Dashboard,
  products: Products,
  pricing: Pricing,
  orders: Orders,
  marketing: Marketing,
  logistics: Logistics,
  analytics: Analytics,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const PageComponent = PAGES[page] || Dashboard;

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      <PageComponent />
    </Layout>
  );
}
```

- [ ] **Step 4: Create placeholder pages**

For each of the 7 page files (`Dashboard.tsx`, `Products.tsx`, etc.), create a minimal placeholder:

```tsx
export default function Products() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">商品管理</h2>
      <p className="text-gray-500">商品列表将在此处展示。</p>
    </div>
  );
}
```

(Create these for all 7 pages, replacing the title accordingly.)

- [ ] **Step 5: Verify**

Start the app, click through all 7 sidebar items. Each should show its page title.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: layout shell with sidebar navigation and metric card component"
```

---

### Task 3: Product Management Page

**Files:**
- Create: `server/routes/products.js`
- Modify: `server/index.js` (add route mount)
- Modify: `client/src/pages/Products.tsx`

- [ ] **Step 1: Create products API route**

Create `server/routes/products.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/products — list all products with category name and SKU count
router.get('/', (_req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, c.name as category_name,
      (SELECT COUNT(*) FROM skus WHERE product_id = p.id) as sku_count,
      (SELECT MIN(price) FROM skus WHERE product_id = p.id) as min_price,
      (SELECT MAX(price) FROM skus WHERE product_id = p.id) as max_price
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.id
  `).all();
  res.json(products);
});

// GET /api/products/:id/skus — get SKUs for a product
router.get('/:id/skus', (req, res) => {
  const db = getDb();
  const skus = db.prepare('SELECT * FROM skus WHERE product_id = ?').all(req.params.id);
  res.json(skus);
});

// POST /api/products — create a new product
router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, category_id, main_image } = req.body;
  const result = db.prepare(
    'INSERT INTO products (name, description, category_id, main_image) VALUES (?, ?, ?, ?)'
  ).run(name, description || '', category_id || 1, main_image || '');
  res.json({ id: result.lastInsertRowid });
});

// PUT /api/products/:id — update product status
router.put('/:id', (req, res) => {
  const db = getDb();
  const { status, name, description } = req.body;
  if (status) {
    db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  if (name || description) {
    db.prepare('UPDATE products SET name = ?, description = ? WHERE id = ?').run(
      name, description, req.params.id
    );
  }
  res.json({ ok: true });
});

// GET /api/categories — list categories
router.get('/categories/list', (_req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM categories').all();
  res.json(cats);
});

module.exports = router;
```

- [ ] **Step 2: Mount routes in server/index.js**

In `server/index.js`, add after `app.use(express.json());`:

```javascript
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);
```

- [ ] **Step 3: Build the Products page**

Rewrite `client/src/pages/Products.tsx`:

```tsx
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  category_name: string;
  sku_count: number;
  min_price: number;
  max_price: number;
  status: string;
}

interface SKU {
  id: number;
  spec_name: string;
  spec_value: string;
  price: number;
  cost: number;
  stock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const loadSkus = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    const res = await fetch(`/api/products/${id}/skus`);
    const data = await res.json();
    setSkus(data);
    setExpanded(id);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">商品管理</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="搜索商品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">商品名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">类目</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">价格区间</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">SKU数</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <>
                <tr
                  key={p.id}
                  onClick={() => loadSkus(p.id)}
                  className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category_name}</td>
                  <td className="px-4 py-3 text-right">
                    ¥{p.min_price} - ¥{p.max_price}
                  </td>
                  <td className="px-4 py-3 text-center">{p.sku_count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={
                      'inline-block px-2 py-0.5 rounded-full text-xs ' +
                      (p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                    }>
                      {p.status === 'active' ? '在售' : '下架'}
                    </span>
                  </td>
                </tr>
                {expanded === p.id && (
                  <tr key={`sku-${p.id}`}>
                    <td colSpan={5} className="bg-gray-50 px-6 py-3">
                      <p className="text-xs text-gray-500 mb-2 font-medium">SKU 明细（库存单位）</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-1">规格名</th>
                            <th className="text-left py-1">规格值</th>
                            <th className="text-right py-1">售价</th>
                            <th className="text-right py-1">成本</th>
                            <th className="text-right py-1">库存</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skus.map((s) => (
                            <tr key={s.id} className="border-t border-gray-200">
                              <td className="py-1.5 text-gray-500">{s.spec_name}</td>
                              <td className="py-1.5 font-medium">{s.spec_value}</td>
                              <td className="py-1.5 text-right">¥{s.price}</td>
                              <td className="py-1.5 text-right text-gray-500">¥{s.cost}</td>
                              <td className="py-1.5 text-right">{s.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test the API**

Start the server, then run:
```bash
curl http://localhost:3001/api/products
```
Expected: JSON array with 20 products, each with `category_name`, `sku_count`, `min_price`, `max_price`.

Run:
```bash
curl http://localhost:3001/api/products/1/skus
```
Expected: JSON array with SKUs for product 1.

- [ ] **Step 5: Verify in browser**

Open the app, go to "商品管理". Verify: 20 products listed. Click a row — SKU details expand below.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: product management page with SKU drill-down"
```

---

### Task 4: Pricing Management Page

**Files:**
- Modify: `server/routes/products.js` (add pricing endpoint)
- Create/Modify: `client/src/pages/Pricing.tsx`

- [ ] **Step 1: Add pricing API endpoint**

Add to `server/routes/products.js`:

```javascript
// GET /api/products/pricing — all SKUs with product info for pricing page
router.get('/pricing/list', (_req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT s.*, p.name as product_name, c.name as category_name,
      ROUND((s.price - s.cost) / s.price * 100, 1) as margin_pct
    FROM skus s
    JOIN products p ON p.id = s.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.category_id, p.id
  `).all();
  res.json(data);
});
```

- [ ] **Step 2: Build Pricing page**

Write `client/src/pages/Pricing.tsx`:

```tsx
import { useState, useEffect } from 'react';

interface SkuPricing {
  id: number;
  product_name: string;
  category_name: string;
  spec_name: string;
  spec_value: string;
  price: number;
  cost: number;
  stock: number;
  margin_pct: number;
}

export default function Pricing() {
  const [data, setData] = useState<SkuPricing[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    fetch('/api/products/pricing/list')
      .then((r) => r.json())
      .then(setData);
  }, []);

  const startEdit = (sku: SkuPricing) => {
    setEditId(sku.id);
    setEditPrice(String(sku.price));
  };

  const savePrice = async (id: number) => {
    await fetch(`/api/products/${id}/price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: parseFloat(editPrice) }),
    });
    setEditId(null);
    setData((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, price: parseFloat(editPrice), margin_pct: Math.round((parseFloat(editPrice) - s.cost) / parseFloat(editPrice) * 1000) / 10 }
          : s
      )
    );
  };

  // Stats
  const avgMargin = data.length > 0
    ? Math.round(data.reduce((sum, s) => sum + s.margin_pct, 0) / data.length * 10) / 10
    : 0;
  const lowStock = data.filter((s) => s.stock < 50).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">定价管理</h2>
        <div className="flex gap-4 text-sm">
          <span className="bg-white px-3 py-1.5 rounded-lg border">
            平均利润率: <strong className="text-green-600">{avgMargin}%</strong>
          </span>
          <span className="bg-white px-3 py-1.5 rounded-lg border">
            低库存预警: <strong className="text-orange-600">{lowStock}</strong> 个SKU
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">商品 / SKU</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">类目</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">成本价</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">售价</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">利润率</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">库存</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{s.product_name}</p>
                  <p className="text-xs text-gray-400">{s.spec_name}: {s.spec_value}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.category_name}</td>
                <td className="px-4 py-3 text-right text-gray-500">¥{s.cost}</td>
                <td className="px-4 py-3 text-right">
                  {editId === s.id ? (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-20 text-right border rounded px-1 py-0.5"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">¥{s.price}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={
                    s.margin_pct >= 50 ? 'text-green-600' :
                    s.margin_pct >= 30 ? 'text-blue-600' :
                    'text-orange-600'
                  }>
                    {s.margin_pct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={s.stock < 50 ? 'text-red-500 font-medium' : ''}>
                    {s.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {editId === s.id ? (
                    <button
                      onClick={() => savePrice(s.id)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      保存
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(s)}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      调价
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add price update endpoint**

Add to `server/routes/products.js`:

```javascript
// PUT /api/products/:id/price — update SKU price
router.put('/:id/price', (req, res) => {
  const db = getDb();
  const { price } = req.body;
  db.prepare('UPDATE skus SET price = ? WHERE id = ?').run(price, req.params.id);
  res.json({ ok: true });
});
```

- [ ] **Step 4: Verify**

Click "定价管理" in sidebar. See all SKUs with cost, price, margin. Click "调价", change price, save.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: pricing management page with inline price editing"
```

---

### Task 5: Order Management Page

**Files:**
- Create: `server/routes/orders.js`
- Modify: `server/index.js`
- Modify: `client/src/pages/Orders.tsx`

- [ ] **Step 1: Create orders API route**

Create `server/routes/orders.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/orders — list orders with optional status filter
router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let query = `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
  `;
  if (status && status !== 'all') {
    query += ` WHERE o.status = '${status}'`;
  }
  query += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(query).all();
  res.json(orders);
});

// GET /api/orders/:id — order detail with items
router.get('/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, c.name, c.phone, c.address
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, s.spec_name, s.spec_value, p.name as product_name
    FROM order_items oi
    JOIN skus s ON s.id = oi.sku_id
    JOIN products p ON p.id = s.product_id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

// PUT /api/orders/:id/status — advance order status
router.put('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  const validNext: Record<string, string[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped'],
    shipped: ['completed'],
  };
  const current = db.prepare('SELECT status FROM orders WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Not found' });
  if (!validNext[current.status]?.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from ${current.status} to ${status}` });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

  // If shipped, create logistics record
  if (status === 'shipped') {
    const carriers = ['顺丰速运', '中通快递'];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const trackNo = 'SF' + String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0');
    db.prepare('INSERT INTO logistics (order_id, carrier, tracking_no, status) VALUES (?, ?, ?, ?)')
      .run(req.params.id, carrier, trackNo, 'picked_up');
  }

  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 2: Mount in server/index.js**

```javascript
const ordersRouter = require('./routes/orders');
app.use('/api/orders', ordersRouter);
```

- [ ] **Step 3: Build Orders page**

Write `client/src/pages/Orders.tsx`:

```tsx
import { useState, useEffect } from 'react';

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  item_count: number;
  created_at: string;
}

interface OrderDetail extends Order {
  name: string;
  phone: string;
  address: string;
  items: Array<{
    id: number;
    product_name: string;
    spec_name: string;
    spec_value: string;
    quantity: number;
    price: number;
  }>;
}

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
];

const STATUS_MAP: Record<string, string> = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  useEffect(() => {
    fetch(`/api/orders?status=${tab}`)
      .then((r) => r.json())
      .then(setOrders);
  }, [tab]);

  const viewDetail = async (id: number) => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setDetail(data);
  };

  const advanceStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    // Refresh
    const res = await fetch(`/api/orders?status=${tab}`);
    setOrders(await res.json());
    setDetail(null);
  };

  // Summary stats
  const todayTotal = orders
    .filter((o) => o.created_at?.startsWith('2026-05-18'))
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">订单管理</h2>
        <span className="text-sm text-gray-500">
          今日销售额: <strong className="text-green-600">¥{todayTotal.toFixed(2)}</strong>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 border w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              'px-4 py-1.5 rounded text-sm transition-colors ' +
              (tab === t.key ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Order list */}
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${detail ? 'w-1/2' : 'w-full'}`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">订单号</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">客户</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">金额</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">商品数</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">时间</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">#{String(o.id).padStart(5, '0')}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3 text-right font-medium">¥{o.total_amount}</td>
                  <td className="px-4 py-3 text-center">{o.item_count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={
                      'inline-block px-2 py-0.5 rounded-full text-xs ' +
                      (o.status === 'completed' ? 'bg-green-100 text-green-700' :
                       o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                       o.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                       o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                       'bg-gray-100 text-gray-500')
                    }>
                      {STATUS_MAP[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.created_at}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => viewDetail(o.id)}
                      className="text-sm text-blue-500 hover:underline mr-2"
                    >
                      详情
                    </button>
                    {o.status === 'pending' && (
                      <button
                        onClick={() => advanceStatus(o.id, 'paid')}
                        className="text-sm bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
                      >
                        确认付款
                      </button>
                    )}
                    {o.status === 'paid' && (
                      <button
                        onClick={() => advanceStatus(o.id, 'shipped')}
                        className="text-sm bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600"
                      >
                        发货
                      </button>
                    )}
                    {o.status === 'shipped' && (
                      <button
                        onClick={() => advanceStatus(o.id, 'completed')}
                        className="text-sm bg-purple-500 text-white px-2 py-0.5 rounded hover:bg-purple-600"
                      >
                        完成
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order detail panel */}
        {detail && (
          <div className="w-1/2 bg-white rounded-lg shadow-sm border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">订单 #{String(detail.id).padStart(5, '0')}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>

            <div className="text-sm space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <p><span className="text-gray-500">客户:</span> {detail.name}</p>
              <p><span className="text-gray-500">手机:</span> {detail.phone}</p>
              <p><span className="text-gray-500">地址:</span> {detail.address}</p>
              <p><span className="text-gray-500">状态:</span> {STATUS_MAP[detail.status]}</p>
            </div>

            <p className="text-sm font-medium text-gray-600 mb-2">商品明细</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-2">商品</th>
                  <th className="text-left py-2">规格</th>
                  <th className="text-right py-2">单价</th>
                  <th className="text-right py-2">数量</th>
                  <th className="text-right py-2">小计</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2 text-gray-500">{item.spec_name}: {item.spec_value}</td>
                    <td className="py-2 text-right">¥{item.price}</td>
                    <td className="py-2 text-right">x{item.quantity}</td>
                    <td className="py-2 text-right font-medium">¥{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-right text-lg font-bold mt-3">
              合计: ¥{detail.total_amount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Click "订单管理". Switch between status tabs. Click "详情" to see order items and address. Click "确认付款" → status changes to paid → then "发货" → then "完成".

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: order management page with status transitions and detail panel"
```

---

### Task 6: Logistics Management Page

**Files:**
- Create: `server/routes/logistics.js`
- Modify: `server/index.js`
- Modify: `client/src/pages/Logistics.tsx`

- [ ] **Step 1: Create logistics API**

Create `server/routes/logistics.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/logistics — list all logistics records
router.get('/', (_req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT l.*, o.id as order_no, o.total_amount, c.name as customer_name
    FROM logistics l
    JOIN orders o ON o.id = l.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    ORDER BY l.updated_at DESC
  `).all();
  res.json(data);
});

// GET /api/logistics/:orderId/timeline — simulated tracking timeline
router.get('/:orderId/timeline', (req, res) => {
  const db = getDb();
  const logi = db.prepare('SELECT * FROM logistics WHERE order_id = ?').get(req.params.orderId);
  if (!logi) return res.json([]);

  const created = logi.updated_at || '2026-05-18 10:00:00';
  const date = new Date(created);
  const nodes = [
    { time: formatDate(date, -6), status: 'picked_up', desc: '快递员已揽件' },
    { time: formatDate(date, -4), status: 'in_transit', desc: '快件已到达【杭州分拣中心】' },
    { time: formatDate(date, -3), status: 'in_transit', desc: '快件已发往【上海中转站】' },
    { time: formatDate(date, -1), status: 'in_transit', desc: '快件已到达【上海中转站】' },
    { time: formatDate(date, 0), status: 'delivering', desc: '快递员正在派送中' },
  ];
  if (logi.status === 'signed') {
    nodes.push({ time: formatDate(date, 2), status: 'signed', desc: '已签收，签收人：本人' });
  }
  res.json(nodes);
});

function formatDate(base: Date, hoursOffset: number) {
  const d = new Date(base.getTime() + hoursOffset * 3600000);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = router;
```

- [ ] **Step 2: Mount in server/index.js**

```javascript
const logisticsRouter = require('./routes/logistics');
app.use('/api/logistics', logisticsRouter);
```

- [ ] **Step 3: Build Logistics page**

Write `client/src/pages/Logistics.tsx`:

```tsx
import { useState, useEffect } from 'react';

interface Logistics {
  id: number;
  order_id: number;
  order_no: number;
  customer_name: string;
  carrier: string;
  tracking_no: string;
  status: string;
  total_amount: number;
  updated_at: string;
}

interface TimelineNode {
  time: string;
  status: string;
  desc: string;
}

const STATUS_MAP: Record<string, string> = {
  picked_up: '已揽件',
  in_transit: '运输中',
  delivering: '派送中',
  signed: '已签收',
};

export default function Logistics() {
  const [list, setList] = useState<Logistics[]>([]);
  const [timeline, setTimeline] = useState<TimelineNode[]>([]);
  const [selected, setSelected] = useState<Logistics | null>(null);

  useEffect(() => {
    fetch('/api/logistics').then((r) => r.json()).then(setList);
  }, []);

  const viewTimeline = async (l: Logistics) => {
    setSelected(l);
    const res = await fetch(`/api/logistics/${l.order_id}/timeline`);
    setTimeline(await res.json());
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">物流管理</h2>

      <div className="flex gap-4">
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${selected ? 'w-1/2' : 'w-full'}`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">订单号</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">客户</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">快递公司</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">运单号</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">状态</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">#{String(l.order_no).padStart(5, '0')}</td>
                  <td className="px-4 py-3">{l.customer_name}</td>
                  <td className="px-4 py-3">{l.carrier}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.tracking_no}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={
                      'inline-block px-2 py-0.5 rounded-full text-xs ' +
                      (l.status === 'signed' ? 'bg-green-100 text-green-700' :
                       l.status === 'delivering' ? 'bg-blue-100 text-blue-700' :
                       'bg-yellow-100 text-yellow-700')
                    }>
                      {STATUS_MAP[l.status] || l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => viewTimeline(l)}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      查看轨迹
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timeline panel */}
        {selected && (
          <div className="w-1/2 bg-white rounded-lg shadow-sm border p-5">
            <h3 className="font-bold text-lg mb-1">物流轨迹</h3>
            <p className="text-sm text-gray-500 mb-4">
              {selected.carrier} · {selected.tracking_no}
            </p>

            <div className="relative pl-6">
              {timeline.map((node, i) => (
                <div key={i} className="relative pb-6 last:pb-0">
                  {/* Line */}
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[-17px] top-3 w-0.5 h-full bg-blue-200" />
                  )}
                  {/* Dot */}
                  <div className={
                    'absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full border-2 ' +
                    (node.status === 'signed' ? 'bg-green-500 border-green-500' :
                     i === timeline.length - 1 ? 'bg-blue-500 border-blue-500' :
                     'bg-white border-blue-300')
                  } />
                  <p className="text-sm font-medium">{node.desc}</p>
                  <p className="text-xs text-gray-400">{node.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Click "物流管理". See all shipped orders with carriers and tracking numbers. Click "查看轨迹" to see the timeline.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: logistics tracking page with timeline visualization"
```

---

### Task 7: Marketing Center Page

**Files:**
- Create: `server/routes/marketing.js`
- Modify: `server/index.js`
- Modify: `client/src/pages/Marketing.tsx`

- [ ] **Step 1: Create marketing API**

Create `server/routes/marketing.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/coupons
router.get('/', (_req, res) => {
  const db = getDb();
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id').all();
  res.json(coupons);
});

// POST /api/coupons
router.post('/', (req, res) => {
  const db = getDb();
  const { name, type, threshold, discount, quantity, valid_from, valid_to } = req.body;
  const result = db.prepare(
    'INSERT INTO coupons (name, type, threshold, discount, quantity, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, type, threshold || 0, discount, quantity || 100, valid_from, valid_to);
  res.json({ id: result.lastInsertRowid });
});

// PUT /api/coupons/:id/toggle
router.put('/:id/toggle', (req, res) => {
  const db = getDb();
  const coupon = db.prepare('SELECT status FROM coupons WHERE id = ?').get(req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Not found' });
  const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE coupons SET status = ? WHERE id = ?').run(newStatus, req.params.id);
  res.json({ status: newStatus });
});

module.exports = router;
```

- [ ] **Step 2: Mount in server/index.js**

```javascript
const marketingRouter = require('./routes/marketing');
app.use('/api/coupons', marketingRouter);
```

- [ ] **Step 3: Build Marketing page**

Write `client/src/pages/Marketing.tsx`:

```tsx
import { useState, useEffect } from 'react';

interface Coupon {
  id: number;
  name: string;
  type: string;
  threshold: number;
  discount: number;
  quantity: number;
  used: number;
  valid_from: string;
  valid_to: string;
  status: string;
}

const TYPE_MAP: Record<string, string> = {
  threshold: '满减券',
  percent: '折扣券',
  free_shipping: '免邮券',
};

export default function Marketing() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'threshold', threshold: '99', discount: '20',
    quantity: '100', valid_from: '2026-05-18', valid_to: '2026-06-30',
  });

  useEffect(() => {
    fetch('/api/coupons').then((r) => r.json()).then(setCoupons);
  }, []);

  const createCoupon = async () => {
    await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        threshold: parseFloat(form.threshold) || 0,
        discount: parseFloat(form.discount),
        quantity: parseInt(form.quantity),
      }),
    });
    setShowForm(false);
    const res = await fetch('/api/coupons');
    setCoupons(await res.json());
  };

  const toggleStatus = async (id: number) => {
    await fetch(`/api/coupons/${id}/toggle`, { method: 'PUT' });
    const res = await fetch('/api/coupons');
    setCoupons(await res.json());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">营销中心</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          {showForm ? '取消' : '+ 新建优惠券'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
          <h3 className="font-bold mb-4">新建优惠券</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">名称</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full border rounded px-3 py-2" placeholder="如：618满减券" />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">类型</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full border rounded px-3 py-2">
                <option value="threshold">满减券</option>
                <option value="percent">折扣券</option>
                <option value="free_shipping">免邮券</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">门槛金额 (¥)</label>
              <input type="number" value={form.threshold} onChange={(e) => setForm({...form, threshold: e.target.value})}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">{form.type === 'percent' ? '折扣力度(%)' : '优惠金额 (¥)'}</label>
              <input type="number" value={form.discount} onChange={(e) => setForm({...form, discount: e.target.value})}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">发放数量</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-gray-600 mb-1">开始日期</label>
                <input type="date" value={form.valid_from} onChange={(e) => setForm({...form, valid_from: e.target.value})}
                  className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex-1">
                <label className="block text-gray-600 mb-1">结束日期</label>
                <input type="date" value={form.valid_to} onChange={(e) => setForm({...form, valid_to: e.target.value})}
                  className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          </div>
          <button onClick={createCoupon}
            className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-600">
            创建优惠券
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-lg shadow-sm border p-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg">{c.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {TYPE_MAP[c.type] || c.type}
                </span>
              </div>
              <button
                onClick={() => toggleStatus(c.id)}
                className={
                  'text-xs px-3 py-1 rounded ' +
                  (c.status === 'active'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                }
              >
                {c.status === 'active' ? '生效中' : '已停用'}
              </button>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {c.type === 'threshold' && <p>满 ¥{c.threshold} 减 ¥{c.discount}</p>}
              {c.type === 'percent' && <p>满 ¥{c.threshold} 打 {100 - c.discount} 折</p>}
              {c.type === 'free_shipping' && <p>免邮费</p>}
              <p>有效期: {c.valid_from} 至 {c.valid_to}</p>
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-gray-500">已领取: {c.used} / {c.quantity}</span>
              <span>使用率: {c.quantity > 0 ? Math.round(c.used / c.quantity * 100) : 0}%</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${c.quantity > 0 ? Math.round(c.used / c.quantity * 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Click "营销中心". See existing coupons. Create a new coupon via the form. Toggle status on/off.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: marketing center with coupon creation and management"
```

---

### Task 8: Dashboard + Analytics Pages

**Files:**
- Create: `server/routes/dashboard.js`
- Create: `server/routes/analytics.js`
- Modify: `server/index.js`
- Modify: `client/src/pages/Dashboard.tsx`
- Modify: `client/src/pages/Analytics.tsx`

- [ ] **Step 1: Create dashboard API**

Create `server/routes/dashboard.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (_req, res) => {
  const db = getDb();

  const today = db.prepare(`
    SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as sales
    FROM orders WHERE date(created_at) = date('now', 'localtime')
  `).get();

  const activeProducts = db.prepare(
    "SELECT COUNT(*) as count FROM products WHERE status = 'active'"
  ).get();

  const avgOrder = db.prepare(
    "SELECT ROUND(COALESCE(AVG(total_amount), 0), 2) as avg_val FROM orders"
  ).get();

  const trend = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as orders, SUM(total_amount) as sales
    FROM orders
    WHERE created_at >= date('now', '-7 days', 'localtime')
    GROUP BY date(created_at)
    ORDER BY day
  `).all();

  const categorySales = db.prepare(`
    SELECT c.name, COALESCE(SUM(oi.price * oi.quantity), 0) as total
    FROM order_items oi
    JOIN skus s ON s.id = oi.sku_id
    JOIN products p ON p.id = s.product_id
    JOIN categories c ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY total DESC
  `).all();

  const recent = db.prepare(`
    SELECT o.id, o.total_amount, o.status, o.created_at, c.name as customer_name
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();

  res.json({
    today: { ...today, avg_order: avgOrder.avg_val, active_products: activeProducts.count },
    trend,
    categorySales,
    recentOrders: recent,
  });
});

module.exports = router;
```

- [ ] **Step 2: Create analytics API**

Create `server/routes/analytics.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (_req, res) => {
  const db = getDb();

  const topProducts = db.prepare(`
    SELECT p.name, COUNT(oi.id) as sold, SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN skus s ON s.id = oi.sku_id
    JOIN products p ON p.id = s.product_id
    GROUP BY p.id ORDER BY sold DESC LIMIT 10
  `).all();

  const dailyTrend = db.prepare(`
    SELECT date(created_at) as day,
      COUNT(*) as orders,
      SUM(total_amount) as gmv,
      ROUND(AVG(total_amount), 2) as avg_order
    FROM orders
    WHERE created_at >= date('now', '-30 days', 'localtime')
    GROUP BY date(created_at)
    ORDER BY day
  `).all();

  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const completedOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'completed'").get().c;
  const returnOrders = db.prepare("SELECT COUNT(*) as c FROM after_sales WHERE type = 'return'").get().c;

  res.json({
    topProducts,
    dailyTrend,
    metrics: {
      totalOrders,
      completionRate: totalOrders > 0 ? Math.round(completedOrders / totalOrders * 1000) / 10 : 0,
      returnRate: totalOrders > 0 ? Math.round(returnOrders / totalOrders * 1000) / 10 : 0,
    },
  });
});

module.exports = router;
```

- [ ] **Step 3: Mount routes in server/index.js**

```javascript
const dashboardRouter = require('./routes/dashboard');
const analyticsRouter = require('./routes/analytics');
app.use('/api/dashboard', dashboardRouter);
app.use('/api/analytics', analyticsRouter);
```

- [ ] **Step 4: Build Dashboard page with Recharts**

Write `client/src/pages/Dashboard.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/MetricCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">总览看板</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard title="今日销售额" value={`¥${data.today.sales.toFixed(2)}`} subtitle={`${data.today.order_count} 笔订单`} />
        <MetricCard title="今日订单数" value={data.today.order_count} subtitle="较昨日持平" />
        <MetricCard title="平均客单价" value={`¥${data.today.avg_order}`} subtitle="全周期平均" />
        <MetricCard title="在售商品" value={data.today.active_products} subtitle="个 SPU" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Sales trend */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-bold text-gray-700 mb-4">近 7 天销售额趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="销售额" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-bold text-gray-700 mb-4">各品类销售占比</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.categorySales} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.categorySales.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <h3 className="font-bold text-gray-700 px-5 pt-5 pb-3">最新订单</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-2 text-gray-500 font-medium">订单号</th>
              <th className="text-left px-5 py-2 text-gray-500 font-medium">客户</th>
              <th className="text-right px-5 py-2 text-gray-500 font-medium">金额</th>
              <th className="text-center px-5 py-2 text-gray-500 font-medium">状态</th>
              <th className="text-left px-5 py-2 text-gray-500 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((o: any) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-5 py-2.5 font-mono text-xs">#{String(o.id).padStart(5, '0')}</td>
                <td className="px-5 py-2.5">{o.customer_name}</td>
                <td className="px-5 py-2.5 text-right">¥{o.total_amount}</td>
                <td className="px-5 py-2.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                    o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-gray-500 text-xs">{o.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Build Analytics page**

Write `client/src/pages/Analytics.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">数据分析</h2>

      {/* Health metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <p className="text-sm text-gray-500">总订单数</p>
          <p className="text-3xl font-bold mt-1">{data.metrics.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <p className="text-sm text-gray-500">订单完成率</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{data.metrics.completionRate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <p className="text-sm text-gray-500">退货率</p>
          <p className="text-3xl font-bold mt-1 text-orange-600">{data.metrics.returnRate}%</p>
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
        <h3 className="font-bold text-gray-700 mb-4">近 30 天 GMV 与订单趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="gmv" stroke="#3b82f6" strokeWidth={2} name="GMV (¥)" />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="订单数" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 products */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h3 className="font-bold text-gray-700 mb-4">Top 10 热销商品</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.topProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="sold" fill="#3b82f6" name="销量" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Dashboard: See 4 metric cards, 7-day trend chart, category pie chart, recent orders.
Analytics: See health metrics, 30-day trend, top 10 bar chart.

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "feat: dashboard with charts and analytics page"
```

---

## Final Verification

- [ ] `npm run dev` starts both servers
- [ ] All 7 pages load and display data
- [ ] Product page: expand SKUs, search
- [ ] Pricing page: inline price edit
- [ ] Order page: status transitions (paid → shipped → completed)
- [ ] Logistics page: tracking timeline
- [ ] Marketing page: create/toggle coupons
- [ ] Dashboard: charts render
- [ ] Analytics: charts render
