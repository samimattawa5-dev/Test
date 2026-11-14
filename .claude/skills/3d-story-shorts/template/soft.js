// "soft" look: semi-realistic cartoon (feature-animation style).
// PBR materials + room environment light + soft shadows + AO + selective bloom + ACES tone mapping,
// sculpted characters (big head, irises, eyelids, fingers, fabric/skin/hair materials),
// procedural textured worlds (dunes, rocks, tiled rooms, lit city windows, textured Earth with clouds + atmosphere).
// Everything is deterministic (seeded noise), so any frame renders the same every time.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let R, composer, renderPass, aoPass, envTex, OPT;

// ---------- seeded noise ----------
function rngFrom(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function makeNoise(seed) {
  const r = rngFrom(seed), p = new Uint8Array(512), perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const h = (x, y) => p[(p[x & 255] + y) & 511] / 255;
  const sm = (t) => t * t * (3 - 2 * t);
  const n2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = sm(xf), v = sm(yf);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  return (x, y, oct = 4) => { let f = 1, a = 0.5, s = 0; for (let i = 0; i < oct; i++) { s += a * n2(x * f, y * f); f *= 2; a *= 0.5; } return s / (1 - Math.pow(0.5, oct)); };
}
const N = makeNoise(11);
const C = (hex) => new THREE.Color(hex);
const lerpC = (a, b, t) => a.clone().lerp(b, Math.max(0, Math.min(1, t)));

function canvasTex(w, h, draw, opts = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat, opts.repeat); }
  t.anisotropy = 4; return t;
}
function noiseTex(c1, c2, scale = 6, repeat = 8, speck = 0) {
  const a = C(c1), b = C(c2);
  return canvasTex(256, 256, (ctx, w, h) => { const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { // tileable: sample on a torus
      const u = x / w * Math.PI * 2, v = y / h * Math.PI * 2;
      const n = N(Math.cos(u) * scale / 6 + 10 + Math.sin(v) * 0.0, Math.sin(u) * scale / 6 + Math.cos(v) * scale / 6 + 10, 5);
      let c = lerpC(a, b, n * 1.4 - 0.2); if (speck && ((x * 7919 + y * 104729) % 97) < speck) c = c.clone().multiplyScalar(0.8);
      const i = (y * w + x) * 4; img.data[i] = c.r * 255; img.data[i + 1] = c.g * 255; img.data[i + 2] = c.b * 255; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0); }, { repeat });
}

// ---------- materials ----------
const M = {
  skin: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.3, sheenRoughness: 0.5, sheenColor: C('#ff8f7a'), emissive: C('#ff6040'), emissiveIntensity: 0.025 }),
  fabric: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.82, sheen: 0.8, sheenRoughness: 0.7, sheenColor: lerpC(C(c), C('#ffffff'), 0.5) }),
  hair: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, sheen: 1, sheenRoughness: 0.35, sheenColor: lerpC(C(c), C('#ffffff'), 0.4), clearcoat: 0.25 }),
  gloss: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
  matte: (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r }),
  metal: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.9 }),
  glow: (c, k = 3) => new THREE.MeshStandardMaterial({ color: c, emissive: C(c), emissiveIntensity: k, roughness: 0.4 }),
};
function part(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }

// ---------- renderer / post ----------
export function init(renderer, story, W, H) {
  R = renderer; OPT = story;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = story.exposure || 0.9;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  const pm = new THREE.PMREMGenerator(R); envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  composer = new EffectComposer(R); composer.setPixelRatio(1); composer.setSize(W, H);
  renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(renderPass);
  // GTAO can leave dark rectangles on big planes: off by default (blob contact shadows instead)
  if (story.ao === true) { aoPass = new GTAOPass(new THREE.Scene(), new THREE.PerspectiveCamera(), W, H); aoPass.blendIntensity = 0.9; composer.addPass(aoPass); }
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), story.bloom ?? 0.3, 0.5, 1.0));
  composer.addPass(new OutputPass());
}
export function render(scene, camera) {
  renderPass.scene = scene; renderPass.camera = camera;
  if (aoPass) { aoPass.scene = scene; aoPass.camera = camera; }
  composer.render();
}

// ---------- characters ----------
let BLOB_TEX;
function blobTex() { return canvasTex(128, 128, (ctx, w) => { const gr = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w); }); }
const SKINS = ['#f6c9a8', '#e8b48c', '#c98e62', '#8f5a3a', '#f9d7bd'];
const IRIS = ['#5b3a1e', '#2f6db5', '#3c8a4f', '#7a5230', '#4a4a8a'];
function hash(str) { let h = 7; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; }
function lathe(points, seg = 32, start = 0, len = Math.PI * 2) { return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg, start, len); }

export function makeCharacter(spec) {
  const c = typeof spec === 'string' ? { color: spec } : spec, hsh = hash(c.color || 'x');
  const shirtC = c.color || '#7ad0ff', skinC = c.skin || SKINS[hsh % SKINS.length], pantsC = c.pants || '#33415c', shoeC = c.shoes || '#3a2a22';
  const hairC = c.hair?.color || '#3a2618', irisC = c.iris || IRIS[hsh % IRIS.length];
  const skin = M.skin(skinC), shirt = M.fabric(shirtC), pants = M.fabric(pantsC), shoe = M.gloss(shoeC), hair = M.hair(hairC);
  const g = new THREE.Group(); const lids = [];
  // legs + shoes
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(0.15 * s, 0.52, 0); lg.name = s < 0 ? 'legL' : 'legR'; g.add(lg); // hip pivot: legs can swing
    const addL = (o) => { o.position.sub(lg.position); lg.add(o); };
    const leg = part(new THREE.CapsuleGeometry(0.11, 0.36, 8, 16), pants); leg.position.set(0.15 * s, 0.33, 0); addL(leg);
    const cuff = part(new THREE.TorusGeometry(0.115, 0.025, 8, 20), pants); cuff.rotation.x = Math.PI / 2; cuff.position.set(0.15 * s, 0.17, 0); addL(cuff);
    const sh = part(new THREE.SphereGeometry(0.14, 24, 16), shoe); sh.scale.set(0.95, 0.62, 1.55); sh.position.set(0.15 * s, 0.08, 0.07); addL(sh);
    for (let k = 0; k < 3; k++) { const lc = part(new THREE.BoxGeometry(0.1, 0.012, 0.016), M.matte('#f2efe8', 0.8), false); lc.position.set(0.15 * s, 0.135 - k * 0.012, 0.1 + k * 0.035); lc.rotation.x = -0.5; addL(lc); }
    const sole = part(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24), M.matte('#efe8dc', 0.9)); sole.scale.set(1, 1, 1.6); sole.position.set(0.15 * s, 0.025, 0.07); addL(sole);
  }
  // hips + torso (lathe profile)
  const hips = part(lathe([[0, 0.5], [0.27, 0.5], [0.31, 0.58], [0.31, 0.66], [0, 0.66]]), pants); g.add(hips);
  const torso = part(lathe([[0, 0.62], [0.31, 0.63], [0.34, 0.78], [0.35, 0.98], [0.32, 1.14], [0.22, 1.24], [0.09, 1.28], [0, 1.28]]), shirt); g.add(torso);
  const hem = part(new THREE.CylinderGeometry(0.315, 0.315, 0.05, 32, 1, true), M.fabric(lerpC(C(shirtC), C('#000000'), 0.18).getStyle())); hem.position.y = 0.655; hem.material.side = THREE.DoubleSide; g.add(hem);
  if (c.outfit !== 'labcoat') for (let k = 0; k < 3; k++) { const b = part(new THREE.SphereGeometry(0.022, 10, 8), M.gloss(lerpC(C(shirtC), C('#ffffff'), 0.55).getStyle()), false); b.scale.z = 0.5; b.position.set(0, 0.86 + k * 0.12, 0.345 - k * 0.005); g.add(b); }
  // belt + buckle, pants pockets and side seams, chest pocket, shoulder seams
  const belt = part(new THREE.CylinderGeometry(0.318, 0.318, 0.06, 32), M.gloss('#3a2a22')); belt.position.y = 0.62; g.add(belt);
  const buckle = part(new THREE.BoxGeometry(0.1, 0.07, 0.025), M.metal('#d4b26a')); buckle.position.set(0, 0.62, 0.32); g.add(buckle);
  for (const s of [-1, 1]) {
    const pk = part(new THREE.BoxGeometry(0.11, 0.02, 0.09), M.fabric(lerpC(C(pantsC), C('#000000'), 0.25).getStyle()), false); pk.position.set(0.22 * s, 0.56, 0.2); pk.rotation.set(0.5, 0.6 * s, 0); g.add(pk);
    const seam = part(new THREE.BoxGeometry(0.012, 0.42, 0.012), M.fabric(lerpC(C(pantsC), C('#ffffff'), 0.2).getStyle()), false); seam.position.set(0.255 * s, 0.33, 0); g.add(seam);
    const sh = part(new THREE.SphereGeometry(0.13, 16, 12), c.outfit === 'labcoat' ? M.fabric('#f4f4ef') : shirt); sh.scale.set(1, 0.7, 1); sh.position.set(0.33 * s, 1.16, 0); g.add(sh);
  }
  if (c.outfit !== 'labcoat' && c.outfit !== 'explorer') { const cp = part(new THREE.BoxGeometry(0.12, 0.12, 0.015), M.fabric(lerpC(C(shirtC), C('#000000'), 0.12).getStyle()), false); cp.position.set(0.17, 1.0, 0.335); cp.rotation.y = 0.35; g.add(cp);
    const pf = part(new THREE.BoxGeometry(0.125, 0.035, 0.02), M.fabric(lerpC(C(shirtC), C('#000000'), 0.2).getStyle()), false); pf.position.set(0.17, 1.065, 0.34); pf.rotation.y = 0.35; g.add(pf); }
  const collar = part(new THREE.TorusGeometry(0.12, 0.035, 12, 24), shirt); collar.rotation.x = Math.PI / 2; collar.position.y = 1.27; g.add(collar);
  const neck = part(new THREE.CylinderGeometry(0.085, 0.095, 0.16, 16), skin); neck.position.y = 1.33; g.add(neck);
  if (c.outfit === 'labcoat') {
    const coatM = M.fabric('#f4f4ef'); coatM.side = THREE.DoubleSide;
    const coat = part(lathe([[0.33, 0.45], [0.36, 0.62], [0.37, 0.8], [0.37, 1.0], [0.34, 1.15], [0.24, 1.26], [0.14, 1.3]], 32, 0.42, Math.PI * 2 - 0.84), coatM); g.add(coat);
    for (const s of [-1, 1]) { const lap = part(new THREE.BoxGeometry(0.1, 0.32, 0.02), coatM); lap.position.set(0.1 * s, 1.08, 0.33); lap.rotation.set(-0.2, 0, 0.25 * s); g.add(lap); }
    const pocket = part(new THREE.BoxGeometry(0.13, 0.1, 0.015), M.fabric('#e6e6df')); pocket.position.set(-0.2, 0.98, 0.33); pocket.rotation.y = -0.4; g.add(pocket);
    const pen = part(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), M.gloss('#2f6db5')); pen.position.set(-0.18, 1.04, 0.34); g.add(pen);
  }
  if (c.outfit === 'explorer') {
    const vest = part(lathe([[0.355, 0.7], [0.365, 0.85], [0.365, 1.02], [0.33, 1.15], [0.2, 1.24]], 32, 0.3, Math.PI * 2 - 0.6), M.fabric('#9c7a4a')); vest.material.side = THREE.DoubleSide; g.add(vest);
    for (const s of [-1, 1]) { const pk = part(new THREE.BoxGeometry(0.12, 0.12, 0.04), M.fabric('#86683e')); pk.position.set(0.17 * s, 0.86, 0.34); g.add(pk); }
    const strap = part(new THREE.TorusGeometry(0.36, 0.02, 8, 40, Math.PI), M.matte('#5a3f22')); strap.rotation.set(0, Math.PI / 2, 0.9); strap.position.y = 0.9; g.add(strap);
  }
  // head
  const head = new THREE.Group(); head.position.y = 1.78; g.add(head);
  const skull = part(new THREE.SphereGeometry(0.46, 48, 32), skin); skull.scale.set(1, 1.03, 0.97); head.add(skull);
  const cheeks = part(new THREE.SphereGeometry(0.34, 40, 28), skin); cheeks.scale.set(1.12, 0.82, 0.95); cheeks.position.set(0, -0.17, 0.1); head.add(cheeks);
  for (const s of [-1, 1]) { const ear = part(new THREE.SphereGeometry(0.1, 20, 14), skin); ear.scale.set(0.5, 1, 0.8); ear.position.set(0.45 * s, -0.04, -0.02); head.add(ear); }
  const nose = part(new THREE.SphereGeometry(0.075, 24, 16), skin); nose.scale.set(1, 0.85, 0.9); nose.position.set(0, -0.06, 0.45); head.add(nose);
  for (const s of [-1, 1]) { const blush = part(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: '#ff8a8a', transparent: true, opacity: 0.35, roughness: 0.6, depthWrite: false }), false); blush.scale.set(1.2, 0.6, 0.3); blush.position.set(0.25 * s, -0.12, 0.38); head.add(blush); }
  // eyes: white, iris, pupil, highlight, eyelid
  const white = M.gloss('#fbfbf8'), irisM = M.gloss(irisC), pupilM = M.gloss('#0c0a10'), hl = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const s of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(0.165 * s, 0.07, 0.36); head.add(eye);
    eye.add(part(new THREE.SphereGeometry(0.115, 32, 24), white, false));
    const iris = part(new THREE.SphereGeometry(0.08, 28, 18), irisM, false); iris.scale.z = 0.45; iris.position.z = 0.08; eye.add(iris);
    const ring = part(new THREE.TorusGeometry(0.078, 0.008, 8, 28), M.gloss('#1a1420'), false); ring.position.z = 0.1; eye.add(ring);
    const pupil = part(new THREE.SphereGeometry(0.042, 16, 12), pupilM, false); pupil.scale.z = 0.4; pupil.position.z = 0.112; eye.add(pupil);
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), hl); h1.position.set(0.03, 0.035, 0.118); eye.add(h1);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), hl); h2.position.set(-0.02, -0.025, 0.118); eye.add(h2);
    const lid = part(new THREE.SphereGeometry(0.122, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), skin, false); lid.rotation.x = -0.55; eye.add(lid); lids.push(lid);
    const lashy = ['bob', 'bun', 'long', 'curly'].includes(c.hair?.style) || c.lashes;
    if (lashy) for (let k = 0; k < 3; k++) { const la = part(new THREE.CapsuleGeometry(0.008, 0.05, 4, 6), M.gloss('#1a1420'), false); const a = (0.35 + k * 0.25) * s; la.position.set(Math.sin(a) * 0.115 * 0.9 + 0.03 * s, 0.03, Math.cos(a) * 0.115); la.rotation.set(-0.6, 0, -a * 1.4); lid.add(la); }
    const brow = part(new THREE.CapsuleGeometry(0.024, 0.13, 6, 10), hair, false); brow.rotation.z = Math.PI / 2 + 0.08 * s; brow.position.set(0.17 * s, 0.24, 0.37); brow.name = 'brow' + s; head.add(brow);
  }
  // mouth
  const expr = c.expr || 'smile', mouthM = M.gloss('#6b1f2b');
  if (expr === 'wow') { const m = part(new THREE.SphereGeometry(0.065, 20, 14), mouthM, false); m.scale.set(0.85, 1.15, 0.5); m.position.set(0, -0.25, 0.38); head.add(m); for (const s of [-1, 1]) head.getObjectByName('brow' + s).position.y = 0.3; }
  else if (expr === 'neutral') { const m = part(new THREE.CapsuleGeometry(0.016, 0.1, 6, 8), mouthM, false); m.rotation.z = Math.PI / 2; m.position.set(0, -0.24, 0.4); head.add(m); }
  else if (expr === 'grin') {
    const m = part(new THREE.SphereGeometry(0.11, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouthM, false); m.scale.set(1.1, 0.75, 0.45); m.position.set(0, -0.2, 0.37); head.add(m);
    const teeth = part(new THREE.BoxGeometry(0.17, 0.035, 0.02), M.gloss('#ffffff'), false); teeth.position.set(0, -0.215, 0.415); head.add(teeth);
  } else { const worried = expr === 'worried';
    const m = part(new THREE.TorusGeometry(0.075, 0.019, 10, 20, Math.PI), mouthM, false); m.rotation.z = worried ? 0 : Math.PI; m.position.set(0, worried ? -0.29 : -0.2, 0.39); head.add(m);
    if (worried) for (const s of [-1, 1]) { const b = head.getObjectByName('brow' + s); b.rotation.z = Math.PI / 2 + 0.38 * s; b.position.y = 0.26; } }
  // hair styles
  const hs = c.hair?.style || ['bob', 'spiky', 'bun', 'curly', 'tuft'][hsh % 5];
  const cap = (r, tl, y = 0.03, z = -0.03, rx = -0.3) => { const m = part(new THREE.SphereGeometry(r, 40, 24, 0, Math.PI * 2, 0, tl), hair); m.position.set(0, y, z); m.rotation.x = rx; head.add(m); return m; };
  // hair stays simple (one or two smooth masses); the detail budget goes to the body
  if (hs === 'bob' || hs === 'long') { cap(0.49, Math.PI * 0.58, 0.03, -0.04, -0.35);
    const fringe = part(new THREE.SphereGeometry(0.3, 24, 16), hair); fringe.scale.set(1.25, 0.38, 0.6); fringe.position.set(0.04, 0.3, 0.3); fringe.rotation.z = -0.15; head.add(fringe);
    if (hs === 'long') { const back = part(new THREE.CapsuleGeometry(0.3, 0.35, 10, 16), hair); back.scale.z = 0.55; back.position.set(0, -0.2, -0.25); head.add(back); } }
  else if (hs === 'bun') { cap(0.475, Math.PI * 0.5, 0.04, -0.02, -0.15); const bun = part(new THREE.SphereGeometry(0.16, 24, 16), hair); bun.position.set(0, 0.47, -0.18); head.add(bun); }
  else if (hs === 'curly') { cap(0.47, Math.PI * 0.45, 0.05, -0.02, -0.15); const r = rngFrom(hsh); for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, el = 0.15 + r() * 0.9; const b = part(new THREE.SphereGeometry(0.09 + r() * 0.04, 14, 10), hair); b.position.set(Math.cos(a) * Math.sin(el) * 0.47, Math.cos(el) * 0.47 + 0.05, Math.sin(a) * Math.sin(el) * 0.47 - 0.03); if (b.position.z > 0.25 && b.position.y < 0.3) continue; head.add(b); } }
  else if (hs === 'spiky') { cap(0.47, Math.PI * 0.42, 0.06, -0.02, -0.2); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const t = part(new THREE.ConeGeometry(0.1, 0.26, 12), hair); t.position.set(Math.cos(a) * 0.22, 0.42, Math.sin(a) * 0.22 - 0.04); t.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); head.add(t); } }
  else if (hs === 'tuft') { cap(0.465, Math.PI * 0.3, 0.06, -0.05, -0.4); for (let i = 0; i < 3; i++) { const t = part(new THREE.CapsuleGeometry(0.04, 0.16, 6, 8), hair); t.position.set(-0.06 + i * 0.06, 0.5, 0.05); t.rotation.set(0.4, 0, (i - 1) * 0.5); head.add(t); } }
  else if (hs === 'cap') { const capM = M.fabric(hairC); const d = part(new THREE.SphereGeometry(0.48, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.45), capM); d.position.y = 0.04; head.add(d);
    const brim = part(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 32, 1, false, -Math.PI / 2, Math.PI), capM); brim.position.set(0, 0.2, 0.34); brim.scale.z = 1.2; head.add(brim);
    const btn = part(new THREE.SphereGeometry(0.04, 12, 10), capM); btn.position.y = 0.52; head.add(btn); }
  if (c.outfit === 'explorer') { const hatM = M.fabric('#c9a46a'); const brim = part(new THREE.CylinderGeometry(0.66, 0.68, 0.03, 40), hatM); brim.position.y = 0.33; head.add(brim);
    const top = part(lathe([[0.36, 0], [0.37, 0.12], [0.33, 0.24], [0.2, 0.28], [0, 0.27]]), hatM); top.position.y = 0.33; head.add(top);
    const band = part(new THREE.CylinderGeometry(0.372, 0.372, 0.06, 40, 1, true), M.fabric('#5a3f22')); band.position.y = 0.37; head.add(band); }
  if (c.outfit === 'scarf') { const scM = M.fabric(c.scarf || '#e84a5f'); const sc = part(new THREE.TorusGeometry(0.2, 0.085, 16, 32), scM); sc.rotation.x = Math.PI / 2; sc.position.y = 1.3; g.add(sc);
    for (const k of [0, 1]) { const tail = part(new THREE.BoxGeometry(0.13, 0.4, 0.05), scM); tail.position.set(0.12 + k * 0.05, 1.08 - k * 0.04, 0.3 - k * 0.03); tail.rotation.z = 0.12 + k * 0.15; g.add(tail);
      const fr = part(new THREE.BoxGeometry(0.13, 0.04, 0.05), M.fabric('#ffffff')); fr.position.copy(tail.position); fr.position.y -= 0.17; fr.rotation.z = tail.rotation.z; g.add(fr); } }
  if (c.glasses) { const fm = M.gloss('#1e1a22'); for (const s of [-1, 1]) { const r = part(new THREE.TorusGeometry(0.135, 0.016, 10, 28), fm, false); r.position.set(0.165 * s, 0.07, 0.47); head.add(r); const arm = part(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 6), fm, false); arm.rotation.x = Math.PI / 2; arm.position.set(0.3 * s, 0.08, 0.3); head.add(arm); }
    const br = part(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), fm, false); br.rotation.z = Math.PI / 2; br.position.set(0, 0.09, 0.48); head.add(br); }
  // arms: shoulder pivot > upper (sleeve) > elbow > forearm (skin) > hand with fingers
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(0.37 * s, 1.17, 0); arm.name = s < 0 ? 'armL' : 'armR'; g.add(arm);
    const sleeveM = c.outfit === 'labcoat' ? M.fabric('#f4f4ef') : shirt;
    const up = part(new THREE.CapsuleGeometry(0.09, 0.22, 8, 12), sleeveM); up.position.y = -0.16; arm.add(up);
    const fore = part(new THREE.CapsuleGeometry(0.07, 0.2, 8, 12), skin); fore.position.y = -0.42; arm.add(fore);
    const fold = part(new THREE.TorusGeometry(0.093, 0.012, 6, 20), sleeveM); fold.rotation.x = Math.PI / 2; fold.position.y = -0.12; arm.add(fold);
    const scuff = part(new THREE.TorusGeometry(0.088, 0.022, 8, 20), sleeveM); scuff.rotation.x = Math.PI / 2; scuff.position.y = -0.3; arm.add(scuff);
    const hand = new THREE.Group(); hand.position.y = -0.6; arm.add(hand);
    const palm = part(new THREE.SphereGeometry(0.08, 20, 14), skin); palm.scale.set(1, 1.1, 0.7); hand.add(palm);
    for (let f = 0; f < 4; f++) { const fg = part(new THREE.CapsuleGeometry(0.02, 0.07, 6, 8), skin); fg.position.set((-0.045 + f * 0.03) * s, -0.1, 0.005); fg.rotation.x = 0.15; hand.add(fg); }
    const th = part(new THREE.CapsuleGeometry(0.022, 0.06, 6, 8), skin); th.position.set(-0.06 * s, -0.03, 0.05); th.rotation.set(0.5, 0, 0.6 * s); hand.add(th);
    arm.rotation.z = 0.1 * s;
    if (s > 0 && c.hold === 'magnifier') { const ring = part(new THREE.TorusGeometry(0.14, 0.024, 12, 32), M.metal('#b08d57')); ring.position.set(0, -0.92, 0.12); arm.add(ring);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), new THREE.MeshPhysicalMaterial({ color: '#cfeaff', transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide })); glass.position.copy(ring.position); arm.add(glass);
      const hd = part(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 12), M.gloss('#5a3a22')); hd.position.set(0, -0.7, 0.06); arm.add(hd); }
    if (s > 0 && c.hold === 'clipboard') { const cb = part(new THREE.BoxGeometry(0.3, 0.4, 0.025), M.matte('#a87b4f', 0.6)); cb.position.set(-0.05, -0.7, 0.16); arm.add(cb);
      const pp = part(new THREE.BoxGeometry(0.24, 0.3, 0.01), M.matte('#ffffff', 0.9), false); pp.position.set(-0.05, -0.72, 0.18); arm.add(pp);
      const clip = part(new THREE.BoxGeometry(0.1, 0.04, 0.03), M.metal('#c0c0c0')); clip.position.set(-0.05, -0.5, 0.18); arm.add(clip); }
  }
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ map: BLOB_TEX ??= blobTex(), transparent: true, depthWrite: false, opacity: 0.55 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; blob.renderOrder = 1; g.add(blob);
  g.userData.head = head; g.userData.lids = lids; g.userData.eyes = []; g.userData.seed = (hsh % 100) / 37;
  if (c.scale) g.scale.setScalar(c.scale);
  return g;
}

// ---------- props ----------
function earthTexture(barren) {
  return canvasTex(1024, 512, (ctx, w, h) => { const img = ctx.createImageData(w, h);
    const deep = C('#0d3b78'), shallow = C('#1f78c8'), sand = C('#e3cc94'), green = C(barren ? '#c9b693' : '#5cab4a'), dark = C(barren ? '#9a8a74' : '#3d7d33'), ice = C('#f2f6fa');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w * Math.PI * 2, lat = (y / h - 0.5) * Math.PI;
      const px = Math.cos(lat) * Math.cos(u), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(u);
      const n = (N(px * 1.7 + 5, py * 1.7 + 5, 6) + N(pz * 1.7 + 9, px * 1.7 + 2, 6) + N(py * 1.7 + 1, pz * 1.7 + 7, 6)) / 3 * 1.25 - 0.12; let c;
      const sea = barren ? 0.56 : 0.5; // Ordovician: more ocean, bare land
      if (n < sea) c = lerpC(deep, shallow, (n - 0.3) / (sea - 0.3));
      else if (n < sea + 0.03) c = sand; else c = lerpC(green, dark, (n - sea - 0.03) / 0.25);
      if (Math.abs(py) > 0.9 - N(px * 3, pz * 3) * 0.1) c = ice;
      const i = (y * w + x) * 4; img.data[i] = c.r * 255; img.data[i + 1] = c.g * 255; img.data[i + 2] = c.b * 255; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0); });
}
function cloudTexture() {
  return canvasTex(1024, 512, (ctx, w, h) => { const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w * Math.PI * 2, lat = (y / h - 0.5) * Math.PI;
      const px = Math.cos(lat) * Math.cos(u), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(u);
      const n = (N(px * 3 + 40, py * 3 + 40, 5) + N(pz * 3 + 11, px * 3 + 17, 5)) / 2 * 1.3 - 0.15; const a = Math.max(0, (n - 0.5) * 2.6);
      const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.min(255, a * 255); }
    ctx.putImageData(img, 0, 0); });
}
let EARTH_TEX, EARTH_TEX_B, CLOUD_TEX, RING_TEX, MAPS;
function atmosphere(r, color = '#6fb6ff') {
  return new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 48, 32), new THREE.ShaderMaterial({
    uniforms: { c: { value: C(color) } }, transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(c * 1.3, f * 0.7); }' }));
}
function ringTexture() {
  return canvasTex(1024, 1024, (ctx, w) => { const cx = w / 2; for (let r = 0; r < cx; r++) { const t = r / cx; if (t < 0.6) continue;
    const band = N(t * 40, 3.3, 3); const a = Math.max(0, Math.min(1, (band - 0.3) * 1.6)) * Math.min(1, (t - 0.6) * 12) * Math.min(1, (1 - t) * 14);
    const c = lerpC(C('#fbf0d4'), C('#d9bf92'), N(t * 15, 7.7, 2));
    ctx.strokeStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a.toFixed(3)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2); ctx.stroke(); } });
}
function rockGeo(r, seed, detail = 2) {
  const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position, v = new THREE.Vector3(), nz = makeNoise(seed);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 0.75 + 0.5 * nz(v.x * 2 / r + 3, v.y * 2 / r + v.z * 1.3 / r + 3, 3); v.multiplyScalar(k); p.setXYZ(i, v.x, v.y * 0.8, v.z); }
  g.computeVertexNormals(); return g;
}
export function makeProp(p) {
  const s = p.size || [1, 1, 1]; let m;
  switch (p.type) {
    case 'earth': { const r = s[0] / 2; m = new THREE.Group();
      EARTH_TEX ??= earthTexture(false); EARTH_TEX_B ??= earthTexture(true); CLOUD_TEX ??= cloudTexture();
      const globe = part(new THREE.SphereGeometry(r, 64, 48), new THREE.MeshPhysicalMaterial({ map: p.barren ? EARTH_TEX_B : EARTH_TEX, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4 })); m.add(globe);
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(r * 1.015, 64, 48), new THREE.MeshStandardMaterial({ map: CLOUD_TEX, transparent: true, depthWrite: false, roughness: 1 })); clouds.name = 'clouds'; m.add(clouds);
      m.add(atmosphere(r));
      if (p.equator) { const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.03, 12, 128), M.glow(p.equator, 2.5)); band.rotation.x = Math.PI / 2; m.add(band); }
      // globe data: latitude lines (deg), e.g. latLines: [30, 0, -30]
      for (const lat of (p.latLines || [])) { const a = lat * Math.PI / 180; const ln = new THREE.Mesh(new THREE.TorusGeometry(r * Math.cos(a) * 1.012, r * 0.012, 8, 128), M.glow(lat === 0 ? '#ffffff' : '#ffd84d', 2.2)); ln.rotation.x = Math.PI / 2; ln.position.y = r * Math.sin(a) * 1.012; m.add(ln); }
      // growing polar ice caps: ice: {t0, t1, to: degrees from the pole at the end}
      if (p.ice) for (const sgn of [1, -1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.004, 64, 24, 0, Math.PI * 2, sgn > 0 ? 0 : Math.PI - 0.01, 0.01), new THREE.MeshPhysicalMaterial({ color: '#f4fbff', roughness: 0.3, clearcoat: 0.6 })); cap.name = 'icecap'; cap.userData.sgn = sgn; m.add(cap); }
      if (p.dots) { const r2 = rngFrom(21); for (let i = 0; i < p.dots; i++) { const a = r2() * Math.PI * 2, lat = (r2() - 0.5) * 2 * (p.dotsLat ?? 0.25); const d = part(new THREE.SphereGeometry(r * 0.05, 12, 10), M.glow('#ffb347', 2)); d.name = 'dot'; d.position.set(Math.cos(a) * Math.cos(lat) * r * 1.01, Math.sin(lat) * r * 1.01, Math.sin(a) * Math.cos(lat) * r * 1.01); m.add(d); } }
      break; }
    case 'ring': { RING_TEX ??= ringTexture();
      m = new THREE.Mesh(new THREE.RingGeometry(s[0], s[1], 160, 1), new THREE.MeshStandardMaterial({ map: RING_TEX, transparent: true, side: THREE.DoubleSide, roughness: 0.8, emissive: C('#f3dfb2'), emissiveIntensity: 0.25, emissiveMap: RING_TEX, depthWrite: false }));
      // remap UVs radially so the canvas rings follow the geometry
      const uv = m.geometry.attributes.uv, pos = m.geometry.attributes.position; for (let i = 0; i < uv.count; i++) { const x = pos.getX(i), y = pos.getY(i); uv.setXY(i, 0.5 + x / (2 * s[1]), 0.5 + y / (2 * s[1])); }
      m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.renderOrder = 3; break; }
    case 'shadowband': { // the ring's shadow on the globe: a dark band over the tropics (size [earthDiameter, bandHeight])
      // hugs the sphere: a latitude band of a slightly larger sphere, with feathered edges
      const r = s[0] / 2, half = Math.asin(Math.min(0.99, (s[1] || s[0] * 0.25) / 2 / r));
      const bt = canvasTex(4, 128, (ctx, w, h) => { const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, 'rgba(255,255,255,1)'); gr.addColorStop(0.75, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); }, { linear: true });
      m = new THREE.Mesh(new THREE.SphereGeometry(r * 1.008, 96, 32, 0, Math.PI * 2, Math.PI / 2 - half, half * 2), new THREE.MeshBasicMaterial({ color: p.color || '#05060f', alphaMap: bt, transparent: true, opacity: p.opacity ?? 0.5, depthWrite: false }));
      break; }
    case 'frost': { m = part(new THREE.CircleGeometry(s[0] / 2, 64), new THREE.MeshPhysicalMaterial({ color: '#eef8ff', roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.9 }), false); m.rotation.x = -Math.PI / 2; m.position.y = 0.02; break; }
    case 'roche': { const pts = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * s[0] / 2, 0, Math.sin(a) * s[0] / 2)); }
      m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: p.color || '#ff6b6b', dashSize: 0.25, gapSize: 0.15, transparent: true })); m.computeLineDistances(); break; }
    case 'skyring': { // the ring seen from the ground: a banded arch across the sky (size [radius])
      m = new THREE.Group(); const R0 = s[0] || 60; RING_TEX ??= ringTexture();
      [[1, 0.9, '#fbf0d4'], [0.965, 0.5, '#e8d6ae'], [0.93, 0.7, '#f6e7c3']].forEach(([k, w, col]) => { const arc = new THREE.Mesh(new THREE.TorusGeometry(R0 * k, w, 8, 200, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, fog: false })); m.add(arc); });
      m.rotation.x = -(p.tilt ?? 0.35); break; }
    case 'breakup': { // rubble-pile asteroid: a cluster that flies apart at p.at (global s) into an orbiting swarm
      m = new THREE.Group(); const r4 = rngFrom(77), n = p.pieces || 14;
      for (let i = 0; i < n; i++) { const f = part(rockGeo(0.12 + r4() * 0.16, i + 5, 1), M.matte(p.color || '#8d7b6a', 0.9)); const dir = new THREE.Vector3(r4() - 0.5, (r4() - 0.5) * 0.4, r4() - 0.5).normalize();
        f.position.copy(dir.clone().multiplyScalar(0.18 + r4() * 0.12)); f.userData.dir = dir; f.userData.home = f.position.clone(); m.add(f); }
      break; }
    // ---------- history / nature set pieces ----------
    case 'moon': { // red eclipsed Moon with drifting clouds (size [diameter])
      m = new THREE.Group(); const r = s[0] / 2;
      const mt = canvasTex(256, 128, (ctx, w, h) => { const img = ctx.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = N(x / 18, y / 18, 4); const c = lerpC(C('#6e1c12'), C('#b0402a'), n * 1.3 - 0.15); const i = (y * w + x) * 4; img.data[i] = c.r * 255; img.data[i + 1] = c.g * 255; img.data[i + 2] = c.b * 255; img.data[i + 3] = 255; } ctx.putImageData(img, 0, 0); });
      m.add(new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshStandardMaterial({ map: mt, color: p.dark ? '#3a0f0a' : '#ffffff', emissive: C(p.dark ? '#5a1408' : '#e0482a'), emissiveMap: mt, emissiveIntensity: p.dark ? 0.55 : 1.5, roughness: 1, fog: false })));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 32, 16), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(vec3(0.9,0.25,0.12) * 1.4, f * 0.7); }' })); m.add(halo);
      const ct = canvasTex(256, 64, (ctx, w, h) => { for (let i = 0; i < 40; i++) { const x = (i * 53) % w, y = 20 + (i * 17) % 30, rr = 12 + (i * 7) % 18; const g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(40,30,50,0.55)'); g.addColorStop(1, 'rgba(40,30,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); } });
      for (let k = 0; k < 2; k++) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(r * 5, r * 1.2), new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false })); cl.position.set(-r * 2 + k * r * 2.5, -r * 0.3 + k * r * 0.5, r * 1.2); cl.name = 'cloud'; cl.userData.k = k; m.add(cl); }
      break; }
    case 'ship': { // medieval cog: hull, mast, square sail (size [length])
      m = new THREE.Group(); const L = s[0] || 4; const wood = M.matte('#6b4226', 0.8);
      const hull = part(lathe([[0, 0], [0.28, 0.02], [0.42, 0.25], [0.5, 0.55], [0.5, 0.62], [0, 0.62]], 24), wood); hull.scale.set(L * 0.5, L * 0.5, 1.6 * L * 0.5 * 0.45); hull.rotation.z = Math.PI; hull.position.y = L * 0.31; hull.rotation.y = Math.PI / 2; m.add(hull);
      const deck = part(new THREE.BoxGeometry(L * 0.9, 0.06, L * 0.4), M.matte('#8a5a36', 0.8)); deck.position.y = L * 0.3; m.add(deck);
      const castle = part(new THREE.BoxGeometry(L * 0.22, L * 0.12, L * 0.36), wood); castle.position.set(-L * 0.36, L * 0.37, 0); m.add(castle);
      const mast = part(new THREE.CylinderGeometry(0.05 * L / 4, 0.07 * L / 4, L * 0.9, 12), wood); mast.position.y = L * 0.75; m.add(mast);
      const sailM = M.fabric(p.sail || '#efe2c2'); sailM.side = THREE.DoubleSide; const sail = part(new THREE.PlaneGeometry(L * 0.5, L * 0.45, 8, 8), sailM); const sp = sail.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin((sp.getY(i) / (L * 0.45) + 0.5) * Math.PI) * 0.12 * L / 4); sail.geometry.computeVertexNormals();
      sail.position.set(0.03, L * 0.82, 0.05); sail.rotation.y = Math.PI / 2; m.add(sail);
      if (p.cross) { const cr = part(new THREE.BoxGeometry(0.02, L * 0.25, L * 0.06), M.matte('#b3261e')); cr.position.set(0.06, L * 0.82, 0.07); m.add(cr); }
      break; }
    case 'sack': { m = new THREE.Group(); const d = s[0] || 0.5, burlap = new THREE.MeshStandardMaterial({ map: noiseTex('#cdb48a', '#a88b5c', 20, 2, 8), roughness: 1 });
      const sk = part(lathe([[0, 0], [d * 0.48, d * 0.02], [d * 0.56, d * 0.25], [d * 0.5, d * 0.6], [d * 0.3, d * 0.85], [d * 0.12, d * 0.95], [d * 0.14, d * 1.05], [d * 0.2, d * 1.15], [0, d * 1.12]], 20), burlap); m.add(sk);
      const tie = part(new THREE.TorusGeometry(d * 0.13, d * 0.025, 6, 16), M.matte('#6b4226')); tie.rotation.x = Math.PI / 2; tie.position.y = d * 0.97; m.add(tie);
      for (let k = 0; k < 8; k++) { const g = part(new THREE.CapsuleGeometry(d * 0.02, d * 0.05, 3, 5), M.matte('#e2bf5c', 0.7), false); g.position.set(Math.cos(k) * d * 0.5, d * 0.02, Math.sin(k * 1.7) * d * 0.45); g.rotation.z = k; m.add(g); } break; }
    case 'treering': { // trunk slice: rings on the face, one pale-blue band that lights up (size [diameter, thickness])
      m = new THREE.Group(); const R0 = s[0] / 2, th = s[1] || 0.3, nb = p.rings || 28, blue = p.blue ?? 0.62;
      const face = canvasTex(512, 512, (ctx, w) => { const c = w / 2; for (let i = nb; i >= 1; i--) { const r = i / nb * c * 0.98; ctx.beginPath(); ctx.arc(c + Math.sin(i) * 3, c + Math.cos(i * 1.3) * 3, r, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? '#d9b27c' : '#c79a62'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a5a30'; ctx.stroke(); } });
      const bark = M.matte('#5a3b26', 0.95); const body = part(new THREE.CylinderGeometry(R0, R0, th, 48), [bark, new THREE.MeshStandardMaterial({ map: face, roughness: 0.8 }), bark]); m.add(body);
      const band = new THREE.Mesh(new THREE.TorusGeometry(R0 * blue, R0 * 0.025, 8, 96), new THREE.MeshStandardMaterial({ color: '#2f8fff', emissive: C('#2f8fff'), emissiveIntensity: 0.9, transparent: true }));
      band.rotation.x = Math.PI / 2; band.position.y = th / 2 + 0.005; band.name = 'blueband'; m.add(band); m.rotation.x = Math.PI / 2 - 0.25; break; }
    case 'wheat': { // a patch of stalks; wilt: {t0, t1} bends them over
      m = new THREE.Group(); const n = p.n || 40, W = s[0] || 4, r6 = rngFrom(Math.round(W * 31) + 3);
      for (let i = 0; i < n; i++) { const st = new THREE.Group(); st.position.set((r6() - 0.5) * W, 0, (r6() - 0.5) * W * 0.6); st.rotation.y = r6() * 6.28;
        const h = 0.8 + r6() * 0.5; const stem = part(new THREE.CylinderGeometry(0.012, 0.018, h, 6), M.matte('#c9a24a', 0.8)); stem.position.y = h / 2; st.add(stem);
        const ear = part(new THREE.CapsuleGeometry(0.035, 0.16, 4, 8), M.matte('#e2bf5c', 0.7)); ear.position.y = h + 0.08; st.add(ear); st.name = 'stalk'; st.userData.ph = r6(); m.add(st); }
      break; }
    case 'flea': { // small brown flea seen side-on: flat teardrop body, tiny head, long bent jumping legs
      m = new THREE.Group(); const brown = M.matte('#8a5a2b', 0.75), dark = M.matte('#4a2c14', 0.8);
      const b = part(new THREE.SphereGeometry(0.08, 16, 12), brown); b.scale.set(1.35, 1.05, 0.55); m.add(b);
      for (let k = 0; k < 3; k++) { const seg = part(new THREE.TorusGeometry(0.075 - k * 0.012, 0.006, 4, 20, Math.PI), dark, false); seg.position.set(-0.03 + k * 0.035, 0.0, 0); seg.rotation.y = Math.PI / 2; seg.rotation.x = 0; seg.scale.set(1, 1.05, 1); m.add(seg); }
      const hd = part(new THREE.SphereGeometry(0.03, 10, 8), dark); hd.position.set(0.11, 0.0, 0); m.add(hd);
      for (let k = 0; k < 6; k++) { const side = k % 2 ? 1 : -1, row = Math.floor(k / 2), L = row === 0 ? 0.2 : 0.12;
        const up = part(new THREE.CylinderGeometry(0.008, 0.007, L * 0.55, 5), dark, false), lo = part(new THREE.CylinderGeometry(0.007, 0.005, L * 0.6, 5), dark, false);
        const leg = new THREE.Group(); leg.position.set(-0.05 + row * 0.06, -0.05, side * 0.035);
        up.position.set(-L * 0.12, L * 0.18, 0); up.rotation.z = 0.9; lo.position.set(-L * 0.2, -L * 0.08, 0); lo.rotation.z = -0.5; leg.add(up, lo); m.add(leg); }
      m.scale.setScalar(p.scale || 1.8); break; }
    case 'rat': { m = new THREE.Group(); const fur = M.fabric(p.fur || '#5e5650'); const body = part(new THREE.CapsuleGeometry(0.16, 0.3, 8, 12), fur); body.rotation.z = Math.PI / 2; body.position.y = 0.17; m.add(body);
      const head = part(new THREE.SphereGeometry(0.13, 16, 12), fur); head.position.set(0.33, 0.22, 0); head.scale.set(1.3, 1, 1); m.add(head);
      for (const sg of [-1, 1]) { const ear = part(new THREE.SphereGeometry(0.06, 12, 8), M.skin('#e8a0a0')); ear.scale.set(0.4, 1, 1); ear.position.set(0.3, 0.33, 0.08 * sg); m.add(ear);
        const ey = part(new THREE.SphereGeometry(0.022, 8, 6), M.gloss('#111'), false); ey.position.set(0.43, 0.26, 0.06 * sg); m.add(ey); }
      const nose = part(new THREE.SphereGeometry(0.025, 8, 6), M.skin('#e88a9a'), false); nose.position.set(0.5, 0.21, 0); m.add(nose);
      const tail = part(new THREE.TorusGeometry(0.32, 0.02, 6, 24, Math.PI * 1.2), M.skin('#d99a9a')); tail.position.set(-0.5, 0.14, 0); tail.rotation.z = Math.PI; m.add(tail); break; }
    case 'icecore': { m = new THREE.Group(); const L = s[1] || 2; const core = part(new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, L, 24), new THREE.MeshPhysicalMaterial({ color: '#d8f0ff', roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 })); m.add(core);
      for (let k = -4; k <= 4; k++) { const ln = part(new THREE.CylinderGeometry(s[0] / 2 + 0.003, s[0] / 2 + 0.003, 0.01, 24, 1, true), M.matte('#a9c9df'), false); ln.position.y = k * L / 10; m.add(ln); }
      const band = new THREE.Mesh(new THREE.CylinderGeometry(s[0] / 2 + 0.006, s[0] / 2 + 0.006, L * 0.06, 24, 1, true), M.glow('#ffd84d', 2.5)); band.position.y = (p.bandAt ?? 0.1) * L; band.name = 'iceband'; m.add(band); m.rotation.z = p.lie ? Math.PI / 2 : 0; break; }
    case 'volcano': { // cone + smoke puffs that rise after erupt (global s); big: true = full eruption (lava streams, glow, ash column, lava bombs)
      m = new THREE.Group(); const H = s[1] || 1.2, Rb = s[0] / 2, big = !!p.big;
      const rockTex = big ? canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#2b2422'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { ctx.fillStyle = i % 2 ? 'rgba(90,74,66,0.35)' : 'rgba(20,16,15,0.35)'; ctx.fillRect((i * 37) % w, (i * 53) % h, 6 + i % 9, 3 + i % 5); } ctx.fillStyle = '#ff7a2a'; ctx.fillRect(0, 0, w, 6); for (let i = 0; i < 5; i++) { const x0 = (i * 53 + 20) % w; ctx.beginPath(); ctx.moveTo(x0, 0); for (let y = 0; y <= h * (0.3 + 0.1 * (i % 4)); y += 8) ctx.lineTo(x0 + Math.sin(y * 0.05 + i) * 9, y); ctx.lineWidth = 3 + (i % 2) * 2; ctx.strokeStyle = '#ff5a1a'; ctx.shadowColor = '#ffb040'; ctx.shadowBlur = 10; ctx.stroke(); } }) : null;
      const coneM = big ? new THREE.MeshStandardMaterial({ map: rockTex, emissiveMap: rockTex, emissive: C('#ffffff'), emissiveIntensity: 0.9, roughness: 1, fog: false }) : M.matte('#5a4a42', 0.95);
      m.add(part(new THREE.ConeGeometry(Rb, H, 32, 1, !big), coneM));
      if (big) { const gl = new THREE.PointLight('#ff6a2a', 6, Rb * 6, 1.5); gl.position.y = H * 0.6; gl.name = 'vglow'; m.add(gl);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (ctx, w) => { const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,140,60,0.9)'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); halo.scale.setScalar(Rb * 1.6); halo.position.y = H / 2 + Rb * 0.15; halo.name = 'vhalo'; m.add(halo);
        for (let k = 0; k < 10; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(Rb * 0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb347', fog: false })); b.name = 'bomb'; b.userData.k = k; b.position.y = H / 2; m.add(b); } }
      const lava = part(new THREE.CircleGeometry(Rb * 0.18, 16), M.glow('#ff6a2a', 2.5), false); lava.rotation.x = -Math.PI / 2; lava.position.y = H / 2 - 0.02; m.add(lava);
      const smoke = canvasTex(128, 128, (ctx, w) => { for (let i = 0; i < 7; i++) { const x = w * (0.3 + 0.4 * ((i * 37) % 10) / 10), y = w * (0.3 + 0.4 * ((i * 53) % 10) / 10), r = w * (0.22 + 0.04 * (i % 3)); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, w); } });
      const NP = big ? 30 : 14; for (let k = 0; k < NP; k++) { const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke, color: big ? (k % 4 === 0 ? '#c0704a' : k % 2 ? '#6d625c' : '#8d8079') : k % 3 ? '#5a5350' : '#7a706a', transparent: true, opacity: 0, depthWrite: false, fog: !big })); const sz = Rb * (big ? 0.5 + (k % 5) * 0.12 : 0.35 + (k % 4) * 0.08); puff.scale.setScalar(sz); puff.position.y = H / 2; puff.name = 'puff'; puff.userData.k = k; puff.userData.sz = sz; m.add(puff); }
      m.children[0].position.y = 0; break; }
    case 'houses': { // a row of houses with lit windows; dark: {t0, t1, n} turns n windows off one by one
      m = new THREE.Group(); const n = p.n || 5, wdt = s[0] || 8, r7 = rngFrom(n * 7 + 1); const wins = [];
      for (let i = 0; i < n; i++) { const hw = wdt / n, hh = 2 + r7() * 1.2, x = -wdt / 2 + hw * (i + 0.5);
        const wall = part(new THREE.BoxGeometry(hw * 0.95, hh, 1.4), M.matte(['#c9a27c', '#b7836a', '#d7c29a', '#a98f75', '#c4ad8c'][i % 5], 0.9)); wall.position.set(x, hh / 2, 0); m.add(wall);
        const roof = part(new THREE.ConeGeometry(hw * 0.75, 0.9, 4), M.matte('#7a3b2a', 0.85)); roof.position.set(x, hh + 0.45, 0); roof.rotation.y = Math.PI / 4; m.add(roof);
        for (const wy of [hh * 0.35, hh * 0.72]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(hw * 0.28, hh * 0.18), new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: C('#ffb347'), emissiveIntensity: 2.2 })); win.position.set(x, wy, 0.71); m.add(win); wins.push(win);
          const sh = new THREE.Mesh(new THREE.PlaneGeometry(hw * 0.3, hh * 0.2), M.matte('#4a3324', 0.9)); sh.position.set(x, wy, 0.715); sh.visible = false; sh.name = 'shutter'; m.add(sh); win.userData.shutter = sh; } }
      m.userData.wins = wins; break; }
    case 'map': { // stylised Mediterranean map; cities light up / turn red; routes draw on (size [width])
      const W = s[0] || 6; MAPS = MAPS || []; const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 760; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      m = new THREE.Mesh(new THREE.PlaneGeometry(W, W * 760 / 1400), new THREE.MeshBasicMaterial({ map: tex, fog: false })); m.userData.map = { cv, tex, p, last: -1 }; break; }
    case 'rock': m = part(rockGeo(s[0] / 2, Math.round((p.pos?.[0] || 0) * 13 + 7)), M.matte(p.color || '#8a7a6a', 0.9)); break;
    case 'crater': { m = new THREE.Group(); const R0 = s[0] / 2;
      const rim = part(new THREE.TorusGeometry(R0, R0 * 0.16, 16, 64), new THREE.MeshStandardMaterial({ map: noiseTex('#a07a52', '#7a5a3a', 8, 2), roughness: 0.95 })); rim.rotation.x = Math.PI / 2; rim.scale.z = 0.55; m.add(rim);
      const bowl = part(new THREE.SphereGeometry(R0, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5e4128', roughness: 1, side: THREE.BackSide })); bowl.scale.y = 0.35; m.add(bowl);
      const r3 = rngFrom(Math.round(R0 * 100)); for (let i = 0; i < 6; i++) { const a = r3() * Math.PI * 2; const rk = part(rockGeo(0.12 + r3() * 0.12, i + 3, 1), M.matte('#7a6a5a', 0.95)); rk.position.set(Math.cos(a) * R0 * 1.25, 0.05, Math.sin(a) * R0 * 1.25); m.add(rk); }
      break; }
    case 'sphere': m = part(new THREE.SphereGeometry(s[0] / 2, 32, 24), p.glow ? M.glow(p.color, 2) : M.gloss(p.color)); break;
    case 'cone': m = part(new THREE.ConeGeometry(s[0] / 2, s[1], 32), p.color === '#ffffff' ? new THREE.MeshPhysicalMaterial({ color: '#dff4ff', roughness: 0.08, clearcoat: 1, transmission: 0, transparent: true, opacity: 0.92 }) : M.matte(p.color)); break;
    case 'cylinder': m = part(new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], 32), M.matte(p.color)); break;
    case 'torus': m = part(new THREE.TorusGeometry(s[0], s[1] || 0.1, 24, 160), p.glow ? M.glow(p.color, 1.6) : M.matte(p.color)); break;
    case 'lamp': { m = new THREE.Group(); const pole = part(new THREE.CylinderGeometry(0.05, 0.06, 2, 12), M.metal('#555')); pole.position.y = 1; m.add(pole);
      const bulb = part(new THREE.SphereGeometry(0.22, 24, 16), M.glow(p.color || '#fff2b0', 4)); bulb.position.y = 2.1; m.add(bulb); const pl = new THREE.PointLight(p.color || '#fff2b0', 6, 7); pl.position.y = 2.1; m.add(pl); break; }
    default: { const geo = new THREE.BoxGeometry(...s, 2, 2, 2); m = part(geo, M.gloss(p.color || '#cccccc')); }
  }
  if (p.glow && m.material && !m.material.emissiveIntensity) m.material = M.glow(p.color, 1.6);
  m.position.set(...(p.pos || [0, 0, 0]));
  if (p.rot) m.rotation.set(m.rotation.x + p.rot[0], m.rotation.y + p.rot[1], m.rotation.z + p.rot[2]);
  if (p.scale) m.scale.setScalar(p.scale);
  const keepMap = m.userData && m.userData.map; const keepWins = m.userData && m.userData.wins;
  m.userData = { type: p.type, spin: p.spin || 0, base: m.position.clone(), baseRot: m.rotation.clone(), move: p.move, fall: p.fall, orbit: p.orbit, appear: p.appear, at: p.at, spread: p.spread, dotsReveal: p.dotsReveal, ice: p.ice, r: (s[0] || 1) / 2, dots: p.dots || 0, dotsLat: p.dotsLat ?? 0.25, map: keepMap, wins: keepWins, wilt: p.wilt, hop: p.hop, erupt: p.erupt, loopPlume: p.loopPlume, big: !!p.big, h: s[1] || 1.2, glowAt: p.glowAt, dark: p.dark, shutters: p.shutters, shutters: p.shutters };
  return m;
}

// ---------- worlds ----------
const SOFT_WORLDS = {
  space:  { sky: ['#02030c', '#0b1638', '#1a1240'], ground: null },
  desert: { sky: ['#5fa8e8', '#bfe0f5', '#ffe2b0'], ground: ['#e3b877', '#c9955a'], fog: '#f3d7a8' },
  lab:    { sky: ['#c9dbe6', '#dce8ee', '#dce8ee'], ground: ['#c9d1d8', '#b3bdc6'], room: '#bfe0e6', fog: null },
  office: { sky: ['#dfe9ef', '#eef3f5', '#eef3f5'], ground: ['#b9a58a', '#9c8a70'], room: '#f1ebe1', fog: '#f1ebe1' },
  prison: { sky: ['#ffd0de', '#ffe3ec', '#ffe3ec'], ground: ['#a8a8a8', '#8c8c8c'], room: '#f7a8c4', fog: '#ffe3ec' },
  ice:    { sky: ['#6f9cc9', '#b8d3ea', '#dcebf5'], ground: ['#e3edf4', '#c2d5e3'], fog: '#cfe0ec' },
  dusk:   { sky: ['#1b1440', '#5a2f6b', '#ff8a5c'], ground: ['#3a3846', '#2a2833'], fog: '#5a3d6b' },
  duskfield: { sky: ['#140f38', '#4a2a66', '#ff9a66'], ground: ['#5a4a5e', '#3e3346'], fog: '#6a4a72' },
  harbour:  { sky: ['#05060f', '#141a3a', '#3a2440'], ground: ['#5b5550', '#47423e'], fog: '#1a1a2e' },
  harbourday: { sky: ['#5fa8e8', '#bfe0f5', '#ffe9c4'], ground: ['#a89a88', '#8f8272'], fog: '#d8e6ef' },
  studio:   { sky: ['#0b1026', '#141c3e', '#1d2650'], ground: null },
  rainfield: { sky: ['#4a5566', '#6f7a88', '#8a939e'], ground: ['#6b6a50', '#57563f'], fog: '#7d8794' },
  city:   { sky: ['#4f9ae0', '#b9dcf5', '#f0f6fa'], ground: ['#6d6f78', '#5a5c66'], fog: '#cfe2f0' },
  ocean:  { sky: ['#4f9ae0', '#b9dcf5', '#f0f6fa'], ground: ['#2f7fbf', '#1f5f9a'], fog: '#cfe2f0' },
};
function skyTex(cols, stars) {
  return canvasTex(64, 1024, (ctx, w, h) => { const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, cols[0]); gr.addColorStop(0.55, cols[1]); gr.addColorStop(1, cols[2]); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    if (stars) { const r = rngFrom(5); for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; ctx.fillRect(r() * w, r() * h, r() < 0.1 ? 1.5 : 0.8, 0.6); } } });
}
function windowTex(seed) {
  return canvasTex(128, 256, (ctx, w, h) => { const r = rngFrom(seed); ctx.fillStyle = '#2a2838'; ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 8; y += 20) for (let x = 8; x < w - 8; x += 24) { ctx.fillStyle = r() < 0.55 ? (r() < 0.5 ? '#ffd27a' : '#ffe9b8') : '#3d3a52'; ctx.fillRect(x, y, 14, 12); } });
}
function displacedGround(w, amp, scale, seed, mat) {
  const g = new THREE.PlaneGeometry(w, w, 160, 160), p = g.attributes.position, nz = makeNoise(seed);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y); const fall = Math.min(1, Math.max(0, (d - 5) / 10)); p.setZ(i, (nz(x / scale + 50, y / scale + 50, 4) - 0.5) * amp * fall); }
  g.computeVertexNormals(); const m = part(g, mat, false); m.rotation.x = -Math.PI / 2; return m;
}
export function setupScene(scene, worldName, seed) {
  const w = SOFT_WORLDS[worldName] || SOFT_WORLDS.office, space = worldName === 'space' || worldName === 'studio';
  scene.background = skyTex(w.sky, worldName === 'space' || worldName === 'dusk' || worldName === 'harbour');
  const room = !!w.room, bright = room || worldName === 'ice';
  scene.environment = envTex; scene.environmentIntensity = space ? 0.25 : (worldName === 'dusk' || worldName === 'duskfield') ? 0.35 : bright ? 0.4 : 0.6;
  if (w.fog) scene.fog = new THREE.Fog(w.fog, 18, 70);
  // light rig: key (warm, soft shadow) + fill (sky) + rim (cool, behind)
  scene.add(new THREE.HemisphereLight(w.sky[1], w.ground ? w.ground[1] : '#000000', space ? 0.15 : bright ? 0.3 : 0.5));
  const key = new THREE.DirectionalLight(space ? '#fff3e0' : ((worldName === 'dusk' || worldName === 'duskfield') ? '#ffb27a' : '#fff1dc'), space ? 3.2 : bright ? 1.7 : 2.4);
  key.position.set(space ? 8 : 5, space ? 3 : 8, space ? 6 : 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 40 }); scene.add(key);
  const rim = new THREE.DirectionalLight(space ? '#7fb2ff' : '#bcd6ff', space ? 1.2 : 1.1); rim.position.set(-5, 4, -6); scene.add(rim);
  const r = rngFrom(seed * 97 + 3), world = new THREE.Group(); scene.add(world);
  if (space) return;
  const gmat = new THREE.MeshStandardMaterial({ map: noiseTex(w.ground[0], w.ground[1], 8, 14, worldName === 'desert' ? 6 : 0), roughness: worldName === 'ice' ? 0.35 : 0.92 });
  if (worldName === 'harbour' || worldName === 'harbourday') { // quay, water, house fronts, lamp posts
    const night = worldName === 'harbour';
    const water = part(new THREE.PlaneGeometry(140, 60, 1, 1), new THREE.MeshPhysicalMaterial({ color: night ? '#0d1a33' : '#2f6fa8', roughness: 0.15, clearcoat: 1, metalness: 0.1 }), false); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.6, -32); world.add(water);
    const quay = part(new THREE.BoxGeometry(60, 0.6, 14), new THREE.MeshStandardMaterial({ map: noiseTex('#8a8076', '#6e655c', 16, 8, 10), roughness: 0.95 })); quay.position.set(0, -0.3, 5); world.add(quay);
    for (let i = -6; i <= 6; i++) { const post = part(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 10), M.matte('#4a3324')); post.position.set(i * 2.2, 0.35, -1.8); world.add(post); }
    const row = makeProp({ type: 'houses', size: [30], n: 10, pos: [0, 0, 13] }); row.rotation.y = Math.PI; world.add(row);
    for (const x of [-4.5, 4.5]) world.add(makeProp({ type: 'lamp', color: '#ffc77a', pos: [x, 0, 0.5] }));
    if (night) for (let i = 0; i < 3; i++) { const g = part(new THREE.SphereGeometry(0.4, 12, 8), M.glow('#ffb347', 3), false); g.position.set(-20 + i * 18, 3, -40); world.add(g); }
  } else if (worldName === 'desert' || worldName === 'ice' || worldName === 'duskfield' || worldName === 'rainfield') {
    world.add(displacedGround(140, worldName === 'desert' ? 3.2 : worldName === 'rainfield' ? 1.2 : 2.2, 14, seed, gmat));
    for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, d = 8 + r() * 22; const rk = part(rockGeo(0.3 + r() * 1.1, i * 7 + seed, 2), M.matte(worldName === 'desert' ? '#b07d4f' : worldName === 'duskfield' ? '#4a3e52' : '#e9f3fa', worldName === 'ice' ? 0.25 : 0.95)); rk.position.set(Math.cos(a) * d, 0, -Math.abs(Math.sin(a) * d) - 4); world.add(rk); }
    if (worldName === 'desert') for (let i = 0; i < 5; i++) { const h = 4 + r() * 6; const mesa = part(new THREE.CylinderGeometry(2 + r() * 2, 3 + r() * 3, h, 9), M.matte('#b9774a', 0.95)); mesa.position.set((r() - 0.5) * 60, h / 2 - 0.5, -30 - r() * 20); world.add(mesa); }
    if (worldName === 'ice') for (let i = 0; i < 8; i++) { const h = 1.5 + r() * 3; const sp = part(new THREE.ConeGeometry(0.4 + r() * 0.5, h, 7), new THREE.MeshPhysicalMaterial({ color: '#cfeeff', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); sp.position.set((r() - 0.5) * 16, h / 2 - 0.2, -5 - r() * 10); world.add(sp); }
  } else if (worldName === 'dusk' || worldName === 'city') {
    const road = part(new THREE.PlaneGeometry(140, 140), gmat, false); road.rotation.x = -Math.PI / 2; world.add(road);
    for (let i = 0; i < 26; i++) { const h = 5 + r() * 16, bw = 2 + r() * 2.5; const wt = windowTex(i + seed); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(Math.round(bw), Math.round(h / 3));
      const b = part(new THREE.BoxGeometry(bw, h, bw), new THREE.MeshStandardMaterial({ color: '#4a4660', roughness: 0.7, emissive: '#ffffff', emissiveMap: wt, emissiveIntensity: worldName === 'dusk' ? 1.6 : 0.15 }));
      b.position.set((i % 2 ? 1 : -1) * (4 + r() * 18), h / 2, -6 - r() * 30); world.add(b); }
    for (let i = 0; i < 4; i++) { const lp = makeProp({ type: 'lamp', color: '#ffd9a0', pos: [(i % 2 ? 2.8 : -2.8), 0, -1 - i * 5] }); world.add(lp); }
  } else { // rooms: tiled floor, painted walls with skirting, a window, furniture
    const tiles = canvasTex(256, 256, (ctx, W) => { ctx.fillStyle = '#9aa3ab'; ctx.fillRect(0, 0, W, W); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const n = N(x * 3 + seed, y * 3, 2); ctx.fillStyle = `hsl(200, 10%, ${66 + n * 10}%)`; ctx.fillRect(x * 128 + 3, y * 128 + 3, 122, 122); } }, { repeat: 20 });
    const floor = part(new THREE.PlaneGeometry(40, 40), new THREE.MeshPhysicalMaterial({ map: worldName === 'office' ? noiseTex(w.ground[0], w.ground[1], 30, 10) : tiles, roughness: 0.35, clearcoat: 0.3 }), false); floor.rotation.x = -Math.PI / 2; world.add(floor);
    const wallM = M.matte(w.room, 0.9);
    const back = part(new THREE.BoxGeometry(16, 7, 0.3), wallM); back.position.set(0, 3.5, -4.5); world.add(back);
    for (const x of [-8, 8]) { const side = part(new THREE.BoxGeometry(0.3, 7, 16), wallM); side.position.set(x, 3.5, 3); world.add(side); }
    const skirt = part(new THREE.BoxGeometry(16, 0.35, 0.1), M.gloss('#ffffff')); skirt.position.set(0, 0.17, -4.32); world.add(skirt);
    const win = part(new THREE.BoxGeometry(3.2, 2.2, 0.05), M.glow('#cfe9ff', 1.3)); win.position.set(-3.5, 3.6, -4.33); world.add(win);
    for (const dx of [0]) { const fr = part(new THREE.BoxGeometry(3.4, 0.1, 0.12), M.gloss('#ffffff')); fr.position.set(-3.5 + dx, 3.6, -4.28); world.add(fr); const fv = part(new THREE.BoxGeometry(0.1, 2.4, 0.12), M.gloss('#ffffff')); fv.position.set(-3.5, 3.6, -4.28); world.add(fv); }
    if (worldName === 'lab') { const desk = part(new THREE.BoxGeometry(5, 0.12, 1.2, 2, 2, 2), M.gloss('#e9eef2')); desk.position.set(2.5, 1.05, -3.6); world.add(desk);
      const legs = part(new THREE.BoxGeometry(4.8, 1.0, 1.0), M.matte('#7d8a96', 0.6)); legs.position.set(2.5, 0.5, -3.6); world.add(legs);
      const glassM = new THREE.MeshPhysicalMaterial({ color: '#dff6ff', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.45 });
      ['#4fd1c5', '#ff6b9a', '#ffd84d'].forEach((lc, k) => { const fl = part(lathe([[0, 0], [0.22, 0.02], [0.24, 0.12], [0.1, 0.38], [0.07, 0.55], [0.07, 0.62]], 24), glassM); fl.position.set(1.2 + k * 0.8, 1.11, -3.5); world.add(fl);
        const liq = part(lathe([[0, 0], [0.2, 0.02], [0.21, 0.11], [0.12, 0.28], [0, 0.28]], 24), M.glow(lc, 0.6)); liq.position.copy(fl.position); world.add(liq); });
      const shelf = part(new THREE.BoxGeometry(3, 0.08, 0.5), M.gloss('#ffffff')); shelf.position.set(3, 3.2, -4.2); world.add(shelf);
      for (let k = 0; k < 5; k++) { const bk = part(new THREE.BoxGeometry(0.18, 0.5 + r() * 0.2, 0.35), M.matte(['#e84a5f', '#2f6db5', '#ffb347', '#3c8a4f', '#7a5aa8'][k], 0.7)); bk.position.set(1.9 + k * 0.22, 3.5, -4.2); world.add(bk); }
      const plant = part(new THREE.SphereGeometry(0.5, 20, 14), M.fabric('#3c8a4f')); plant.position.set(-6.5, 1.3, -3.5); world.add(plant); const pot = part(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 20), M.gloss('#d9764f')); pot.position.set(-6.5, 0.3, -3.5); world.add(pot); }
  }
}
const LAND = [
 [[-1,48],[42,48],[42,41.6],[41.5,41.5],[38.5,40.9],[36,41.7],[33.5,42],[31,41.1],[29,41.2],[28,41.6],[27.9,42.9],[28.6,44.3],[29.6,45],[30,45.8],[31,46.6],[32.5,45.4],[33.5,45.3],[33,44.6],[34,44.4],[35.5,45.2],[37,45.2],[38,44.4],[40,43.4],[41.8,42.6],[42,41.5]],
 [[13.7,45.6],[14.5,45.2],[15.2,44.3],[16.4,43.5],[18.1,42.6],[19.4,41.9],[19.4,40.4],[20.2,39.5],[21.1,38.3],[22,36.8],[23,36.5],[23.2,37.9],[24,38.2],[22.9,39.4],[23.8,40.1],[26,40.8],[26.2,40.1],[26.2,39.4],[27,38.4],[27.3,37],[28.3,36.7],[30.6,36.8],[32.5,36.1],[36,36.6],[35.9,34],[42,34],[42,41.6],[29,41.2],[28,41.6],[27.9,42.9],[28.6,44.3],[29.6,45],[30,45.8],[31,46.6],[24,48],[13.7,48]],
 [[-1,48],[13.7,48],[13.7,45.6],[12.3,45.2],[12.4,44.2],[13.6,43.5],[14,42.6],[15.1,41.9],[16.1,41.9],[15.9,41.6],[16.9,41.2],[18,40.7],[18.5,40.1],[18,40.2],[16.9,40.4],[16.5,39.7],[17.1,39.4],[17.1,39],[16.6,38.4],[16.1,37.9],[15.7,38],[16.2,38.9],[15.7,39.9],[15,40.2],[14.3,40.8],[13.5,41.2],[12.4,41.7],[11.2,42.4],[10.5,42.9],[10.2,43.9],[8.8,44.4],[7.5,44],[6.8,43.2],[4.5,43.4],[3,43.2],[-1,43.4]],
 [[12.4,37.8],[13.3,38.2],[15.6,38.3],[15.1,37.5],[15.2,36.7],[14.3,37],[12.6,37.6]], [[8.2,41.1],[9.6,41],[9.8,40],[9.6,39.2],[8.5,39],[8.4,40]], [[9.4,43],[9.6,42],[9.2,41.4],[8.6,41.9],[8.7,42.6]],
 [[-1,34],[-1,35.5],[5,36.8],[9.8,37.3],[11.1,37],[10.4,35.8],[11,35.2],[10.2,34]],
];
const WATER = [[[35,45.4],[36.6,45.4],[37.5,46.6],[39.2,47.2],[38.2,47.1],[35.5,46.3],[35,45.6]]];
const CITY = { venice: [12.33, 45.44, 'VENICE', 'a'], genoa: [8.93, 44.41, 'GENOA', 'bl'], pisa: [10.4, 43.72, 'PISA', 'r'], milan: [9.19, 45.46, 'MILAN', 'a'], rome: [12.5, 41.9, 'ROME', 'l'], tana: [39.3, 47.1, 'BLACK SEA PORTS', 'a'] }; // label side: a above, b below, bl below-left, l left, r right
const ROUTE = { venice: [[39.3,47.1],[36.5,45.6],[33,44],[29,41.2],[26,39.8],[24.5,37.6],[21.5,36.3],[19,39],[17.5,41.8],[14.5,44],[12.6,45.3]], genoa: [[39.3,47.1],[36.5,45.6],[33,44],[29,41.2],[26,39.8],[24.5,37.6],[21.5,36.3],[17,37.6],[15.6,38.2],[12.5,39.8],[10.2,42.4],[9.2,44.1]], pisa: [[39.3,47.1],[36.5,45.6],[33,44],[29,41.2],[26,39.8],[24.5,37.6],[21.5,36.3],[17,37.6],[15.6,38.2],[12.5,39.8],[10.6,42.6],[10.25,43.6]] };
function drawMap(st, t) {
  const tq = Math.round(t * 15) / 15; if (st.last === tq) return; st.last = tq;
  const { cv, tex, p } = st, ctx = cv.getContext('2d'), W = cv.width, H = cv.height, L0 = p.view ? p.view[0] : 4, L1 = p.view ? p.view[1] : 42, B0 = 34, B1 = 48;
  const X = (lon) => (lon - L0) / (L1 - L0) * W, Y = (lat) => (1 - (lat - B0) / (B1 - B0)) * H;
  ctx.fillStyle = '#2f6fa8'; ctx.fillRect(0, 0, W, H);
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(X(a), Y(b)) : ctx.moveTo(X(a), Y(b))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1b3a5c'; ctx.stroke(); };
  LAND.forEach(pg => poly(pg, '#e9d7a8')); WATER.forEach(pg => poly(pg, '#2f6fa8'));
  for (const r of (p.routes || [])) { const pts = ROUTE[r.to]; if (!pts) continue; const k = Math.max(0, Math.min(1, (t - r.t0) / (r.t1 - r.t0))); if (k <= 0) continue;
    const n = pts.length - 1, upto = k * n; ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
    for (let i = 1; i <= Math.ceil(upto); i++) { const f = Math.min(1, upto - (i - 1)); const a = pts[i - 1], b = pts[i]; ctx.lineTo(X(a[0] + (b[0] - a[0]) * f), Y(a[1] + (b[1] - a[1]) * f)); }
    ctx.setLineDash([18, 12]); ctx.lineWidth = 7; ctx.globalAlpha = r.faded ? 0.35 : 1; ctx.strokeStyle = (r.redAt !== undefined && t >= r.redAt) ? '#e53935' : '#8a4b1f'; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    if (k < 1 && r.ship !== false) { const i = Math.min(n - 1, Math.floor(upto)), f = upto - i, a = pts[i], b2 = pts[i + 1]; const hx = X(a[0] + (b2[0] - a[0]) * f), hy = Y(a[1] + (b2[1] - a[1]) * f);
      ctx.fillStyle = '#6b4226'; ctx.beginPath(); ctx.moveTo(hx - 22, hy - 4); ctx.lineTo(hx + 22, hy - 4); ctx.lineTo(hx + 14, hy + 10); ctx.lineTo(hx - 14, hy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f3e7c9'; ctx.fillRect(hx - 3, hy - 30, 18, 24); ctx.fillStyle = '#4a3324'; ctx.fillRect(hx - 4, hy - 34, 4, 32); } }
  ctx.font = `bold ${p.labelSize || 40}px Montserrat, Arial`; ctx.textAlign = 'center';
  if (p.legend) { ctx.fillStyle = 'rgba(20,16,30,0.75)'; ctx.fillRect(16, H - 64, 520, 48); ctx.beginPath(); ctx.arc(46, H - 40, 13, 0, 7); ctx.fillStyle = '#e53935'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 30px Montserrat, Arial'; ctx.fillText(p.legend, 72, H - 30); ctx.textAlign = 'center'; ctx.font = `bold ${p.labelSize || 40}px Montserrat, Arial`; }
  for (const c of (p.cities || [])) { const d = CITY[c.id]; if (!d || (c.t0 !== undefined && t < c.t0)) continue; const red = c.redAt !== undefined && t >= c.redAt; const x = X(d[0]), y = Y(d[1]);
    const pulse = red ? 1 + 0.25 * Math.abs(Math.sin((t - c.redAt) * 5)) : 1; ctx.beginPath(); ctx.arc(x, y, 14 * pulse, 0, Math.PI * 2); ctx.fillStyle = red ? '#e53935' : c.safe ? '#2fbf71' : (c.color || '#ffcc33'); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3a2a1a'; ctx.stroke();
    if (c.label !== false) { const side = c.side || d[3] || 'a'; ctx.textAlign = side === 'l' || side === 'bl' ? 'right' : side === 'r' ? 'left' : 'center'; const lx = side === 'l' ? x - 24 : side === 'bl' ? x + 30 : side === 'r' ? x + 24 : x, ly = side === 'b' || side === 'bl' ? y + 52 : side === 'a' ? y - 26 : y + 14;
      ctx.lineWidth = 8; ctx.strokeStyle = '#1a1420'; ctx.strokeText(d[2], lx, ly); ctx.fillStyle = '#ffffff'; ctx.fillText(d[2], lx, ly); ctx.textAlign = 'center'; } }
  tex.needsUpdate = true;
}
export function animateProp(m, t) {
  const cl = m.getObjectByName && m.getObjectByName('clouds'); if (cl) cl.rotation.y = t * 0.05;
  const u = m.userData;
  if (u.type === 'moon') m.children.filter(c => c.name === 'cloud').forEach(c => { c.position.x = ((t * 0.25 + c.userData.k * 2.2) % 5) - 2.5; });
  if (u.wilt) { const k = Math.max(0, Math.min(1, (t - u.wilt.t0) / (u.wilt.t1 - u.wilt.t0))); m.children.forEach(st => { if (st.name === 'stalk') st.rotation.x = k * (0.9 + st.userData.ph * 0.6) + Math.sin(t * 2 + st.userData.ph * 6) * 0.05; }); }
  else if (u.type === 'wheat') m.children.forEach(st => { if (st.name === 'stalk') st.rotation.x = Math.sin(t * 1.6 + st.userData.ph * 6) * 0.08; });
  if (u.hop) { const ph = (t * (u.hop.speed || 2.2) + (u.hop.phase || 0)) % 1; m.position.y = u.base.y + Math.sin(ph * Math.PI) * (u.hop.h || 0.6); m.position.x = u.base.x + (u.hop.dx || 0) * ((t * (u.hop.speed || 2.2) + (u.hop.phase || 0)) % 3) / 3; }
  if (u.glowAt !== undefined) { const b = m.getObjectByName('blueband') || m.getObjectByName('iceband'); if (b) { const k = Math.max(0, Math.min(1, (t - u.glowAt) / 0.6)); b.material.emissiveIntensity = (b.name === 'blueband' ? 0.15 + 0.85 * k : 0.2 + 2.6 * k); b.material.opacity = 0.25 + 0.75 * k; } }
  if (u.erupt !== undefined && u.big) { const Rb = u.r || 1, H = u.h, e0 = t - u.erupt;
    m.children.forEach(c => {
      if (c.name === 'puff') { let d = e0 - c.userData.k * 0.12; if (u.loopPlume && d > 0) d = d % 3.6; const on = d > 0;
        c.material.opacity = on ? Math.min(1, d * 2.5) * Math.max(0, 1 - d * 0.18) : 0; c.position.y = H / 2 + (on ? d * H * 0.75 : 0); c.position.x = on ? Math.sin(c.userData.k * 1.7) * d * Rb * 0.18 + d * Rb * 0.12 : 0;
        c.scale.setScalar(c.userData.sz * (0.6 + (on ? d * 0.75 : 0))); }
      else if (c.name === 'bomb') { const k = c.userData.k; let d = e0 - k * 0.31; if (d > 0) d = d % 1.6; const on = e0 > 0 && d > 0;
        const ang = k * 2.4, v = Rb * (0.9 + (k % 3) * 0.25); c.visible = on; if (on) c.position.set(Math.cos(ang) * v * 0.45 * d, H / 2 + v * 1.6 * d - Rb * 1.4 * d * d, Math.sin(ang) * v * 0.3 * d); }
      else if (c.name === 'vglow') c.intensity = e0 > 0 ? 5 + 2.5 * Math.sin(t * 9) * Math.sin(t * 3.7) : 1.5;
      else if (c.name === 'vhalo') c.material.opacity = e0 > 0 ? 0.75 + 0.25 * Math.sin(t * 7) : 0.3; }); }
  else if (u.erupt !== undefined) m.children.filter(c => c.name === 'puff').forEach(c => { let d = t - u.erupt - c.userData.k * 0.25; if (u.loopPlume && d > 0) d = d % 4; const on = d > 0; c.material.opacity = on ? Math.max(0, Math.min(1, d * 3) * (0.9 - d * 0.2)) : 0; c.position.y = (u.r || 0.6) + (on ? d * 0.55 : 0); c.position.x = on ? Math.sin(c.userData.k * 1.7) * d * 0.18 : 0; if (c.userData.sz) c.scale.setScalar(c.userData.sz * (1 + (on ? d * 0.45 : 0))); });
  if (u.dark && u.wins) { const k = (t - u.dark.t0) / (u.dark.t1 - u.dark.t0); const n = u.dark.n ?? u.wins.length; u.wins.forEach((w, i) => { const off = k >= 0 && i < Math.ceil(Math.min(1, k) * n); w.material.emissiveIntensity = off ? 0 : 2.2; w.material.color.set(off ? '#1c1a24' : '#ffcf7a'); if (u.shutters) w.userData.shutter.visible = off; }); }
  if (u.map) drawMap(u.map, t);
  if (u.ice) { const k = Math.max(0, Math.min(1, (t - u.ice.t0) / (u.ice.t1 - u.ice.t0))); const ang = Math.max(0.01, k * (u.ice.to || 60) * Math.PI / 180);
    m.children.filter(c => c.name === 'icecap').forEach(c => { const g = new THREE.SphereGeometry(u.r * 1.004, 64, 24, 0, Math.PI * 2, c.userData.sgn > 0 ? 0 : Math.PI - ang, ang); c.geometry.dispose(); c.geometry = g; }); }
  if (u.dotsReveal) { const dots = m.children.filter(c => c.name === 'dot'); const k = Math.max(0, Math.min(1, (t - u.dotsReveal.t0) / (u.dotsReveal.t1 - u.dotsReveal.t0))); dots.forEach((d, i) => { d.visible = i < Math.round(k * dots.length); }); }
  if (u.type === 'breakup' && u.at !== undefined) { const d = Math.max(0, t - u.at);
    m.children.forEach((f, i) => { const k = d * (u.spread || 1.6); f.position.copy(f.userData.home).addScaledVector(f.userData.dir, k);
      f.scale.set(1 + Math.min(d, 0.6), 1, 1); f.rotation.set(t * (1 + i % 3), t * 0.7, 0); }); }
}
