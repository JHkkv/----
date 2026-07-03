@echo off
chcp 65001 >nul
echo [AI HOT]
node "f:\测试工具\AI公众号\scripts\fetch-daily.js"
echo.
echo [多源补充 HN + arXiv]
node "f:\测试工具\AI公众号\scripts\fetch-supplement.js"
