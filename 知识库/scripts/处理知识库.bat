@echo off
chcp 65001 >nul
cd /d "f:\测试工具\知识库"
echo ================================
echo   知识库处理工具
echo ================================
echo.
node scripts\process-kb.js
echo.
echo 按任意键退出...
pause >nul
