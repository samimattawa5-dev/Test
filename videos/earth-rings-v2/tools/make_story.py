import json, re, sys
out = sys.argv[1]
L = json.load(open(f"{out}/vo_lines.json"))
END = L[-1]["t1"] + 0.3

# word timings: spread each line's words over its time by length
WORDS = []
for ln in L:
    ws = ln["line"].split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); t = ln["t0"]
    for w, x in zip(ws, wt):
        d = (ln["t1"] - ln["t0"]) * x / tot; WORDS.append({"w": w, "t0": round(t, 3), "t1": round(t + d, 3)}); t += d
def wt(word, after=0.0):
    for w in WORDS:
        if w["t0"] >= after and re.sub(r"[^a-z0-9-]", "", w["w"].lower()) == word.lower(): return w["t0"]
    raise SystemExit("word not found: " + word)
def lt(i): return L[i - 1]["t0"], L[i - 1]["t1"]

CAST = {
 "maya": dict(color="#ff9f43", outfit="labcoat", glasses=True, hair=dict(style="bob", color="#6b3e26")),
 "omar": dict(color="#4a90e2", outfit="labcoat", hair=dict(style="spiky", color="#222222"), skin="#c98e62"),
 "lina": dict(color="#c77dff", hold="clipboard", glasses=True, hair=dict(style="bun", color="#a0522d"), skin="#8f5a3a"),
 "sam":  dict(color="#4ecdc4", outfit="explorer", skin="#e8b48c"),
 "dad":  dict(color="#3c8a4f", hair=dict(style="tuft", color="#3a2a20"), skin="#e8b48c"),
 "mom":  dict(color="#ff7aa8", hair=dict(style="long", color="#3a2a20"), skin="#f6c9a8"),
 "kid":  dict(color="#ffd86b", hair=dict(style="cap", color="#e84a5f"), skin="#f6c9a8", scale=0.7),
}
E = lambda **k: {**dict(type="earth", size=[3], pos=[0, 0, 0], spin=0.25, barren=True), **k}
RING = lambda: dict(type="ring", color="#ffe6a8", size=[2.2, 3.6], rot=[0.35, 0, 0], pos=[0, 0, 0])
def ch(name, pos, anim, **k): return dict(cast=name, pos=pos, anim=anim, **k)

b = [0, 1.4, lt(2)[0] - 0.14, lt(3)[0] - 0.14, wt("every", lt(3)[0]) - 0.1, lt(4)[0] - 0.14, lt(5)[0] - 0.14, wt("gravity", lt(5)[0]) - 0.1,
     lt(6)[0] - 0.14, lt(7)[0] - 0.14, wt("millions", lt(7)[0]) - 0.1, lt(8)[0] - 0.14, lt(9)[0] - 0.14, wt("earth", lt(9)[0]) - 0.1, END]
b = [round(x, 2) for x in b]
twist = wt("twist", lt(7)[0])
FAMILY = lambda **k: [ch("dad", [-0.9, 0, -2.5], "point", **k), ch("kid", [-0.9, 1.3, -2.6], "cheer", expr="wow", wander=False, auto=False), ch("mom", [1.0, 0, -2.5], "lookup", expr="wow")]
SKY = dict(type="skyring", size=[34], pos=[0, 9, -40], tilt=0.55)
SH = [
 dict(world="duskfield", characters=FAMILY(), props=[SKY], camera={"from": [0, 0.6, 7.5], "to": [0, 0.7, 7.0], "look": [0, 13, -20]}, energy=1, shimmer=True,
      overlays=[dict(type="title", text="EARTH HAD A RING?", t0=0.05, t1=b[2], y=330, size=118)]),
 dict(world="space", props=[E(), RING()], camera={"from": [0, 2, 12], "to": [6, 3.5, 9], "look": [0, 0, 0]}, flash=True, energy=1,
      overlays=[dict(type="badge", text="466 MILLION YEARS AGO", t0=1.6, t1=4.2, y=640, size=50, accent="#ff4d6d"),
                dict(type="badge", text="HYPOTHESIS · MONASH 2024", t0=4.2, t1=b[2], y=640, size=46, accent="#444444")]),
 dict(world="desert", characters=[ch("maya", [-1.3, 0, 0.6], "inspect", hold="magnifier", expr="wow", to=[-0.9, 0, 1.0], walk=dict(t0=b[2], t1=b[2] + 1.4)),
                                   ch("omar", [0.4, 0, 0.2], "point", face=-30), ch("lina", [1.15, 0, 0.9], "nod", expr="smile", face=-20)],
      props=[dict(type="crater", size=[2.6], pos=[0.4, 0.05, -2]), dict(type="box", color="#b9774a", size=[6, 0.5, 1], pos=[0, 0.25, -4]), dict(type="box", color="#8a5a3a", size=[6, 0.5, 1], pos=[0, 0.75, -4]), dict(type="box", color="#c99a6a", size=[6, 0.5, 1], pos=[0, 1.25, -4])],
      camera={"from": [0, 2.2, 8.5], "to": [-0.5, 1.8, 7.2], "look": [0, 1.0, 0]}, energy=1),
 dict(world="lab", characters=[ch("maya", [-1.8, 0, 0.4], "talk", expr="grin"), ch("omar", [-0.6, 0, 0.9], "point"), ch("lina", [0.6, 0, 0.9], "nod"), ch("sam", [1.8, 0, 0.4], "idle", actions=[dict(t=b[3], anim="idle"), dict(t=wt("twenty-one", lt(3)[0]), anim="cheer")])],
      props=[dict(type="box", color="#e9eef2", size=[3.2, 0.1, 1.4], pos=[0, 1.05, -1.2]), dict(type="box", color="#7d8a96", size=[3, 1, 1.2], pos=[0, 0.5, -1.2]), E(pos=[0, 1.75, -1.2], size=[1.1])],
      camera={"from": [0, 2.4, 9.5], "to": [0, 2.2, 8.6], "look": [0, 1.3, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 0}, to=21, label="IMPACT CRATERS", t0=wt("twenty-one", lt(3)[0]), t1=b[4], y=330, dur=0.9)]),
 dict(world="space", props=[E(dots=21, dotsLat=0.45), dict(type="shadowband", size=[3, 1.5], pos=[0, 0, 0], color="#ffb347", opacity=0.22, appear=dict(t0=b[4] + 0.3, t1=b[4] + 1.3))],
      camera={"from": [0, 3, 10], "to": [0, 1, 8], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="badge", text="ALL 21 WITHIN 30° OF THE EQUATOR", t0=wt("within", lt(3)[0]) - 0.2, t1=b[5], y=420, size=44, accent="#ff4d6d")]),
 dict(world="lab", characters=[ch("maya", [-1.8, 0, 0.6], "cheer", expr="grin"), ch("omar", [-0.6, 0, 1.0], "jump", expr="wow"), ch("lina", [0.6, 0, 1.0], "talk", expr="wow"), ch("sam", [1.8, 0, 0.6], "cheer", expr="grin")],
      props=[], camera={"from": [-1, 2.3, 9.5], "to": [1, 2.3, 9.0], "look": [0, 1.3, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 1}, to=25000000, prefix="1 IN ", roll=False, size=118, label="ODDS BY CHANCE", t0=wt("one", lt(4)[0]) - 0.1, t1=b[6], y=300)]),
 dict(world="space", props=[E(), dict(type="roche", size=[5.2], pos=[0, 0, 0]), dict(type="breakup", pos=[-7, 3, 2], move=[-2.4, 0.4, 1.2], at=999, spin=0.8)],
      camera={"from": [-3, 5, 11], "to": [-1, 4, 9.5], "look": [-1, 0.5, 0]}, energy=2,
      overlays=[dict(type="badge", text="RUBBLE-PILE ASTEROID", t0=wt("rubble-pile", lt(5)[0]) - 0.2, t1=wt("roche", lt(5)[0]) - 0.2, y=420, accent="#8d7b6a"),
                dict(type="badge", text="ROCHE LIMIT ≈ 3,100 KM", t0=wt("roche", lt(5)[0]) - 0.2, t1=b[7], y=420, accent="#ff6b6b")]),
 dict(world="space", props=[E(), dict(type="breakup", pos=[-2.4, 0.4, 1.2], move=[-2.0, 0.2, 1.0], at=b[7] + 0.3, spread=0.9, spin=0.8),
                            dict(type="ring", color="#ffe6a8", size=[2.2, 3.4], rot=[0, 0, 0], pos=[0, 0, 0], appear=dict(t0=b[7] + 0.8, t1=b[8] - 0.2))]
      + [dict(type="rock", color="#b8a48c", size=[0.3], orbit=dict(radius=2.4 + 0.15 * (i % 4), speed=0.8, phase=i * 0.52, y=0.05 * (i % 3)), spin=3, appear=dict(t0=b[7] + 0.6, t1=b[7] + 1.2)) for i in range(12)],
      camera={"from": [0, 6, 10], "to": [0, 3, 9], "look": [0, 0, 0]}, energy=2, kicks=[b[7] + 0.3], flash=True, shimmer=True),
 dict(world="desert", characters=[ch("sam", [0, 0, 1.0], "run", expr="worried"), ch("omar", [1.3, 0, -0.2], "scared", expr="wow")],
      props=[dict(type="rock", color="#7a6a5a", size=[0.5], pos=[x, 0.3, z], fall=8) for x, z in [(-3, -1), (-1, -3), (1.5, -2), (3, -0.5), (-2, -5), (2.5, -4), (0, -1.5)]],
      camera={"from": [0, 2.4, 9.5], "to": [0, 2.0, 8.6], "look": [0, 1.2, 0]}, energy=2, kicks=[b[8] + 1.2, b[8] + 2.8]),
 dict(world="space", props=[E(), RING(), dict(type="shadowband", size=[3, 0.9], pos=[0, 0, 0], appear=dict(t0=twist + 0.8, t1=twist + 2.4))],
      camera={"from": [3, 1.5, 10], "to": [-1, 1, 8.5], "look": [0, 0, 0]}, drop=True,
      overlays=[dict(type="title", text="THE TWIST", t0=twist - 0.1, t1=twist + 1.8, y=330, size=120, color="#ffd84d"),
                dict(type="badge", text="SHADE OVER THE TROPICS", t0=twist + 1.9, t1=b[10], y=420, accent="#2f9bff")]),
 dict(world="ice", characters=[ch("mom", [-1.6, 0, 0.6], "hug", outfit="scarf", scarf="#4a90e2", expr="worried"), ch("kid", [-0.8, 0, 1.0], "shiver", outfit="scarf", expr="worried"),
                               ch("dad", [0.5, 0, 0.8], "shiver", outfit="scarf", scarf="#e84a5f", expr="worried"), ch("lina", [1.6, 0, 0.5], "scared", outfit="scarf", expr="wow")],
      props=[dict(type="frost", size=[9], pos=[0, 0.02, 0], appear=dict(t0=b[10], t1=b[10] + 2.5, grow=True))] + [dict(type="sphere", color="#ffffff", size=[0.15], pos=[x, 0, z], fall=6) for x, z in [(-2, 0), (-0.5, -1), (1, 0.5), (2, -0.5), (0, 1.5), (-1.5, 1), (2.4, 1.2)]],
      camera={"from": [0, 2.6, 9.5], "to": [0, 2.0, 8.4], "look": [0, 1.1, 0]}, energy=1,
      overlays=[dict(type="badge", text="ONE OF THE COLDEST IN 500M YEARS", t0=wt("coldest", lt(7)[0]) - 0.3, t1=b[11], y=400, size=42, accent="#2f9bff")]),
 dict(world="lab", characters=[ch("maya", [-1.8, 0, 0.7], "nod", expr="grin"), ch("omar", [-0.6, 0, 1.0], "talk", expr="smile"), ch("lina", [0.6, 0, 1.0], "no", expr="worried"), ch("sam", [1.8, 0, 0.7], "shrug", expr="neutral")],
      props=[E(pos=[0, 3.4, -2.6], size=[1.0], spin=0.5), dict(type="ring", color="#ffe6a8", size=[0.75, 1.15], pos=[0, 3.4, -2.6], rot=[0.3, 0, 0])],
      camera={"from": [1, 2.3, 9.5], "to": [-1, 2.3, 9.0], "look": [0, 1.4, 0]}, energy=2,
      overlays=[dict(type="badge", text="HYPOTHESIS · NOT PROVEN YET", t0=wt("hypothesis", lt(8)[0]) - 0.3, t1=b[12], y=380, size=46, accent="#444444")]),
 dict(world="duskfield", characters=FAMILY(expr="wow"), props=[SKY], camera={"from": [0, 0.8, 8], "to": [0, 0.5, 6.8], "look": [0, 13.5, -20]}, energy=1, shimmer=True),
 dict(world="space", props=[E(), RING()], camera={"from": [2, 1.5, 9], "to": [0, 3, 13], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="title", text="PROOF OR COINCIDENCE?", t0=wt("proof", lt(9)[0]) - 0.1, t1=END, y=330, size=100, color="#ffd84d")]),
]
assert len(SH) == len(b) - 1, (len(SH), len(b))
shots = []
for i, s in enumerate(SH):
    t0, t1 = b[i], b[i + 1]
    ws = [w for w in WORDS if t0 <= w["t0"] < t1]
    s = dict(start=t0, end=t1, line=" ".join(w["w"] for w in ws) or "", words=ws, characters=s.pop("characters", []), **s)
    shots.append(s)
story = dict(title="Earth Had a Ring?", fps=30, width=1080, height=1920, audio="voiceover.wav", bed="bed.wav", mood="wonder", style="soft",
             cast=CAST, captions=dict(words=3, active="#FFE14D", key="#5CFFB0",
             highlight=["SATURN", "RING", "RINGS", "EQUATOR", "ASTEROID", "GRAVITY", "SHADOW", "COLDEST", "TWIST", "CRATERS", "FREEZE", "ROCHE", "ORDOVICIAN", "HYPOTHESIS", "TROPICS"]),
             shots=shots)
json.dump(story, open(f"{out}/story.json", "w"), indent=1)
print(len(shots), "shots,", END, "s")
