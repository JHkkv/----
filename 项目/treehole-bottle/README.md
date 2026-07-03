# 🌊 树洞漂流瓶

把你的不开心送走——匿名情绪漂流瓶社区。

## 功能

- 🍾 **漂流瓶**：写下心事投入大海，打捞他人的瓶子
- 🧠 **渐进式 MBTI**：每次 2-3 题，越用越懂你，匹配心境相似的人
- 🌙 **深海夜光美学**：明月、星空、海面漂流的温暖治愈画面
- 🔒 **安全空间**：评论仅瓶主可见，双重确认投出

## 技术栈

- Next.js 14 (App Router) · React 18 · TypeScript
- Framer Motion · Tailwind CSS
- Prisma · PostgreSQL
- Claude API (AI 情绪分析)

## 快速开始

### 方式一：一键启动（推荐）

```bash
# Windows 用户直接双击运行
setup.bat

# 或者使用 Docker 启动数据库 + 手动启动
docker compose up -d    # 启动 PostgreSQL
npm run setup           # 安装依赖 + 初始化数据库
npm run dev             # http://localhost:3000
```

### 方式二：手动启动

```bash
npm install
cp .env.example .env    # 数据库默认匹配 docker-compose
docker compose up -d    # 启动 PostgreSQL（或用你自己的）
npx prisma migrate dev
npm run dev             # http://localhost:3000
```

## 部署 (Vercel)

1. Fork/导入仓库到 GitHub
2. 在 Vercel 创建项目，导入仓库
3. 设置环境变量 DATABASE_URL
4. 部署

## 项目结构

```
src/
├── app/           # Next.js App Router 页面 + API
│   ├── api/       # REST API 路由
│   ├── mbti/      # MBTI 渐进答题页
│   └── mbti-direct/ # 直接选择 MBTI
├── components/    # React 组件
├── lib/           # 工具库 (prisma, auth, mbti)
└── types/         # TypeScript 类型
```
