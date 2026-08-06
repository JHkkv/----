@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [AI HOT]
node "%~dp0fetch-daily.js"
echo.
echo [HN + arXiv supplement]
node "%~dp0fetch-supplement.js"
