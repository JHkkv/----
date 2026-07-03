@echo off
chcp 65001 >nul
echo ========================================
echo    Edge 浏览器一键修复工具
echo ========================================
echo.

:: Kill all Edge processes
echo [1/3] 终止旧的 Edge 进程...
taskkill /F /IM msedge.exe >nul 2>&1
taskkill /F /IM EdgeGameAssist.exe >nul 2>&1
echo       完成

:: Clear GPU cache (common cause of Edge launch failure)
echo [2/3] 清理 GPU 缓存...
rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\ShaderCache" >nul 2>&1
rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\GrShaderCache" >nul 2>&1
echo       完成

:: Restart Edge normally, fallback to safe flags
echo [3/3] 启动 Edge...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

:: Wait and check if it launched
timeout /t 3 /nobreak >nul
tasklist /FI "IMAGENAME eq msedge.exe" 2>nul | find /I "msedge.exe" >nul
if %errorlevel% equ 0 (
    echo       Edge 启动成功！
) else (
    echo       普通启动失败，尝试安全模式...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --disable-features=RendererCodeIntegrity
    echo       Edge 安全模式启动完成
)

echo.
echo ========================================
echo    修复完成，请检查 Edge 窗口
echo ========================================
pause
