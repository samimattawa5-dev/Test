# Costume rule (أول قاعدة)
Every character ALWAYS wears the outfit of their role in the episode (witch = witch robes+hat, doctor = white coat+stethoscope+head mirror). Keep the blocky face/body/colors of the original character; only the clothing/props change.

## Role → outfit
| Role | Outfit & props |
|---|---|
| Wizard/Witch | purple robe, pointed star hat, wand, long beard (wizard) |
| Doctor | white coat, stethoscope, head mirror, clipboard |
| Chef | white toque, apron, spatula |
| Police | blue cap, badge, whistle |
| Firefighter | red helmet, yellow coat, hose |
| Astronaut | white suit, helmet, antenna |
| Pirate | black tricorn, eye patch, striped shirt, sword |
| Knight | grey armor, plume helmet, sword+shield |
| Pilot | cap, aviator jacket, goggles |
| Teacher | glasses, vest, book |
| Superhero | cape, mask, emblem |

## Prompt template (Higgsfield generate_image, reference = original character image)
"Same blocky voxel-style 3D character as the reference (same face, proportions, skin, colors), now dressed as a {ROLE}: {OUTFIT}. Full body, front view, neutral A-pose, plain background, soft lighting, cute toy-like render."
Then reuse this image as keyframe for all shots of that episode.

## 3D alternative
In Blender, add outfit as separate blocky meshes parented to the rig's head/torso bones; export per-role GLB.
