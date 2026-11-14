---
name: style-presets
description: >-
  One-word visual styles for 3d-story-shorts videos - science explainer,
  mystery, collage history, money explainer, kids cartoon - each setting the
  render look, caption colours, music mood, badge accent and vignette. Our free
  replacement for paid style templates (HyperFrames style-sampling). Use for
  "make it in a mystery style", "same style as last time", "a series look",
  "different style for this channel", or when starting a new series.
---

# style-presets

Built because HyperFrames' `style-sampling` templates are a paid Pro feature. These presets are
ours, original, and free. They set a series look in one line; anything written in `story.json`
still wins over the preset.

```json
{ "preset": "science-explainer", ... }
```

| Preset | Look | Captions (spoken / keywords) | Music mood | Use for |
|---|---|---|---|---|
| `science-explainer` | soft 3D, bright, gentle bloom | yellow / mint | wonder | space, physics, biology, "what if" |
| `mystery` | soft 3D, darker exposure, strong vignette | red / pale pink | tense | unsolved cases, strange history, disasters |
| `collage-history` | toon + ink outlines | yellow / coral | playful | history stories, inventions, loopholes |
| `money-explainer` | soft 3D, clean | green / yellow | tense | economy, prices, business stories |
| `kids-cartoon` | toon + outlines | pink / sky blue | playful | children's facts, simple science |

Each preset also sets the default badge colour (`accent`) and the vignette strength. Presets live in
`template/scene.js` (`PRESETS`); add a new one there with the same fields, then a row here.

## Series rules
- One preset per series. Viewers recognise a channel by its look in the first frame.
- Keep the same `cast` across episodes of a series (see 3d-story-shorts: Cast).
- Change the topic, worlds and camera moves every episode (repetitive uploads are not monetised);
  keep the preset, captions and music mood.
- Never imitate a specific creator's channel look; borrow grammar (pace, structure), not their
  colours, characters or titles.
