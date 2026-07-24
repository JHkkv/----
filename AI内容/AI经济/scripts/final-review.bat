@echo off
chcp 65001 >nul
echo ========================================
echo   AI+经济 30天复盘报告生成
echo ========================================
echo.

node "f:/测试工具/AI内容/AI经济/scripts/final-review.js"

echo.
echo ========================================
echo   复盘报告已生成, 请查看:
echo   f:/测试工具/AI内容/AI经济/reports/FINAL-REVIEW.md
echo ========================================
pause
