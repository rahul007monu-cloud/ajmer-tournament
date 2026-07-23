/* =========================================================
   VK Sports Ajmer — Cinematic 3D Flythrough
   One fixed Three.js world. Scroll drives a camera that
   floats from an aerial view down INTO the cricket ground.
   ========================================================= */
import * as THREE from "three";

const loader = document.getElementById("loader");
const progressEl = document.getElementById("loader-progress");
const canvas = document.getElementById("stadium-canvas");

function finishLoading() {
  if (progressEl) progressEl.style.width = "100%";
  setTimeout(() => {
    loader && loader.classList.add("hide");
    if (window.VK && typeof window.VK.playHeroIntro === "function") window.VK.playHeroIntro();
  }, 350);
}
function fail(msg) {
  console.warn("[stadium]", msg);
  if (canvas) canvas.style.background = "radial-gradient(ellipse at 50% 30%,#0f3d24,#05070d 65%)";
  finishLoading();
}

let progress = 10;
const bump = (v) => { progress = Math.min(96, v); if (progressEl) progressEl.style.width = progress + "%"; };
bump(12);

try {
  if (!canvas) throw new Error("no canvas");

  /* ---------------- Renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  bump(22);

  /* ---------------- Scene ---------------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  scene.fog = new THREE.FogExp2(0x05070f, 0.0042);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(0, 130, 250);

  /* ---------------- Lights ---------------- */
  scene.add(new THREE.AmbientLight(0x3a557f, 1.0));
  const moon = new THREE.DirectionalLight(0xaccaff, 0.55);
  moon.position.set(-150, 240, -120);
  scene.add(moon);
  const groundGlow = new THREE.PointLight(0x88e6ad, 0.6, 500);
  groundGlow.position.set(0, 55, 0);
  scene.add(groundGlow);
  bump(30);

  /* ---------------- Field ---------------- */
  const FIELD_R = 100;
  const field = new THREE.Mesh(
    new THREE.CircleGeometry(FIELD_R, 96),
    new THREE.MeshStandardMaterial({ map: makeFieldTexture(), roughness: 0.95 })
  );
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  scene.add(field);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(FIELD_R + 2, FIELD_R + 10, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b2416, roughness: 1 })
  );
  base.position.y = -4;
  scene.add(base);

  // boundary rope + 30-yard circle
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(FIELD_R - 3, 0.5, 12, 128),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2a5a3a, emissiveIntensity: 0.6, roughness: 0.6 })
  );
  rope.rotation.x = -Math.PI / 2; rope.position.y = 0.5; scene.add(rope);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(46, 0.18, 8, 120),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
  );
  inner.rotation.x = -Math.PI / 2; inner.position.y = 0.4; scene.add(inner);
  bump(40);

  /* ---------------- Pitch + stumps ---------------- */
  const pitch = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.3, 40),
    new THREE.MeshStandardMaterial({ color: 0xcaa46a, roughness: 0.9 })
  );
  pitch.position.y = 0.35; pitch.receiveShadow = true; scene.add(pitch);
  const creaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  [-16, 16].forEach((z) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.32, 0.25), creaseMat);
    c.position.set(0, 0.37, z); scene.add(c);
  });
  addStumps(0, 18.5); addStumps(0, -18.5);
  bump(48);

  /* ---------------- Stands (tiered bowl) ---------------- */
  const standInner = FIELD_R + 4, tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const rIn = standInner + t * 16, rOut = rIn + 15, h = 10 + t * 9;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(rOut, rIn, h, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x14203a, roughness: 0.85, side: THREE.DoubleSide })
    );
    ring.position.y = h / 2 + t * 8; ring.castShadow = true; ring.receiveShadow = true;
    scene.add(ring);
  }
  scene.add(makeCrowd(standInner + 4, tiers));
  bump(60);

  /* ---------------- Floodlights + volumetric beams ---------------- */
  const flColor = 0xfff3d0;
  const lightPanels = [];
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx, sz]) => {
    const dist = (FIELD_R + 46) * 0.72;
    const x = sx * dist, z = sz * dist;
    const g = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.9, 100, 12),
      new THREE.MeshStandardMaterial({ color: 0x1b2233, roughness: 0.6, metalness: 0.4 })
    );
    pole.position.y = 50; pole.castShadow = true; g.add(pole);
    const rig = new THREE.Mesh(new THREE.BoxGeometry(24, 13, 3),
      new THREE.MeshStandardMaterial({ color: 0x0c1526, roughness: 0.7 }));
    rig.position.y = 102; rig.lookAt(0, 6, 0); g.add(rig);

    const panelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: flColor, emissiveIntensity: 2.4 });
    for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(2.7, 16), panelMat);
      lamp.position.set(ix * 7, 102 + iy * 3.6, 0); lamp.lookAt(0, 6, 0);
      const dir = new THREE.Vector3(0, 6, 0).sub(lamp.position).normalize();
      lamp.position.add(dir.multiplyScalar(1.7)); g.add(lamp); lightPanels.push(lamp);
    }
    const haloSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: flColor, transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    haloSprite.scale.set(46, 46, 1); haloSprite.position.set(0, 102, 2); g.add(haloSprite);

    // volumetric beam cone from lamp down to field
    const beamLen = 150;
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(60, beamLen, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: flColor, transparent: true, opacity: 0.05,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    // orient cone from top of pole toward centre
    const from = new THREE.Vector3(x, 102, z);
    const to = new THREE.Vector3(0, 0, 0);
    const mid = from.clone().lerp(to, 0.5);
    beam.position.copy(mid);
    beam.lookAt(to);
    beam.rotateX(Math.PI / 2);
    scene.add(beam);

    const spot = new THREE.SpotLight(flColor, 300, 440, Math.PI / 6, 0.55, 1.2);
    spot.position.set(x, 104, z); spot.target.position.set(0, 0, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
    scene.add(spot); scene.add(spot.target);

    g.position.set(x, 0, z); scene.add(g);
  });
  bump(74);

  /* ---------------- Stars + floating dust ---------------- */
  const stars = makeStars(1600, 1100); scene.add(stars);
  const dust = makeDust(700); scene.add(dust);
  bump(84);

  /* ---------------- Camera rig: scroll keyframes ---------------- */
  // Each key: pos [x,y,z], look [x,y,z]
  const keys = [
    { p: [0, 135, 255], l: [0, 22, 0] },   // 0.0  aerial, whole stadium + sky (brand)
    { p: [10, 70, 165], l: [0, 12, 0] },   // descending toward the bowl
    { p: [55, 22, 78],  l: [0, 5, 0] },    // floating in over the boundary
    { p: [-34, 9, 34],  l: [0, 3, -2] },   // low, drifting across the pitch
    { p: [26, 13, -46], l: [0, 5, 4] },    // far side, floating
    { p: [-60, 30, -70],l: [0, 8, 0] },    // rising, orbiting
    { p: [0, 60, 150],  l: [0, 16, 0] }    // 1.0 pull back wide (CTA)
  ];
  const nSeg = keys.length - 1;
  let scrollP = 0;      // 0..1 target
  let smoothP = 0;      // eased actual
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function computeScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  }
  window.addEventListener("scroll", computeScroll, { passive: true });
  window.addEventListener("mousemove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  computeScroll();

  const smooth = (t) => t * t * (3 - 2 * t); // smoothstep
  const vP = new THREE.Vector3(), vL = new THREE.Vector3(), tmpL = new THREE.Vector3();

  function samplePath(prog) {
    const f = prog * nSeg;
    let i = Math.floor(f);
    if (i >= nSeg) i = nSeg - 1;
    const local = smooth(f - i);
    const a = keys[i], b = keys[i + 1];
    vP.set(
      a.p[0] + (b.p[0] - a.p[0]) * local,
      a.p[1] + (b.p[1] - a.p[1]) * local,
      a.p[2] + (b.p[2] - a.p[2]) * local
    );
    vL.set(
      a.l[0] + (b.l[0] - a.l[0]) * local,
      a.l[1] + (b.l[1] - a.l[1]) * local,
      a.l[2] + (b.l[2] - a.l[2]) * local
    );
  }

  /* ---------------- Resize ---------------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------------- Animate ---------------- */
  const clock = new THREE.Clock();
  let flick = 0;
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // ease scroll progress for buttery camera motion
    smoothP += (scrollP - smoothP) * 0.07;
    samplePath(smoothP);

    // idle floating bob + slow drift so it always feels alive
    const bob = Math.sin(t * 0.6) * (1.6 + smoothP * 2.5);
    const drift = Math.sin(t * 0.12) * 6 * (1 - smoothP * 0.5);

    // mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    camera.position.set(
      vP.x + drift + mouse.x * 8,
      vP.y + bob - mouse.y * 5,
      vP.z
    );
    tmpL.copy(vL);
    tmpL.x += mouse.x * 3;
    camera.lookAt(tmpL);

    // floodlight flicker
    flick += 0.05;
    const fInt = 2.2 + Math.sin(flick) * 0.18 + Math.sin(flick * 3.1) * 0.06;
    lightPanels.forEach((p) => (p.material.emissiveIntensity = fInt));

    stars.rotation.y = t * 0.006;
    dust.rotation.y = t * 0.02;
    const dpos = dust.geometry.attributes.position;
    for (let i = 1; i < dpos.count * 3; i += 3) {
      dpos.array[i] += 0.05; // gentle upward float
      if (dpos.array[i] > 160) dpos.array[i] = 2;
    }
    dpos.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();
  bump(96);
  finishLoading();

  /* ================= builders ================= */
  function makeFieldTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 1024;
    const ctx = c.getContext("2d"); const cx = 512, cy = 512, stripes = 28;
    for (let i = 0; i < stripes; i++) {
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 512, (i / stripes) * Math.PI * 2, ((i + 1) / stripes) * Math.PI * 2);
      ctx.closePath(); ctx.fillStyle = i % 2 ? "#1a6a34" : "#1f7a3d"; ctx.fill();
    }
    for (let r = 60; r < 512; r += 90) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 30; ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
  }
  function makeGlowTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const ctx = c.getContext("2d"); const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,244,214,0.7)");
    g.addColorStop(1, "rgba(255,244,214,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function addStumps(x, z) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf3e9d2, roughness: 0.5 });
    for (let i = -1; i <= 1; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3, 8), mat);
      s.position.set(x + i * 0.5, 1.6, z); s.castShadow = true; scene.add(s);
    }
  }
  function makeCrowd(radius, tiers) {
    const count = 5400;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ roughness: 0.9 }), count
    );
    const d = new THREE.Object3D();
    const palette = [0xff5a5a, 0x5ad1ff, 0xffd15a, 0xffffff, 0x9b8cff, 0x5aff9b, 0xff8cc6];
    let i = 0;
    for (let t = 0; t < tiers && i < count; t++) {
      const r = radius + t * 16 + 6, h = 12 + t * 9 + t * 8, per = Math.floor(count / tiers);
      for (let k = 0; k < per && i < count; k++) {
        const a = (k / per) * Math.PI * 2 + Math.random() * 0.03, rr = r + (Math.random() - 0.5) * 10;
        d.position.set(Math.cos(a) * rr, h - Math.random() * (6 + t * 6), Math.sin(a) * rr);
        const s = 0.7 + Math.random() * 0.6; d.scale.set(s, s, s); d.rotation.y = a; d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
        mesh.setColorAt(i, new THREE.Color(palette[(Math.random() * palette.length) | 0])); i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }
  function makeStars(count, spread) {
    const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.6 + Math.random() * 0.4), theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 70;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xbcd4ff, size: 1.7, transparent: true, opacity: 0.9, sizeAttenuation: true
    }));
  }
  function makeDust(count) {
    const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 160;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 150 + 2;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      map: makeGlowTexture(), color: 0xbfe9cf, size: 2.4, transparent: true,
      opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
  }
} catch (err) {
  fail(err && err.message ? err.message : String(err));
}
