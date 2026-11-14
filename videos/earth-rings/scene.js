import * as THREE from 'three';
import * as SOFT from '/soft.js';

const story = await (await fetch('/story.json')).json();
const SC = Number(new URLSearchParams(location.search).get('scale') || 1);
const W = Math.round(story.width * SC), H = Math.round(story.height * SC);
const wrap = document.getElementById('wrap');
const capEl = document.getElementById('cap');
const flashEl = document.createElement('div'); flashEl.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none'; wrap.appendChild(flashEl);
const vigEl = document.createElement('div'); vigEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.35) 100%)'; wrap.appendChild(vigEl);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
wrap.prepend(renderer.domElement);
const CAP = Object.assign({ words: 3, active: '#FFE14D', key: '#5CFFB0', size: 0.105, highlight: [] }, story.captions || {});
capEl.style.fontSize = Math.round(W * CAP.size) + 'px';

const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
const SOFTSTYLE = story.style === 'soft'; // semi-realistic cartoon look (soft.js)
if (SOFTSTYLE) { SOFT.init(renderer, story, W, H); vigEl.style.background = 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,.28) 100%)'; }
// cartoon look: 3-step toon shading + ink outline (normal-extruded back faces)
const GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const mat = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD });
const INK_COLOR = story.ink || '#17121d';
const FLAT = new Set(['PlaneGeometry', 'CircleGeometry', 'RingGeometry']);
function inkMat(w) {
  const m = new THREE.MeshBasicMaterial({ color: INK_COLOR, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.uniforms.inkW = { value: w }; sh.vertexShader = 'uniform float inkW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * inkW;'); };
  m.customProgramCacheKey = () => 'ink';
  return m;
}
const mesh = (g, c, shadow = true, ink = true) => {
  const m = new THREE.Mesh(g, mat(c)); m.castShadow = shadow; m.receiveShadow = true;
  if (ink && story.outline !== false && !FLAT.has(g.type)) {
    g.computeBoundingSphere();
    const o = new THREE.Mesh(g, inkMat(Math.min(0.07, Math.max(0.008, g.boundingSphere.radius * 0.05)))); o.castShadow = false; m.add(o);
  }
  return m;
};

// ---------- characters ----------
// spec: {color (shirt), skin, pants, shoes, hair:{style:'tuft|bob|spiky|bun|cap|bald', color}, outfit:'labcoat|scarf|explorer|none',
//        glasses:true, expr:'smile|wow|worried|neutral|grin', hold:'magnifier|clipboard|none', cheeks:true}
const SKINS = ['#ffd7b5', '#f1c27d', '#c68642', '#8d5524', '#ffe0bd'];
function hash(str) { let h = 7; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; }
function makeCharacter(spec) {
  const c = typeof spec === 'string' ? { color: spec } : spec;
  const shirt = c.color || '#7ad0ff', skin = c.skin || SKINS[hash(shirt) % SKINS.length], pants = c.pants || '#3b4a6b', shoes = c.shoes || '#2b2b2b';
  const g = new THREE.Group(); const eyes = [];
  // legs + shoes
  for (const s of [-1, 1]) {
    const leg = mesh(new THREE.CapsuleGeometry(0.11, 0.28, 6, 10), pants); leg.position.set(0.16 * s, 0.3, 0); g.add(leg);
    const shoe = mesh(new THREE.SphereGeometry(0.14, 14, 10), shoes); shoe.scale.set(1, 0.6, 1.5); shoe.position.set(0.16 * s, 0.07, 0.06); g.add(shoe);
  }
  // torso
  const body = mesh(new THREE.CapsuleGeometry(0.34, 0.5, 8, 16), shirt); body.position.y = 0.85; g.add(body);
  const belt = mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.07, 24), '#2a2230'); belt.position.y = 0.6; g.add(belt);
  if (c.outfit === 'labcoat') {
    const coat = mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.75, 24, 1, true, 0.5, Math.PI * 2 - 1.0), '#f7f7f2'); coat.position.y = 0.78; coat.rotation.y = Math.PI / 2 + Math.PI; g.add(coat);
    const pocket = mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), '#e3e3dd'); pocket.position.set(-0.22, 0.95, 0.31); g.add(pocket);
  }
  if (c.outfit === 'explorer') { const vest = mesh(new THREE.CylinderGeometry(0.355, 0.37, 0.45, 24), '#b58b52'); vest.position.y = 0.92; g.add(vest); }
  // head
  const headG = new THREE.Group(); headG.position.y = 1.55; g.add(headG);
  const head = mesh(new THREE.SphereGeometry(0.4, 32, 24), skin); headG.add(head);
  for (const s of [-1, 1]) { const ear = mesh(new THREE.SphereGeometry(0.09, 12, 10), skin); ear.position.set(0.39 * s, 0, 0); ear.scale.z = 0.6; headG.add(ear); }
  const nose = mesh(new THREE.SphereGeometry(0.055, 12, 10), skin); nose.position.set(0, -0.02, 0.4); headG.add(nose);
  for (const s of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(0.15 * s, 0.08, 0.33); headG.add(eye); eyes.push(eye);
    eye.add(mesh(new THREE.SphereGeometry(0.095, 16, 12), '#ffffff', false));
    const pup = mesh(new THREE.SphereGeometry(0.05, 12, 12), '#1b1420', false, false); pup.position.z = 0.075; eye.add(pup);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(0.02, 0.025, 0.12); eye.add(hl);
    const brow = mesh(new THREE.CapsuleGeometry(0.018, 0.1, 4, 6), c.hair?.color || '#3a2a20', false); brow.rotation.z = Math.PI / 2; brow.position.set(0.15 * s, 0.23, 0.33); brow.name = 'brow' + s; headG.add(brow);
    if (c.cheeks !== false) { const ck = mesh(new THREE.SphereGeometry(0.06, 10, 8), '#ff9aa8', false, false); ck.scale.set(1, 0.6, 0.3); ck.position.set(0.24 * s, -0.08, 0.31); headG.add(ck); }
  }
  // mouth by expression
  const expr = c.expr || 'smile'; let mouth;
  if (expr === 'wow') { mouth = mesh(new THREE.SphereGeometry(0.06, 14, 10), '#5a1f2a', false); mouth.scale.set(0.9, 1.2, 0.5); }
  else if (expr === 'neutral') { mouth = mesh(new THREE.CapsuleGeometry(0.015, 0.1, 4, 6), '#5a1f2a', false); mouth.rotation.z = Math.PI / 2; }
  else { const arc = expr === 'worried' ? -1 : 1; mouth = mesh(new THREE.TorusGeometry(0.08, 0.018, 8, 16, Math.PI), '#5a1f2a', false); mouth.rotation.z = arc > 0 ? Math.PI : 0; if (expr === 'grin') mouth.scale.set(1.4, 1.2, 1); }
  mouth.position.set(0, expr === 'worried' ? -0.2 : -0.15, 0.37); headG.add(mouth);
  if (expr === 'worried') for (const s of [-1, 1]) { const br = headG.getObjectByName('brow' + s); br.rotation.z = Math.PI / 2 + 0.35 * s; br.position.y = 0.25; }
  if (expr === 'wow') for (const s of [-1, 1]) headG.getObjectByName('brow' + s).position.y = 0.29;
  // hair
  const hc = c.hair?.color || '#3a2a20', hs = c.hair?.style || ['tuft', 'bob', 'spiky', 'bun'][hash(shirt) % 4];
  if (hs === 'tuft') for (let i = 0; i < 3; i++) { const t = mesh(new THREE.ConeGeometry(0.07, 0.2, 10), hc); t.position.set(-0.08 + i * 0.08, 0.42, 0.02); t.rotation.z = (i - 1) * 0.4; headG.add(t); }
  else if (hs === 'bob') { const cap = mesh(new THREE.SphereGeometry(0.43, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hc); cap.position.set(0, 0.03, -0.03); cap.rotation.x = -0.25; headG.add(cap); }
  else if (hs === 'spiky') for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const t = mesh(new THREE.ConeGeometry(0.08, 0.24, 8), hc); t.position.set(Math.cos(a) * 0.2, 0.36, Math.sin(a) * 0.2 - 0.04); t.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); headG.add(t); }
  else if (hs === 'bun') { const cap = mesh(new THREE.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), hc); cap.position.y = 0.04; headG.add(cap); const bun = mesh(new THREE.SphereGeometry(0.14, 14, 10), hc); bun.position.set(0, 0.45, -0.12); headG.add(bun); }
  else if (hs === 'cap') { const dome = mesh(new THREE.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hc); dome.position.y = 0.05; headG.add(dome); const brim = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20, 1, false, 0, Math.PI), hc); brim.position.set(0, 0.2, 0.3); brim.rotation.y = -Math.PI / 2; headG.add(brim); }
  if (c.outfit === 'explorer') { const brim = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 28), '#c9a46a'); brim.position.y = 0.3; headG.add(brim); const top = mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.25, 24), '#c9a46a'); top.position.y = 0.43; headG.add(top); }
  if (c.outfit === 'scarf') { const sc = mesh(new THREE.TorusGeometry(0.26, 0.08, 10, 24), c.scarf || '#e84a5f'); sc.rotation.x = Math.PI / 2; sc.position.y = 1.18; g.add(sc); const tail = mesh(new THREE.BoxGeometry(0.12, 0.35, 0.06), c.scarf || '#e84a5f'); tail.position.set(0.12, 0.98, 0.3); tail.rotation.z = 0.15; g.add(tail); }
  if (c.glasses) for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 20), '#222', false, false); r.position.set(0.15 * s, 0.08, 0.4); headG.add(r); if (s > 0) { const br = mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), '#222', false, false); br.position.set(0, 0.08, 0.42); headG.add(br); } }
  // arms (group pivots at the shoulder): sleeve + hand
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(0.42 * s, 1.08, 0); arm.name = s < 0 ? 'armL' : 'armR'; g.add(arm);
    const sleeve = mesh(new THREE.CapsuleGeometry(0.085, 0.32, 6, 8), c.outfit === 'labcoat' ? '#f7f7f2' : shirt); sleeve.position.y = -0.2; arm.add(sleeve);
    const hand = mesh(new THREE.SphereGeometry(0.095, 12, 10), skin); hand.position.y = -0.45; arm.add(hand);
    arm.rotation.z = 0.12 * s;
    if (s > 0 && c.hold === 'magnifier') { const ring = mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 24), '#5a4a3a'); ring.position.set(0, -0.72, 0.1); arm.add(ring); const glass = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), new THREE.MeshBasicMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.5, side: THREE.DoubleSide })); glass.position.copy(ring.position); arm.add(glass); const hd = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), '#5a4a3a'); hd.position.set(0, -0.52, 0.05); arm.add(hd); }
    if (s > 0 && c.hold === 'clipboard') { const cb = mesh(new THREE.BoxGeometry(0.28, 0.36, 0.03), '#a07850'); cb.position.set(-0.05, -0.55, 0.15); arm.add(cb); const pp = mesh(new THREE.BoxGeometry(0.22, 0.26, 0.01), '#ffffff', false, false); pp.position.set(-0.05, -0.57, 0.17); arm.add(pp); }
  }
  g.userData.head = headG; g.userData.eyes = eyes; g.userData.seed = (hash(shirt) % 100) / 37;
  if (c.scale) g.scale.setScalar(c.scale);
  return g;
}
function animate(g, anim, t, base) {
  g.position.copy(base); g.rotation.set(0, 0, 0); g.userData.head.rotation.set(0, 0, 0);
  const blink = ((t + g.userData.seed) % 2.6) < 0.13; const bl = blink ? 0.1 : 1; g.userData.eyes.forEach(e => { e.scale.y = bl; });
  if (g.userData.lids) g.userData.lids.forEach(l => { l.rotation.x = blink ? 1.45 : -0.55; });
  const armL = g.getObjectByName('armL'), armR = g.getObjectByName('armR');
  if (anim === 'bounce') g.position.y = base.y + Math.abs(Math.sin(t * 6)) * 0.3;
  else if (anim === 'wave') armR.rotation.z = Math.PI * 0.8 + Math.sin(t * 10) * 0.4;
  else if (anim === 'point') { armR.rotation.z = Math.PI * 0.45; armR.rotation.x = -0.6; g.userData.head.rotation.y = 0.3; }
  else if (anim === 'inspect') { armR.rotation.x = -1.1 + Math.sin(t * 2) * 0.1; g.userData.head.rotation.x = 0.25; g.position.y = base.y + Math.sin(t * 2) * 0.02; }
  else if (anim === 'spin') g.rotation.y = t * 2;
  else if (anim === 'shiver') { g.position.x = base.x + Math.sin(t * 60) * 0.03; armL.rotation.z = -0.6; armR.rotation.z = 0.6; }
  else if (anim === 'no') g.userData.head.rotation.y = Math.sin(t * 8) * 0.5;
  else if (anim === 'lookup') { g.userData.head.rotation.x = -0.5; armR.rotation.z = Math.PI * 0.7; }
  else if (anim === 'run') { g.position.x = base.x + ((t * 1.5) % 4) - 2; g.rotation.y = Math.PI / 2; armL.rotation.x = Math.sin(t * 16) * 0.9; armR.rotation.x = -Math.sin(t * 16) * 0.9; g.position.y = base.y + Math.abs(Math.sin(t * 16)) * 0.1; }
  else if (anim === 'walk') { g.position.x = base.x + Math.sin(t * 2) * 0.8; g.rotation.y = Math.cos(t * 2) > 0 ? Math.PI / 2 : -Math.PI / 2; armL.rotation.x = Math.sin(t * 8) * 0.6; armR.rotation.x = -Math.sin(t * 8) * 0.6; }
  else { g.position.y = base.y + Math.sin(t * 2) * 0.03; g.userData.head.rotation.z = Math.sin(t * 1.5) * 0.08; }
  // breathing + small head life for every pose
  const sd = g.userData.seed || 0; g.userData.head.rotation.z += Math.sin(t * 1.3 + sd) * 0.04; g.userData.head.rotation.x += Math.sin(t * 0.9 + sd * 2) * 0.03;
  if (g.userData.lids) g.scale.y = (g.userData.baseScaleY ??= g.scale.y) * (1 + Math.sin(t * 2.4 + sd) * 0.008);
}

// ---------- props ----------
function glowMat(c) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.8, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }); }
function makeProp(p) {
  const s = p.size || [1, 1, 1];
  let m;
  switch (p.type) {
    case 'sphere': m = mesh(new THREE.SphereGeometry(s[0] / 2, 32, 24), p.color); break;
    case 'cylinder': m = mesh(new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], 24), p.color); break;
    case 'cone': m = mesh(new THREE.ConeGeometry(s[0] / 2, s[1], 24), p.color); break;
    case 'torus': m = mesh(new THREE.TorusGeometry(s[0], s[1] || 0.1, 16, 64), p.color); break;
    case 'rock': m = mesh(new THREE.DodecahedronGeometry(s[0] / 2, 0), p.color); break;
    case 'ring': { // flat glowing planetary ring: size [inner, outer]
      m = new THREE.Mesh(new THREE.RingGeometry(s[0], s[1], 96, 1), glowMat(p.color));
      m.rotation.x = -Math.PI / 2; break;
    }
    case 'earth': { // size [diameter]
      m = new THREE.Group();
      const r = s[0] / 2;
      m.add(mesh(new THREE.SphereGeometry(r, 48, 32), p.color || '#2f7fd8'));
      let q = 7; const rnd = () => ((q = (q * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < 14; i++) {
        const c = mesh(new THREE.SphereGeometry(r * (0.18 + rnd() * 0.22), 16, 12), rnd() > 0.3 ? '#4caf50' : '#e9d8a6', false);
        const th = rnd() * Math.PI * 2, ph = 0.4 + rnd() * 2.3;
        c.position.set(Math.sin(ph) * Math.cos(th) * r * 0.9, Math.cos(ph) * r * 0.9, Math.sin(ph) * Math.sin(th) * r * 0.9);
        c.scale.setScalar(1); m.add(c);
      }
      if (p.equator) { const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, r * 0.05, 12, 96), glowMat(p.equator)); band.rotation.x = Math.PI / 2; m.add(band); }
      if (p.dots) for (let i = 0; i < p.dots; i++) { const a = (i / p.dots) * Math.PI * 2 + rnd(); const lat = (rnd() - 0.5) * 0.5; const d = mesh(new THREE.SphereGeometry(r * 0.06, 10, 8), '#3a2a1a', false); d.position.set(Math.cos(a) * Math.cos(lat) * r, Math.sin(lat) * r, Math.sin(a) * Math.cos(lat) * r); m.add(d); }
      break;
    }
    case 'crater': { // size [diameter]
      m = new THREE.Group();
      const rim = mesh(new THREE.TorusGeometry(s[0] / 2, s[0] * 0.08, 12, 48), p.color || '#8a6a4a'); rim.rotation.x = Math.PI / 2; rim.scale.z = 0.6; m.add(rim);
      const pit = mesh(new THREE.CircleGeometry(s[0] / 2, 32), '#3b2b1d', false); pit.rotation.x = -Math.PI / 2; pit.position.y = 0.02; m.add(pit);
      break;
    }
    case 'lamp': {
      m = new THREE.Group();
      const pole = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 8), '#444'); pole.position.y = 1; m.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshBasicMaterial({ color: p.color })); bulb.position.y = 2.1; m.add(bulb);
      const pl = new THREE.PointLight(p.color, 8, 8); pl.position.y = 2.1; m.add(pl); break;
    }
    default: m = mesh(new THREE.BoxGeometry(...s), p.color);
  }
  if (p.glow && m.material) m.material = glowMat(p.color);
  m.position.set(...(p.pos || [0, 0, 0]));
  if (p.rot) m.rotation.set(m.rotation.x + p.rot[0], m.rotation.y + p.rot[1], m.rotation.z + p.rot[2]);
  m.userData = { spin: p.spin || 0, base: m.position.clone(), baseRot: m.rotation.clone(), move: p.move, fall: p.fall, orbit: p.orbit };
  return m;
}
function animateProp(m, t, k) {
  const u = m.userData, b = u.base;
  if (u.spin) m.rotation.y = u.baseRot.y + t * u.spin;
  if (u.move) { const to = u.move; m.position.set(b.x + (to[0] - b.x) * k, b.y + (to[1] - b.y) * k, b.z + (to[2] - b.z) * k); }
  if (u.fall) { const h = u.fall; const ph = ((t * 0.6 + b.x * 0.37 + b.z * 0.21) % 1 + 1) % 1; m.position.y = b.y + h * (1 - ph); m.rotation.x = t * 3; }
  if (u.orbit) { const o = u.orbit, a = t * (o.speed || 1) + (o.phase || 0); m.position.set(Math.cos(a) * o.radius, (o.y || 0), Math.sin(a) * o.radius); }
}

// ---------- worlds ----------
const WORLDS = {
  office:   { sky: '#cfe8ff', floor: '#8fa3b8', wall: '#e8edf2', deco: 'room' },
  prison:   { sky: '#ffb3cf', floor: '#9a9a9a', wall: '#ff9ec0', deco: 'room' },
  city:     { sky: '#8ecbff', floor: '#555a63', wall: null, deco: 'city' },
  lab:      { sky: '#d9f5e5', floor: '#b8c9c0', wall: '#e9fff3', deco: 'room' },
  space:    { sky: '#0a0a2a', floor: '#2a2a4a', wall: null, deco: 'stars' },
  desert:   { sky: '#ffd9a0', floor: '#e6b872', wall: null, deco: 'dunes' },
  ocean:    { sky: '#7fd0ff', floor: '#2f7fbf', wall: null, deco: 'dunes' },
  ice:      { sky: '#cfe6f5', floor: '#eef6fb', wall: null, deco: 'dunes' },
  dusk:     { sky: '#3a2b5c', floor: '#2b2b38', wall: null, deco: 'city' }
};
function makeWorld(name, seed) {
  const w = WORLDS[name] || WORLDS.office;
  const g = new THREE.Group();
  if (w.deco !== 'stars') { const floor = mesh(new THREE.PlaneGeometry(120, 120), w.floor); floor.rotation.x = -Math.PI / 2; g.add(floor); }
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  if (w.deco === 'room') {
    const back = mesh(new THREE.BoxGeometry(14, 6, 0.3), w.wall); back.position.set(0, 3, -4); g.add(back);
    for (const x of [-7, 7]) { const side = mesh(new THREE.BoxGeometry(0.3, 6, 14), w.wall); side.position.set(x, 3, 2); g.add(side); }
    for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(0.6 + rnd(), 0.5 + rnd() * 1.5, 0.6 + rnd()), '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0')); b.position.set(-5 + i * 2.5, b.geometry.parameters.height / 2, -3.2); g.add(b); }
  } else if (w.deco === 'city') {
    for (let i = 0; i < 40; i++) { const h = 3 + rnd() * 14; const b = mesh(new THREE.BoxGeometry(1.5 + rnd() * 2, h, 1.5 + rnd() * 2), '#' + Math.floor(120 + rnd() * 100).toString(16) + Math.floor(120 + rnd() * 100).toString(16) + 'c0'); b.position.set((rnd() - 0.5) * 40, h / 2, -5 - rnd() * 25); g.add(b); }
  } else if (w.deco === 'stars') {
    const pts = []; for (let i = 0; i < 400; i++) { const a = rnd() * Math.PI * 2, b = Math.acos(2 * rnd() - 1), R = 45; pts.push(R * Math.sin(b) * Math.cos(a), R * Math.cos(b), R * Math.sin(b) * Math.sin(a)); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.25 })));
    
  } else {
    for (let i = 0; i < 14; i++) { const d = mesh(new THREE.SphereGeometry(2 + rnd() * 3, 16, 12), w.floor); d.scale.y = 0.35; d.position.set((rnd() - 0.5) * 40, 0, -6 - rnd() * 25); g.add(d); }
  }
  return g;
}

// ---------- shots ----------
const scenes = story.shots.map((shot, i) => {
  const scene = new THREE.Scene();
  if (SOFTSTYLE) {
    SOFT.setupScene(scene, shot.world, i + 1);
    const chars = (shot.characters || []).map(c => { const g = SOFT.makeCharacter(c); scene.add(g); return { g, c, base: new THREE.Vector3(...(c.pos || [0, 0, 0])) }; });
    const props = (shot.props || []).map(p => { const m = SOFT.makeProp(p); scene.add(m); return m; });
    return { shot, scene, chars, props };
  }
  const wd = WORLDS[shot.world] || WORLDS.office;
  scene.background = new THREE.Color(wd.sky);
  if (wd.deco !== 'stars') scene.fog = new THREE.Fog(wd.sky, 15, 60);
  scene.add(new THREE.HemisphereLight('#ffffff', '#667788', 1.1));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2); sun.position.set(4, 8, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  scene.add(sun);
  scene.add(makeWorld(shot.world, i + 1));
  const chars = (shot.characters || []).map(c => { const g = makeCharacter(c); scene.add(g); return { g, c, base: new THREE.Vector3(...(c.pos || [0, 0, 0])) }; });
  const props = (shot.props || []).map(p => { const m = makeProp(p); scene.add(m); return m; });
  return { shot, scene, chars, props };
});

// ---------- captions (one word at a time) ----------
function wordsFor(shot) {
  const words = shot.line.replace(/\s+/g, ' ').trim().split(' ');
  if (shot.words) return shot.words; // [{w, t0, t1}] from real audio timing
  const dur = shot.end - shot.start, step = dur / words.length;
  return words.map((w, i) => ({ w, t0: shot.start + i * step, t1: shot.start + (i + 1) * step }));
}
// karaoke captions: 2-3 words at a time, the spoken word lights up, numbers/keywords keep their own colour
const KEYS = new Set((CAP.highlight || []).map(w => w.toUpperCase()));
const isKey = (w) => /\d/.test(w) || KEYS.has(w.toUpperCase());
const groupsCache = new Map();
function groupsFor(shot) {
  if (groupsCache.has(shot)) return groupsCache.get(shot);
  const ws = wordsFor(shot).map(x => ({ ...x, w: x.w.replace(/[.,!?:;"]/g, '') })).filter(x => x.w);
  const raw = wordsFor(shot); const gs = []; let cur = [];
  ws.forEach((x, i) => { cur.push(x); const endPunct = /[.,!?:;]$/.test(raw[i]?.w || ''); if (cur.length >= CAP.words || endPunct || i === ws.length - 1) { gs.push(cur); cur = []; } });
  gs.forEach((g, i) => { g.t0 = g[0].t0; g.t1 = i < gs.length - 1 ? gs[i + 1][0].t0 : g[g.length - 1].t1 + 0.25; });
  groupsCache.set(shot, gs); return gs;
}
let capKey = '';
function drawCaptions(shot, t) {
  const g = groupsFor(shot).find(x => t >= x.t0 && t < x.t1);
  if (!g) { if (capKey) { capEl.innerHTML = ''; capKey = ''; } return; }
  const key = shot.start + ':' + g.t0;
  if (key !== capKey) { capEl.innerHTML = g.map(x => `<span class="cw">${x.w}</span>`).join(' '); capKey = key; }
  const pop = spring(t - g.t0, 18, 0.55);
  capEl.style.transform = `translateY(${(1 - pop) * 30}px) scale(${0.8 + 0.2 * pop})`;
  [...capEl.children].forEach((el, i) => {
    const x = g[i], on = t >= x.t0 && t < x.t1, k = spring(t - x.t0, 22, 0.5);
    el.style.color = on ? CAP.active : isKey(x.w) ? CAP.key : '#ffffff';
    el.style.transform = on ? `scale(${1 + 0.14 * k}) rotate(${(i % 2 ? 1 : -1) * 2 * k}deg)` : 'scale(1)';
  });
}
const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10); // smootherstep
const FPS = story.fps || 30;


// ---------- motion-graphics overlays (from motion-effects / explainer-high-energy recipes) ----------
// shot.overlays: [{type:'title'|'counter'|'badge', text, t0, t1, y (px in 1080x1920 space, keep 360-1420), from, to, label, color, accent}]
function spring(t, w = 14, z = 0.62) { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const OV = document.createElement('div');
OV.style.cssText = `position:absolute;left:0;top:0;width:${story.width}px;height:${story.height}px;transform-origin:0 0;transform:scale(${SC});pointer-events:none;font-family:"Arial Black","Arial Bold",Impact,sans-serif;font-weight:900;color:#fff`;
wrap.appendChild(OV);
const ovEls = [];
story.shots.forEach(sh => (sh.overlays || []).forEach(o => {
  const el = document.createElement('div'); el.style.cssText = `position:absolute;left:0;right:0;top:${o.y || 420}px;text-align:center;opacity:0`;
  if (o.type === 'title') {
    el.innerHTML = o.text.split(' ').map(w => `<span style="display:inline-block;overflow:hidden;vertical-align:top;padding:0 10px"><span class="w" style="display:inline-block;font-size:${o.size || 112}px;line-height:1.1;-webkit-text-stroke:16px #120c18;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45);color:${o.color || '#fff'}">${w}</span></span>`).join('');
  } else if (o.type === 'counter') {
    el.innerHTML = `<div class="n" style="font-size:${o.size || 170}px;line-height:1;color:${o.color || '#ffd84d'};-webkit-text-stroke:18px #120c18;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45);font-variant-numeric:tabular-nums"></div><div class="l" style="display:inline-block;margin-top:14px;font-size:60px;padding:10px 30px;border-radius:40px;background:${o.accent || '#ff4d6d'};border:6px solid #120c18">${o.label || ''}</div>`;
  } else {
    el.innerHTML = `<div class="b" style="display:inline-block;font-size:${o.size || 58}px;padding:14px 34px;border-radius:50px;background:${o.accent || '#2f47ff'};border:7px solid #120c18;box-shadow:0 10px 0 #120c18">${o.text}</div>`;
  }
  OV.appendChild(el); ovEls.push({ o, el });
}));
const fmt = (n) => Math.round(n).toLocaleString('en-US');
function drawOverlays(t) {
  for (const { o, el } of ovEls) {
    const on = t >= o.t0 && t < o.t1; el.style.opacity = on ? 1 : 0; if (!on) continue;
    const lt = t - o.t0, out = clamp01((t - (o.t1 - 0.25)) / 0.25);
    el.style.transform = `translateY(${-out * 60}px)`; el.style.opacity = 1 - out;
    if (o.type === 'title') el.querySelectorAll('.w').forEach((w, i) => { const k = spring(lt - i * 0.07); w.style.transform = `translateY(${(1 - k) * 110}%)`; });
    else if (o.type === 'counter') {
      const k = clamp01(lt / (o.dur || 1.1)); const e = 1 - Math.pow(1 - k, 3);
      el.querySelector('.n').textContent = (o.prefix || '') + fmt(o.from + (o.to - o.from) * e) + (o.suffix || '');
      const p = spring(lt - 0.1); el.querySelector('.n').style.transform = `scale(${0.6 + 0.4 * p})`;
      el.querySelector('.l').style.transform = `scale(${spring(lt - 0.35)})`;
    } else { const p = spring(lt, 16, 0.5); el.querySelector('.b').style.transform = `scale(${p}) rotate(${(1 - p) * -8 + Math.sin(lt * 3) * 1.5}deg)`; }
  }
}

window.__total = story.shots[story.shots.length - 1].end;
await document.fonts.load('900 100px Montserrat').catch(() => {});
window.__ready = true;
window.renderFrame = (t) => {
  const entry = scenes.find(s => t >= s.shot.start && t < s.shot.end) || scenes[scenes.length - 1];
  const { shot, scene, chars, props } = entry;
  const lt = t - shot.start, k = ease(Math.min(1, lt / (shot.end - shot.start)));
  chars.forEach(o => animate(o.g, o.c.anim, t, o.base));
  props.forEach(p => { animateProp(p, t, k); if (SOFTSTYLE) SOFT.animateProp(p, t); });
  const cam = shot.camera, f = cam.from, to = cam.to || cam.from;
  camera.position.set(f[0] + (to[0] - f[0]) * k, f[1] + (to[1] - f[1]) * k, f[2] + (to[2] - f[2]) * k);
  camera.lookAt(...(cam.look || [0, 1, 0]));
  const roll = (cam.roll !== undefined ? cam.roll : (story.shots.indexOf(shot) % 2 ? 2 : -2)) * Math.PI / 180;
  camera.rotateZ(roll * (0.6 + 0.4 * k));
  for (const kt of (shot.kicks || [])) { // impact shake: flips sign every frame, decays over 7 frames
    const f = Math.round((t - kt) * FPS);
    if (f >= 0 && f < 7) { const a = 0.06 * (1 - f / 7) * (f % 2 ? -1 : 1); camera.position.x += a; camera.position.y -= a * 0.6; camera.rotateZ(a * 0.4); }
  }
  drawOverlays(t);
  flashEl.style.opacity = shot.flash ? Math.max(0, 1 - lt / 0.35).toFixed(3) : 0;
  if (SOFTSTYLE) SOFT.render(scene, camera); else renderer.render(scene, camera);
  drawCaptions(shot, t);
};
