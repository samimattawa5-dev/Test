#!/usr/bin/env bash
# Free pipeline: Blender (bpy, CPU Cycles) + Kokoro TTS (Apache-2.0) + FFmpeg. No paid services.
set -e
D="${1:-$HOME/whatif-env}"; mkdir -p "$D/voices"
python3 -m venv "$D/venv"
"$D/venv/bin/pip" install -q bpy kokoro-onnx soundfile numpy
R=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f "$D/voices/kokoro-v1.0.onnx" ] || curl -L -o "$D/voices/kokoro-v1.0.onnx" $R/kokoro-v1.0.onnx
[ -f "$D/voices/voices-v1.0.bin" ] || curl -L -o "$D/voices/voices-v1.0.bin" $R/voices-v1.0.bin
echo "ok: $D"
