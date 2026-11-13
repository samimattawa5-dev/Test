import * as THREE from 'three';

const story = await (await fetch('/story.json')).json();
const SC = Number(new URLSearchParams(location.search).get('scale') || 1);
const W = Math.round(story.width * SC), H = Math.round(story.height * SC);
const wrap = document.getElementById('wrap');
const capEl = document.getElementById('cap');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
wrap.prepend(renderer.domElement);
capEl.style.fontSize = Math.round(W * 0.14) + 'px';

const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
const mesh = (g, c, shadow = true) => { const m = new THREE.Mesh(g, mat(c)); m.castShadow = shadow; m.receiveShadow = true; return m; };

// ---------- characters ----------
function makeCharacter(color) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.35, 0.6, 8, 16), color); body.position.y = 0.75; g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.4, 24, 16), color); head.position.y = 1.55; g.add(head);
  for (const s of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.1, 12, 12), '#ffffff'); eye.position.set(0.17 * s, 1.62, 0.34); g.add(eye);
    const pup = mesh(new THREE.SphereGeometry(0.05, 12, 12), '#111111'); pup.position.set(0.17 * s, 1.62, 0.43); g.add(pup);
    const arm = mesh(new THREE.CapsuleGeometry(0.09, 0.45, 6, 8), color); arm.position.set(0.48 * s, 0.95, 0); arm.geometry.translate(0, -0.2, 0); arm.name = s < 0 ? 'armL' : 'armR'; g.add(arm);
    const leg = mesh(new THREE.CapsuleGeometry(0.11, 0.3, 6, 8), '#333333'); leg.position.set(0.18 * s, 0.25, 0); g.add(leg);
  }
  g.userData.head = head;
  return g;
}
function animate(g, anim, t, base) {
  g.position.copy(base); g.rotation.set(0, 0, 0);
  const armL = g.getObjectByName('armL'), armR = g.getObjectByName('armR');
  if (anim === 'bounce') g.position.y = base.y + Math.abs(Math.sin(t * 6)) * 0.3;
  else if (anim === 'wave') armR.rotation.z = Math.PI * 0.8 + Math.sin(t * 10) * 0.4;
  else if (anim === 'spin') g.rotation.y = t * 2;
  else if (anim === 'walk') { g.position.x = base.x + Math.sin(t * 2) * 0.8; g.rotation.y = Math.cos(t * 2) > 0 ? Math.PI / 2 : -Math.PI / 2; armL.rotation.x = Math.sin(t * 8) * 0.6; armR.rotation.x = -Math.sin(t * 8) * 0.6; }
  else { g.position.y = base.y + Math.sin(t * 2) * 0.03; g.userData.head.rotation.z = Math.sin(t * 1.5) * 0.08; }
}

// ---------- props ----------
function makeProp(p) {
  const s = p.size || [1, 1, 1];
  let m;
  switch (p.type) {
    case 'sphere': m = mesh(new THREE.SphereGeometry(s[0] / 2, 24, 16), p.color); break;
    case 'cylinder': m = mesh(new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], 24), p.color); break;
    case 'cone': m = mesh(new THREE.ConeGeometry(s[0] / 2, s[1], 24), p.color); break;
    case 'lamp': {
      m = new THREE.Group();
      const pole = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 8), '#444'); pole.position.y = 1; m.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshBasicMaterial({ color: p.color })); bulb.position.y = 2.1; m.add(bulb);
      const pl = new THREE.PointLight(p.color, 8, 8); pl.position.y = 2.1; m.add(pl); break;
    }
    default: m = mesh(new THREE.BoxGeometry(...s), p.color);
  }
  m.position.set(...(p.pos || [0, 0, 0]));
  m.userData.spin = p.spin || 0;
  return m;
}

// ---------- worlds ----------
const WORLDS = {
  office:   { sky: '#cfe8ff', floor: '#8fa3b8', wall: '#e8edf2', deco: 'room' },
  prison:   { sky: '#ffb3cf', floor: '#9a9a9a', wall: '#ff9ec0', deco: 'room' },
  city:     { sky: '#8ecbff', floor: '#555a63', wall: null, deco: 'city' },
  lab:      { sky: '#d9f5e5', floor: '#b8c9c0', wall: '#e9fff3', deco: 'room' },
  space:    { sky: '#0a0a2a', floor: '#2a2a4a', wall: null, deco: 'stars' },
  desert:   { sky: '#ffd9a0', floor: '#e6b872', wall: null, deco: 'dunes' },
  ocean:    { sky: '#7fd0ff', floor: '#2f7fbf', wall: null, deco: 'dunes' }
};
function makeWorld(name, seed) {
  const w = WORLDS[name] || WORLDS.office;
  const g = new THREE.Group();
  const floor = mesh(new THREE.PlaneGeometry(60, 60), w.floor); floor.rotation.x = -Math.PI / 2; g.add(floor);
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  if (w.deco === 'room') {
    const back = mesh(new THREE.BoxGeometry(14, 6, 0.3), w.wall); back.position.set(0, 3, -4); g.add(back);
    for (const x of [-7, 7]) { const side = mesh(new THREE.BoxGeometry(0.3, 6, 14), w.wall); side.position.set(x, 3, 2); g.add(side); }
    for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(0.6 + rnd(), 0.5 + rnd() * 1.5, 0.6 + rnd()), '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0')); b.position.set(-5 + i * 2.5, b.geometry.parameters.height / 2, -3.2); g.add(b); }
  } else if (w.deco === 'city') {
    for (let i = 0; i < 40; i++) { const h = 3 + rnd() * 14; const b = mesh(new THREE.BoxGeometry(1.5 + rnd() * 2, h, 1.5 + rnd() * 2), '#' + Math.floor(120 + rnd() * 100).toString(16) + Math.floor(120 + rnd() * 100).toString(16) + 'c0'); b.position.set((rnd() - 0.5) * 40, h / 2, -5 - rnd() * 25); g.add(b); }
  } else if (w.deco === 'stars') {
    const pts = []; for (let i = 0; i < 400; i++) pts.push((rnd() - 0.5) * 80, rnd() * 30, -10 - rnd() * 40);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.25 })));
    const planet = mesh(new THREE.SphereGeometry(3, 32, 24), '#c77dff'); planet.position.set(5, 6, -15); g.add(planet);
  } else {
    for (let i = 0; i < 14; i++) { const d = mesh(new THREE.SphereGeometry(2 + rnd() * 3, 16, 12), w.floor); d.scale.y = 0.35; d.position.set((rnd() - 0.5) * 40, 0, -6 - rnd() * 25); g.add(d); }
  }
  return g;
}

// ---------- shots ----------
const scenes = story.shots.map((shot, i) => {
  const scene = new THREE.Scene();
  const wd = WORLDS[shot.world] || WORLDS.office;
  scene.background = new THREE.Color(wd.sky);
  scene.fog = new THREE.Fog(wd.sky, 15, 50);
  scene.add(new THREE.HemisphereLight('#ffffff', '#667788', 1.1));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2); sun.position.set(4, 8, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  scene.add(sun);
  scene.add(makeWorld(shot.world, i + 1));
  const chars = (shot.characters || []).map(c => { const g = makeCharacter(c.color); scene.add(g); return { g, c, base: new THREE.Vector3(...(c.pos || [0, 0, 0])) }; });
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
const ease = (x) => x * x * (3 - 2 * x);

window.__total = story.shots[story.shots.length - 1].end;
window.__ready = true;
window.renderFrame = (t) => {
  const entry = scenes.find(s => t >= s.shot.start && t < s.shot.end) || scenes[scenes.length - 1];
  const { shot, scene, chars, props } = entry;
  const lt = t - shot.start, k = ease(Math.min(1, lt / (shot.end - shot.start)));
  chars.forEach(o => animate(o.g, o.c.anim, t, o.base));
  props.forEach(p => { if (p.userData.spin) p.rotation.y = t * p.userData.spin; });
  const cam = shot.camera, f = cam.from, to = cam.to || cam.from;
  camera.position.set(f[0] + (to[0] - f[0]) * k, f[1] + (to[1] - f[1]) * k, f[2] + (to[2] - f[2]) * k);
  camera.lookAt(...(cam.look || [0, 1, 0]));
  renderer.render(scene, camera);
  const w = wordsFor(shot).find(x => t >= x.t0 && t < x.t1);
  capEl.textContent = w ? w.w.replace(/[.,!?]/g, '') : '';
  capEl.style.transform = w ? `scale(${0.85 + 0.15 * Math.min(1, (t - w.t0) * 12)})` : '';
};
