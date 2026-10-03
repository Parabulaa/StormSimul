// StormSight hero — low-poly 3D home in a living flood. 1 unit ≈ 1 m, street level at y = 0.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const DEG = Math.PI / 180;
const TILE = 22;

const WEATHER = {
  clear: { depth: 0.2, hemi: 1.55, sun: 1.9, tint: 0x8be2ef, deep: 0x55b7ea, flow: 0.7 },
  rain:  { depth: 0.5, hemi: 1.35, sun: 1.5,  tint: 0x86dcef, deep: 0x4a9be2, flow: 1.0 },
  storm: { depth: 1.1, hemi: 1.0,  sun: 0.95, tint: 0x6cb9de, deep: 0x2f68b8, flow: 1.55 },
};

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, flatShading: true, ...extra });

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildHouse() {
  const g = new THREE.Group();
  const white = mat(0xf8fafd);
  const navy = mat(0x1d3784, { roughness: 0.6 });
  const glass = mat(0x7cc4f4, { roughness: 0.15, metalness: 0.1, emissive: 0x2d6fd8, emissiveIntensity: 0.12 });
  const frame = mat(0xe9eef6);

  // main volume: 6.4 wide (x), 5.4 deep (z), walls 4.8 tall
  const W = 6.4, D = 5.4, H = 4.8, base = 0.36;
  g.add(box(W + 0.3, 0.22, D + 0.3, mat(0xdde5ef), 0, base - 0.05, 0));
  g.add(box(W, H, D, white, 0, base + H / 2, 0));

  // gable fill + roof planes (ridge along z)
  const rise = 2.5;
  const gable = new THREE.Shape();
  gable.moveTo(-W / 2, 0); gable.lineTo(W / 2, 0); gable.lineTo(0, rise); gable.closePath();
  const gableMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: D, bevelEnabled: false }), white);
  gableMesh.position.set(0, base + H, -D / 2);
  gableMesh.castShadow = true;
  g.add(gableMesh);

  const slope = Math.atan2(rise, W / 2);
  const planeLen = Math.hypot(W / 2, rise) + 0.55;
  for (const s of [-1, 1]) {
    const p = box(planeLen, 0.22, D + 0.7, navy);
    p.rotation.z = -s * slope;
    p.position.set(s * (W / 4 + 0.12), base + H + rise / 2 + 0.12, 0);
    g.add(p);
  }
  g.add(box(0.7, 2.0, 0.7, white, 1.6, base + H + rise - 0.1, -1.2)); // chimney
  g.add(box(0.85, 0.14, 0.85, mat(0xdde5ef), 1.6, base + H + rise + 0.95, -1.2));

  // windows: front face (+z) and side face (+x)
  const win = (x, y, z, rotY) => {
    const w = new THREE.Group();
    w.add(box(1.25, 1.45, 0.08, frame));
    const pane = box(1.05, 1.25, 0.1, glass);
    w.add(pane);
    w.add(box(0.06, 1.25, 0.12, frame));
    w.add(box(1.05, 0.06, 0.12, frame));
    w.position.set(x, y, z);
    w.rotation.y = rotY;
    g.add(w);
  };
  const fz = D / 2 + 0.02, sx = W / 2 + 0.02;
  win(-1.9, base + 3.6, fz, 0); win(0.4, base + 3.6, fz, 0); win(2.2, base + 3.6, fz, 0);
  win(0.4, base + 1.4, fz, 0);
  win(sx, base + 3.95, -1.0, Math.PI / 2);
  win(-sx, base + 3.6, 0.6, -Math.PI / 2);

  // door + porch canopy + steps
  g.add(box(1.1, 2.1, 0.12, navy, -1.9, base + 1.05, fz + 0.02));
  g.add(box(1.9, 0.16, 1.2, navy, -1.9, base + 2.45, fz + 0.55));
  g.add(box(1.7, 0.18, 0.7, mat(0xe3e9f1), -1.9, base - 0.02, fz + 0.45));
  g.add(box(1.3, 0.12, 0.08, mat(0xffd98a, { emissive: 0xffc14d, emissiveIntensity: 0.6 }), -1.9, base + 2.25, fz + 0.06));

  // attached garage on +x side
  const garage = new THREE.Group();
  garage.add(box(3.4, 2.9, 4.2, white, 0, base + 1.45, 0));
  garage.add(box(3.9, 0.22, 4.7, navy, 0, base + 3.0, 0.05));
  garage.add(box(2.6, 1.9, 0.08, mat(0xe2e8f1), 0, base + 1.0, 2.12));
  for (let i = 0; i < 4; i++) garage.add(box(2.6, 0.03, 0.1, mat(0xc9d3e1), 0, base + 0.35 + i * 0.45, 2.15));
  garage.position.set(W / 2 + 1.7, 0, 0.6);
  g.add(garage);
  return g;
}

function buildCar() {
  const g = new THREE.Group();
  const paint = mat(0x223f94, { roughness: 0.4, metalness: 0.15 });
  const glass = mat(0x9fd5f7, { roughness: 0.1 });
  g.add(box(1.8, 0.62, 3.6, paint, 0, 0.62, 0));
  g.add(box(1.6, 0.6, 1.9, paint, 0, 1.2, -0.25));
  g.add(box(1.62, 0.44, 1.5, glass, 0, 1.22, -0.25));
  g.add(box(1.4, 0.4, 0.05, glass, 0, 1.15, 0.72));
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14);
  const tire = mat(0x1b2236, { flatShading: false });
  for (const [x, z] of [[-0.86, 1.15], [0.86, 1.15], [-0.86, -1.2], [0.86, -1.2]]) {
    const w = new THREE.Mesh(wheelGeo, tire);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.36, z);
    w.castShadow = true;
    g.add(w);
  }
  g.add(box(0.36, 0.14, 0.04, mat(0xfff2c4, { emissive: 0xffe08a, emissiveIntensity: 0.8 }), -0.6, 0.72, 1.81));
  g.add(box(0.36, 0.14, 0.04, mat(0xfff2c4, { emissive: 0xffe08a, emissiveIntensity: 0.8 }), 0.6, 0.72, 1.81));
  return g;
}

function buildTree(scale = 1, hue = 0x5aae6a) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.8, 6), mat(0x7a5a43));
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  g.add(trunk);
  const leaf = mat(hue);
  const a = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), leaf);
  a.position.y = 2.6; a.castShadow = true;
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), leaf);
  b.position.set(0.35, 3.45, 0.1); b.rotation.set(0.4, 0.8, 0); b.castShadow = true;
  g.add(a, b);
  g.scale.setScalar(scale);
  g.userData.crown = [a, b];
  return g;
}

const waterVert = /* glsl */`
  uniform float uTime;
  uniform float uFlow;
  varying vec2 vXZ;
  void main(){
    vec3 p = position;
    vec4 w = modelMatrix * vec4(p,1.0);
    float t = uTime * uFlow;
    w.y += 0.035*sin(w.x*0.75 + t*1.1) + 0.03*sin(w.z*0.95 - t*1.35) + 0.015*sin((w.x+w.z)*1.7 + t*2.0);
    vXZ = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const waterFrag = /* glsl */`
  uniform float uTime;
  uniform float uFlow;
  uniform vec3 uLight;
  uniform vec3 uDeep;
  uniform vec2 uRings[7];
  uniform vec2 uHalf;
  uniform float uAlpha;
  varying vec2 vXZ;
  void main(){
    vec2 p = vXZ;
    float t = uTime * uFlow;
    // depth-ish colour variation
    float n = 0.5 + 0.5*sin(p.x*0.22 + p.y*0.17 + t*0.15) * sin(p.y*0.26 - t*0.1);
    vec3 col = mix(uDeep, uLight, 0.35 + 0.45*n);
    // meandering current lines that drift downstream
    float bend = sin(p.y*0.32 + t*0.22)*1.9 + sin(p.y*0.71 - t*0.15)*0.6;
    float band = sin((p.x + bend)*1.15 - t*0.9);
    float lines = smoothstep(0.955, 0.995, band) * 0.55;
    float band2 = sin((p.x*0.8 - p.y*0.35 + bend*0.6)*1.6 + t*0.6);
    lines += smoothstep(0.975, 0.998, band2) * 0.28;
    // rings around trees / walls standing in water
    float rings = 0.0;
    for(int i=0;i<7;i++){
      float d = length(p - uRings[i]);
      float r = abs(fract(d*0.85 - t*0.32) - 0.5);
      rings += (1.0 - smoothstep(0.0, 0.05, r - 0.42)) * smoothstep(3.2, 0.7, d) * step(0.45, d);
    }
    rings = min(rings, 1.0) * 0.45;
    // glints that sparkle in drifting patches rather than a regular grid
    float glintMask = smoothstep(0.55, 1.0, sin(p.x*0.37 + t*0.21) * sin(p.y*0.43 - t*0.17) + 0.45);
    float g = pow(max(0.0, sin(p.x*2.3 + p.y*0.9 + t*1.4) * sin(p.y*2.7 - p.x*0.6 - t*1.1)), 24.0) * 0.45 * glintMask;
    // soften at the tile border
    vec2 e = smoothstep(uHalf, uHalf - 1.6, abs(p));
    float edge = e.x * e.y;
    col = mix(col, vec3(1.0), clamp(lines + rings + g, 0.0, 0.85));
    gl_FragColor = vec4(col, min(1.0, mix(0.5, 0.76, edge) * uAlpha));
  }`;

export function createHouseScene(container, { onFrame, reducedMotion = false, weather = 'rain' } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 300);
  const camDir = new THREE.Vector3(1, 0.86, 1.08).normalize();
  const target = new THREE.Vector3(0.6, 1.4, 0.4);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9d6f0, 1.3);
  const sun = new THREE.DirectionalLight(0xfff8ee, 1.45);
  sun.position.set(16, 24, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  sun.shadow.bias = -0.0006;
  sun.shadow.radius = 4;
  scene.add(hemi, sun);

  const world = new THREE.Group();
  scene.add(world);

  // ── diorama tile
  const slab = box(TILE, 1.4, TILE, mat(0x9cc4e8, { roughness: 0.95 }), 0, -0.7, 0);
  slab.castShadow = false;
  world.add(slab);
  world.add(box(TILE + 0.02, 0.05, TILE + 0.02, mat(0xb9d3e6), 0, -0.02, 0)); // street-level ground (under water)
  world.add(box(4.2, 0.06, TILE, mat(0xc7d2de), -8.6, 0.01, 0)); // road on the west edge
  for (let z = -9; z < 10; z += 3) world.add(box(0.14, 0.02, 1.4, mat(0xffffff), -8.6, 0.05, z));

  // raised yard
  const yard = box(12.4, 0.32, 13, mat(0x9fd38c), 1.2, 0.16, 0.2);
  world.add(yard);
  world.add(box(3.2, 0.06, 6.0, mat(0xe8eef4), 5.35, 0.34, 4.0)); // driveway to garage
  world.add(box(1.5, 0.05, 4.8, mat(0xe3e9f1), -2.3, 0.34, 4.2)); // front path

  // fence (white posts + rails) around the yard, open at the driveway and path
  const fenceMat = mat(0xffffff);
  const fence = new THREE.Group();
  const post = (x, z) => fence.add(box(0.2, 0.9, 0.2, fenceMat, x, 0.77, z));
  const x0 = 1.2 - 6.1, x1 = 1.2 + 6.1, z0 = 0.2 - 6.4, z1 = 0.2 + 6.4;
  for (let x = x0; x <= x1 + 0.01; x += 1.525) { post(x, z0); }
  for (let z = z0; z <= z1 + 0.01; z += 1.6) { post(x0, z); post(x1, z); }
  for (let x = x0; x <= -3.4; x += 1.4) post(x, z1);
  for (let x = -1.1; x <= 3.4; x += 1.5) post(x, z1);
  fence.add(box(x1 - x0, 0.12, 0.08, fenceMat, (x0 + x1) / 2, 1.0, z0));
  fence.add(box(0.08, 0.12, z1 - z0, fenceMat, x0, 1.0, (z0 + z1) / 2));
  fence.add(box(0.08, 0.12, z1 - z0 - 6.4, fenceMat, x1, 1.0, z0 + (z1 - z0 - 6.4) / 2));
  world.add(fence);

  const house = buildHouse();
  house.position.set(-0.4, 0, -0.9);
  world.add(house);

  const car = buildCar();
  car.position.set(5.35, 0.34, 4.6);
  world.add(car);

  // shrubs
  const shrub = mat(0x6dbb6f);
  for (const [x, z, s] of [[-3.6, 2.5, 1], [0.9, 2.6, 0.8], [-3.9, -3.4, 1.1], [3.3, -4.6, 0.9], [0.6, 4.6, 0.7]]) {
    world.add(box(1.1 * s, 0.8 * s, 0.9 * s, shrub, x, 0.32 + 0.4 * s, z));
  }

  // trees — some inside the yard, some standing in the flood
  const trees = [
    [-4.2, -4.9, 1.05, 0x5aae6a], [5.6, -4.6, 0.95, 0x4fa463], [-3.9, 5.2, 0.8, 0x63b56f],
    [-7.0, -7.8, 1.0, 0x4c9f5f], [9.0, 8.6, 0.9, 0x58aa69], [-10.0, 6.6, 0.85, 0x5aae6a], [9.4, -7.0, 1.1, 0x4fa463],
  ].map(([x, z, s, c]) => {
    const t = buildTree(s, c);
    t.position.set(x, Math.abs(x) > 7.5 || Math.abs(z) > 7 ? 0 : 0.32, z);
    t.userData.phase = Math.random() * 6.28;
    world.add(t);
    return t;
  });

  // ── water: shader surface + translucent sides
  const uniforms = {
    uTime: { value: 0 },
    uFlow: { value: 1 },
    uLight: { value: new THREE.Color(0x8be2ef) },
    uDeep: { value: new THREE.Color(0x3f8fdc) },
    uRings: { value: [[-7, -7.8], [9, 8.6], [-10, 6.6], [9.4, -7], [7.6, 6.8], [-5.2, 6.9], [7.6, -6.4]].map(([x, z]) => new THREE.Vector2(x, z)) },
    uHalf: { value: new THREE.Vector2(TILE / 2, TILE / 2) },
    uAlpha: { value: 1 },
  };
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE, TILE, 96, 96),
    new THREE.ShaderMaterial({ uniforms, vertexShader: waterVert, fragmentShader: waterFrag, transparent: true, depthWrite: false })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.renderOrder = 2;
  world.add(surface);

  const sideMat = new THREE.MeshBasicMaterial({ color: 0x55b7ea, transparent: true, opacity: 0.42, depthWrite: false });
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const sides = new THREE.Mesh(new THREE.BoxGeometry(TILE + 0.04, 1, TILE + 0.04), [sideMat, sideMat, hidden, hidden, sideMat, sideMat]);
  sides.renderOrder = 1;
  world.add(sides);

  // ── state
  let W = WEATHER[weather] || WEATHER.rain;
  let level = W.depth, hemiI = W.hemi, sunI = W.sun;
  const light = new THREE.Color(W.tint), deep = new THREE.Color(W.deep);
  const tgtLight = new THREE.Color(), tgtDeep = new THREE.Color();
  let flow = W.flow;
  const pointer = { x: 0, y: 0 }, rot = { x: 0, y: 0 };
  let paused = false, visible = true, raf = 0, time = 0, last = performance.now(), compiled = false;

  const anchorRoof = new THREE.Vector3(), anchorWater = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function applyLevel() {
    surface.position.y = level + 0.002;
    sides.scale.y = level + 0.02;
    sides.position.y = (level + 0.02) / 2 - 0.02;
  }

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the tile (≈15.5 half-width, ≈12 half-height in view space) inside the frame
    const vh = Math.tan((camera.fov * DEG) / 2);
    const dist = Math.max(15.8 / (vh * camera.aspect), 12.6 / vh);
    camera.position.copy(target).addScaledVector(camDir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }

  function project(v) {
    tmp.copy(v).project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * container.clientWidth, y: (-tmp.y * 0.5 + 0.5) * container.clientHeight };
  }

  function frame(now) {
    raf = 0;
    if (!compiled) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = 1 - Math.exp(-dt * (reducedMotion ? 60 : 1.6));
    const animate = !paused && !reducedMotion;
    if (animate) time += dt;

    // ease toward weather targets
    level += (W.depth - level) * k;
    hemiI += (W.hemi - hemiI) * k;
    sunI += (W.sun - sunI) * k;
    flow += (W.flow - flow) * k;
    light.lerp(tgtLight.set(W.tint), k);
    deep.lerp(tgtDeep.set(W.deep), k);
    uniforms.uLight.value.copy(light);
    uniforms.uDeep.value.copy(deep);
    hemi.intensity = hemiI;
    sun.intensity = sunI;
    uniforms.uTime.value = time;
    uniforms.uFlow.value = flow;
    applyLevel();

    // damped pointer parallax (±1.3°) plus a slow idle sway
    const pk = 1 - Math.exp(-dt * 3);
    rot.y += (pointer.x * 1.0 * DEG - rot.y) * pk;
    rot.x += (pointer.y * 0.5 * DEG - rot.x) * pk;
    const sway = animate ? Math.sin(time * 0.18) * 0.3 * DEG : 0;
    world.rotation.y = Math.max(-1.3 * DEG, Math.min(1.3 * DEG, rot.y + sway));
    world.rotation.x = rot.x;

    if (animate) {
      for (const t of trees) {
        const s = Math.sin(time * 0.9 * flow + t.userData.phase) * 0.025 * flow;
        t.userData.crown.forEach((c) => (c.rotation.z = s));
      }
    }

    renderer.render(scene, camera);

    if (onFrame) {
      house.localToWorld(anchorRoof.set(0, 7.75, 0.3));
      anchorWater.set(-6.2, level + 0.05, 8.3);
      world.localToWorld(anchorWater);
      onFrame({ roof: project(anchorRoof), water: project(anchorWater), level });
    }

    const settling = Math.abs(W.depth - level) > 0.002 || Math.abs(rot.y - pointer.x * DEG) > 0.0005;
    if (visible && (animate || settling)) schedule();
  }

  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

  const ro = new ResizeObserver(() => { resize(); schedule(); });
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); schedule(); } });
  io.observe(container);
  const onVis = () => { if (!document.hidden) { last = performance.now(); schedule(); } };
  document.addEventListener('visibilitychange', onVis);

  resize();
  applyLevel();
  // compile shaders off the main path (KHR_parallel_shader_compile) so the page never stalls on first paint
  const ready = (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve())
    .catch(() => {})
    .then(() => { compiled = true; last = performance.now(); frame(last); });

  return {
    ready,
    setWeather(name) { W = WEATHER[name] || W; schedule(); },
    setPaused(p) { paused = p; last = performance.now(); schedule(); },
    setPointer(x, y) { pointer.x = x; pointer.y = y; schedule(); },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/* ───────────────── Section 2: 3D neighbourhood flood preview ─────────────────
   A sloped block beside the river. The water is one flat plane, so as its level
   rises it climbs the bank by itself and the flooded area grows where the ground is lowest. */

const HOOD = { sx: 34, sz: 24 };
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const riverX = (z) => -10.5 + 1.8 * Math.sin(z * 0.21 + 0.6);
function groundH(x, z) {
  const dx = x - riverX(z);
  if (dx < -3) return -0.4 + 1.0 * smooth(-3, -7.5, dx) + 0.05 * Math.sin(z * 0.7);
  if (dx < 3) { const k = dx / 3; return -1.3 + 0.9 * k * k; }
  return -0.4 + 1.85 * smooth(3, 21, dx) + 0.06 * Math.sin(x * 0.55) * Math.cos(z * 0.45);
}
// timeline hours → water surface height (0h: river channel only, 24h: most of the block)
const hoodLevel = (h) => -0.55 + (h / 24) * 1.9;

function buildMiniHouse(roof, accent = false) {
  const g = new THREE.Group();
  const white = mat(0xf7f9fc), roofMat = mat(roof, { roughness: 0.6 });
  const w = 2.8, d = 2.3, h = 1.7, rise = 1.0;
  g.add(box(w + 0.3, 0.9, d + 0.3, mat(0xdfe6ef), 0, -0.25, 0)); // plinth reaches into the slope
  g.add(box(w, h, d, white, 0, 0.2 + h / 2, 0));
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0); shape.lineTo(d / 2, 0); shape.lineTo(0, rise); shape.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false }), white);
  gable.rotation.y = Math.PI / 2;
  gable.position.set(-w / 2, 0.2 + h, 0);
  gable.castShadow = true;
  g.add(gable);
  const slope = Math.atan2(rise, d / 2), len = Math.hypot(d / 2, rise) + 0.3;
  for (const s of [-1, 1]) {
    const p = box(w + 0.4, 0.14, len, roofMat);
    p.rotation.x = s * slope;
    p.position.set(0, 0.2 + h + rise / 2 + 0.06, s * (d / 4 + 0.06));
    g.add(p);
  }
  const glass = mat(accent ? 0xffd98a : 0x9fd2f5, accent ? { emissive: 0xffc14d, emissiveIntensity: 0.5 } : {});
  g.add(box(0.5, 0.55, 0.06, glass, -0.6, 1.25, d / 2 + 0.01));
  g.add(box(0.5, 0.55, 0.06, glass, 0.7, 1.25, d / 2 + 0.01));
  g.add(box(0.5, 0.9, 0.06, mat(0x1d3784), 0.05, 0.65, d / 2 + 0.01));
  g.add(box(0.06, 0.55, 0.5, glass, w / 2 + 0.01, 1.25, 0));
  return g;
}

function buildPine(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 5), mat(0x7a5a43));
  trunk.position.y = 0.45; trunk.castShadow = true;
  g.add(trunk);
  const leaf = mat(0x4f9f6c);
  for (const [r, h, y] of [[1.0, 1.5, 1.3], [0.75, 1.2, 2.1]]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), leaf);
    c.position.y = y; c.castShadow = true;
    g.add(c);
  }
  g.scale.setScalar(scale);
  return g;
}

// a flat strip (road) laid over the terrain
function drape(width, length, cx, cz, alongZ, color) {
  const geo = alongZ
    ? new THREE.PlaneGeometry(width, length, 1, Math.ceil(length * 2))
    : new THREE.PlaneGeometry(length, width, Math.ceil(length * 2), 1);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, z = p.getZ(i) + cz;
    p.setXYZ(i, x, groundH(x, z) + 0.07, z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, { flatShading: false }));
  m.receiveShadow = true;
  return m;
}

export function createNeighborhoodScene(container, { reducedMotion = false, hours = 12, onFrame } = {}) {
  const { sx, sz } = HOOD;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 400);
  const camDir = new THREE.Vector3(0.82, 0.95, 1.12).normalize();
  const target = new THREE.Vector3(0.5, -0.6, 0.6);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xbad6ee, 1.35);
  const sun = new THREE.DirectionalLight(0xfff8ee, 1.5);
  sun.position.set(18, 26, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 18, bottom: -18, near: 1, far: 90 });
  sun.shadow.bias = -0.0008;
  scene.add(hemi, sun);

  const world = new THREE.Group();
  scene.add(world);

  // terrain: low-poly facets, sand in the channel, grass getting deeper green uphill
  const tGeo = new THREE.PlaneGeometry(sx, sz, 68, 48);
  tGeo.rotateX(-Math.PI / 2);
  const tp = tGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, groundH(tp.getX(i), tp.getZ(i)));
  const terrainGeo = tGeo.toNonIndexed();
  tGeo.dispose();
  const cols = [], sand = new THREE.Color(0xdcd3b8), grassLo = new THREE.Color(0xa9d89c), grassHi = new THREE.Color(0x8cc785), tc = new THREE.Color();
  const tpp = terrainGeo.attributes.position;
  for (let i = 0; i < tpp.count; i += 3) {
    const y = (tpp.getY(i) + tpp.getY(i + 1) + tpp.getY(i + 2)) / 3;
    if (y < -0.32) tc.copy(sand); else tc.copy(grassLo).lerp(grassHi, Math.min(1, (y + 0.3) / 1.8));
    for (let k = 0; k < 3; k++) cols.push(tc.r, tc.g, tc.b);
  }
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, mat(0xffffff, { vertexColors: true }));
  terrain.receiveShadow = true;
  world.add(terrain);

  // skirt: the cut sides of the diorama, following the terrain edge
  const BOTTOM = -2.6;
  const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  const edges = [
    steps(-sx / 2, sx / 2, 68).map((x) => [x, sz / 2]),
    steps(-sz / 2, sz / 2, 48).map((z) => [sx / 2, z]),
    steps(-sx / 2, sx / 2, 68).map((x) => [x, -sz / 2]),
    steps(-sz / 2, sz / 2, 48).map((z) => [-sx / 2, z]),
  ];
  const strip = (pts, top, bottom) => {
    const v = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const a0 = top(x0, z0), a1 = top(x1, z1), b0 = bottom(x0, z0), b1 = bottom(x1, z1);
      v.push(x0, a0, z0, x0, b0, z0, x1, a1, z1, x1, a1, z1, x0, b0, z0, x1, b1, z1);
    }
    return v;
  };
  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(edges.flatMap((e) => strip(e, groundH, () => BOTTOM)), 3));
  skirtGeo.computeVertexNormals();
  world.add(new THREE.Mesh(skirtGeo, mat(0xa9c8e6, { side: THREE.DoubleSide, roughness: 0.95 })));

  // roads
  world.add(drape(1.6, sz, 4.6, 0, true, 0xeef2f7));
  world.add(drape(1.6, 23, 5.5, 0.6, false, 0xeef2f7));

  // houses: yours has the navy roof and lit windows
  const homes = [
    [-3, -8.3, 0x7d93b8], [1.3, -8.3, 0x8aa0c2], [8.2, -8, 0xc98a6e], [12.6, -7.6, 0x7d93b8],
    [-3.4, -3.6, 0x8aa0c2], [1.3, -3.8, 0xc98a6e], [8.4, -3.6, 0x7d93b8], [12.8, -3.2, 0x8aa0c2],
    [-2.6, 4.8, 0x7d93b8], [1.4, 4.6, 'home'], [8.4, 4.8, 0x8aa0c2], [12.8, 5, 0xc98a6e],
    [2, 9.6, 0x8aa0c2], [8.6, 9.6, 0x7d93b8], [12.8, 9.8, 0x8aa0c2],
  ];
  let home = null;
  homes.forEach(([x, z, roof], i) => {
    const isHome = roof === 'home';
    const hs = buildMiniHouse(isHome ? 0x1d3784 : roof, isHome);
    hs.position.set(x, groundH(x, z), z);
    if (!isHome && i % 3 === 1) hs.rotation.y = Math.PI / 2;
    world.add(hs);
    if (isHome) home = hs;
  });

  // floating marker over your home
  const pin = new THREE.Group();
  const pinMat = new THREE.MeshStandardMaterial({ color: 0x2e69f2, roughness: 0.4, emissive: 0x2e69f2, emissiveIntensity: 0.25 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 16), pinMat);
  cone.rotation.x = Math.PI; cone.position.y = 0.4;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), pinMat);
  ball.position.y = 0.95;
  pin.add(cone, ball);
  world.add(pin);

  // trees along both banks plus some between the houses (seeded, so the layout is stable)
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const taken = (x, z) => homes.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 2.5) || Math.abs(x - 4.6) < 1.4 || Math.abs(z - 0.6) < 1.4;
  const trees = [];
  const plant = (x, z, s, pine) => {
    if (Math.abs(x) > sx / 2 - 0.8 || Math.abs(z) > sz / 2 - 0.8 || taken(x, z)) return;
    const t = pine ? buildPine(s) : buildTree(s * 0.62, [0x5aae6a, 0x4fa463, 0x63b56f][Math.floor(rand() * 3)]);
    t.position.set(x, groundH(x, z) - 0.05, z);
    t.rotation.y = rand() * 6.28;
    t.userData.phase = rand() * 6.28;
    world.add(t);
    if (!pine) trees.push(t);
  };
  for (let z = -11; z <= 11; z += 1.9) {
    plant(riverX(z) + 4.1 + rand() * 1.2, z + rand() * 0.6, 0.8 + rand() * 0.35, rand() < 0.3);
    if (rand() < 0.75) plant(riverX(z) - 4.4 - rand() * 1.4, z + rand() * 0.8, 0.75 + rand() * 0.3, rand() < 0.5);
  }
  for (let i = 0; i < 26; i++) plant(-5 + rand() * 21, -11 + rand() * 22, 0.7 + rand() * 0.35, rand() < 0.25);

  // water: one shader plane + side walls only where the cut edge sits below the waterline
  const uniforms = {
    uTime: { value: 0 }, uFlow: { value: 1 },
    uLight: { value: new THREE.Color(0x8be2ef) }, uDeep: { value: new THREE.Color(0x3f8fdc) },
    uRings: { value: Array.from({ length: 7 }, (_, i) => new THREE.Vector2(riverX(-9 + i * 3) + 3.2, -9 + i * 3)) },
    uHalf: { value: new THREE.Vector2(sx / 2, sz / 2) },
    uAlpha: { value: 1.08 },
  };
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz, 120, 84),
    new THREE.ShaderMaterial({ uniforms, vertexShader: waterVert, fragmentShader: waterFrag, transparent: true, depthWrite: false }));
  surface.rotation.x = -Math.PI / 2;
  surface.renderOrder = 2;
  world.add(surface);
  const sideGeo = new THREE.BufferGeometry();
  const sides = new THREE.Mesh(sideGeo, new THREE.MeshBasicMaterial({ color: 0x55b7ea, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
  sides.renderOrder = 1;
  world.add(sides);

  const clampX = (x) => Math.max(-sx / 2, Math.min(sx / 2, x)), clampZ = (z) => Math.max(-sz / 2, Math.min(sz / 2, z));
  const out = [[0, 0.015], [0.015, 0], [0, -0.015], [-0.015, 0]];
  let level = hoodLevel(hours), goal = level, builtLevel = null;
  function applyLevel() {
    surface.position.y = level;
    if (builtLevel !== null && Math.abs(builtLevel - level) < 0.004) return;
    builtLevel = level;
    const v = edges.flatMap((e, ei) => strip(
      e.map(([x, z]) => [x + out[ei][0], z + out[ei][1]]),
      () => level,
      (x, z) => Math.min(level, groundH(clampX(x), clampZ(z)))));
    sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  }

  let visible = true, raf = 0, time = 0, last = performance.now(), compiled = false, paused = false;
  const anchor = new THREE.Vector3();

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vh = Math.tan((camera.fov * DEG) / 2);
    const dist = Math.max(21 / (vh * camera.aspect), 13 / vh);
    camera.position.copy(target).addScaledVector(camDir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    raf = 0;
    if (!compiled) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const animate = !paused && !reducedMotion;
    if (animate) time += dt;
    level += (goal - level) * (1 - Math.exp(-dt * (reducedMotion ? 60 : 5)));
    applyLevel();
    uniforms.uTime.value = time;
    pin.position.set(home.position.x, home.position.y + 4.1 + (animate ? Math.sin(time * 2) * 0.18 : 0), home.position.z);
    if (animate) for (const t of trees) t.userData.crown.forEach((c) => (c.rotation.z = Math.sin(time * 0.9 + t.userData.phase) * 0.03));
    renderer.render(scene, camera);
    if (onFrame) {
      anchor.copy(pin.position).setY(pin.position.y + 1.6).project(camera);
      onFrame({ home: { x: (anchor.x * 0.5 + 0.5) * container.clientWidth, y: (-anchor.y * 0.5 + 0.5) * container.clientHeight } });
    }
    if (visible && (animate || Math.abs(goal - level) > 0.002)) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

  const ro = new ResizeObserver(() => { resize(); schedule(); });
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); schedule(); } });
  io.observe(container);

  resize();
  applyLevel();
  const ready = (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve())
    .catch(() => {})
    .then(() => { compiled = true; last = performance.now(); frame(last); });

  return {
    ready,
    setHours(h) { goal = hoodLevel(h); schedule(); },
    setPaused(p) { paused = p; last = performance.now(); schedule(); },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
