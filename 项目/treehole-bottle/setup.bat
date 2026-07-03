@echo off
chcp 65001 >nul
title 🌊 树洞漂流瓶 - 一键启动

echo.
echo    🌊 树洞漂流瓶 — 一键启动
echo    ════════════════════════════
echo.

:: 1. 检查 .env
if not exist .env (
    echo [1/4] 创建 .env 配置文件...
    copy .env.example .env >nul
    echo   ✅ .env 已创建（默认使用本地 PostgreSQL）
) else (
    echo [1/4] ✅ .env 已存在，跳过
)

:: 2. 检查 node_modules
if not exist node_modules (
    echo [2/4] 安装依赖...
    call npm install
) else (
    echo [2/4] ✅ 依赖已安装
)

:: 3. Prisma
echo [3/4] 生成 Prisma Client + 数据库迁移...
call npx prisma generate
call npx prisma migrate dev --name init 2>nul || echo   ⚠️ 迁移跳过（数据库可能未就绪，不影响启动）

:: 4. 启动
echo [4/4] 启动开发服务器...
echo.
echo    🌊 打开浏览器访问: http://localhost:3000
echo.
call npm run dev
