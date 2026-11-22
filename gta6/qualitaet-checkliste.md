# Qualitäts-Checkliste vor jedem Export (Claude geht sie durch)

- [ ] Frame 0–1 s: stärkster/bewegter Moment? (kein Titel-/Logo-Standbild)
- [ ] Hook-Text oben (y≈290–470) in den ersten 2–4 s, wahr, keine Übertreibung
- [ ] Länge 20–30 s (min. 10 s), Ende sauber (Satz/Szene fertig, kein Logo/„Vorbestellen“)
- [ ] Endfrage in den letzten 5 s, in der Safe-Zone (y≈1160)
- [ ] Bild groß (≥ 1080×1080 Mitte), Banner/Laufszenen gekürzt
- [ ] Sprecher 90 %, Original-Ton hörbar, keine KI-Stimme
- [ ] Offizielles Material, Deutsch/Englisch, ein zusammenhängendes Stück (nur zusammenschneiden wenn nötig)
- [ ] Je Plattform eigene Datei (_tt/_ig/_yt), eigener Hook-Text, eigene Caption, eigene Zeit
- [ ] Captions: #werbung #blizzardpartner in eigener Zeile, TikTok @blizzard_de, YouTube @WorldofWarcraftDE, IG ohne Tag
- [ ] Letzten Frame und Audio-Ende nach dem Rendern ansehen (nicht abgeschnitten)
- [ ] Nutzer-Freigabe vor dem Planen

## Encoding-Standard (ab 22.11., wegen Nutzerfeedback „gepostet sieht schlechter aus“)
- Export: H.264 High, 1080×1920, 30 fps, `-crf 14 -preset slow` (Ziel ≈ 10–14 Mbit/s), `-maxrate 16M -bufsize 32M`, AAC 192k, yuv420p, +faststart
- Skalierung/Zoom mit `flags=lanczos` (nicht bilinear), Zoom nur bis 1,06
- Quelle in voller Auflösung verwenden (1920×1080 horizontal oder 1080×1920 vertikal), nie vorher komprimierte Zwischenstufen
- Vergleich: Datei im Chat (Original) vs. Plattform-Wiedergabe erst 30–60 Min nach Upload prüfen (TikTok/YouTube verarbeiten HD verspätet)
