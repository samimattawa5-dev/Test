"""Original music + SFX bed for a story Short, ducked under the voice.

Usage: python3 tools/make_bed.py story.json voiceover.wav bed.wav [--mood wonder|tense|playful]
Needs numpy. Writes a 48 kHz stereo WAV the length of the voiceover.
Music: chord pad + plucked arpeggio + sub bass + soft drums, sections follow the shots.
SFX: whoosh on every cut, boom on every shot "kicks" time, shimmer on shots with "shimmer": true.
"""
import json, os, sys, wave, subprocess
import numpy as np

SFX_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx")  # real CC0 sounds (see sfx/CREDITS.txt)

SR = 48000
rng = np.random.default_rng(7)

MOODS = {  # (bpm, root midi, chord progression as semitone offsets of triads)
    "wonder":  (92, 57, [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]]),   # Am F C G
    "tense":   (100, 52, [[0, 3, 7], [1, 5, 8], [0, 3, 7], [-2, 2, 5]]),
    "playful": (112, 60, [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]]),
}

def read_wav(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a=0.01, d=0.2, s=0.6, r=0.3):
    t = np.arange(n) / SR; dur = n / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((dur - t) / r, 0, 1)
    return e * rel

def pad(freqs, n):
    t = np.arange(n) / SR; out = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):  # detuned partials, soft harmonics
            ff = f * 2 ** (det / 12)
            out += np.sin(2 * np.pi * ff * t) + 0.35 * np.sin(2 * np.pi * 2 * ff * t) + 0.12 * np.sin(2 * np.pi * 3 * ff * t)
    return out / (len(freqs) * 3 * 1.5) * env_adsr(n, a=0.6, d=0.5, s=0.85, r=0.8)

def pluck(f, n):
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.1 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 6) * 0.5

def bass(f, n):
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env_adsr(n, a=0.02, d=0.3, s=0.7, r=0.15)

def kick(n=int(0.35 * SR)):
    t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)

def hat(n=int(0.06 * SR)):
    x = rng.standard_normal(n); x = np.diff(x, prepend=0)  # crude high-pass
    return x * np.exp(-np.arange(n) / SR * 60) * 0.25

def whoosh(n=int(0.45 * SR)):
    x = rng.standard_normal(n); t = np.linspace(0, 1, n)
    # sweep a one-pole low-pass cutoff up then down
    cut = 0.02 + 0.25 * np.sin(np.pi * t) ** 2; y = np.zeros(n); acc = 0.0
    for i in range(n): acc += cut[i] * (x[i] - acc); y[i] = acc
    return y * np.sin(np.pi * t) ** 1.5 * 2.2

def boom(n=int(1.2 * SR)):
    t = np.arange(n) / SR; f = 35 + 60 * np.exp(-t * 6)
    low = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5)
    nz = rng.standard_normal(n) * np.exp(-t * 18) * 0.3
    return low + nz

def shimmer(n=int(1.6 * SR), base=88):
    out = np.zeros(n); t = np.arange(n) / SR
    for i, m in enumerate([0, 7, 12, 16, 19, 24]):
        start = int(i * 0.07 * SR); k = n - start
        out[start:] += np.sin(2 * np.pi * hz(base + m) * t[:k]) * np.exp(-t[:k] * 2.5) * 0.18
    return out

def add(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= buf.shape[1] or i + len(x) <= 0: return
    j = min(buf.shape[1], i + len(x)); x = x[: j - i]
    buf[0, i:j] += x * gain * np.sqrt(0.5 * (1 - pan)); buf[1, i:j] += x * gain * np.sqrt(0.5 * (1 + pan))

def main():
    story = json.load(open(sys.argv[1])); voice = read_wav(sys.argv[2]); out = sys.argv[3]
    PRESET_MOOD = {"science-explainer": "wonder", "mystery": "tense", "collage-history": "playful", "money-explainer": "tense", "kids-cartoon": "playful"}
    mood = sys.argv[sys.argv.index("--mood") + 1] if "--mood" in sys.argv else story.get("mood") or PRESET_MOOD.get(story.get("preset"), "wonder")
    bpm, root, prog = MOODS[mood]
    N = len(voice); dur = N / SR
    music = np.zeros((2, N)); sfx = np.zeros((2, N))
    beat = 60 / bpm; bar = 4 * beat
    shots = story["shots"]
    # energy per shot: quiet hook, build, drop at the twist (shot with "drop": true), swell at the end
    def energy(t):
        for s in shots:
            if s["start"] <= t < s["end"]:
                if s.get("drop"): return 0
                return s.get("energy", 2)
        return 1
    nbars = int(np.ceil(dur / bar)) + 1
    for b in range(nbars):
        t0 = b * bar; chord = prog[b % len(prog)]; e = energy(t0 + 0.01)
        n = int(bar * SR) + int(0.8 * SR)
        add(music, pad([hz(root + c) for c in chord], n), t0, 0.55, -0.2)
        add(music, pad([hz(root + 12 + chord[0])], n), t0, 0.25, 0.3)
        if e >= 1:
            add(music, bass(hz(root - 12 + chord[0]), int(bar * SR)), t0, 0.5)
            for k in range(8):  # eighth-note arpeggio
                m = root + 12 + chord[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if k == 6 else 0)
                add(music, pluck(hz(m), int(0.6 * SR)), t0 + k * beat / 2, 0.22, -0.4 + 0.1 * k)
        if e >= 2:
            for k in (0, 2): add(music, kick(), t0 + k * beat, 0.55)
            for k in range(8): add(music, hat(), t0 + k * beat / 2 + 0.003, 0.5 if k % 2 else 0.25, 0.5)
    # SFX: real CC0 recordings when tools/sfx/*.ogg exist, synth fallback otherwise
    real = {}
    for k in ("whoosh", "impact", "pop", "riser", "tick"):
        f = os.path.join(SFX_DIR, k + ".ogg")
        if os.path.exists(f):
            x = read_wav(f); real[k] = x / (np.abs(x).max() + 1e-9)
    W = real.get("whoosh"); I = real.get("impact"); Pp = real.get("pop"); Rs = real.get("riser"); Tk = real.get("tick")
    for i, s in enumerate(shots):
        if i > 0:
            if W is not None: add(sfx, W, s["start"] - min(0.3, len(W) / SR / 2), 0.35, 0.4 if i % 2 else -0.4)
            else: add(sfx, whoosh(), s["start"] - 0.25, 0.22, 0.4 if i % 2 else -0.4)
        for kt in s.get("kicks", []):
            add(sfx, boom(), kt, 0.4)
            if I is not None: add(sfx, I, kt, 0.6)
        if s.get("shimmer"): add(sfx, shimmer(), s["start"] + 0.1, 0.6, 0.2)
        if s.get("drop") and Rs is not None: add(sfx, Rs, s["start"] - len(Rs) / SR, 0.45)  # riser ends on the twist
        for o in s.get("overlays", []):
            if Pp is not None: add(sfx, Pp, o["t0"] + 0.05, 0.5)
            if o.get("type") == "counter" and Tk is not None:
                n = 8; d = o.get("dur", 1.1)
                for j in range(n): add(sfx, Tk, o["t0"] + d * (1 - (1 - j / n) ** 0.5), 0.18)
    # duck music under the voice (sfx stays)
    win = int(0.05 * SR)
    venv = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
    venv = venv / (venv.max() + 1e-9)
    talking = np.convolve((venv > 0.06).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    duck = 1 - 0.55 * np.clip(talking, 0, 1)
    music *= duck
    # fade out last 2 s, gentle fade in
    fade = np.ones(N); f2 = int(2 * SR); fade[-f2:] = np.linspace(1, 0, f2); fade[: int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
    mix = (music * 0.30 + sfx * 0.5) * fade
    peak = np.abs(mix).max()
    if peak > 0.5: mix *= 0.5 / peak
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f"bed: {out} {dur:.2f}s mood={mood} bpm={bpm}")

if __name__ == "__main__":
    main()
