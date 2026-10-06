import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { HOTSPOTS } from './slides.js';

const ACCENT = 0x7a2042;
const CREAM = 0xf4e4d4;
const CHARCOAL = 0x0c0b0d;
const STEEL = 0x3a3a42;
const CONCRETE = 0x2a2a30;

function darkRoom(overrides = {}) {
  return {
    bg: CHARCOAL,
    fog: 0x121014,
    fogNear: 14,
    fogFar: 40,
    ambient: 0x2a2430,
    ambientI: 0.55,
    keyI: 0.95,
    keyPos: [5, 8, 6],
    rim: ACCENT,
    rimI: 1.1,
    rimPos: [-5, 3, -3],
    fill: ACCENT,
    fillI: 4.2,
    ground: 0x1a1018,
    groundI: 2.4,
    floor: 0x1c1a20,
    floorOp: 0.35,
    sky: 0x101014,
    particles: 0x8a6a78,
    particleOp: 0.28,
    pSize: 0.02,
    pScale: 1,
    dust: ACCENT,
    trailA: ACCENT,
    trailB: 0xc4a08a,
    exposure: 0.92,
    bloom: 0.22,
    spin: 0.01,
    cssBg: '#0c0b0d',
    ...overrides,
  };
}

const ROOMS = {
  hero: darkRoom({ bloom: 0.28, rimI: 1.35, fillI: 5.0 }),
  lage: darkRoom({ fogNear: 12, fogFar: 36, ambientI: 0.5 }),
  risiko: darkRoom({ fogNear: 10, fogFar: 34, bloom: 0.32, fillI: 5.5, spin: 0.006 }),
  haftung: darkRoom({ rim: 0x9a3058, fillI: 4.8 }),
  bauwerk: darkRoom({ keyPos: [3, 10, 4], groundI: 3.0 }),
  maschinen: darkRoom({ ambient: 0x242830, particles: 0x708090 }),
  inhalt: darkRoom({ rimI: 0.9, fillI: 3.8 }),
  recht: darkRoom({ fog: 0x141018, bloom: 0.26 }),
  liquiditaet: darkRoom({ fill: 0xa04060, fillI: 5.2 }),
  menschen: darkRoom({ ambient: 0x2c2432, rimI: 1.2 }),
  warum: darkRoom({ bloom: 0.3, rimI: 1.4, fillI: 5.5 }),
  beitrag: darkRoom({ fogNear: 12, fogFar: 38 }),
  paket: darkRoom({ fillI: 4.5 }),
  naechste: darkRoom({ ambientI: 0.48 }),
  schluss: darkRoom({ bloom: 0.34, rimI: 1.5, fillI: 5.8, exposure: 0.98 }),
};

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function coverUVs(geo, w, h, tex) {
  const img = tex.image;
  const tw = img?.width || 1;
  const th = img?.height || 1;
  const texAspect = tw / th;
  const planeAspect = w / h;
  let sx = 1;
  let sy = 1;
  let ox = 0;
  let oy = 0;
  if (texAspect > planeAspect) {
    sx = planeAspect / texAspect;
    ox = (1 - sx) / 2;
  } else {
    sy = texAspect / planeAspect;
    oy = (1 - sy) / 2;
  }
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + w / 2) / w;
    const v = (pos.getY(i) + h / 2) / h;
    uv.setXY(i, ox + u * sx, oy + v * sy);
  }
  uv.needsUpdate = true;
}

function makePhotoMesh(tex, w, h) {
  const shape = roundedShape(w, h, 0.08);
  const geo = new THREE.ShapeGeometry(shape, 12);
  coverUVs(geo, w, h, tex);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const frame = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedShape(w + 0.06, h + 0.06, 0.1), 8),
    new THREE.MeshStandardMaterial({
      color: 0x1a1218,
      emissive: ACCENT,
      emissiveIntensity: 0.22,
      metalness: 0.4,
      roughness: 0.55,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    }),
  );
  frame.position.z = -0.01;
  mesh.add(frame);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 1.15, h * 1.15),
    new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.position.z = -0.04;
  mesh.add(glow);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.92, h * 0.2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -h / 2 - 0.15, 0.2);
  mesh.add(shadow);
  mesh.userData.mat = mat;
  mesh.userData.frame = frame;
  mesh.userData.glow = glow;
  mesh.userData.shadow = shadow;
  return mesh;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function makeCard({ label, sub = '', kicker = '', w = 3.15, h = 3.95 }) {
  /* Portrait tile — pass smaller w/h for dual-card slides */
  const W = 1024;
  const H = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#141018';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(122,32,66,0.38)');
  g.addColorStop(0.4, 'rgba(20,16,24,0.15)');
  g.addColorStop(1, 'rgba(122,32,66,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(122,32,66,0.85)';
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  // Accent bar
  ctx.fillStyle = '#7A2042';
  ctx.fillRect(40, 40, 16, H - 80);

  const pad = 110;
  let y = 220;
  ctx.textBaseline = 'top';

  if (kicker) {
    ctx.fillStyle = 'rgba(244,228,212,0.78)';
    ctx.font = '700 42px Manrope, system-ui, sans-serif';
    ctx.fillText(String(kicker).toUpperCase(), pad, y);
    y += 100;
  }

  ctx.fillStyle = '#F4E4D4';
  const labelSize = String(label).length > 16 ? 78 : String(label).length > 11 ? 92 : 108;
  ctx.font = `700 ${labelSize}px Syne, sans-serif`;
  const labelLines = wrapText(ctx, String(label), W - pad * 2 - 20);
  labelLines.slice(0, 4).forEach((line) => {
    ctx.fillText(line, pad, y);
    y += labelSize + 18;
  });

  y += 40;
  ctx.strokeStyle = 'rgba(122,32,66,0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(pad + 240, y);
  ctx.stroke();
  y += 60;

  if (sub) {
    ctx.fillStyle = 'rgba(244,228,212,0.78)';
    ctx.font = '500 48px Manrope, system-ui, sans-serif';
    const subLines = wrapText(ctx, sub, W - pad * 2 - 20);
    subLines.slice(0, 10).forEach((line) => {
      ctx.fillText(line, pad, y);
      y += 62;
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mesh = makePhotoMesh(tex, w, h);
  mesh.userData.isCard = true;
  return mesh;
}

function matSteel(color = STEEL) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.55,
    roughness: 0.42,
    emissive: ACCENT,
    emissiveIntensity: 0.04,
  });
}

function matConcrete() {
  return new THREE.MeshStandardMaterial({
    color: CONCRETE,
    metalness: 0.15,
    roughness: 0.85,
    emissive: 0x1a1018,
    emissiveIntensity: 0.08,
  });
}

function buildConstructionSite() {
  const root = new THREE.Group();
  root.name = 'site';

  // Ground plate
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(18, 48),
    new THREE.MeshStandardMaterial({
      color: 0x16141a,
      metalness: 0.2,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.85;
  root.add(ground);

  // Grid lines
  const grid = new THREE.GridHelper(20, 20, 0x7a2042, 0x2a2430);
  grid.position.y = -2.84;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  root.add(grid);

  // Building blocks (rising structure)
  const building = new THREE.Group();
  building.name = 'building';
  const levels = [
    { w: 2.4, d: 1.8, h: 0.7, y: -2.4 },
    { w: 2.2, d: 1.6, h: 0.7, y: -1.7 },
    { w: 2.0, d: 1.4, h: 0.7, y: -1.0 },
    { w: 1.6, d: 1.2, h: 0.55, y: -0.35 },
  ];
  levels.forEach((L, i) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(L.w, L.h, L.d), matConcrete());
    box.position.set(0.4, L.y, -1.2);
    box.userData.phase = i * 0.4;
    building.add(box);
  });
  root.add(building);

  // Scaffolding
  const scaffold = new THREE.Group();
  scaffold.name = 'scaffold';
  const barMat = matSteel(0x4a3040);
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), barMat);
    post.position.set(-2.8 + i * 0.55, -1.2, 0.6);
    scaffold.add(post);
  }
  for (let r = 0; r < 3; r++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.04), barMat);
    rail.position.set(-1.95, -2.2 + r * 0.9, 0.6);
    scaffold.add(rail);
  }
  // Platforms
  for (let r = 0; r < 3; r++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.05, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x3a2820, roughness: 0.8, metalness: 0.1 }),
    );
    plank.position.set(-1.95, -2.15 + r * 0.9, 0.6);
    scaffold.add(plank);
  }
  root.add(scaffold);

  // Crane
  const crane = new THREE.Group();
  crane.name = 'crane';
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.2, 0.18), matSteel(0x5a2038));
  mast.position.set(3.4, -0.2, -0.4);
  crane.add(mast);
  const jib = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.12), matSteel(0x7a2042));
  jib.position.set(1.6, 2.35, -0.4);
  crane.add(jib);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), matSteel(STEEL));
  counter.position.set(4.3, 2.35, -0.4);
  crane.add(counter);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), matSteel(0x2a2030));
  cabin.position.set(3.4, 2.0, -0.4);
  crane.add(cabin);
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), matSteel());
  hook.position.set(0.4, 1.45, -0.4);
  crane.add(hook);
  const load = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), matConcrete());
  load.position.set(0.4, 0.45, -0.4);
  crane.add(load);
  root.add(crane);

  // Machine silhouette (excavator-ish)
  const machine = new THREE.Group();
  machine.name = 'machine';
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.85), matSteel(0x3a3038));
  body.position.set(2.6, -2.35, 1.4);
  machine.add(body);
  const cabinM = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.7), matSteel(0x7a2042));
  cabinM.position.set(2.2, -1.85, 1.4);
  machine.add(cabinM);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.12), matSteel());
  arm.position.set(3.3, -1.7, 1.4);
  arm.rotation.z = -0.45;
  machine.add(arm);
  const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.4), matSteel(0x4a2030));
  bucket.position.set(3.95, -2.15, 1.4);
  machine.add(bucket);
  // Tracks
  [-0.4, 0.4].forEach((zOff) => {
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.22, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.95 }),
    );
    track.position.set(2.6, -2.72, 1.4 + zOff);
    machine.add(track);
  });
  root.add(machine);

  // Yard shed
  const shed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.2), matConcrete());
  shed.position.set(-3.2, -2.25, -0.8);
  shed.name = 'yard';
  root.add(shed);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.08, 1.35),
    matSteel(0x5a2038),
  );
  roof.position.set(-3.2, -1.65, -0.8);
  root.add(roof);

  // Hotspot markers
  const hotGroup = new THREE.Group();
  hotGroup.name = 'hotspots';
  hotGroup.visible = false;
  HOTSPOTS.forEach((h) => {
    const g = new THREE.Group();
    g.userData.hotspotId = h.id;
    g.userData.label = h.label;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 8, 24),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.9 }),
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: CREAM }),
    );
    g.add(core);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.9, 6),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.35 }),
    );
    beam.position.y = -0.45;
    g.add(beam);
    g.position.set(h.x, h.y, h.z);
    g.userData.rest = { x: h.x, y: h.y, z: h.z };
    g.userData.phase = Math.random() * Math.PI * 2;
    hotGroup.add(g);
  });
  root.add(hotGroup);

  root.position.set(0.2, 0, -0.5);
  return { root, hotGroup, crane, building, scaffold, machine };
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(CHARCOAL, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x121014, 14, 40);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0.35, 9);

  const look = new THREE.Vector3(0.4, 0.2, 0);

  const ambient = new THREE.AmbientLight(0x2a2430, 0.55);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.position.set(5, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(ACCENT, 1.1);
  rim.position.set(-5, 3, -3);
  scene.add(rim);
  const fill = new THREE.PointLight(ACCENT, 4.2, 28, 2);
  fill.position.set(0, 1.4, 4);
  scene.add(fill);
  const groundGlow = new THREE.PointLight(0x1a1018, 2.4, 18, 2);
  groundGlow.position.set(0, -3, 2);
  scene.add(groundGlow);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(38, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x101014,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  scene.add(sky);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(24, 56),
    new THREE.MeshBasicMaterial({
      color: 0x1c1a20,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.35;
  scene.add(floor);

  const site = buildConstructionSite();
  scene.add(site.root);

  const roomState = {
    id: '',
    spin: ROOMS.hero.spin,
    fogColor: new THREE.Color(0x121014),
    fogNear: 14,
    fogFar: 40,
  };
  const clearProxy = { r: 0.047, g: 0.043, b: 0.051 };

  function hexRgb(hex) {
    const c = new THREE.Color(hex);
    return { r: c.r, g: c.g, b: c.b };
  }

  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
  let mobile = isMobile();
  const count = mobile ? 220 : 680;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 22 - 2;
    speeds[i] = 0.04 + Math.random() * 0.08;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x8a6a78,
    size: mobile ? 0.026 : 0.018,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  const dustN = 48;
  const dustPos = new Float32Array(dustN * 3);
  const dustLife = new Float32Array(dustN);
  let dustHead = 0;
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: 0.045,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);
  const dustAt = new THREE.Vector3();
  let lastPx = 0;
  let lastPy = 0;

  function makeTrail(color) {
    const geo = new THREE.BufferGeometry();
    const n = 80;
    const pos = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    return { geo, mat, pos, n, line };
  }
  const trailA = makeTrail(ACCENT);
  const trailB = makeTrail(0xc4a08a);

  function applyRoom(id, reduced = false) {
    const room = ROOMS[id] || ROOMS.hero;
    if (roomState.id === id && !reduced) return;
    roomState.id = id;
    roomState.spin = room.spin;
    const dur = reduced ? 0.01 : 1.7;
    const ease = 'power3.inOut';
    const fogCol = hexRgb(room.fog || room.bg);
    gsap.killTweensOf(clearProxy);
    gsap.killTweensOf(scene.fog);
    gsap.to(clearProxy, {
      r: fogCol.r,
      g: fogCol.g,
      b: fogCol.b,
      duration: dur,
      ease,
      onUpdate: () => {
        const col = new THREE.Color(clearProxy.r, clearProxy.g, clearProxy.b);
        renderer.setClearColor(col, 1);
        if (scene.fog) scene.fog.color.copy(col);
        roomState.fogColor.copy(col);
      },
    });
    roomState.fogNear = room.fogNear;
    roomState.fogFar = room.fogFar;
    if (scene.fog) gsap.to(scene.fog, { near: room.fogNear, far: room.fogFar, duration: dur, ease });
    gsap.to(ambient.color, { ...hexRgb(room.ambient), duration: dur, ease });
    gsap.to(ambient, { intensity: room.ambientI, duration: dur, ease });
    gsap.to(key, { intensity: room.keyI, duration: dur, ease });
    gsap.to(key.position, { x: room.keyPos[0], y: room.keyPos[1], z: room.keyPos[2], duration: dur, ease });
    gsap.to(rim.color, { ...hexRgb(room.rim), duration: dur, ease });
    gsap.to(rim, { intensity: room.rimI, duration: dur, ease });
    gsap.to(fill.color, { ...hexRgb(room.fill), duration: dur, ease });
    gsap.to(fill, { intensity: room.fillI, duration: dur, ease });
    gsap.to(groundGlow, { intensity: room.groundI, duration: dur, ease });
    gsap.to(sky.material.color, { ...hexRgb(room.sky), duration: dur, ease });
    gsap.to(floor.material.color, { ...hexRgb(room.floor), duration: dur, ease });
    gsap.to(pMat.color, { ...hexRgb(room.particles), duration: dur, ease });
    gsap.to(pMat, { opacity: room.particleOp, size: room.pSize, duration: dur, ease });
    gsap.to(trailA.mat.color, { ...hexRgb(room.trailA), duration: dur, ease });
    gsap.to(trailB.mat.color, { ...hexRgb(room.trailB), duration: dur, ease });
    gsap.to(renderer, { toneMappingExposure: room.exposure, duration: dur, ease });
    if (bloomPass) gsap.to(bloomPass, { strength: room.bloom, duration: dur, ease });
    const app = document.getElementById('app');
    if (app) {
      app.setAttribute('data-room', id);
      app.style.setProperty('--bg', room.cssBg);
    }
    document.documentElement.style.setProperty('--bg', room.cssBg);
  }

  const loader = new THREE.TextureLoader();
  const texCache = new Map();

  function loadTex(url) {
    if (texCache.has(url)) return texCache.get(url);
    const prom = new Promise((resolve, reject) => {
      loader.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.generateMipmaps = true;
          resolve(t);
        },
        undefined,
        reject,
      );
    });
    texCache.set(url, prom);
    return prom;
  }

  const slideGroups = [];
  let composer = null;
  let bloomPass = null;
  let useBloom = !mobile && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupComposer(w, h) {
    if (!useBloom) {
      composer = null;
      return;
    }
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.35, 0.88);
    composer.addPass(bloomPass);
  }

  async function buildSlides(slides) {
    const urls = new Set();
    slides.forEach((s) => (s.photos || []).forEach((ph) => urls.add(ph.src)));
    await Promise.all([...urls].map((u) => loadTex(u).catch(() => null)));

    for (const slide of slides) {
      const g = new THREE.Group();
      g.visible = false;
      for (const ph of slide.photos || []) {
        try {
          const tex = await texCache.get(ph.src);
          if (!tex) continue;
          const mesh = makePhotoMesh(tex, ph.w, ph.h);
          mesh.position.set(ph.x, ph.y, ph.z);
          mesh.rotation.y = ph.ry || 0;
          mesh.userData.rest = { x: ph.x, y: ph.y, z: ph.z, ry: ph.ry || 0 };
          mesh.userData.phase = Math.random() * Math.PI * 2;
          g.add(mesh);
        } catch {
          /* skip missing photo */
        }
      }
      for (const card of slide.cards || []) {
        const mesh = makeCard(card);
        mesh.position.set(card.x, card.y, card.z);
        mesh.userData.rest = { x: card.x, y: card.y, z: card.z, ry: card.ry || 0 };
        mesh.userData.phase = Math.random() * Math.PI * 2;
        mesh.rotation.y = card.ry || 0;
        g.add(mesh);
      }
      scene.add(g);
      slideGroups.push(g);
    }
  }

  let current = -1;
  let hover = null;
  let focused = null;
  let focusBusy = false;
  let hotspotPick = null;
  const pointer = new THREE.Vector2(0, 0);
  let pointerLive = false;
  const raycaster = new THREE.Raycaster();

  function setSiteMode(mode) {
    const show = (obj, on) => {
      if (!obj) return;
      gsap.to(obj.scale, { x: on ? 1 : 0.01, y: on ? 1 : 0.01, z: on ? 1 : 0.01, duration: 0.8, ease: 'power2.out' });
      obj.visible = true;
      if (!on) {
        gsap.delayedCall(0.85, () => {
          if (obj.scale.x < 0.05) obj.visible = false;
        });
      }
    };
    const wide = !mode || mode === 'wide' || mode === 'map';
    show(site.crane, wide || mode === 'building' || mode === 'machine');
    show(site.building, wide || mode === 'building' || mode === 'scaffold');
    show(site.scaffold, wide || mode === 'scaffold' || mode === 'yard');
    show(site.machine, wide || mode === 'machine');
    site.hotGroup.visible = mode === 'map';
    if (mode === 'map') {
      site.hotGroup.children.forEach((m, i) => {
        m.scale.set(0.01, 0.01, 0.01);
        gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.7, delay: 0.1 + i * 0.06, ease: 'back.out(1.6)' });
      });
    }
  }

  function killMeshTweens(m) {
    gsap.killTweensOf(m.position);
    gsap.killTweensOf(m.scale);
    gsap.killTweensOf(m.rotation);
    if (m.userData.mat) gsap.killTweensOf(m.userData.mat);
    if (m.userData.shadow) gsap.killTweensOf(m.userData.shadow.material);
    if (m.userData.glow) gsap.killTweensOf(m.userData.glow.material);
  }

  function fadeGroup(group, show, delay = 0) {
    group.visible = true;
    group.children.forEach((m, i) => {
      killMeshTweens(m);
      const rest = m.userData.rest || { x: 0, y: 0, z: 0, ry: 0 };
      const mat = m.userData.mat;
      if (show) {
        m.position.set(rest.x * 1.15, rest.y - 0.3, rest.z - 1.0);
        m.scale.set(0.88, 0.88, 0.88);
        if (mat) mat.opacity = 0;
        gsap.to(m.position, { x: rest.x, y: rest.y, z: rest.z, duration: 1.25, delay: delay + i * 0.08, ease: 'power3.out' });
        gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 1.25, delay: delay + i * 0.08, ease: 'power3.out' });
        if (mat) gsap.to(mat, { opacity: 1, duration: 0.85, delay: delay + i * 0.08, ease: 'power2.out' });
        if (m.userData.glow) gsap.to(m.userData.glow.material, { opacity: 0.14, duration: 1, delay: delay + 0.15 });
        if (m.userData.shadow) gsap.to(m.userData.shadow.material, { opacity: 0.22, duration: 0.9, delay: delay + 0.2 });
      } else {
        gsap.to(m.position, { z: rest.z - 0.7, y: rest.y + 0.12, duration: 0.65, ease: 'power2.in' });
        if (mat) gsap.to(mat, { opacity: 0, duration: 0.5, ease: 'power2.in' });
        if (m.userData.glow) gsap.to(m.userData.glow.material, { opacity: 0, duration: 0.35 });
        gsap.to(m.scale, {
          x: 0.94,
          y: 0.94,
          z: 0.94,
          duration: 0.65,
          ease: 'power2.in',
          onComplete: () => {
            if (current !== slideGroups.indexOf(group)) group.visible = false;
          },
        });
      }
    });
  }

  function fillTrail(trail, from, to, amp) {
    for (let i = 0; i < trail.n; i++) {
      const t = i / (trail.n - 1);
      const s = t * t * (3 - 2 * t);
      trail.pos[i * 3] = from.x + (to.x - from.x) * s + Math.sin(t * 8) * amp;
      trail.pos[i * 3 + 1] = from.y + (to.y - from.y) * s + Math.sin(t * 5) * amp * 0.55;
      trail.pos[i * 3 + 2] = from.z + (to.z - from.z) * s;
    }
    trail.geo.attributes.position.needsUpdate = true;
    trail.mat.opacity = 0.8;
    gsap.to(trail.mat, { opacity: 0, duration: 1.3, ease: 'power2.out', delay: 0.12 });
  }

  function burstTrail(from, to) {
    fillTrail(trailA, from, to, 0.14);
    fillTrail(trailB, from, to, 0.2);
  }

  function setSlide(index, { reduced = false, section = 'hero', siteMode = 'wide', hotspots = false } = {}) {
    if (focused) closeFocus({ instant: true });
    applyRoom(section, reduced);
    setSiteMode(hotspots ? 'map' : siteMode);
    if (index === current) return;
    const prev = current;
    hover = null;
    if (prev >= 0 && slideGroups[prev]?.children.length) fadeGroup(slideGroups[prev], false);
    current = index;
    const g = slideGroups[index];
    if (g && g.children.length) fadeGroup(g, true, reduced ? 0 : 0.22);
  }

  function pickFrom(group) {
    if (!group || !group.visible) return null;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(group.children, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && obj !== group) {
      if (obj.userData?.mat) return obj;
      obj = obj.parent;
    }
    return null;
  }

  function pickHotspot() {
    if (!site.hotGroup.visible) return null;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(site.hotGroup.children, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && obj !== site.hotGroup) {
      if (obj.userData?.hotspotId) return obj;
      obj = obj.parent;
    }
    return null;
  }

  function openFocus(mesh, reduced = false) {
    if (!mesh || focusBusy) return;
    if (focused === mesh) {
      closeFocus();
      return;
    }
    if (focused) closeFocus({ instant: true });
    focused = mesh;
    focusBusy = true;
    mesh.userData.locked = true;
    document.getElementById('app')?.classList.add('is-focus');
    document.getElementById('hud')?.classList.add('dim');
    scene.fog = null;
    const rest = mesh.userData.rest || { x: 0, y: 0, z: 0, ry: 0 };
    const heroX = mobile ? 0.1 : 0.85;
    const heroY = mobile ? 1.0 : 0.28;
    const heroZ = rest.z + (mobile ? 0.55 : 0.9);
    const heroScale = mobile ? 1.75 : 2.15;
    const dur = reduced ? 0.01 : 0.4;
    const tl = gsap.timeline({ onComplete: () => { focusBusy = false; } });
    tl.to(mesh.rotation, { y: rest.ry + Math.PI * 0.5, duration: dur, ease: 'power2.in' }, 0);
    tl.to(mesh.scale, { x: 0.35, y: 1.1, z: 1, duration: dur, ease: 'power2.in' }, 0);
    tl.to(mesh.rotation, { y: 0, duration: 0.65, ease: 'power3.out' });
    tl.to(mesh.position, { x: heroX, y: heroY, z: heroZ, duration: 0.65, ease: 'back.out(1.4)' }, '<');
    tl.to(mesh.scale, { x: heroScale, y: heroScale, z: 1, duration: 0.65, ease: 'back.out(1.5)' }, '<');
  }

  function closeFocus({ instant = false } = {}) {
    const mesh = focused;
    if (!mesh) return false;
    focused = null;
    focusBusy = !instant;
    document.getElementById('app')?.classList.remove('is-focus');
    document.getElementById('hud')?.classList.remove('dim');
    scene.fog = new THREE.Fog(roomState.fogColor.clone(), roomState.fogNear, roomState.fogFar);
    const rest = mesh.userData.rest || { x: 0, y: 0, z: 0, ry: 0 };
    const dur = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.01 : 0.5;
    gsap.to(mesh.position, { x: rest.x, y: rest.y, z: rest.z, duration: dur, ease: 'power3.inOut' });
    gsap.to(mesh.rotation, { x: 0, y: rest.ry, duration: dur, ease: 'power3.inOut' });
    gsap.to(mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: dur,
      ease: 'power3.inOut',
      onComplete: () => {
        mesh.userData.locked = false;
        focusBusy = false;
      },
    });
    return true;
  }

  function onClick() {
    if (focusBusy) return;
    const hot = pickHotspot();
    if (hot && typeof hotspotPick === 'function') {
      hotspotPick(hot.userData.hotspotId, hot.userData.label);
      gsap.fromTo(hot.scale, { x: 1.35, y: 1.35, z: 1.35 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'power2.out' });
      return;
    }
    const mesh = pickFrom(slideGroups[current]);
    if (focused) {
      if (!mesh || mesh === focused) closeFocus();
      else openFocus(mesh);
      return;
    }
    if (mesh) openFocus(mesh);
  }

  function setPointer(x, y) {
    pointer.x = x;
    pointer.y = y;
    pointerLive = true;
  }

  function layoutGroups(w) {
    mobile = w < 720;
    useBloom = !mobile && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = mobile ? 0.62 : w < 1100 ? 0.95 : 1.05;
    slideGroups.forEach((g) => {
      g.scale.setScalar(s);
      g.position.set(0, mobile ? 0.95 : 0, 0);
    });
    site.root.scale.setScalar(mobile ? 0.68 : 1);
    site.root.position.set(mobile ? 0 : 0.2, mobile ? 0.4 : 0, mobile ? -0.2 : -0.5);
  }

  function resize(w, h) {
    camera.aspect = w / h;
    camera.fov = w < 720 ? 42 : 34;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    layoutGroups(w);
    if (useBloom) {
      if (!composer) setupComposer(w, h);
      else {
        composer.setSize(w, h);
        bloomPass?.setSize(w, h);
      }
    } else composer = null;
  }

  function tick(t, reduced) {
    const px = pointerLive ? pointer.x : 0;
    const py = pointerLive ? pointer.y : 0;

    if (!reduced) {
      particles.rotation.y = t * roomState.spin;
      particles.position.x = THREE.MathUtils.lerp(particles.position.x, px * 0.4, 0.06);
      particles.position.y = THREE.MathUtils.lerp(particles.position.y, py * 0.16, 0.06);
      const arr = pGeo.attributes.position.array;
      for (let i = 0; i < count; i++) arr[i * 3 + 1] += Math.sin(t * speeds[i] + i) * 0.001;
      pGeo.attributes.position.needsUpdate = true;

      // Crane idle sway
      if (site.crane.visible) {
        site.crane.rotation.y = Math.sin(t * 0.15) * 0.08;
      }
      site.hotGroup.children.forEach((m) => {
        const ph = m.userData.phase || 0;
        m.position.y = (m.userData.rest?.y || 0) + Math.sin(t * 1.2 + ph) * 0.08;
        m.rotation.y = t * 0.4 + ph;
      });

      if (!mobile && pointerLive && (Math.abs(px - lastPx) > 0.004 || Math.abs(py - lastPy) > 0.004)) {
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.at(7.1, dustAt);
        for (let n = 0; n < 2; n++) {
          const i = dustHead++ % dustN;
          dustPos[i * 3] = dustAt.x + (Math.random() - 0.5) * 0.16;
          dustPos[i * 3 + 1] = dustAt.y + (Math.random() - 0.5) * 0.16;
          dustPos[i * 3 + 2] = dustAt.z + (Math.random() - 0.5) * 0.16;
          dustLife[i] = 1;
        }
        lastPx = px;
        lastPy = py;
      }
      let liveDust = 0;
      for (let i = 0; i < dustN; i++) {
        if (dustLife[i] <= 0) {
          dustPos[i * 3 + 1] = -40;
          continue;
        }
        dustLife[i] -= 0.018;
        dustPos[i * 3 + 1] += 0.01;
        liveDust += dustLife[i];
      }
      dustGeo.attributes.position.needsUpdate = true;
      dustMat.opacity = Math.min(0.7, liveDust * 0.04);
    } else {
      dustMat.opacity = 0;
    }

    const g = slideGroups[current];
    const next = pickFrom(g);
    if (!focused && hover !== next) {
      if (hover) gsap.to(hover.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power2.out' });
      hover = next;
      if (hover) gsap.to(hover.scale, { x: 1.06, y: 1.06, z: 1, duration: 0.4, ease: 'power2.out' });
    }

    if (g) {
      g.children.forEach((m) => {
        const rest = m.userData.rest;
        if (!rest || m.userData.locked) return;
        const ph = m.userData.phase || 0;
        const depth = THREE.MathUtils.clamp(0.05 + (rest.z + 1.2) * 0.1, 0.04, 0.28);
        const mag = !reduced && m === hover ? 1 : 0;
        const idle = reduced ? 0 : Math.sin(t * 0.7 + ph) * 0.045;
        m.position.x = THREE.MathUtils.lerp(m.position.x, rest.x + px * depth + mag * px * 0.35, mag ? 0.14 : 0.08);
        m.position.y = THREE.MathUtils.lerp(m.position.y, rest.y + idle + py * depth * 0.7, mag ? 0.14 : 0.08);
        m.position.z = THREE.MathUtils.lerp(m.position.z, rest.z + mag * 0.2, mag ? 0.14 : 0.08);
        m.rotation.y = THREE.MathUtils.lerp(
          m.rotation.y,
          rest.ry + (reduced ? 0 : Math.sin(t * 0.35 + ph) * 0.02) + (mag ? px * 0.28 : px * 0.04),
          0.1,
        );
      });
    }

    camera.lookAt(look.x + px * 0.14, look.y + py * 0.07, look.z);
    if (composer && useBloom && !reduced && !focused) composer.render();
    else renderer.render(scene, camera);
  }

  setupComposer(window.innerWidth || 1280, window.innerHeight || 720);

  return {
    renderer,
    scene,
    camera,
    look,
    buildSlides,
    setSlide,
    setPointer,
    resize,
    tick,
    burstTrail,
    onClick,
    closeFocus,
    onHotspotPick: (fn) => {
      hotspotPick = fn;
    },
    isFocused: () => !!focused,
    isHovering: () => !!hover || !!focused,
  };
}
