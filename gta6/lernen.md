# Lern-Protokoll (wird täglich von Claude fortgeschrieben)

Ablauf jeden Morgen (09:07): 1) Zahlen jedes Clips holen (data.json), 2) Fehler/Erfolge benennen, 3) hier eintragen, 4) die nächsten Clips nach diesen Regeln bauen (+ gta6/qualitaet-checkliste.md), 5) dem Nutzer zur Freigabe schicken.

## Aktuelle Regeln (aus allen Einträgen, neueste oben)
0. BESTÄTIGT (22.11.): Hook-Text ab Sekunde 0 + Zoom + Fortschrittsbalken + Zwischentexte senken die 3-s-Abbruchrate deutlich (56,5 % → 33,6 %). Beibehalten.
1. Erste Sekunde = stärkster Moment (Treffer/Zauber/Boss), kein ruhiger Auftakt, keine statische Titelkarte.
2. Hook-Text in den ersten 2–4 s, mittig-oben in der Safe-Zone; Endfrage in den letzten 5 s.
3. Laufende/ruhige Passagen und eingeblendete Info-Banner kürzen; Einstellungen 1–1,5 s.
4. Ende nie abschneiden; Logo/„Jetzt spielen“-Karte weglassen; Satz/Szene zu Ende schneiden.
5. 20–30 s; Sprecher auf 90 % Tempo (Original-Ton bleibt).
6. Pro Plattform eigene Datei/Texte/Zeit; nie 1:1 kopieren.
7. Pünktlich posten (Verzögerung kostet Reichweite).
8. Aktion (Kampf) schlägt Landschaft; Landschaftsclips nur mit starkem Hook.

## Phase 2 (ab 22.11. abends): Fokus MITTE halten (Hook ist gelöst)
Ziel: Ø-Wiedergabe von ~29 % auf ≥ 45 % bringen (IG ig_reels_avg_watch_time / Dauer; YouTube-Retentionskurve ab 24.11.).
Maßnahmen (nur wahre Aussagen, offizielles Material):
1. Open Loop: bei 3–5 s Versprechen („Gleich: …“), Auflösung bei ~75 % der Laufzeit.
2. Pattern Interrupt alle 6–8 s (Zoom-Punch, Text-Pop, Farbblitz, 1-Wort-Einblendung), nie länger als 8 s ohne Veränderung.
3. Nummerierte Struktur („1/3 … 2/3 … 3/3“) bei Feature-Clips.
4. Länge 20–25 s: ruhige Passagen/Laufszenen raus, Einstellungen 1–1,5 s.
5. Re-Hook bei ~40–50 %: kurze Frage/Spannungstext in der Mitte.
6. Große Wort-für-Wort-Untertitel (2–3 Wörter, Safe-Zone) statt kleiner Einheits-Untertitel, falls Transkript vorhanden.
7. Schluss: Auflösung + Endfrage, kein Leerlauf.
Messen: pro Clip Ø-Wiedergabe in %, Skip-Rate 3 s, Views je Plattform; täglich in data.json/dashboard; Vergleich mit v5 (Referenz: IG 8,9 s von 30,4 s = 29 %, Skip 33,6 %).

## Einträge

### 21.11. Action – „So sehen die Kämpfe aus“
Zahlen (22.11.): TikTok 238 Views/3 Likes/5 Komm.; IG 134 Views, Ø-Wiedergabe 6,6 s von 26,8 s (25 %), Skip-Rate 3 s = 56,9 % (schwach); YouTube 16 Views.
Fehler: schwacher Einstieg (generische Zauber), Info-Banner und Laufpassagen, Logo-Karte am Ende; YouTube-Kanal neu → kaum Reichweite.
Gut: TikTok-Verteilung okay, Kommentare/Saves vorhanden, Zusammenschnitt mit Aktion.
Nächstes Mal: stärkster Treffer in Frame 0, Banner/Laufszenen raus, Endfrage statt Logo.

### 22.11. Dun Morogh – Zonenflug
Zahlen (22.11. 17:30): TikTok 13 Views (nach 1 h; im öffentlichen Feed noch nicht gelistet), IG 3 Views (Skip-Rate 100 % bei nur 3 Zuschauern, Ø 8,8 s), YT 0. Kaum Verteilung.
Fehler: statische Titelkarte in den ersten 3 s, ruhige Landschaft, kein Hook-Text am Anfang, Post 2 h verspätet (14:33 statt 12:28), „Anzeige“-Label sichtbar.
Nächstes Mal: Landschaftsclips nur mit Hook-Text oben + Start ab bewegter Stelle; pünktlich.

### 22.11. Himmelsgeborene – neues Volk (Iterationen v1–v4)
Fehler beim Bauen: Bild zu klein (608 px), Ende abgeschnitten (Satz/Szene), Emoji-Glyph im Text fehlte, Text in der UI-Zone.
Fix: 1080×1080 Mitte, Schnitt bis Szenenende (27,4 s Quelle), Safe-Zone-Layout, plattformspezifische Hooks.
Zahlen (22.11. 19:22, 1 h nach Post): TikTok 300 Views (Action: 241 nach 25 h), IG 162 Views, **Skip-Rate 3 s 33,6 % (Action 56,5 %) = starker Hook**, Ø-Wiedergabe 8,9 s von 30,4 s (29 %); YT 2 Views. v5-Maßnahmen wirken auf den Hook (Skip −23 Punkte). Offen: Ø-Wiedergabe noch ~29 % → Mitte/Ende dynamischer. TikTok-Kommentar skeptisch („zahlt extra dafür“) → nicht streiten.
v5 (22.11. 17:35, Anwendung der Lektionen): Hook-Text ab Sekunde 0 (TikTok „Allianz ODER Horde?“), langsamer Zoom 1,00→1,08 gegen Standbild-Wirkung, Fortschrittsbalken, 2 Zwischentexte als Pattern Interrupt (10,5–14 s „Du wählst deine Fraktion“, 19,5–23 s „Krieger · Schurke · Druide · Jäger“, beides durch den Sprecher belegt), Endfrage 25,5 s. Grenze: Quelle ist ein ruhiger Erklärclip → Hook bleibt die Schwachstelle, künftig mehr Kampf-/Feature-Material.

### Prozess
- Worker-Neustart verschob einen Termin um 2 h → bei Verspätung sofort melden und nachholen.
- TikTok-Formular im Client nicht verfügbar → jetzt über vidIQ (Draft → Nutzerfreigabe → publish).
