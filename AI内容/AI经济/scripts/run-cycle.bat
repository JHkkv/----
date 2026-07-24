@echo off
chcp 65001 >nul
echo ========================================
echo   AI+经济 信息采集系统 - 单轮完整执行
echo ========================================
echo.

set BASE=f:/测试工具/AI内容/AI经济/scripts

echo [1/5] 国内数据采集...
node "%BASE%/fetch-domestic.js"
echo.

echo [2/5] 国外数据采集...
node "%BASE%/fetch-international.js"
echo.

echo [3/5] 经济指标采集...
node "%BASE%/fetch-economic-indicators.js"
echo.

echo [4/5] 合并汇报生成...
node "%BASE%/merge-report.js"
echo.

echo [5/5] Git自动推送...
node "%BASE%/auto-push.js"
echo.

echo ========================================
echo   采集流程完成
echo ========================================
pause
