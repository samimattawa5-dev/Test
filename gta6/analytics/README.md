# NexaClips Analyse-Tool

- `data.json`: alle Zahlen je Clip und Plattform (Views, Likes, Kommentare, IG Ø-Wiedergabe, IG Skip-Rate der ersten 3 s)
- `build.py`: `python3 gta6/analytics/build.py` → erzeugt `dashboard.html` (nur Standardbibliothek)
- `dashboard.html`: Übersicht mit Hook-Ampel (Skip-Rate: <45 % stark, 45–55 % mittel, >55 % schwach) und Ø-Wiedergabe (≥60 % gut)
- Der Routine-Check (alle 3 h, 09:07 mit vidIQ) füllt data.json, baut das Dashboard und meldet dem Nutzer.

Grenzen: TikTok nur öffentliche Zahlen (keine Retention, dafür Screenshot aus TikTok Studio); YouTube-Retention/Länder erst 1–2 Tage nach Upload; Länderanteil DE/AT/CH (relevant für Bezahlung) kommt über vidIQ-YouTube-Analytics.
