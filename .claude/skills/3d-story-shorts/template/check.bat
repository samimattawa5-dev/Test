@echo off
cd /d "%~dp0"
if not exist out mkdir out
node render.mjs --check > out\check_log.txt 2>&1
type out\check_log.txt
pause
