/* =========================================================
   VK Sports Ajmer — 3D Rotating Cricket Stadium
   Three.js (ES module). Cinematic night-stadium hero scene.
   ========================================================= */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const loader = document.getElementById("loader");
const progressEl = document.getElementById("loader-progress");
const canvas = document.getElementById("stadium-canvas");

/* ---- graceful fallback if WebGL / CDN fails ---- */
function finishLoading() {
  if (progressEl) progressEl.style.width = "100%";
  setTimeout(() => {
    loader && loader.classList.add("hide");
    if (window.VK && typeof window.VK.playHeroIntro === "function") window.VK.playHeroIntro();
  }, 350);
}
function fail(msg) {
  console.warn("[stadium]", msg);
  if (canvas) {
    canvas.style.background =
      "radial-gradient(ellipse at 50% 30%,#0f3d24,#05070d 65%)";
  }
  finishLoading();
}

let progress = 10;
const bump = (v) => {
  progress = Math.min(96, v);
  if (progressEl) progressEl.style.width = progress + "%";
};
bump(15);

try {
  if (!canvas) throw new Error("no canvas");

  /* ---------------- Renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  bump(25);

  /* ---------------- Scene & fog ---------------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a14);
  scene.fog = new THREE.FogExp2(0x060a14, 0.0065);

  /* ---------------- Camera ---------------- */
  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 70, 165);

  /* ---------------- Controls (auto-rotate) ---------------- */
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.6;
  controls.maxPolarAngle = 1.35;
  controls.target.set(0, 6, 0);

  /* ---------------- Lights ---------------- */
  scene.add(new THREE.AmbientLight(0x33507a, 0.9));
  const moon = new THREE.DirectionalLight(0x9fc0ff, 0.5);
  moon.position.set(-120, 200, -80);
  scene.add(moon);

  const centerGlow = new THREE.PointLight(0x8fe3b0, 0.7, 400);
  centerGlow.position.set(0, 60, 0);
  scene.add(centerGlow);
  bump(35);

  /* ---------------- Field (canvas texture) ---------------- */
  const FIELD_R = 100;
  const fieldTex = makeFieldTexture();
  const field = new THREE.Mesh(
    new THREE.CircleGeometry(FIELD_R, 96),
    new THREE.MeshStandardMaterial({ map: fieldTex, roughness: 0.95, metalness: 0 })
  );
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  scene.add(field);

  // subtle grass mound under field
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(FIELD_R + 2, FIELD_R + 8, 6, 64),
    new THREE.MeshStandardMaterial({ color: 0x0c2a17, roughness: 1 })
  );
  base.position.y = -3;
  scene.add(base);

  /* ---------------- Boundary rope ---------------- */
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(FIELD_R - 3, 0.5, 12, 120),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x224433, roughness: 0.6 })
  );
  rope.rotation.x = -Math.PI / 2;
  rope.position.y = 0.4;
  scene.add(rope);

  // inner 30-yard circle
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(46, 0.18, 8, 120),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.35;
  scene.add(inner);
  bump(45);

  /* ---------------- Pitch + stumps ---------------- */
  const pitch = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.3, 40),
    new THREE.MeshStandardMaterial({ color: 0xcaa46a, roughness: 0.9 })
  );
  pitch.position.y = 0.35;
  pitch.receiveShadow = true;
  scene.add(pitch);
  // crease lines
  const creaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  [-16, 16].forEach((z) => {
    const crease = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.32, 0.25), creaseMat);
    crease.position.set(0, 0.36, z);
    scene.add(crease);
  });
  addStumps(scene, 0, 18.5);
  addStumps(scene, 0, -18.5);
  bump(52);

  /* ---------------- Stands (tiered bowl) ---------------- */
  const standGroup = new THREE.Group();
  const standInner = FIELD_R + 4;
  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const rIn = standInner + t * 16;
    const rOut = rIn + 15;
    const h = 10 + t * 9;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(rOut, rIn, h, 96, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x14203a,
        roughness: 0.85,
        side: THREE.DoubleSide
      })
    );
    ring.position.y = h / 2 + t * 8;
    ring.castShadow = true;
    ring.receiveShadow = true;
    standGroup.add(ring);
  }
  scene.add(standGroup);

  // Crowd — instanced colourful specks on the bowl
  const crowd = makeCrowd(standInner + 4, tiers);
  scene.add(crowd);
  bump(66);

  /* ---------------- Floodlight towers ---------------- */
  const flColor = 0xfff4d6;
  const towerPositions = [
    [1, 1], [-1, 1], [1, -1], [-1, -1]
  ];
  const lightPanels = [];
  towerPositions.forEach(([sx, sz]) => {
    const dist = FIELD_R + 44;
    const x = sx * dist * 0.72;
    const z = sz * dist * 0.72;
    const g = new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.8, 96, 12),
      new THREE.MeshStandardMaterial({ color: 0x223, roughness: 0.6, metalness: 0.4 })
    );
    pole.position.y = 48;
    pole.castShadow = true;
    g.add(pole);

    const rig = new THREE.Mesh(
      new THREE.BoxGeometry(22, 12, 3),
      new THREE.MeshStandardMaterial({ color: 0x0c1526, roughness: 0.7 })
    );
    rig.position.y = 98;
    rig.lookAt(0, 6, 0);
    g.add(rig);

    // emissive lamp panels
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: flColor,
      emissiveIntensity: 2.2
    });
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        const lamp = new THREE.Mesh(new THREE.CircleGeometry(2.6, 16), panelMat);
        lamp.position.set(ix * 6.5, 98 + iy * 3.5, 0);
        lamp.lookAt(0, 6, 0);
        // push slightly toward field
        const dir = new THREE.Vector3(0, 6, 0).sub(lamp.position).normalize();
        lamp.position.add(dir.multiplyScalar(1.6));
        g.add(lamp);
        lightPanels.push(lamp);
      }
    }

    // glowing halo sprite
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: flColor,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    halo.scale.set(40, 40, 1);
    halo.position.set(0, 98, 2);
    g.add(halo);

    // spotlight onto field
    const spot = new THREE.SpotLight(flColor, 320, 420, Math.PI / 6, 0.5, 1.2);
    spot.position.set(x, 100, z);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    scene.add(spot);
    scene.add(spot.target);

    g.position.set(x, 0, z);
    scene.add(g);
  });
  bump(78);

  /* ---------------- Stars ---------------- */
  const stars = makeStars(1400, 900);
  scene.add(stars);

  /* ---------------- Center scoreboard-ish glow ring ---------------- */
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(2, 46, 64),
    new THREE.MeshBasicMaterial({ color: 0x0e2a1a, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.2;
  scene.add(halo);
  bump(88);

  /* ---------------- Resize ---------------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------------- Scroll-linked camera (cinematic dive-in) ---------------- */
  let scrollProgress = 0;
  const hero = document.getElementById("home");
  window.addEventListener(
    "scroll",
    () => {
      const h = hero ? hero.offsetHeight : window.innerHeight;
      scrollProgress = Math.min(Math.max(window.scrollY / h, 0), 1);
    },
    { passive: true }
  );

  /* ---------------- Animate ---------------- */
  const clock = new THREE.Clock();
  let flicker = 0;
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // gentle floodlight flicker
    flicker += 0.05;
    const fInt = 2.0 + Math.sin(flicker) * 0.15 + Math.sin(flicker * 3.3) * 0.05;
    lightPanels.forEach((p) => (p.material.emissiveIntensity = fInt));

    // scroll dive-in: descend camera + tighten as user scrolls hero
    const baseY = 70 - scrollProgress * 34;
    const baseDist = 165 - scrollProgress * 55;
    controls.target.y = 6 + scrollProgress * 4;
    // keep autorotate but blend radius/height
    const cur = camera.position.clone();
    const radius = Math.sqrt(cur.x * cur.x + cur.z * cur.z);
    const scale = baseDist / (radius || 1);
    camera.position.x *= scale;
    camera.position.z *= scale;
    camera.position.y += (baseY - camera.position.y) * 0.06;

    stars.rotation.y = t * 0.008;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  bump(96);
  finishLoading();

  /* ================= helper builders ================= */

  function makeFieldTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const ctx = c.getContext("2d");
    const cx = 512, cy = 512;
    // radial mowing stripes
    const stripes = 28;
    for (let i = 0; i < stripes; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const a0 = (i / stripes) * Math.PI * 2;
      const a1 = ((i + 1) / stripes) * Math.PI * 2;
      ctx.arc(cx, cy, 512, a0, a1);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#1f7a3d" : "#1a6a34";
      ctx.fill();
    }
    // concentric rings for depth
    for (let r = 60; r < 512; r += 90) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 30;
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }

  function makeGlowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,244,214,0.7)");
    g.addColorStop(1, "rgba(255,244,214,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function addStumps(scene, x, z) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf3e9d2, roughness: 0.5 });
    for (let i = -1; i <= 1; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3, 8), mat);
      s.position.set(x + i * 0.5, 1.6, z);
      s.castShadow = true;
      scene.add(s);
    }
  }

  function makeCrowd(radius, tiers) {
    const count = 5200;
    const geo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    const palette = [0xff5a5a, 0x5ad1ff, 0xffd15a, 0xffffff, 0x9b8cff, 0x5aff9b, 0xff8cc6];
    let i = 0;
    for (let t = 0; t < tiers && i < count; t++) {
      const r = radius + t * 16 + 6;
      const h = 12 + t * 9 + t * 8;
      const perRing = Math.floor(count / tiers);
      for (let k = 0; k < perRing && i < count; k++) {
        const a = (k / perRing) * Math.PI * 2 + Math.random() * 0.03;
        const rr = r + (Math.random() - 0.5) * 10;
        dummy.position.set(
          Math.cos(a) * rr,
          h - Math.random() * (6 + t * 6),
          Math.sin(a) * rr
        );
        const s = 0.7 + Math.random() * 0.6;
        dummy.scale.set(s, s, s);
        dummy.rotation.y = a;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, new THREE.Color(palette[(Math.random() * palette.length) | 0]));
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  function makeStars(count, spread) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.6 + Math.random() * 0.4);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 60;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbcd4ff,
      size: 1.6,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });
    return new THREE.Points(geo, mat);
  }
} catch (err) {
  fail(err && err.message ? err.message : String(err));
}
