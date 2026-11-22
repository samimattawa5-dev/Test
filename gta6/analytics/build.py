#!/usr/bin/env python3
"""Liest data.json und schreibt dashboard.html (nur Standardbibliothek).
Aufruf: python3 build.py"""
import json, html, pathlib
here = pathlib.Path(__file__).parent
d = json.loads((here / "data.json").read_text(encoding="utf-8"))

def n(x): return "–" if x is None else str(x)
def pct(a, b): return None if (a is None or b in (None, 0)) else round(100 * a / b, 1)

def hook(skip):
    if skip is None: return ("–", "mut")
    if skip < 45: return (f"{skip}% · stark", "ok")
    if skip <= 55: return (f"{skip}% · mittel", "mid")
    return (f"{skip}% · schwach", "bad")

def watch(avg, dur):
    p = pct(avg, dur)
    if p is None: return ("–", "mut")
    cls = "ok" if p >= 60 else "mid" if p >= 35 else "bad"
    return (f"{avg:.1f}s von {dur:.0f}s · {p}%", cls)

def eng(p):
    v, l, c = p.get("views"), p.get("likes") or 0, p.get("comments") or 0
    r = pct(l + c, v)
    return "–" if r is None else f"{r}%"

rows, tot = [], {"tiktok": 0, "instagram": 0, "youtube": 0}
for c in d["clips"]:
    for k in tot: tot[k] += c[k].get("views") or 0
    ig = c["instagram"]
    h, hc = hook(ig.get("skip_rate_3s"))
    w, wc = watch(ig.get("avg_watch_s"), c["duration"])
    def line(name, p, extra=""):
        link = f'<a href="{html.escape(p["url"])}">öffnen</a>' if p.get("url") else "–"
        return (f'<tr><td>{name}</td><td>{n(p.get("views"))}</td><td>{n(p.get("likes"))}</td>'
                f'<td>{n(p.get("comments"))}</td><td>{eng(p)}</td><td>{extra}</td><td>{link}</td></tr>')
    rows.append(f'''<section class="clip"><h2>{html.escape(c["title"])}<small>{html.escape(c["posted"])} · {c["duration"]}s</small></h2>
<div class="kpis"><div class="kpi {hc}"><b>{h}</b><span>Instagram: Abbruch in den ersten 3 s (Hook)</span></div>
<div class="kpi {wc}"><b>{w}</b><span>Instagram: Ø Wiedergabe</span></div></div>
<div class="tw"><table><tr><th>Plattform</th><th>Views</th><th>Likes</th><th>Komm.</th><th>Interaktion</th><th>Mehr</th><th>Link</th></tr>
{line("TikTok", c["tiktok"], f'Shares {n(c["tiktok"].get("shares"))} · Saves {n(c["tiktok"].get("saves"))}')}
{line("Instagram", ig, f'Reach {n(ig.get("reach"))}')}
{line("YouTube", c["youtube"])}</table></div></section>''')

page = f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NexaClips Analyse</title><style>
:root{{--bg:#0f1220;--card:#1a1f36;--tx:#eef1ff;--mut:#9aa3c7;--ok:#3ddc97;--mid:#ffcc4d;--bad:#ff6b6b;--ac:#5fd8ff}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--tx);font:15px/1.4 -apple-system,system-ui,sans-serif;padding:16px;max-width:760px;margin:auto}}
h1{{font-size:20px;margin:0 0 4px}}h2{{font-size:16px;margin:0 0 10px}}h2 small{{display:block;color:var(--mut);font-weight:400;margin-top:2px}}
.sum,.clip{{background:var(--card);border-radius:14px;padding:14px;margin:12px 0}}
.sum{{display:flex;gap:10px;flex-wrap:wrap}}.sum div{{flex:1;min-width:90px}}.sum b{{display:block;font-size:22px;color:var(--ac)}}.sum span{{color:var(--mut);font-size:12px}}
.kpis{{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}}.kpi{{flex:1;min-width:150px;border-radius:10px;padding:10px;background:#232948;border-left:4px solid var(--mut)}}
.kpi b{{display:block}}.kpi span{{font-size:12px;color:var(--mut)}}.kpi.ok{{border-color:var(--ok)}}.kpi.mid{{border-color:var(--mid)}}.kpi.bad{{border-color:var(--bad)}}
.tw{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;font-size:13px}}th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid #2c3354;white-space:nowrap}}th{{color:var(--mut);font-weight:500}}
a{{color:var(--ac)}}.note{{color:var(--mut);font-size:12px;margin-top:14px}}
</style></head><body><h1>NexaClips Analyse</h1><small style="color:var(--mut)">Stand: {html.escape(d["updated"])}</small>
<div class="sum"><div><b>{tot["tiktok"]}</b><span>TikTok Views</span></div><div><b>{tot["instagram"]}</b><span>Instagram Views</span></div><div><b>{tot["youtube"]}</b><span>YouTube Views</span></div></div>
{"".join(rows)}
<p class="note">Hook-Ampel (Instagram Skip-Rate 3 s): unter 45 % stark, 45–55 % mittel, über 55 % schwach. Ø Wiedergabe: ab 60 % gut. Bezahlt werden nur Aufrufe aus DE/AT/CH, die Länderverteilung fehlt hier noch. {html.escape(d["notes"])}</p>
</body></html>'''
(here / "dashboard.html").write_text(page, encoding="utf-8")
print("dashboard.html geschrieben,", len(d["clips"]), "Clips")
