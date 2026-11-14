#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
echo "[1/4] Installing tools (first time only)..."
npm install --no-audit --no-fund || exit 1
npx playwright install chromium || exit 1
echo "[2/4] Checking story..."
node render.mjs --check || exit 1
echo "[3/4] Rendering..."
node render.mjs || { echo "RENDER FAILED - see out/check_log.txt"; exit 1; }
echo "DONE - your video is final.mp4 in this folder"
