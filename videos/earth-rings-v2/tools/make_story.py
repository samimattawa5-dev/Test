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

b = [0, lt(2)[0] - 0.14, lt(3)[0] - 0.14, wt("every", lt(3)[0]) - 0.1, wt("though", lt(3)[0]) - 0.1, lt(4)[0] - 0.14, lt(5)[0] - 0.14,
     wt("gravity", lt(5)[0]) - 0.1, lt(6)[0] - 0.14, lt(7)[0] - 0.14, wt("millions", lt(7)[0]) - 0.1, lt(8)[0] - 0.14, lt(9)[0] - 0.14, wt("earth", lt(9)[0]) - 0.1, END]
b = [round(x, 2) for x in b]
twist = wt("twist", lt(7)[0]); tore = wt("tore", lt(5)[0])
SKY = dict(type="skyring", size=[34], pos=[0, 9, -40], tilt=0.55)
SH = [
 # 1 frame 0: ringed Earth + the claim
 dict(world="space", props=[E(), RING()], camera={"from": [0, 2, 11], "to": [5, 3.2, 9], "look": [0, 0, 0]}, energy=1, shimmer=True,
      overlays=[dict(type="title", text="EARTH HAD A RING?", t0=0.0, t1=b[1], y=300, size=118),
                dict(type="badge", text="466 MILLION YEARS AGO", t0=1.0, t1=3.6, y=600, size=50, accent="#ff4d6d"),
                dict(type="badge", text="HYPOTHESIS · MONASH 2024", t0=3.6, t1=b[1], y=600, size=48, accent="#444444")]),
 # 2 clues in the rocks
 dict(world="desert", characters=[ch("maya", [-1.3, 0, 0.6], "inspect", hold="magnifier", expr="wow", to=[-0.9, 0, 1.0], walk=dict(t0=b[1], t1=b[1] + 1.3)),
                                   ch("omar", [0.4, 0, 0.2], "point", face=-30), ch("lina", [1.15, 0, 0.9], "nod", expr="smile", face=-20)],
      props=[dict(type="crater", size=[2.6], pos=[0.4, 0.05, -2]), dict(type="box", color="#b9774a", size=[6, 0.5, 1], pos=[0, 0.25, -4]), dict(type="box", color="#8a5a3a", size=[6, 0.5, 1], pos=[0, 0.75, -4]), dict(type="box", color="#c99a6a", size=[6, 0.5, 1], pos=[0, 1.25, -4])],
      camera={"from": [0, 2.2, 8.5], "to": [-0.5, 1.8, 7.2], "look": [0, 1.0, 0]}, energy=1),
 # 3 the map builds: 21 craters drop onto the globe
 dict(world="space", props=[E(dots=21, dotsLat=0.45, dotsReveal=dict(t0=wt("mapped", lt(3)[0]), t1=wt("craters", lt(3)[0]) + 0.6))],
      camera={"from": [0, 1, 9], "to": [0, 1.6, 7.6], "look": [0, 0, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 0}, to=21, label="IMPACT CRATERS", t0=wt("twenty-one", lt(3)[0]), t1=b[3], y=300, dur=0.9)]),
 # 4 all within 30 degrees
 dict(world="space", props=[E(dots=21, dotsLat=0.45), dict(type="shadowband", size=[3, 1.5], pos=[0, 0, 0], color="#ffb347", opacity=0.25, appear=dict(t0=b[3] + 0.2, t1=b[3] + 1.0))],
      camera={"from": [0, 3, 9.5], "to": [0, 0.6, 8], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="badge", text="ALL 21 WITHIN 30° OF THE EQUATOR", t0=b[3] + 0.1, t1=b[4], y=420, size=50, accent="#ff4d6d")]),
 # 5 base rate: darts everywhere
 dict(world="lab", characters=[ch("lina", [-1.2, 0, 1.0], "throw", expr="grin"), ch("omar", [0.3, 0, 1.4], "shrug"), ch("maya", [1.4, 0, 0.8], "talk")],
      props=[E(pos=[0.6, 2.6, -2.2], size=[1.6], dots=30, dotsLat=1.4, spin=0.6)], camera={"from": [0, 2.3, 9], "to": [0.3, 2.3, 8], "look": [0, 1.6, 0]}, energy=2,
      overlays=[dict(type="badge", text="ONLY ~1/3 OF THE LAND WAS THERE", t0=b[4] + 0.1, t1=b[5], y=380, size=50, accent="#2f9bff")]),
 # 6 the odds
 dict(world="lab", characters=[ch("maya", [-1.7, 0, 0.6], "cheer", expr="grin"), ch("omar", [-0.6, 0, 1.0], "jump", expr="wow"), ch("lina", [0.6, 0, 1.0], "talk", expr="wow"), ch("sam", [1.7, 0, 0.6], "cheer", expr="grin")],
      props=[], camera={"from": [-1, 1.2, 8.5], "to": [1, 1.6, 8.0], "look": [0, 1.6, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 1}, to=25000000, prefix="1 IN ", roll=False, size=112, label="ODDS BY CHANCE", t0=wt("one", lt(4)[0]) - 0.1, t1=b[6], y=280)]),
 # 7 the asteroid crosses the Roche limit
 dict(world="space", props=[E(), dict(type="roche", size=[5.4], pos=[0, 0, 0], color="#ff6b6b"), dict(type="breakup", pos=[-8, 2.6, 1.8], move=[-2.6, 0.4, 1.3], at=999, spin=0.8, scale=2.6)],
      camera={"from": [-2, 4.5, 11.5], "to": [-1, 3.8, 10.5], "look": [-1.5, 0.5, 0]}, energy=2,
      overlays=[dict(type="badge", text="RUBBLE-PILE ASTEROID", t0=wt("rubble-pile", lt(5)[0]) - 0.2, t1=wt("roche", lt(5)[0]) - 0.3, y=420, size=50, accent="#8d7b6a"),
                dict(type="badge", text="ROCHE LIMIT ≈ 3,100 KM UP", t0=wt("roche", lt(5)[0]) - 0.3, t1=b[7] + 0.2, y=420, size=50, accent="#ff6b6b")]),
 # 8 torn apart -> ring (no white flash: the break-up is the picture)
 dict(world="space", props=[E(), dict(type="roche", size=[5.4], pos=[0, 0, 0], color="#ff6b6b"), dict(type="breakup", pos=[-2.6, 0.4, 1.3], move=[-2.3, 0.2, 1.1], at=tore, spread=1.1, spin=0.8, scale=2.6),
                            dict(type="ring", color="#ffe6a8", size=[2.2, 3.4], rot=[0, 0, 0], pos=[0, 0, 0], appear=dict(t0=tore + 0.7, t1=b[8] - 0.2))]
      + [dict(type="rock", color="#b8a48c", size=[0.3], orbit=dict(radius=2.4 + 0.15 * (i % 4), speed=0.8, phase=i * 0.52, y=0.05 * (i % 3)), spin=3, appear=dict(t0=tore + 0.5, t1=tore + 1.1)) for i in range(12)],
      camera={"from": [-1, 5, 10], "to": [0, 3.2, 9], "look": [-0.5, 0, 0]}, energy=2, kicks=[tore], shimmer=True),
 # 9 chunks fall: Sam runs, Omar ducks (apart, both facing the camera)
 dict(world="desert", characters=[ch("sam", [-0.6, 0, 1.0], "run", expr="worried"), ch("omar", [1.4, 0, 0.2], "scared", expr="wow")],
      props=[dict(type="rock", color="#7a6a5a", size=[0.5], pos=[x, 0.3, z], fall=8) for x, z in [(-3, -1), (-1, -3), (1.5, -2), (3, -0.5), (-2, -5), (2.5, -4), (0, -1.5)]],
      camera={"from": [0, 2.4, 9.5], "to": [0, 2.0, 8.6], "look": [0, 1.2, 0]}, energy=2, kicks=[b[8] + 1.2, b[8] + 2.8]),
 # 10 the twist: the ring's shadow on the tropics
 dict(world="space", props=[E(), RING(), dict(type="shadowband", size=[3, 0.9], pos=[0, 0, 0], color="#02030a", opacity=0.8, appear=dict(t0=twist + 0.4, t1=twist + 1.6))],
      camera={"from": [2.5, 0.6, 9.5], "to": [-0.5, 0.4, 8.0], "look": [0, 0, 0]}, drop=True, kicks=[twist],
      overlays=[dict(type="title", text="THE TWIST", t0=twist - 0.3, t1=twist + 1.6, y=300, size=124, color="#FFE14D"),
                dict(type="badge", text="MAY HAVE SHADED THE TROPICS", t0=twist + 1.6, t1=b[10], y=420, size=50, accent="#2f9bff")]),
 # 11 ice age
 dict(world="ice", characters=[ch("mom", [-1.6, 0, 0.6], "hug", outfit="scarf", scarf="#4a90e2", expr="worried"), ch("kid", [-0.8, 0, 1.0], "shiver", outfit="scarf", expr="worried"),
                               ch("dad", [0.5, 0, 0.8], "shiver", outfit="scarf", scarf="#e84a5f", expr="worried"), ch("lina", [1.6, 0, 0.5], "scared", outfit="scarf", expr="wow")],
      props=[dict(type="frost", size=[9], pos=[0, 0.02, 0], appear=dict(t0=b[10], t1=b[10] + 2.5, grow=True))] + [dict(type="sphere", color="#ffffff", size=[0.15], pos=[x, 0, z], fall=6) for x, z in [(-2, 0), (-0.5, -1), (1, 0.5), (2, -0.5), (0, 1.5), (-1.5, 1), (2.4, 1.2)]],
      camera={"from": [0, 2.6, 9.5], "to": [0, 2.0, 8.4], "look": [0, 1.1, 0]}, energy=1,
      overlays=[dict(type="badge", text="ONE OF THE COLDEST IN 500M YEARS", t0=wt("coldest", lt(7)[0]) - 0.3, t1=b[11], y=400, size=46, accent="#2f9bff")]),
 # 12 the debate (closer, moving camera)
 dict(world="lab", characters=[ch("maya", [-1.15, 0, 0.9], "nod", expr="grin"), ch("lina", [0.1, 0, 1.3], "no", expr="worried"), ch("sam", [1.2, 0, 0.8], "shrug", expr="neutral")],
      props=[E(pos=[0, 3.4, -2.6], size=[1.0], spin=0.5), dict(type="ring", color="#ffe6a8", size=[0.75, 1.15], pos=[0, 3.4, -2.6], rot=[0.3, 0, 0])],
      camera={"from": [2.0, 2.0, 8.8], "to": [-1.2, 2.2, 8.3], "look": [0, 1.5, 0]}, energy=2,
      overlays=[dict(type="badge", text="HYPOTHESIS · NOT PROVEN YET", t0=wt("hypothesis", lt(8)[0]) - 0.3, t1=b[12], y=380, size=50, accent="#444444")]),
 # 13 look up tonight: the ring from the ground
 dict(world="duskfield", characters=[ch("dad", [-1.0, 0, -2.5], "point", expr="wow"), ch("kid", [0.05, 0, -2.2], "jump", expr="grin", wander=False), ch("mom", [1.0, 0, -2.5], "lookup", expr="wow")],
      props=[SKY], camera={"from": [0, 0.9, 8], "to": [0, 0.7, 6.8], "look": [0, 12, -20]}, energy=1, shimmer=True),
 # 14 back to the ringed Earth (loops into frame 0)
 dict(world="space", props=[E(), RING()], camera={"from": [5, 3.2, 9], "to": [0, 2, 11], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="title", text="PROOF OR COINCIDENCE?", t0=wt("proof", lt(9)[0]) - 0.1, t1=END, y=300, size=104, color="#FFE14D")]),
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
