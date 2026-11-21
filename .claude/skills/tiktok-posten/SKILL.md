---
name: tiktok-posten
description: >-
  TikTok-Posting und Kommentare für das Konto nexaclips.hq (WoW-Forever-Kampagne). Nutze ihn, wenn der Nutzer sagt "TikTok posten", "TikTok Caption", "Kommentar auf TikTok", "TikTok Zahlen" oder nach dem TikTok-Ablauf fragt.
---

# tiktok-posten

Claude hat KEINE Schreib-/Lese-Tools für TikTok (Higgsfield-Publish-Formular erscheint im Client des Nutzers nicht, Composio hat kein TikTok). Deshalb:

## Posten (Nutzer macht es in der TikTok-App, Claude liefert alles)
1. Clip-Datei im Chat schicken (SendUserFile) + Caption im Codeblock.
2. Ablauf für den Nutzer (arabisch, kurz): + → Hochladen → Video → Weiter → Weiter → Beschreibung einfügen.
3. Nach dem Einfügen: Emoji-Vorschlag hinter `#blizzardpartner` löschen. Zeile muss genau `#werbung #blizzardpartner` heißen, danach max. 3 Hashtags.
4. Inhaltsoffenlegung EIN → Markeninhalt → Markenpartner „Blizzard Entertainment".
5. Sichtbarkeit: Alle. Veröffentlichen.
6. Link kopieren (Teilen → Link kopieren), Nutzer reicht ihn bei Content Rewards ein (Konto dort verknüpft).
7. Link in gta6/FORTSCHRITT.md eintragen.

## Caption-Format
`<Text mit Frage> @blizzard_de` + neue Zeile `#werbung #blizzardpartner` + neue Zeile 3 Hashtags (#worldofwarcraft #wowforever #gaming). Deutsch, wahr, keine erfundenen Fakten, „ist da" statt „kommt bald".

## Kommentare
Nutzer schickt Screenshot/Text → Claude schreibt 1–2 kurze deutsche Antworten (Frage zurück). Nicht antworten auf Beleidigung, Spam, Geld/Auszahlung. Helfer-Seite: gta6/tools/tiktok-antworten.html.

## Zahlen
Nutzer schickt Screenshot aus TikTok-Studio, Claude wertet aus. Erst nach 24–48 h beurteilen.

## Nicht tun
Keine Bots/Login-Cookies/Fremd-Tools für das Konto (Sperrrisiko, Konto bringt das Geld). Keine Aufrufe kaufen.

## Wenn Zugriff möglich wird
Client mit MCP-Widgets (z. B. Claude Desktop/claude.ai/code): `tiktok_prepare_publish` mit connector_id 66367ca8-9ed3-4445-9e59-26fc9017fe57, Video-URL aus gta6/FORTSCHRITT.md (Higgsfield-gehostet), Nutzer bestätigt das Formular. Oder Computer-Use über die Claude-Desktop-App auf dem PC des Nutzers (nur mit seiner Freigabe).
