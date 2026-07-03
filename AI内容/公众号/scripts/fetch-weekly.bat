@echo off
chcp 65001 >nul
echo [AI HOT 全量]
node "f:\测试工具\AI公众号\scripts\fetch-weekly.js"
echo.
echo [多源补充 HN + arXiv]
node "f:\测试工具\AI公众号\scripts\fetch-supplement.js" "f:\测试工具\AI公众号\周报"
