@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [AI HOT Weekly]
node "%~dp0fetch-weekly.js"
echo.
echo [HN + arXiv supplement]
node "%~dp0fetch-supplement.js"
