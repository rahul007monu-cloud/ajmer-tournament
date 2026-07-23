/* =========================================================
   VK Sports Ajmer — IMMERSIVE Ground-Level 3D Flythrough
   You are INSIDE the stadium. Scroll floats you across the
   pitch while the giant floodlit bowl towers around you.
   ========================================================= */
import * as THREE from "three";

const loaderEl = document.getElementById("loader");
const progressEl = document.getElementById("loader-progress");
const canvas = document.getElementById("stadium-canvas");

function finishLoading() {
  if (progressEl) progressEl.style.width = "100%";
  setTimeout(() => {
    loaderEl && loaderEl.classList.add("hide");
    if (window.VK && typeof window.VK.playHeroIntro === "function") window.VK.playHeroIntro();
  }, 350);
}
function fail(msg) {
  console.warn("[stadium]", msg);
  if (canvas) canvas.style.background = "radial-gradient(ellipse at 50% 60%,#12603a,#05070d 70%)";
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
  renderer.toneMappingExposure = 1.35;
  bump(22);

  /* ---------------- Scene ---------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b2a24, 0.0026);

  const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 4000);
  camera.position.set(0, 95, 200);

  /* ---------------- Sky dome (gradient dusk/night) ---------------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x060b1e) },
        mid: { value: new THREE.Color(0x123a4a) },
        bottom: { value: new THREE.Color(0x1f7350) }
      },
      vertexShader: `varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: `
        varying vec3 vW; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
        void main(){
          float h = normalize(vW).y;             // -1..1
          float t = clamp(h*0.5+0.5, 0.0, 1.0);
          vec3 col = h < 0.08
            ? mix(bottom, mid, clamp((h+0.15)/0.23,0.0,1.0))
            : mix(mid, top, clamp(h/0.9,0.0,1.0));
          gl_FragColor = vec4(col, 1.0);
        }`
    })
  );
  scene.add(sky);

  /* ---------------- Lights (bright, vivid) ---------------- */
  scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x123a24, 1.1));
  scene.add(new THREE.AmbientLight(0x557a9a, 0.6));
  const moon = new THREE.DirectionalLight(0xcfe4ff, 0.7);
  moon.position.set(-160, 260, 120); scene.add(moon);
  const fieldFill = new THREE.PointLight(0xa9ffcf, 0.8, 600); fieldFill.position.set(0, 40, 0); scene.add(fieldFill);
  bump(30);

  /* ---------------- Field (vivid grass) ---------------- */
  const FIELD_R = 100;
  const field = new THREE.Mesh(
    new THREE.CircleGeometry(FIELD_R, 120),
    new THREE.MeshStandardMaterial({ map: makeFieldTexture(), roughness: 0.9 })
  );
  field.rotation.x = -Math.PI / 2; field.receiveShadow = true; scene.add(field);

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(FIELD_R + 2, FIELD_R + 12, 10, 80),
    new THREE.MeshStandardMaterial({ color: 0x0d3020, roughness: 1 })
  );
  skirt.position.y = -5; scene.add(skirt);

  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(FIELD_R - 3, 0.6, 12, 140),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2f6a44, emissiveIntensity: 0.7 })
  );
  rope.rotation.x = -Math.PI / 2; rope.position.y = 0.5; scene.add(rope);
  const circle30 = new THREE.Mesh(
    new THREE.TorusGeometry(46, 0.2, 8, 130),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  circle30.rotation.x = -Math.PI / 2; circle30.position.y = 0.4; scene.add(circle30);
  bump(40);

  /* ---------------- Pitch + stumps + batsman-eye crease ---------------- */
  const pitch = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 0.3, 42),
    new THREE.MeshStandardMaterial({ color: 0xd2ac72, roughness: 0.85 })
  );
  pitch.position.y = 0.35; pitch.receiveShadow = true; scene.add(pitch);
  const creaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  [-18, -8, 8, 18].forEach((z) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.33, 0.25), creaseMat);
    c.position.set(0, 0.37, z); scene.add(c);
  });
  addStumps(0, 19.5); addStumps(0, -19.5);
  bump(48);

  /* ---------------- Stands (tall towering bowl) ---------------- */
  const standInner = FIELD_R + 3, tiers = 4;
  let standTop = 0;
  for (let t = 0; t < tiers; t++) {
    const rIn = standInner + t * 14, rOut = rIn + 13, h = 16 + t * 6;
    const yBase = t * 13;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(rOut, rIn, h, 100, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x162542, roughness: 0.85, side: THREE.DoubleSide })
    );
    ring.position.y = yBase + h / 2; ring.castShadow = true; ring.receiveShadow = true; scene.add(ring);
    standTop = yBase + h;
  }
  // roof lip
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(standInner + tiers * 14 + 10, standInner + tiers * 14 + 2, 4, 100, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0c1830, roughness: 0.7, side: THREE.DoubleSide })
  );
  roof.position.y = standTop + 2; scene.add(roof);
  scene.add(makeCrowd(standInner + 3, tiers));
  bump(60);

  /* ---------------- Big scoreboard screen ---------------- */
  const board = new THREE.Group();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 16),
    new THREE.MeshStandardMaterial({ map: makeScoreboardTexture(), emissive: 0xffffff, emissiveMap: makeScoreboardTexture(), emissiveIntensity: 1.1 })
  );
  const frame = new THREE.Mesh(new THREE.BoxGeometry(37, 19, 1.4), new THREE.MeshStandardMaterial({ color: 0x05080f }));
  screen.position.z = 0.9; board.add(frame); board.add(screen);
  board.position.set(0, 30, -(standInner + 20));
  board.lookAt(0, 8, 0);
  scene.add(board);

  /* ---------------- Floodlight towers (4 realistic pole lights) ---------------- */
  const flColor = 0xfff6e2;
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx, sz]) => {
    const dist = (FIELD_R + 38) * 0.8;
    const x = sx * dist, z = sz * dist;
    const poleTop = standTop + 48;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    // face the light rig toward the middle of the ground
    g.rotation.y = Math.atan2(-x, -z);

    // tapered steel pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2.8, poleTop, 16),
      new THREE.MeshStandardMaterial({ color: 0x9aa6b8, roughness: 0.45, metalness: 0.65 })
    );
    pole.position.y = poleTop / 2; pole.castShadow = true; g.add(pole);

    // dark light housing that tilts down toward the field
    const dHoriz = Math.hypot(x, z);
    const housing = new THREE.Group();
    housing.position.y = poleTop;
    housing.rotation.x = Math.atan2(poleTop, dHoriz); // tilt face down toward centre
    const backPlate = new THREE.Mesh(
      new THREE.BoxGeometry(34, 22, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x121a29, roughness: 0.6, metalness: 0.3 })
    );
    housing.add(backPlate);

    // bright lamp grid (looks like a real floodlight array)
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: flColor, emissiveIntensity: 3.4 });
    const cols = 6, rows = 4, gapX = 5.3, gapY = 4.9;
    for (let cx = 0; cx < cols; cx++) for (let cy = 0; cy < rows; cy++) {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(2.15, 20), lampMat);
      lamp.position.set((cx - (cols - 1) / 2) * gapX, (cy - (rows - 1) / 2) * gapY, 1.3);
      housing.add(lamp);
    }
    g.add(housing);

    // soft glow behind the rig
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: flColor, transparent: true, opacity: 0.45,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    halo.scale.set(72, 48, 1); halo.position.set(0, poleTop, 0); g.add(halo);

    // soft, even light on the field (no harsh streaks)
    const spot = new THREE.SpotLight(flColor, 150, 700, Math.PI / 4.2, 1.0, 0.8);
    spot.position.set(x, poleTop, z);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0004;
    scene.add(spot); scene.add(spot.target);

    scene.add(g);
  });
  bump(74);

  /* ---------------- Stars + floating dust (in the light) ---------------- */
  const stars = makeStars(1400, 1300); scene.add(stars);
  const dust = makeDust(900); scene.add(dust);
  bump(84);

  /* ---------------- Camera path — LOW, inside the ground ---------------- */
  // pos [x,y,z]  look [x,y,z]  — stays low so you feel grounded & surrounded
  const keys = [
    { p: [0, 95, 200], l: [0, 20, 0] },      // 0.0  AERIAL: whole floodlit stadium + sky (brand)
    { p: [8, 55, 128], l: [0, 12, 0] },      // descend toward the bowl
    { p: [22, 22, 66], l: [0, 6, -4] },      // drop IN over the boundary / stands
    { p: [-24, 7, 20], l: [0, 4, -8] },      // now LOW inside, floating over the pitch
    { p: [-46, 8, -32], l: [-2, 6, 6] },     // cruise low across the field, floodlight towering
    { p: [34, 9, -46], l: [0, 5, -2] },      // low sweep to the far side, floating
    { p: [52, 12, 24], l: [0, 6, 0] },       // arc around toward the scoreboard side
    { p: [0, 40, 118], l: [0, 10, 0] }       // 1.0  gentle rise, whole-bowl reveal (CTA)
  ];
  const nSeg = keys.length - 1;
  let scrollP = 0, smoothP = 0;
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
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  computeScroll();

  const smooth = (t) => t * t * (3 - 2 * t);
  const vP = new THREE.Vector3(), vL = new THREE.Vector3(), tmpL = new THREE.Vector3();
  function samplePath(prog) {
    const f = prog * nSeg; let i = Math.min(Math.floor(f), nSeg - 1);
    const local = smooth(f - i), a = keys[i], b = keys[i + 1];
    vP.set(a.p[0]+(b.p[0]-a.p[0])*local, a.p[1]+(b.p[1]-a.p[1])*local, a.p[2]+(b.p[2]-a.p[2])*local);
    vL.set(a.l[0]+(b.l[0]-a.l[0])*local, a.l[1]+(b.l[1]-a.l[1])*local, a.l[2]+(b.l[2]-a.l[2])*local);
  }

  /* ---------------- Animate ---------------- */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    smoothP += (scrollP - smoothP) * 0.06;
    samplePath(smoothP);

    // strong, alive floating motion (breathe + sway) so it always feels weightless
    const bob = Math.sin(t * 0.8) * 1.5 + Math.sin(t * 0.31) * 0.9;
    const swayX = Math.sin(t * 0.24) * 3.2;
    const swayZ = Math.cos(t * 0.19) * 2.4;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    camera.position.set(
      vP.x + swayX + mouse.x * 7,
      Math.max(3, vP.y + bob - mouse.y * 4),
      vP.z + swayZ
    );
    tmpL.set(vL.x + mouse.x * 4 + Math.sin(t * 0.2) * 2, vL.y + Math.sin(t * 0.5) * 0.6, vL.z);
    camera.lookAt(tmpL);

    stars.rotation.y = t * 0.005;
    dust.rotation.y = t * 0.03;
    const dp = dust.geometry.attributes.position;
    for (let i = 1; i < dp.count * 3; i += 3) {
      dp.array[i] += 0.06;
      if (dp.array[i] > 120) dp.array[i] = 1;
    }
    dp.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();
  bump(96);
  finishLoading();

  /* ================= builders ================= */
  function makeFieldTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 1024;
    const ctx = c.getContext("2d");
    // straight parallel mowing stripes (like a real outfield)
    const stripes = 16, w = 1024 / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? "#2a9e4d" : "#34b45c";
      ctx.fillRect(i * w, 0, Math.ceil(w) + 1, 1024);
    }
    // subtle mow seams
    ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 2;
    for (let i = 0; i <= stripes; i++) {
      ctx.beginPath(); ctx.moveTo(i * w, 0); ctx.lineTo(i * w, 1024); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
  }
  function makeScoreboardTexture() {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#04120a"; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#0bff7a"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
    ctx.fillText("VK SPORTS AJMER", 256, 60);
    ctx.fillStyle = "#ffd15a"; ctx.font = "bold 30px Arial";
    ctx.fillText("AJMER PREMIER LEAGUE", 256, 110);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 54px Arial";
    ctx.fillText("142/4   vs   138/7", 256, 180);
    ctx.fillStyle = "#8fb6ff"; ctx.font = "22px Arial";
    ctx.fillText("LIVE  •  UNDER THE LIGHTS", 256, 226);
    const tex = new THREE.CanvasTexture(c); return tex;
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
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 3.2, 8), mat);
      s.position.set(x + i * 0.55, 1.7, z); s.castShadow = true; scene.add(s);
    }
  }
  function makeCrowd(radius, tiers) {
    const count = 8000;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ roughness: 0.9 }), count
    );
    const d = new THREE.Object3D();
    const palette = [0xff5a5a, 0x5ad1ff, 0xffd15a, 0xffffff, 0x9b8cff, 0x5aff9b, 0xff8cc6, 0xff9f43];
    let i = 0;
    for (let t = 0; t < tiers && i < count; t++) {
      const r = radius + t * 14 + 5, yBase = t * 13, h = 16 + t * 6;
      const per = Math.floor(count / tiers);
      for (let k = 0; k < per && i < count; k++) {
        const a = (k / per) * Math.PI * 2 + Math.random() * 0.02, rr = r + (Math.random() - 0.5) * 9;
        d.position.set(Math.cos(a) * rr, yBase + Math.random() * h, Math.sin(a) * rr);
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
      const phi = Math.acos(Math.random() * 0.7 + 0.15);
      pos[i*3] = r*Math.sin(phi)*Math.cos(theta);
      pos[i*3+1] = Math.abs(r*Math.cos(phi)) + 120;
      pos[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 2, transparent: true, opacity: 0.85, sizeAttenuation: true }));
  }
  function makeDust(count) {
    const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 120, a = Math.random() * Math.PI * 2;
      pos[i*3] = Math.cos(a) * r; pos[i*3+1] = Math.random() * 110 + 1; pos[i*3+2] = Math.sin(a) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      map: makeGlowTexture(), color: 0xdff7e6, size: 2.6, transparent: true,
      opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
  }
} catch (err) {
  fail(err && err.message ? err.message : String(err));
}
