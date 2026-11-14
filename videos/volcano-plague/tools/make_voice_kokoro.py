import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
d, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
LINES = [
 "A lost volcano may have helped bring the Black Death to Europe.",
 "Through the grain meant to save them.",
 "In some regions, up to sixty percent died.",
 "Yet some big cities may have been spared. Why?",
 "Clue one: ice cores.",
 "Around thirteen forty-five, a spike of sulphur.",
 "An eruption, or series of eruptions.",
 "Clue two: pale blue rings in Pyrenees trees.",
 "Cold, wet summers.",
 "And writers saw strange clouds, and dark eclipses of the Moon.",
 "Crops could have failed across the Mediterranean.",
 "So in thirteen forty-seven, Venice, Genoa and Pisa imported grain from the Black Sea.",
 "Food for the hungry. And that may have been the problem.",
 "Less than two months after the last grain ships,",
 "Venice reported its first plague cases.",
 "The ships most likely carried fleas, feeding on grain dust.",
 "Milan and Rome apparently did not need grain imports after thirteen forty-five.",
 "They were most probably not affected.",
 "Nobody knows which volcano it was. And some historians are cautious.",
 "Your city is starving. Grain ships arrive. Nobody knows they carry plague. Open the port?",
 "And Europe's plague may have begun under a Moon like this.",
]
style = k.get_voice_style("bm_george"); sr = 24000; chunks = []; t = 0.25; meta = []
chunks.append(np.zeros(int(0.25 * sr), dtype=np.float32))
for i, line in enumerate(LINES):
    a, sr = k.create(line, voice=style, speed=1.08, lang="en-gb")
    # trim leading/trailing near-silence
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 240): idx[-1] + 480] if len(idx) else a
    meta.append({"line": line, "t0": round(t, 3), "t1": round(t + len(a) / sr, 3)})
    chunks.append(a.astype(np.float32)); t += len(a) / sr
    gap = 0.28; chunks.append(np.zeros(int(gap * sr), dtype=np.float32)); t += gap
sf.write(f"{out}/vo_raw.wav", np.concatenate(chunks), sr)
json.dump(meta, open(f"{out}/vo_lines.json", "w"), indent=1); print(round(t, 2), "s total")
