# E-Commerce Operations System Design

**Date:** 2026-05-18
**Goal:** Build a complete e-commerce operations workflow system for learning purposes.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite + Tailwind CSS | Fast dev, modern, easy to understand |
| Backend | Express.js (Node.js) | Unified JS across frontend and backend |
| Database | SQLite (better-sqlite3) | Zero install, file-based, real SQL |
| Charts | Recharts | Most popular React charting library |

## Architecture

```
Browser (React SPA)
    ↓ HTTP requests (REST API)
Express Server (routes/ → business logic)
    ↓ SQL queries
SQLite Database (ecommerce.db file)
```

## Project Structure

```
ecommerce-ops/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # 7 module pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.tsx
│   └── index.html
├── server/                 # Express backend
│   ├── routes/             # API routes per module
│   ├── database.js         # SQLite connection & seed data
│   └── index.js            # Entry point
└── package.json
```

## Database Schema (8 Tables)

1. **categories** — Product categories (name, parent_id)
2. **products** — SPU (name, description, category_id, main_image, status)
3. **skus** — SKU (product_id, spec_name, spec_value, price, cost, stock)
4. **customers** — Users (name, phone, address)
5. **orders** — Orders (customer_id, status, total_amount, created_at)
6. **order_items** — Order line items (order_id, sku_id, quantity, price)
7. **logistics** — Logistics tracking (order_id, carrier, tracking_no, status)
8. **after_sales** — Returns/refunds (order_id, type, reason, status, amount)

## Modules (7 Pages + Sidebar Navigation)

### 1. Dashboard (总览看板)
- 4 metric cards: today's sales, order count, avg order value, active products
- 7-day sales trend line chart
- Category sales pie chart
- Latest 10 orders table

### 2. Product Management (商品管理)
- Product table with expandable SKU details
- New product form
- Search + category filter
- Concepts: SPU vs SKU, categories

### 3. Pricing Management (定价管理)
- SKU price grid (cost, original, promo price, margin %)
- Batch price adjustment
- Price change history
- Concepts: cost, margin, markup rate

### 4. Order Management (订单管理)
- Order list with status tabs: All / Pending Pay / Paid / Shipped / Done
- Order detail expansion (items, address)
- Action buttons: confirm payment → ship → mark complete
- Concepts: order lifecycle, GMV, avg order value

### 5. Logistics Management (物流管理)
- Shipped orders logistics tracking list
- Per-order tracking timeline (picked up → in transit → delivering → signed)
- Concepts: tracking number, carrier, logistics nodes

### 6. Marketing Center (营销中心)
- Coupon management (threshold, discount, validity, quantity)
- Active/inactive coupon list
- New coupon form
- Concepts: coupon types, threshold discounts

### 7. Data Analytics (数据分析)
- Date range picker
- Core metrics trend: GMV, orders, avg order value
- Top 10 hot products ranking
- Health metrics: repurchase rate, return rate
- Concepts: conversion rate, retention, repurchase rate

## Seed Data Strategy

- Shop theme: 3C digital accessories (phone cases, chargers, cables, earphones, stands, screen protectors)
- 6 categories, ~20 SPUs, ~50 SKUs
- ~100 simulated customers
- ~200 orders over 30 days
- All data randomly generated

## Build Order (7 Steps)

1. Project scaffold + navigation + database init
2. Product management page
3. Pricing management page
4. Order management page (core flow)
5. Logistics management page
6. Marketing center page
7. Dashboard + analytics page
