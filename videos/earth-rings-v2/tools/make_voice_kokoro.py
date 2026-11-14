import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
d, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
LINES = [
 "466 million years ago, Earth may have worn a ring like Saturn. And what it did next is even stranger.",
 "Scientists found clues a ring could have left behind, in the rocks.",
 "In 2024, a Monash University team worked out where twenty-one craters from that period sat back then. Every single one landed within thirty degrees of the equator, even though only about thirty percent of the stable crust was near the equator.",
 "The odds of that by chance: about one in twenty-five million.",
 "The idea: a rubble-pile asteroid flew inside Earth's Roche limit, and gravity tore it into a ring.",
 "For millions of years, chunks may have fallen out of that ring, which could explain the craters.",
 "Here's the twist: the ring may have shaded the tropics. Millions of years later, Earth plunged into one of its coldest periods in 500 million years.",
 "It's still a hypothesis, and some scientists say the evidence isn't enough yet.",
 "Look up tonight and picture a silver arch. Earth might have had one. Proof, or coincidence?",
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
