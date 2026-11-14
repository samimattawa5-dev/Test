---
name: 3d-story-shorts
description: Make a ~60s vertical (9:16) 3D cartoon "story Short" from a true, surprising fact - research, script with sources, voiceover, 3D scenes with moving camera and one-word captions, rendered locally with Node.js. Use when the user wants a YouTube Short / TikTok / Reel video about a topic, or says "3d story short".
---

# 3D Story Shorts

Topic -> true story -> script -> voice -> 3D scenes -> `final.mp4`. User approves 4 times, then runs one render button.

## Workflow (do NOT skip approvals)

### 0. Input
Need: topic + audience. If missing, ask once. Keep chat replies short.

### 1. Ideas (approval 1)
Research the web (WebSearch). Give **5 true stories**, each: hook (first sentence), what happens on screen, the twist. User replies with a number or own idea.
Good topics: hidden science, loopholes, old inventions, engineering stories.

### 2. Script (approval 2)
Output:
- **Shot table**: time | voiceover line | on-screen (world, characters, props, camera).
- **Fact list** with >=2 sources per claim. Save as `script.md`.
Rules:
- 55-65 s total, ~150 words, 10-16 shots of 3-6 s.
- Hook = first sentence: strange action + one exact detail ("They painted the jail cell pink."). No intro, no "like and subscribe".
- Real fact + story + twist. Mark any invented character/dialogue as fiction; never present it as history.
- Ad-safe: no medical/money advice, no fake quotes from real people, no graphic injury.
- Original characters/sets only; never copy another creator's scripts/characters/scenes.
Iterate on plain-language changes until user says yes.

### 3. Voice (approval 3)
- **Own voice**: give a voice-over PDF/text of the script; user records WAV/MP3 and attaches it.
- **AI voice**: only if a voice tool is connected (e.g. Higgsfield `generate_audio`/`list_voices`); play 3 short samples, user picks one, read whole script in that voice.
Save as `voiceover.mp3` (or .wav; set `"audio"` in story.json). Remind: check YouTube Studio's current disclosure rules for synthetic/altered content.

### 4. Build (approval 4)
1. Copy `template/` (this skill folder) to a new project folder `<slug>/`.
2. Write `story.json` from the approved script (format below). Make every video different: new worlds, colours, camera moves.
3. Timing: if real audio exists, get word times (e.g. whisper if available, else measure each line with `ffprobe` and spread words evenly) and fill `start`/`end` and optionally `words`. Total `end` of last shot = audio length.
4. Run `node render.mjs --check` (after `npm install` and `npx playwright install chromium`). It writes `out/preview_shot_NN.png` for every shot. **Look at every preview image** (Read tool). Fix empty/dull/clipped shots: add props, move camera closer, change world, bigger characters. Repeat until all shots look good.
5. Make the music/SFX bed (see below), then fast test: `SCALE=0.25 MAX_SECONDS=3 node render.mjs`.
6. Deliver: project folder on user's computer (desktop app with folder access) or a zip. Tell user to **extract the zip** first.

### 5. Render (user)
- Install Node.js LTS from nodejs.org (once); check `node -v`.
- Windows: double-click `render.bat` ("Windows protected your PC" -> More info -> Run anyway). Mac/Linux: `bash render.sh`.
- Steps: [1/4] install tools (first time, minutes) -> [2/4] check -> [3/4] render frames (~1,800) -> [4/4] voiceover. Result: `final.mp4`; previous kept as `final_previous.mp4`.
- ~2 min on a good PC, 10+ min on old laptops.

## story.json format
```json
{ "title": "...", "fps": 30, "width": 1080, "height": 1920, "audio": "voiceover.mp3",
  "shots": [{
    "start": 0, "end": 4, "line": "voiceover text for this shot",
    "words": [{"w":"They","t0":0,"t1":0.3}],            // optional exact word timing
    "world": "office|prison|city|lab|space|desert|ocean|ice|dusk",
    "characters": [{"color":"#7ad0ff","pos":[x,y,z],"anim":"idle|wave|bounce|spin|walk|run|shiver|no|lookup|point|inspect",
                    "skin":"#hex", "pants":"#hex", "shoes":"#hex",
                    "hair":{"style":"tuft|bob|spiky|bun|cap|bald","color":"#hex"},
                    "outfit":"labcoat|explorer|scarf|none", "scarf":"#hex", "glasses":true,
                    "expr":"smile|grin|wow|worried|neutral", "hold":"magnifier|clipboard", "scale":1.0}],
    "overlays": [{"type":"title","text":"466 MILLION YEARS AGO","t0":0.45,"t1":4.9,"y":400,"size":104,"color":"#fff"},
                 {"type":"counter","from":0,"to":21,"prefix":"","suffix":"","label":"IMPACT CRATERS","t0":9.9,"t1":13.9,"y":380,"dur":1.1},
                 {"type":"badge","text":"HYPOTHESIS · MONASH 2024","t0":49.1,"t1":50.9,"y":430,"accent":"#444"}],
    "props": [{"type":"box|sphere|cylinder|cone|torus|rock|ring|earth|crater|lamp","color":"#hex","pos":[x,y,z],"size":[w,h,d],
               "rot":[x,y,z], "spin":1.0, "glow":true,
               "move":[x,y,z],                                  // slide from pos to here during the shot
               "fall":8,                                        // loop-falling from this height
               "orbit":{"radius":2.5,"speed":0.8,"phase":0,"y":0},
               "equator":"#ff4d4d", "dots":21}],                 // earth only: glowing equator band, crater dots
    "camera": {"from":[x,y,z],"to":[x,y,z],"look":[x,y,z]}   // camera moves from -> to during the shot
}]}
```
- Characters ~1.9 units tall; camera z 5-8 shows 1-3 characters in 9:16. An `earth` of size 3 needs camera distance ~10-12 to fit the 9:16 width.
- Preview all shots at once: after `--check`, `ffmpeg -pattern_type glob -i 'out/preview_shot_*.png' -vf "scale=270:480,tile=7x2" -frames:v 1 out/sheet.png`, then Read `out/sheet.png`.
- Timing without whisper: `ffmpeg -i voiceover.wav -af silencedetect=noise=-35dB:d=0.25 -f null -` gives the pauses; map them to sentences, put shot cuts in the middle of pauses, spread words inside each phrase by length.
- In a cloud session, Higgsfield results download from `d8j0ntlcm91z4.cloudfront.net` (must be an allowed host). Headless render there: `CHROME_PATH=/opt/pw-browsers/chromium`. Always move the camera (`from` != `to`).
- Shots must be contiguous (`end` of one = `start` of next).
- Look (on by default): toon shading + ink outlines (`"outline": false` / `"ink": "#hex"` at top level), blinking eyes, vignette, smootherstep camera, small alternating camera roll (`camera.roll` in degrees to override).
- Characters: give each recurring person a fixed look (same color/hair/outfit across shots) so viewers recognise them; match `expr` to the line (wow on surprises, worried on danger).
- Overlays (motion graphics, times are global seconds, `y` in 1080x1920 px): keep `y` between 360 and 1420 (TikTok/Reels safe zone). Use a `counter` for every number the voice says, a `title` for the hook date/fact, a `badge` for labels - and a badge saying "hypothesis"/"theory" when a claim is not proven. Words reveal from a mask with a spring, counters tick with a pop label; each overlay gets a pop SFX automatically.
- Per-shot extras: `"flash": true` (white flash at shot start - use right after the hook), `"kicks": [t,...]` (impact shake + boom SFX at global seconds), `"energy": 0-2` (music intensity), `"drop": true` (music drops to pad - use on the twist), `"shimmer": true` (sparkle SFX).

## Music + SFX (free, original, no credits)
`python3 tools/make_bed.py story.json voiceover.wav bed.wav` (numpy) writes an original score (pad, arpeggio, bass, soft drums following each shot's `energy`/`drop`) + real CC0 SFX from `tools/sfx/` (whoosh on cuts, impact on `kicks`, riser into the `drop`, pop + ticks on overlays; credits in `tools/sfx/CREDITS.txt`) - music ducked under the voice. Set `"bed": "bed.wav"` and `"mood": "wonder|tense|playful"` in story.json. `render.mjs` mixes voice + bed and normalises to -14 LUFS (YouTube/TikTok/Reels level). Generate the bed AFTER the timing is final.
- Need a new world/prop/animation? Edit `scene.js` (`WORLDS`, `makeProp`, `animate`).
- Captions: one word at a time, from `line` (or `words`).

## Quality helpers (other skills in this repo)
- `cartoon-3d-short` (MIT, mromidev/claude-animated-shorts): proven look values for this genre - camera rules (every hold creeps, cuts on big jumps, impact shakes), ink outlines, depth of field, light presets, character proportions, beat formula, readability traps. Borrow its rules/values to upgrade `scene.js`; its own pipeline needs Remotion. Its private reference frames were deliberately NOT installed - never copy another channel's frames or shots.
- `ffmpeg-skill` (MIT, kajisho5/ffmpeg-skill): post-production on `final.mp4` - loudness to -14 LUFS, platform checks (`check.py --platform reels/youtube`), safe-zone look sheets, music bed with ducking. Needs FFmpeg 6.1+, Python 3.10+.
- `3dviz-pro-max` (MIT, viettranx/3dviz-pro-max): how to make 3D objects convincing (silhouette, materials, lighting direction, visual anti-slop checklist). Use when a prop/world looks basic.
- Motion graphics (MIT, charlie947/motion-graphics-skills + Barty-Bart/motion-graphics), all built as HTML with `window.seek(t)` - same idea as our `renderFrame(t)`, so their recipes port directly into `index.html` overlays:
  - `motion-effects`: 16 effects (masked type, elastic type, chart morph, glass focus, particle logo...) - use for title cards, number reveals, end card.
  - `title-sequence-3d`: cinematic 3D opener (camera through a lit scene, title lands) - use to upgrade the hook shot.
  - `animated-chart`: counters, bars that become a line - use when the script says a number ("1 in 25 million").
  - `explainer-high-energy`: spring/track/kf easing helpers, motion blur by sub-frames, HUD frame, transitions carried by a shape.
  - `vox-explainer`: paper-card documentary look, label call-outs, counters.
  - `sound-effects`: real CC0 SFX library (whoosh, pop, impact, riser) + measured mix (-16 LUFS, beat grid). Prefer it over the synth SFX in `tools/make_bed.py` when the user wants a richer sound; needs `pip install librosa soundfile numpy scipy matplotlib` in a venv.
  - `reel-export`: safe zone for TikTok/Reels (text between y 360 and 1420, nothing in the right 120 px) + upload-clean H.264 settings.
  - `brand-intake`: writes brand.md + MOTION.md for a channel's look; run once per channel.
  Rules they share that apply here: one object turning into another beats a fade; stagger elements by a beat; every frame from time alone; label invented numbers; sound is never optional.

## Fixes for common problems
| Problem | Do |
|---|---|
| "vulnerabilities" / "npm warn" | Ignore. Never `npm audit fix --force` |
| Browser downloads, frame count never appears | render retries; else run `check.bat`, send `out\check_log.txt` |
| RENDER FAILED | `check.bat`, send `out\check_log.txt` |
| "node is not recognized" | Install Node LTS, restart PC |
| Browser blocks `.bat` download | Deliver whole project as zip or write into user's folder |
| Captions out of sync | Tell which line; re-time from real audio |
| Shot empty/dull | Tell which shot; add props/light, camera closer |

## Channel tips
- Real fact + story + twist beats plain explainers and pure fiction.
- Vary topic, locations, colours, camera - repetitive mass-produced uploads aren't monetized.
- Keep `script.md` sources; post on schedule; track which topics hold viewers to the end, then "make another like the X video".
