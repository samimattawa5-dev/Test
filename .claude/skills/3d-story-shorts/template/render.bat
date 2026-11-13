@echo off
cd /d "%~dp0"
echo [1/4] Installing tools (first time only)...
call npm install --no-audit --no-fund || goto fail
call npx playwright install chromium || goto fail
echo [2/4] Checking story...
node render.mjs --check || goto fail
echo [3/4] Rendering...
node render.mjs || goto fail
echo DONE - your video is final.mp4 in this folder
pause
exit /b 0
:fail
echo RENDER FAILED - see out\check_log.txt
pause
exit /b 1
