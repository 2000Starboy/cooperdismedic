@echo off
REM ============================================================================
REM setup-scheduled-task.bat — Setup Windows Task Scheduler for API Service
REM ============================================================================
REM This batch file creates a Windows scheduled task to run the API server
REM automatically at system startup

echo.
echo ============================================================================
echo SETUP: Cooper Dismedic API Service - Windows Task Scheduler
echo ============================================================================
echo.

REM Get the project root directory
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"

echo Project Root: %PROJECT_ROOT%
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo To run as Administrator:
    echo 1. Right-click Command Prompt or PowerShell
    echo 2. Select "Run as Administrator"
    echo 3. Navigate to: %PROJECT_ROOT%\scripts
    echo 4. Run: setup-scheduled-task.bat
    echo.
    pause
    exit /b 1
)

echo ✓ Running as Administrator
echo.

REM Create scheduled task to run API server at system startup
echo Creating scheduled task "CooperDismedic-API-Service"...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "SchTasks.exe /Create /TN ""CooperDismedic-API-Service"" /TR ""cmd.exe /c cd /d %PROJECT_ROOT% && npm run api"" /SC ONSTART /RU SYSTEM /F"

if %errorLevel% equ 0 (
    echo.
    echo ✅ SUCCESS: Scheduled task created successfully!
    echo.
    echo Task Details:
    echo   • Name: CooperDismedic-API-Service
    echo   • Trigger: System Startup
    echo   • Action: npm run api (Products API Server)
    echo   • User: SYSTEM
    echo.
    echo The API server will now:
    echo   1. Start automatically when Windows boots
    echo   2. Run in the background
    echo   3. Execute daily synchronization at 03:00 AM
    echo.
    echo To verify the task was created:
    echo   • Open: Task Scheduler (search "Task Scheduler" in Windows)
    echo   • Look for: CooperDismedic-API-Service under "Task Scheduler Library"
    echo.
) else (
    echo.
    echo ❌ ERROR: Failed to create scheduled task
    echo.
    echo Troubleshooting:
    echo 1. Make sure you're running as Administrator
    echo 2. Check that npm is installed and in PATH
    echo 3. Check that Node.js is installed
    echo.
)

pause
