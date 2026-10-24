// Oficina en 3D: vista isométrica con Three.js, sincronizada con la simulación de office.js (window.WMO).
// No cambia la lógica de la oficina: solo la dibuja. Si WebGL no está disponible, se queda el plano.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = (id) => document.getElementById(id);
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CLAVE = 'wm.oficina.vista';
const box = $('map3d'), svg = $('map'), sw = document.querySelector('.view-sw');
if (!box || !svg || !sw) throw new Error('office3d: falta el contenedor');

/* ---------- Plano (1000×830) → mundo ---------- */
const S = 1 / 50;
const W = (x, y) => [(x - 500) * S, (y - 415) * S];

const ROOMS = [
  [330, 20, 340, 178, 'DIRECCIÓN', '#f5c842'],
  [20, 20, 200, 130, 'DATOS · SUPABASE', '#00d4aa'],
  [780, 20, 200, 130, 'TÚ · APROBACIONES', '#f5c842'],
  [20, 200, 335, 400, 'VENTAS', '#00d4aa'],
  [655, 200, 325, 220, 'MARKETING Y SEO', '#9d70ff'],
  [20, 610, 335, 200, 'CLIENTES', '#ff7ab6'],
  [655, 440, 160, 370, 'FINANZAS', '#8be9fd'],
  [825, 440, 155, 370, 'SEGURIDAD', '#ff6b6b'],
  [375, 200, 250, 160, 'SALA DE DEMOS', '#4da3ff'],
  [375, 380, 250, 430, 'SALA DE REUNIONES', '#7c4dff'],
];
const LOOK = {
  luna: ['#f3cdb0', '#2b1646'], sol: ['#9a6240', '#15100d'], vega: ['#e8b690', '#b24a1e'], atlas: ['#c98d66', '#1a1a1f'],
  eco: ['#f6d8bd', '#4a2d1d'], alba: ['#e8b690', '#e0a93f'], abaco: ['#f3cdb0', '#c9c9d6'], egida: ['#c98d66', '#101015'],
  nova: ['#f0c4a0', '#6b3a1d'], aura: ['#b9805a', '#1d1d2a'], lira: ['#f1cfb2', '#8a4a1c'], rigel: ['#e3b08a', '#8c8c96'],
};

/* ---------- Render ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  sw.hidden = true; throw e; // sin WebGL: se queda el plano
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.setAttribute('aria-hidden', 'true');
box.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#08080d');
scene.fog = new THREE.Fog('#08080d', 34, 60);

const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
const BASE_YAW = Math.PI / 4, ISO_PITCH = 0.72, DIST = 40; // algo más alta que la isométrica pura: el suelo se lee mejor
let yaw = BASE_YAW, yawUser = 0, zoom = 1, fitHalf = 13;

scene.add(new THREE.HemisphereLight('#9d70ff', '#08080d', 0.55));
scene.add(new THREE.AmbientLight('#ffffff', 0.18));
const sun = new THREE.DirectionalLight('#ffffff', 1.5);
sun.position.set(-8, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
sun.shadow.bias = -0.0005;
scene.add(sun);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.55, 0.2);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- Utilidades ---------- */
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.1, ...o });
const glow = (c, k = 1.6) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
function mesh(geo, m, x = 0, y = 0, z = 0, parent = scene, shadow = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
  if (shadow) { o.castShadow = true; o.receiveShadow = true; }
  parent.add(o); return o;
}
function textCanvas(text, { size = 46, weight = 600, color = '#f0f0f5', bg = null, border = null, pad = 22, maxW = 900 } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  const font = `${weight} ${size}px Sora, system-ui, sans-serif`;
  x.font = font;
  const w = Math.min(maxW, Math.ceil(x.measureText(text).width) + pad * 2), h = Math.ceil(size * 1.6);
  c.width = w; c.height = h;
  x.font = font; x.textBaseline = 'middle'; x.textAlign = 'center';
  if (bg) {
    const r = h / 2; x.fillStyle = bg; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, r); x.fill();
    if (border) { x.lineWidth = 3; x.strokeStyle = border; x.stroke(); }
  }
  x.fillStyle = color; x.fillText(text, w / 2, h / 2 + 2, w - pad);
  return c;
}
function sprite(text, h, opts) {
  const tex = new THREE.CanvasTexture(textCanvas(text, opts)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(h * tex.image.width / tex.image.height, h, 1); sp.renderOrder = 10;
  return sp;
}
function setSprite(sp, text, h, opts) {
  const old = sp.material.map; const tex = new THREE.CanvasTexture(textCanvas(text, opts)); tex.colorSpace = THREE.SRGBColorSpace;
  sp.material.map = tex; sp.material.needsUpdate = true; sp.scale.set(h * tex.image.width / tex.image.height, h, 1);
  if (old) old.dispose();
}
function floorText(text, color, x, z, h = 0.34) {
  const cv = textCanvas(text, { size: 40, weight: 600, color, pad: 6 });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const w = h * cv.width / cv.height;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  p.rotation.x = -Math.PI / 2; p.position.set(x + w / 2, 0.075, z); scene.add(p);
  return p;
}

/* ---------- Suelo y salas ---------- */
const anim = []; // funciones (t, dt) que mueven el decorado
const base = mesh(new THREE.BoxGeometry(20.2, 0.3, 16.8), mat('#0b0b13', { roughness: 0.9 }), 0, -0.15, 0);
base.castShadow = false;
const grid = new THREE.GridHelper(20, 20, '#2a2140', '#15121f'); grid.position.y = 0.01; scene.add(grid);
const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(20.2, 0.3, 16.8)), new THREE.LineBasicMaterial({ color: '#7c4dff', transparent: true, opacity: 0.6 }));
edge.position.y = -0.15; scene.add(edge);

const WALL = 0.42, T = 0.06;
ROOMS.forEach(([x, y, w, h, label, color]) => {
  const [x0, z0] = W(x, y), ww = w * S, hh = h * S, cx = x0 + ww / 2, cz = z0 + hh / 2;
  const tile = mesh(new THREE.BoxGeometry(ww - 0.06, 0.05, hh - 0.06), mat(new THREE.Color(color).multiplyScalar(0.07).add(new THREE.Color('#0d0d16')), { roughness: 0.8 }), cx, 0.025, cz);
  tile.castShadow = false;
  const wm = new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.16, roughness: 0.1, metalness: 0, transmission: 0, depthWrite: false });
  [[ww, T, cx, z0 + T / 2], [ww, T, cx, z0 + hh - T / 2]].forEach(([a, b, px, pz]) => { const m = mesh(new THREE.BoxGeometry(a, WALL, b), wm, px, WALL / 2 + 0.05, pz); m.castShadow = false; });
  [[T, hh, x0 + T / 2, cz], [T, hh, x0 + ww - T / 2, cz]].forEach(([a, b, px, pz]) => { const m = mesh(new THREE.BoxGeometry(a, WALL, b), wm, px, WALL / 2 + 0.05, pz); m.castShadow = false; });
  const top = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ww, WALL, hh)), new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.4), transparent: true, opacity: 0.9, toneMapped: false }));
  top.position.set(cx, WALL / 2 + 0.05, cz); scene.add(top);
  floorText(label, color, x0 + 0.22, z0 + 0.3);
  const lamp = mesh(new THREE.SphereGeometry(0.06, 12, 8), glow(color, 2.2), x0 + 0.14, 0.12, z0 + 0.3, scene, false);
  const ph = Math.random() * 6;
  anim.push((t) => { lamp.scale.setScalar(1 + Math.sin(t * 3 + ph) * 0.25); });
});

/* Luz de barrido sobre el suelo */
const scan = mesh(new THREE.PlaneGeometry(20, 0.18), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7c4dff').multiplyScalar(1.6), transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }), 0, 0.08, 0, scene, false);
scan.rotation.x = -Math.PI / 2;
anim.push((t) => { scan.position.z = ((t * 1.6) % 18) - 9; scan.material.opacity = 0.18 + 0.17 * Math.sin(t * 2); });

/* ---------- Decorado animado por sala ---------- */
// Datos: racks con LEDs y partículas que suben
{
  const leds = [];
  for (let s = 0; s < 3; s++) {
    const [x, z] = W(64 + s * 58, 93);
    mesh(new THREE.BoxGeometry(0.8, 1.3, 0.55), mat('#16161f', { metalness: 0.5, roughness: 0.4 }), x, 0.7, z);
    for (let r = 0; r < 6; r++) {
      const l = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.02), glow(r % 2 ? '#00d4aa' : '#7c4dff'), x, 0.25 + r * 0.18, z + 0.285, scene, false);
      leds.push(l);
    }
  }
  anim.push((t) => { leds.forEach((l, i) => { l.visible = REDUCED || Math.sin(t * (3 + (i % 5)) + i * 1.7) > -0.3; }); });
  const N = 70, pos = new Float32Array(N * 3), spd = [];
  const [dx, dz] = W(120, 85);
  for (let i = 0; i < N; i++) { pos[i * 3] = dx + (Math.random() - 0.5) * 3.4; pos[i * 3 + 1] = Math.random() * 3; pos[i * 3 + 2] = dz + (Math.random() - 0.5) * 2; spd.push(0.3 + Math.random() * 0.6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color('#00d4aa').multiplyScalar(1.8), size: 0.07, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
  scene.add(pts);
  if (!REDUCED) anim.push((t, dt) => { for (let i = 0; i < N; i++) { pos[i * 3 + 1] += spd[i] * dt; if (pos[i * 3 + 1] > 3) pos[i * 3 + 1] = 0.1; } g.attributes.position.needsUpdate = true; });
}
// Dirección: holograma que gira
{
  const [x, z] = W(640, 70);
  mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.25, 24), mat('#1a1a26', { metalness: 0.6, roughness: 0.3 }), x, 0.15, z);
  const holo = mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#f5c842').multiplyScalar(1.1), wireframe: true, toneMapped: false }), x, 1.05, z, scene, false);
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.015, 8, 64), glow('#f5c842', 1.6), x, 1.05, z, scene, false);
  anim.push((t) => { holo.rotation.y = t * 0.6; holo.rotation.x = t * 0.25; ring.rotation.x = Math.PI / 2 + Math.sin(t) * 0.3; holo.position.y = 1.05 + Math.sin(t * 1.3) * 0.08; });
}
// Aprobaciones: pedestal de Cris con baliza
let beacon;
{
  const [x, z] = W(880, 86);
  mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 32), mat('#2a2410', { metalness: 0.7, roughness: 0.3 }), x, 0.15, z);
  const core = mesh(new THREE.SphereGeometry(0.26, 32, 16), glow('#f5c842', 0.8), x, 0.75, z, scene, false);
  const r1 = mesh(new THREE.TorusGeometry(0.5, 0.02, 8, 64), glow('#f5c842', 2), x, 0.75, z, scene, false);
  const r2 = mesh(new THREE.TorusGeometry(0.62, 0.012, 8, 64), glow('#f5c842', 1.4), x, 0.75, z, scene, false);
  const lab = sprite('TÚ · Cris', 0.38, { size: 44, color: '#f5c842' }); lab.position.set(x, 1.7, z); lab.material.depthTest = false; scene.add(lab);
  beacon = { core, k: 0 };
  anim.push((t) => { r1.rotation.set(t * 0.9, t * 0.6, 0); r2.rotation.set(-t * 0.5, 0, t * 0.8); core.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06 + beacon.k * 0.25); beacon.k *= 0.97; });
}
// Sala de demos: pantallas con imagen en movimiento
{
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  for (let k = 0; k < 4; k++) {
    const [x, z] = W(410 + k * 60, 226);
    mesh(new THREE.BoxGeometry(0.95, 0.65, 0.05), mat('#111118'), x, 0.85, z - 0.04);
    const s = mesh(new THREE.PlaneGeometry(0.88, 0.58), scr, x, 0.85, z, scene, false); s.position.z += 0.0;
    mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), mat('#222230'), x, 0.3, z - 0.06);
  }
  let last = 0;
  anim.push((t) => {
    if (t - last < 0.08) return; last = t;
    c.fillStyle = '#081426'; c.fillRect(0, 0, 256, 160);
    for (let i = 0; i < 9; i++) { const hh = 30 + 90 * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.8)); c.fillStyle = i % 3 ? '#4da3ff' : '#00d4aa'; c.fillRect(18 + i * 25, 150 - hh, 16, hh); }
    c.fillStyle = '#9d70ff'; c.fillRect(((t * 90) % 300) - 40, 12, 40, 6);
    c.fillStyle = '#f0f0f5'; c.font = '600 16px Sora, sans-serif'; c.fillText('DEMO EN DIRECTO', 14, 30);
    tex.needsUpdate = true;
  });
}
// Sala de reuniones: mesa ovalada con anillos holográficos
{
  const [x, z] = W(500, 605);
  const tb = mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 48), mat('#1b1530', { metalness: 0.4, roughness: 0.25 }), x, 0.5, z); tb.scale.z = 0.72;
  mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.45, 16), mat('#13131e'), x, 0.23, z);
  const rings = [0.35, 0.55, 0.75].map((r, i) => mesh(new THREE.TorusGeometry(r, 0.012, 8, 64), glow('#9d70ff', 1.8), x, 0.85 + i * 0.12, z, scene, false));
  const orb = mesh(new THREE.SphereGeometry(0.16, 24, 12), glow('#7c4dff', 1.5), x, 1.05, z, scene, false);
  anim.push((t) => { rings.forEach((r, i) => { r.rotation.x = Math.PI / 2 + Math.sin(t * 0.8 + i) * 0.4; r.rotation.y = t * (0.4 + i * 0.2); }); orb.position.y = 1.05 + Math.sin(t * 1.7) * 0.1; });
}
// Marketing: gráfico de barras vivo
{
  const bars = [];
  for (let i = 0; i < 6; i++) { const [x, z] = W(700 + i * 22, 410); const b = mesh(new THREE.BoxGeometry(0.28, 1, 0.28), glow(i % 2 ? '#9d70ff' : '#00d4aa', 1.3), x, 0.5, z - 0.2, scene, false); bars.push(b); }
  anim.push((t) => bars.forEach((b, i) => { const hh = 0.3 + 0.8 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 0.9)); b.scale.y = hh; b.position.y = 0.06 + hh / 2; }));
}
// Finanzas: moneda que gira
{
  const [x, z] = W(735, 740);
  const coin = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.07, 40), mat('#f5c842', { metalness: 0.9, roughness: 0.25, emissive: '#5a4300' }), x, 0.9, z);
  coin.rotation.x = Math.PI / 2;
  anim.push((t) => { coin.rotation.z = t * 1.6; coin.position.y = 0.9 + Math.sin(t * 1.4) * 0.08; });
}
// Seguridad: escudo con cono de escaneo
{
  const [x, z] = W(905, 740);
  const sh = mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshStandardMaterial({ color: '#ff6b6b', emissive: '#661818', metalness: 0.5, roughness: 0.3, flatShading: true }), x, 0.95, z);
  const cone = mesh(new THREE.ConeGeometry(0.9, 1.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6b6b').multiplyScalar(1.3), transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), x, 0.85, z, scene, false);
  anim.push((t) => { sh.rotation.y = t * 1.1; sh.position.y = 0.95 + Math.sin(t * 2) * 0.07; cone.rotation.y = -t * 0.8; cone.material.opacity = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(t * 3)); });
}
// Clientes: burbujas de chat flotando
{
  const bs = [];
  for (let i = 0; i < 5; i++) { const [x, z] = W(60 + i * 60, 640); bs.push([mesh(new THREE.SphereGeometry(0.1, 16, 8), glow(i % 2 ? '#ff7ab6' : '#f0f0f5', 1.2), x, 0.5, z, scene, false), i]); }
  anim.push((t) => bs.forEach(([b, i]) => { const p = (t * 0.35 + i * 0.2) % 1; b.position.y = 0.3 + p * 1.6; b.material.transparent = true; b.material.opacity = 1 - p; }));
}

/* ---------- Agentes ---------- */
const AG = {}; // id → {a, root, parts, ring, dot, name, bub, bubText, x, z, ...}
const pickables = [];
const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12);

function buildDesk(a) {
  const [x, z] = W(a.x, a.y + 43);
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(new THREE.BoxGeometry(1.7, 0.06, 0.78), mat('#1c1c28', { roughness: 0.35, metalness: 0.3 }), 0, 0.48, 0, g);
  [[-0.78, -0.33], [0.78, -0.33], [-0.78, 0.33], [0.78, 0.33]].forEach(([lx, lz]) => mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), mat('#2a2a38'), lx, 0.23, lz, g));
  mesh(new THREE.BoxGeometry(0.9, 0.52, 0.04), mat('#0f0f16'), 0, 0.84, 0.12, g);
  const screen = mesh(new THREE.PlaneGeometry(0.84, 0.46), new THREE.MeshBasicMaterial({ color: new THREE.Color(a.c).multiplyScalar(0.35), toneMapped: false }), 0, 0.84, 0.098, g, false);
  screen.rotation.y = Math.PI; // la pantalla mira al agente
  const back = mesh(new THREE.PlaneGeometry(0.84, 0.46), new THREE.MeshBasicMaterial({ color: new THREE.Color(a.c).multiplyScalar(0.18), toneMapped: false }), 0, 0.84, 0.142, g, false);
  mesh(new THREE.BoxGeometry(0.05, 0.25, 0.05), mat('#2a2a38'), 0, 0.6, 0.14, g);
  mesh(new THREE.BoxGeometry(0.5, 0.02, 0.16), mat('#24243a'), 0, 0.52, -0.12, g);
  const name = sprite(a.name, 0.32, { size: 42, color: '#f0f0f5' }); name.position.set(0, 0.14, 0.62); g.add(name);
  const role = sprite(a.role, 0.2, { size: 34, weight: 300, color: '#8888a0' }); role.position.set(0, 0.14, 0.88); g.add(role);
  [name, role].forEach((s) => { s.material.depthTest = false; s.renderOrder = 5; });
  return { screen, back };
}

function buildAgent(a) {
  const [skin, hair] = LOOK[a.id] || ['#e8b690', '#222'];
  const root = new THREE.Group(); scene.add(root);
  const body = new THREE.Group(); root.add(body);
  const cloth = mat(a.c, { roughness: 0.5, emissive: new THREE.Color(a.c).multiplyScalar(0.08) });
  const dark = mat('#1b1b26', { roughness: 0.7 });
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.09, 0.42, 0); legR.position.set(0.09, 0.42, 0);
  mesh(capsule(0.065, 0.3), dark, 0, -0.2, 0, legL); mesh(capsule(0.065, 0.3), dark, 0, -0.2, 0, legR);
  body.add(legL, legR);
  const torso = mesh(capsule(0.17, 0.26), cloth, 0, 0.66, 0, body);
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.23, 0.8, 0); armR.position.set(0.23, 0.8, 0);
  mesh(capsule(0.05, 0.26), cloth, 0, -0.17, 0, armL); mesh(capsule(0.05, 0.26), cloth, 0, -0.17, 0, armR);
  mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(skin), 0, -0.34, 0, armL); mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(skin), 0, -0.34, 0, armR);
  body.add(armL, armR);
  const head = new THREE.Group(); head.position.set(0, 1.03, 0); body.add(head);
  mesh(new THREE.SphereGeometry(0.15, 24, 16), mat(skin, { roughness: 0.55 }), 0, 0, 0, head);
  const hairM = mesh(new THREE.SphereGeometry(0.158, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair, { roughness: 0.8 }), 0, 0.012, -0.012, head);
  hairM.rotation.x = -0.25;
  const eyeM = new THREE.MeshBasicMaterial({ color: '#111' });
  mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeM, -0.05, 0.01, 0.14, head, false); mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeM, 0.05, 0.01, 0.14, head, false);
  const ring = mesh(new THREE.RingGeometry(0.3, 0.38, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(a.c).multiplyScalar(1.5), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), 0, 0.07, 0, root, false);
  ring.rotation.x = -Math.PI / 2;
  const dot = mesh(new THREE.SphereGeometry(0.055, 12, 8), glow('#555566', 1), 0.2, 1.32, 0, root, false);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.7; hit.userData.id = a.id; root.add(hit); pickables.push(hit);
  const bub = sprite(' ', 0.3, {}); bub.position.set(0, 1.66, 0); bub.visible = false; root.add(bub);
  const [x, z] = W(a.px ?? a.x, a.py ?? a.y - 16);
  root.position.set(x, 0, z);
  return { a, root, body, head, torso, armL, armR, legL, legR, ring, dot, bub, bubText: '', x, z, face: 0, ph: Math.random() * 6 };
}

let dpk = []; // paquetes de datos (Luna → agente)
function packet(from, to, color) {
  if (REDUCED || dpk.length > 18) return;
  const s = mesh(new THREE.SphereGeometry(0.07, 12, 8), glow(color, 2.2), from.x, 1.2, from.z, scene, false);
  const mid = new THREE.Vector3((from.x + to.x) / 2, 2.6, (from.z + to.z) / 2);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(from.x, 1.2, from.z), mid, new THREE.Vector3(to.x, 1.2, to.z));
  dpk.push({ s, curve, t: 0 });
}

function agentsReady() { return window.WMO && Array.isArray(window.WMO.AGENTS) && window.WMO.AGENTS.length; }
function buildAgents() {
  window.WMO.AGENTS.forEach((a) => { const d = buildDesk(a); const g = buildAgent(a); g.desk = d; AG[a.id] = g; });
}

/* ---------- Cámara ---------- */
function placeCamera(t) {
  const sway = REDUCED ? 0 : Math.sin(t * 0.12) * 0.16;
  yaw = BASE_YAW + yawUser + sway;
  camera.position.set(Math.cos(ISO_PITCH) * Math.sin(yaw) * DIST, Math.sin(ISO_PITCH) * DIST, Math.cos(ISO_PITCH) * Math.cos(yaw) * DIST);
  camera.lookAt(0, 0.3, 0);
}
function fit() {
  const w = box.clientWidth || 800, h = box.clientHeight || 600, asp = w / h;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  bloom.resolution.set(w / 2, h / 2);
  // encaja el suelo completo en la vista isométrica
  placeCamera(0); camera.updateMatrixWorld();
  const inv = camera.matrixWorldInverse; let mx = 0, my = 0;
  [[-10.1, -8.4], [10.1, -8.4], [10.1, 8.4], [-10.1, 8.4]].forEach(([x, z]) => [0, 1.8].forEach((y) => { const v = new THREE.Vector3(x, y, z).applyMatrix4(inv); mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y)); }));
  fitHalf = Math.max(mx, my * asp) * 1.02;
  updateFrustum(asp);
}
function updateFrustum(asp = (box.clientWidth || 800) / (box.clientHeight || 600)) {
  const hw = fitHalf / zoom; camera.left = -hw; camera.right = hw; camera.top = hw / asp; camera.bottom = -hw / asp; camera.updateProjectionMatrix();
}

/* Arrastrar para girar, rueda para acercar, doble clic para recolocar */
let drag = null, moved = false;
box.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y0: yawUser }; moved = false; box.setPointerCapture(e.pointerId); });
box.addEventListener('pointermove', (e) => {
  if (drag) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 3) moved = true; yawUser = Math.max(-1.2, Math.min(1.2, drag.y0 - dx * 0.006)); return; }
  hover(e);
});
box.addEventListener('pointerup', (e) => { if (!moved) pick(e); drag = null; });
box.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey && !e.altKey) return; e.preventDefault(); zoom = Math.max(0.8, Math.min(2.6, zoom * (e.deltaY > 0 ? 0.9 : 1.1))); updateFrustum(); }, { passive: false });
box.addEventListener('dblclick', () => { yawUser = 0; zoom = 1; updateFrustum(); });

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function hit(e) {
  const r = box.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(pickables, false)[0]; return h && h.object.userData.id;
}
function pick(e) { const id = hit(e); if (id && window.WMO && window.WMO.select) window.WMO.select(id); }
function hover(e) { box.style.cursor = hit(e) ? 'pointer' : 'grab'; }

/* ---------- Bucle ---------- */
const clock = new THREE.Clock();
let running = false, nextPacket = 0;
const v = new THREE.Vector3();

function tickAgents(t, dt) {
  const sel = window.WMO && window.WMO.sel ? window.WMO.sel() : null;
  const luna = AG.luna;
  Object.values(AG).forEach((g) => {
    const a = g.a, [tx, tz] = W(a.px ?? a.x, a.py ?? a.y - 16);
    const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
    const walking = d > 0.04;
    if (walking) {
      const step = Math.min(d, (REDUCED ? 30 : 3.2) * dt);
      g.x += (dx / d) * step; g.z += (dz / d) * step;
      g.face = Math.atan2(dx, dz);
    } else {
      // en su mesa mira al monitor; fuera, mira hacia la cámara
      const atDesk = Math.abs(tx - W(a.x, 0)[0]) < 0.05 && Math.abs(tz - W(0, a.y - 16)[1]) < 0.05;
      g.face = atDesk ? 0 : Math.atan2(camera.position.x - g.x, camera.position.z - g.z);
    }
    let dr = g.face - g.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    g.root.rotation.y += dr * Math.min(1, dt * 8);
    g.root.position.set(g.x, 0, g.z);

    const work = a.st === 'work';
    const s = t * 10 + g.ph;
    if (walking && !REDUCED) {
      g.legL.rotation.x = Math.sin(s) * 0.6; g.legR.rotation.x = -Math.sin(s) * 0.6;
      g.armL.rotation.x = -Math.sin(s) * 0.5; g.armR.rotation.x = Math.sin(s) * 0.5;
      g.body.position.y = Math.abs(Math.sin(s)) * 0.05; g.head.rotation.y = 0;
    } else if (work && !REDUCED) {
      g.legL.rotation.x = g.legR.rotation.x = 0;
      g.armL.rotation.x = -1.05 + Math.sin(t * 18 + g.ph) * 0.08; g.armR.rotation.x = -1.05 + Math.sin(t * 18 + g.ph + 2) * 0.08;
      g.body.position.y = 0; g.head.rotation.x = 0.12 + Math.sin(t * 2 + g.ph) * 0.04; g.head.rotation.y = Math.sin(t * 0.9 + g.ph) * 0.15;
    } else {
      g.legL.rotation.x = g.legR.rotation.x = 0;
      g.armL.rotation.x = g.armR.rotation.x = REDUCED ? 0 : Math.sin(t * 1.5 + g.ph) * 0.05;
      g.body.position.y = 0; g.head.rotation.x = 0; g.head.rotation.y = REDUCED ? 0 : Math.sin(t * 0.6 + g.ph) * 0.35;
      g.torso.scale.y = 1 + (REDUCED ? 0 : Math.sin(t * 2 + g.ph) * 0.02);
    }
    // anillo, punto de estado y pantalla
    const isSel = sel === a.id;
    g.ring.material.opacity = isSel ? 0.95 : (work ? 0.45 + 0.25 * Math.sin(t * 4 + g.ph) : 0.18);
    g.ring.scale.setScalar(isSel ? 1.25 + Math.sin(t * 3) * 0.06 : 1);
    g.dot.material.color.set(work ? '#00d4aa' : (a.away > 0 ? '#f5c842' : '#555566')).multiplyScalar(work ? 2 : 1.2);
    g.dot.position.y = 1.32 + (REDUCED ? 0 : Math.sin(t * 3 + g.ph) * 0.03);
    const k = work ? 0.85 + 0.15 * Math.sin(t * 9 + g.ph) : 0.3;
    g.desk.screen.material.color.set(a.c).multiplyScalar(k); g.desk.back.material.color.set(a.c).multiplyScalar(k * 0.45);
    // bocadillo
    let txt = a.task ? a.task.title : (a.away > 0 && a.at ? 'En ' + a.at : '');
    if (txt.length > 34) txt = txt.slice(0, 33) + '…';
    if (txt !== g.bubText) {
      g.bubText = txt; g.bub.visible = !!txt;
      if (txt) setSprite(g.bub, txt, 0.3, { size: 34, weight: 400, color: '#f0f0f5', bg: 'rgba(17,17,24,.92)', border: a.c, pad: 26 });
    }
    // paquetes de datos desde Luna a quien trabaja
    if (work && luna && g !== luna && !REDUCED && t > nextPacket && Math.random() < 0.02) { packet(luna, g, a.c); nextPacket = t + 0.4; }
    if (work && a.task && a.task.review && beacon && Math.random() < 0.01) beacon.k = 1;
  });
}

function frame() {
  if (!running) return;
  requestAnimationFrame(frame);
  const visible = !$('oficina').hidden && !document.hidden && !box.hidden;
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  placeCamera(t);
  anim.forEach((f) => f(REDUCED ? 0 : t, dt));
  if (agentsReady() && !Object.keys(AG).length) buildAgents();
  tickAgents(t, dt);
  dpk = dpk.filter((p) => {
    p.t += dt * 0.7; if (p.t >= 1) { scene.remove(p.s); p.s.geometry.dispose(); p.s.material.dispose(); return false; }
    p.curve.getPoint(p.t, v); p.s.position.copy(v); p.s.scale.setScalar(1 + Math.sin(p.t * Math.PI) * 0.6); return true;
  });
  composer.render();
}

/* ---------- Vista 3D / Plano ---------- */
const ro = new ResizeObserver(() => { if (!box.hidden) fit(); });
ro.observe(box);
function setVista(v3) {
  box.hidden = !v3; svg.style.display = v3 ? 'none' : '';
  sw.querySelectorAll('button').forEach((b) => { const on = (b.dataset.vista === '3d') === v3; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  try { localStorage.setItem(CLAVE, v3 ? '3d' : 'plano'); } catch { /* sin almacenamiento */ }
  if (v3) { fit(); if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } } else running = false;
}
sw.addEventListener('click', (e) => { const b = e.target.closest('button[data-vista]'); if (b) setVista(b.dataset.vista === '3d'); });
renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setVista(false); sw.hidden = true; });

let pref = '3d';
try { pref = localStorage.getItem(CLAVE) || '3d'; } catch { /* sin almacenamiento */ }
sw.hidden = false;
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setVista(pref !== 'plano')); else setVista(pref !== 'plano');
