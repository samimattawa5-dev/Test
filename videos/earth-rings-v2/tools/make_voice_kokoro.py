import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
d, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
LINES = [
 "466 million years ago, Earth may have worn a ring like Saturn, and it may have helped freeze the planet.",
 "Nobody saw it. Scientists found clues a ring could have left behind, in the rocks.",
 "In 2024, a team at Monash University mapped twenty-one impact craters, all from the same slice of time: the Ordovician period.",
 "Then they rewound plate tectonics, to see where each continent sat back then.",
 "Every single crater landed within thirty degrees of the equator.",
 "But only about a third of the land was near the equator. Random space rocks would have hit everywhere.",
 "The odds of this pattern by chance: about one in twenty-five million.",
 "So here's the idea. A big rubble-pile asteroid passed too close to Earth.",
 "Within about three thousand one hundred kilometres of the surface, Earth's gravity pulls harder on the near side of a rock than the far side. That's called the Roche limit.",
 "The asteroid was torn apart, and the pieces spread into a ring around the equator.",
 "For millions of years, chunks fell out of that ring, which may be why the craters line up. Rocks from that time are full of meteorite debris.",
 "Here's the twist: the ring may have lasted around forty million years, and cast a shadow over the tropics.",
 "Millions of years later, Earth plunged into one of its coldest periods in 500 million years.",
 "Did a ring help freeze the planet? It's still a hypothesis, and some scientists say the evidence isn't enough yet.",
 "Look up tonight and picture a silver arch across the sky. Earth might have had one. Proof, or a one-in-twenty-five-million coincidence? Tell me below.",
]
style = k.get_voice_style("bm_george"); sr = 24000; chunks = []; t = 0.25; meta = []
chunks.append(np.zeros(int(0.25 * sr), dtype=np.float32))
for i, line in enumerate(LINES):
    a, sr = k.create(line, voice=style, speed=1.2, lang="en-gb")
    # trim leading/trailing near-silence
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 240): idx[-1] + 480] if len(idx) else a
    meta.append({"line": line, "t0": round(t, 3), "t1": round(t + len(a) / sr, 3)})
    chunks.append(a.astype(np.float32)); t += len(a) / sr
    gap = 0.28; chunks.append(np.zeros(int(gap * sr), dtype=np.float32)); t += gap
sf.write(f"{out}/vo_raw.wav", np.concatenate(chunks), sr)
json.dump(meta, open(f"{out}/vo_lines.json", "w"), indent=1); print(round(t, 2), "s total")
