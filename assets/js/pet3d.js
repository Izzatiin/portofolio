/* Model 3D virtual pet (three.js).
   Layar akuarium memakai canvas piksel dari pet.js sebagai tekstur.
   Kalau WebGL tidak tersedia, versi CSS tetap dipakai. */
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";
import { FontLoader } from "../vendor/three/FontLoader.js";
import { TextGeometry } from "../vendor/three/TextGeometry.js";

const pet = window.PixelPet;
const stage = document.querySelector("[data-pet-stage]");

if (pet && stage) {
  init().catch(function (err) {
    console.warn("3D pet unavailable, using the CSS version.", err);
  });
}

async function init() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = stage.querySelector(".pet");
  const expandBtn = stage.querySelector("[data-pet-open]");
  const htmlButtons = {
    a: stage.querySelector('[data-pet-btn="a"]'),
    b: stage.querySelector('[data-pet-btn="b"]'),
    c: stage.querySelector('[data-pet-btn="c"]')
  };
  const tagText = (stage.querySelector(".pet-tag") || {}).textContent || "izzatiin";

  /* ---------- renderer ---------- */
  const canvas = document.createElement("canvas");
  canvas.className = "pet-3d";
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0.42, 8.9);
  camera.lookAt(0, 0.42, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff1e0, 0.6);
  rim.position.set(4, 2, -3);
  scene.add(rim);

  /* ---------- shape helpers ---------- */
  const W = 1.0; // setengah lebar badan
  const H = 1.18; // setengah tinggi badan
  const E = 0.12; // bagian bawah lebih gemuk
  const D = 0.64; // ketebalan (z) relatif ke lebar
  const N = 2.7; // superellipse: depan lebih rata
  const Y_SPLIT = 0.3; // batas tutup oranye

  const eggR = (t) => W * Math.sin(t) * (1 + E * Math.cos(t));
  const eggY = (t) => -H * Math.cos(t);
  const sp = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

  function eggPoint(t, phi, out) {
    const r = eggR(t);
    out.set(r * sp(Math.cos(phi), 2 / N), eggY(t), r * D * sp(Math.sin(phi), 2 / N));
    return out;
  }

  function eggGeometry(t0, t1, rows, cols, grow) {
    const pos = [];
    const nor = [];
    const idx = [];
    const p = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const d = new THREE.Vector3();
    const h = 1e-3;
    for (let i = 0; i <= rows; i++) {
      const t = THREE.MathUtils.clamp(t0 + ((t1 - t0) * i) / rows, 2e-3, Math.PI - 2e-3);
      for (let j = 0; j <= cols; j++) {
        const phi = (j / cols) * Math.PI * 2;
        eggPoint(t, phi, p);
        eggPoint(t, phi + h, a);
        eggPoint(t, phi - h, b);
        eggPoint(t + h, phi, c);
        eggPoint(t - h, phi, d);
        const n = new THREE.Vector3().subVectors(a, b).cross(new THREE.Vector3().subVectors(c, d)).normalize();
        if (n.dot(p) < 0) n.negate();
        pos.push(p.x * grow, p.y * grow, p.z * grow);
        nor.push(n.x, n.y, n.z);
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const q = i * (cols + 1) + j;
        const r = q + cols + 1;
        idx.push(q, r, q + 1, r, r + 1, q + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  }

  /* titik & normal di permukaan depan untuk (x, y) */
  function surface(x, y) {
    const zAt = (xx, yy) => {
      const t = Math.acos(THREE.MathUtils.clamp(-yy / H, -1, 1));
      const r = Math.max(eggR(t), 1e-4);
      const u = THREE.MathUtils.clamp(Math.abs(xx) / r, 0, 1);
      const c = Math.pow(u, N / 2);
      const s = Math.sqrt(Math.max(0, 1 - c * c));
      return r * D * Math.pow(s, 2 / N);
    };
    const z = zAt(x, y);
    const e = 0.01;
    const dzdx = (zAt(x + e, y) - zAt(x - e, y)) / (2 * e);
    const dzdy = (zAt(x, y + e) - zAt(x, y - e)) / (2 * e);
    return { p: new THREE.Vector3(x, y, z), n: new THREE.Vector3(-dzdx, -dzdy, 1).normalize() };
  }

  function placeOnSurface(obj, x, y, lift) {
    const s = surface(x, y);
    obj.position.copy(s.p).addScaledVector(s.n, lift || 0);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), s.n);
    return s;
  }

  /* ---------- materials ---------- */
  const mat = {
    shell: new THREE.MeshPhysicalMaterial({ color: 0xf6f7fb, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: new THREE.Color(0xdfe4ff) }),
    cap: new THREE.MeshPhysicalMaterial({ color: 0xf0801e, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
    capDark: new THREE.MeshPhysicalMaterial({ color: 0xb4520e, roughness: 0.45, clearcoat: 0.5 }),
    earInner: new THREE.MeshPhysicalMaterial({ color: 0xffd4b8, roughness: 0.55, clearcoat: 0.4 }),
    bezel: new THREE.MeshPhysicalMaterial({ color: 0xeef0f6, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    button: new THREE.MeshPhysicalMaterial({ color: 0xf8a9c2, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x000000 }),
    socket: new THREE.MeshPhysicalMaterial({ color: 0xdfe2ec, roughness: 0.5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xe4e7ee, metalness: 1, roughness: 0.2 }),
    tag: new THREE.MeshStandardMaterial({ color: 0xf1f3f7, metalness: 0.95, roughness: 0.16 }),
    backing: new THREE.MeshBasicMaterial({ color: 0x1f2735 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  };

  const device = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.add(device);
  scene.add(tilt);

  /* badan + tutup */
  const tSplit = Math.acos(-Y_SPLIT / H);
  const body = new THREE.Mesh(eggGeometry(0, tSplit, 64, 128, 1), mat.shell);
  const cap = new THREE.Mesh(eggGeometry(tSplit - 0.004, Math.PI, 48, 128, 1.006), mat.cap);
  device.add(body, cap);

  /* telinga kucing */
  function earGeometry(scale) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      const y = k * 0.62;
      const r = (0.3 - 0.24 * Math.pow(k, 1.15)) * Math.sqrt(1 - Math.pow(Math.max(0, k - 0.82) / 0.18, 2) * 0.96);
      pts.push(new THREE.Vector2(Math.max(r, 0.004) * scale, y * scale));
    }
    pts.push(new THREE.Vector2(0, 0.625 * scale));
    return new THREE.LatheGeometry(pts, 48);
  }
  [-1, 1].forEach((side) => {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(earGeometry(1), mat.cap);
    outer.scale.set(1, 1, 0.55);
    const inner = new THREE.Mesh(earGeometry(0.62), mat.earInner);
    inner.scale.set(1, 1, 0.3);
    inner.position.set(0, 0.05, 0.11);
    ear.add(outer, inner);
    ear.position.set(side * 0.5, 0.84, 0.02);
    ear.rotation.z = -side * 0.34;
    device.add(ear);
  });

  /* garis dahi */
  [-0.16, 0, 0.16].forEach((x, i) => {
    const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.14, 4, 12), mat.capDark);
    placeOnSurface(stripe, x, i === 1 ? 0.86 : 0.82, -0.005);
    stripe.scale.set(1, 1, 0.6);
    device.add(stripe);
  });

  /* bingkai layar */
  const SCREEN_Y = -0.1;
  function roundRect(w, h, r) {
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
  const bezelShape = roundRect(1.26, 1.06, 0.22);
  bezelShape.holes.push(roundRect(1.06, 0.86, 0.1));
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.035, bevelSegments: 8, curveSegments: 32 });
  const bezel = new THREE.Mesh(bezelGeo, mat.bezel);
  const front = surface(0, SCREEN_Y).p.z;
  bezel.position.set(0, SCREEN_Y, front - 0.07);
  device.add(bezel);

  /* layar: tekstur dari canvas piksel */
  const screenTex = new THREE.CanvasTexture(pet.canvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.magFilter = THREE.NearestFilter;
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.generateMipmaps = false;
  const SCREEN_W = 1.06;
  const SCREEN_H = SCREEN_W / (pet.width / pet.height);
  const screenZ = front + 0.03;
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), mat.backing);
  backing.position.set(0, SCREEN_Y, screenZ - 0.004);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.set(0, SCREEN_Y, screenZ);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), mat.glass);
  glass.position.set(0, SCREEN_Y, screenZ + 0.02);
  device.add(backing, screen, glass);

  /* tombol */
  const buttonDefs = { a: [-0.31, -0.84], b: [0, -0.92], c: [0.31, -0.84] };
  const buttons = {};
  const hitAreas = [];
  Object.keys(buttonDefs).forEach((k) => {
    const [x, y] = buttonDefs[k];
    const holder = new THREE.Group();
    const s = placeOnSurface(holder, x, y, 0);
    const socket = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.016, 12, 48), mat.socket);
    socket.position.z = -0.005;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 40, 20), mat.button.clone());
    cap.scale.set(1, 1, 0.45);
    cap.position.z = 0.012;
    cap.userData.key = k;
    // area klik lebih besar dari tombolnya supaya mudah dipencet
    const hit = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial());
    hit.visible = false;
    hit.position.z = 0.05;
    hit.userData.key = k;
    holder.add(socket, cap, hit);
    hitAreas.push(hit);
    device.add(holder);
    buttons[k] = { holder, cap, base: 0.012, press: 0, normal: s.n };
  });

  /* gantungan kunci: eyelet, ring, rantai bola, dan tag nama */
  const keychain = new THREE.Group();
  const topY = H + 0.005;
  keychain.position.set(0.02, topY, 0.02);
  device.add(keychain);

  const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.022, 12, 32), mat.metal);
  eyelet.position.set(0, 0.07, 0);
  eyelet.rotation.y = Math.PI / 2;
  keychain.add(eyelet);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.026, 16, 72), mat.metal);
  ring.position.set(-0.2, 0.74, 0.05);
  ring.rotation.set(0.15, 0.55, 0.1);
  keychain.add(ring);

  const ballGeo = new THREE.SphereGeometry(0.021, 12, 8);
  function chain(from, to, bend) {
    const curve = new THREE.QuadraticBezierCurve3(from, new THREE.Vector3().lerpVectors(from, to, 0.5).add(bend), to);
    const count = Math.max(4, Math.round(curve.getLength() / 0.046));
    const group = new THREE.Group();
    for (let i = 0; i <= count; i++) {
      const ball = new THREE.Mesh(ballGeo, mat.metal);
      ball.position.copy(curve.getPoint(i / count));
      group.add(ball);
    }
    return group;
  }
  keychain.add(chain(new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(-0.2, 0.5, 0.05), new THREE.Vector3(0.02, 0, 0.02)));

  /* tag nama 3D */
  const tag = new THREE.Group();
  keychain.add(tag);
  const fontJson = await (await fetch(new URL("../vendor/dm-sans-800.typeface.json", import.meta.url))).json();
  const font = new FontLoader().parse(fontJson);
  const textGeo = new TextGeometry(tagText, { font, size: 0.25, depth: 0.05, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.011, bevelSegments: 4 });
  textGeo.computeBoundingBox();
  const bb = textGeo.boundingBox;
  textGeo.translate(-bb.min.x, -(bb.max.y + bb.min.y) / 2, -0.03);
  const text = new THREE.Mesh(textGeo, mat.tag);
  tag.add(text);
  const jump = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 10, 24), mat.metal);
  jump.position.set(-0.03, 0, 0);
  tag.add(jump);

  // susun tag menurun miring di atas tutup oranye, mengikuti permukaan
  const tagStart = surface(0.08, 1.04);
  const tagEnd = surface(0.66, 0.5);
  const startP = tagStart.p.clone().addScaledVector(tagStart.n, 0.07).sub(keychain.position);
  const endP = tagEnd.p.clone().addScaledVector(tagEnd.n, 0.07).sub(keychain.position);
  const xAxis = new THREE.Vector3().subVectors(endP, startP).normalize();
  const nAvg = tagStart.n.clone().add(tagEnd.n).normalize();
  const yAxis = new THREE.Vector3().crossVectors(nAvg, xAxis).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  tag.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
  tag.position.copy(startP);
  const textLen = bb.max.x - bb.min.x;
  const fit = startP.distanceTo(endP) / textLen;
  text.scale.setScalar(Math.min(1.15, fit));
  keychain.add(chain(new THREE.Vector3(-0.08, 0.5, 0.08), startP.clone().add(new THREE.Vector3(-0.02, 0.03, 0)), new THREE.Vector3(0.06, 0.05, 0.06)));

  device.position.y = 0;

  /* ---------- mount ---------- */
  box.appendChild(canvas);
  stage.classList.add("is-3d");

  function size() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const scale = stage.getBoundingClientRect().width / Math.max(1, stage.offsetWidth);
    const pr = Math.min((window.devicePixelRatio || 1) * Math.max(1, scale), 3);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  /* ---------- interaction ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickables = hitAreas.concat([screen, glass, body, cap, bezel]);
  device.traverse((o) => {
    if (o.isMesh && pickables.indexOf(o) === -1) pickables.push(o);
  });

  let pointer = { x: 0, y: 0, active: false, last: 0 };
  let hover = null;
  const tip = document.createElement("div");
  tip.className = "pet-tip";
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);

  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (!hit) return null;
    if (hit.object.userData.key) return { kind: "button", key: hit.object.userData.key };
    if (hit.object === screen || hit.object === glass) {
      const local = screen.worldToLocal(hit.point.clone());
      return { kind: "screen", u: local.x / SCREEN_W + 0.5, v: 0.5 - local.y / SCREEN_H };
    }
    return { kind: "body" };
  }

  function toClient(v3) {
    const v = v3.clone().project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }

  function showTip(k) {
    const b = buttons[k];
    const p = toClient(b.cap.getWorldPosition(new THREE.Vector3()));
    tip.textContent = pet.label(k);
    tip.style.left = p.x + "px";
    tip.style.top = p.y + "px";
    tip.classList.add("is-on");
  }
  function hideTip() {
    tip.classList.remove("is-on");
  }

  function setHover(h, e) {
    hover = h;
    const open = pet.isOpen();
    document.documentElement.classList.toggle("pet-hovering", !!h);
    if (h && h.kind === "button") showTip(h.key);
    else hideTip();
    if (expandBtn && !open && h && h.kind !== "button") {
      const r = box.getBoundingClientRect();
      const k = r.width / Math.max(1, box.offsetWidth);
      expandBtn.style.left = (e.clientX - r.left) / k + 14 + "px";
      expandBtn.style.top = (e.clientY - r.top) / k + 10 + "px";
      expandBtn.style.bottom = "auto";
      expandBtn.classList.add("is-following");
    } else if (expandBtn && expandBtn.classList.contains("is-following")) {
      expandBtn.classList.remove("is-following");
      expandBtn.style.left = expandBtn.style.top = expandBtn.style.bottom = "";
    }
  }

  window.addEventListener("pointermove", (e) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    pointer.x = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (vw * 0.5), -1, 1);
    pointer.y = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (vh * 0.5), -1, 1);
    pointer.active = true;
    pointer.last = performance.now();
    if (e.pointerType !== "touch") setHover(pick(e.clientX, e.clientY), e);
    dirty = true;
  });

  document.addEventListener("click", (e) => {
    if (stage.closest("[hidden]")) return;
    const h = pick(e.clientX, e.clientY);
    if (!h) return;
    e.preventDefault();
    if (h.kind === "button") {
      pet.press(h.key);
    } else if (h.kind === "screen" && pet.isOpen()) {
      pet.tap(h.u, h.v);
    } else if (!pet.isOpen()) {
      pet.open();
    }
  });

  // tombol HTML (keyboard) menyalakan tombol 3D
  Object.keys(htmlButtons).forEach((k) => {
    const el = htmlButtons[k];
    if (!el) return;
    el.addEventListener("focus", () => {
      buttons[k].cap.material.emissive.setHex(0x55203a);
      showTip(k);
      dirty = true;
    });
    el.addEventListener("blur", () => {
      buttons[k].cap.material.emissive.setHex(0x000000);
      hideTip();
      dirty = true;
    });
  });

  /* ---------- reaksi ke event pet ---------- */
  let bump = 0;
  let swing = 0;
  let swingV = 0;
  document.addEventListener("pet:press", (e) => {
    const b = buttons[e.detail.key];
    if (b) b.press = 1;
    bump = 1;
    swingV += (Math.random() - 0.5) * 0.06 + 0.02;
    if (hover && hover.kind === "button") showTip(hover.key);
  });
  document.addEventListener("pet:labels", () => {
    if (hover && hover.kind === "button") showTip(hover.key);
  });
  document.addEventListener("pet:open", () => setTimeout(size, 800));
  document.addEventListener("pet:close", () => setTimeout(size, 800));

  // efek partikel muncul dari posisi di model 3D
  if (window.PetFX) {
    window.PetFX.locate.button = (k) => toClient(buttons[k].cap.getWorldPosition(new THREE.Vector3()));
    window.PetFX.locate.screen = (x, y) => {
      const local = new THREE.Vector3((x / pet.width - 0.5) * SCREEN_W, (0.5 - y / pet.height) * SCREEN_H, 0);
      return toClient(screen.localToWorld(local));
    };
  }

  /* ---------- loop ---------- */
  let dirty = true;
  let visible = true;
  let rafId = 0;
  const clock = new THREE.Clock();
  const rot = { x: 0, y: 0 };

  pet.onRender(() => {
    screenTex.needsUpdate = true;
    dirty = true;
    if (!rafId) rafId = requestAnimationFrame(loop);
  });

  function loop() {
    rafId = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    let moving = false;

    if (!reduceMotion) {
      const idle = performance.now() - pointer.last > 2500;
      const tx = idle ? Math.sin(t * 0.6) * 0.1 : pointer.y * 0.28;
      const ty = idle ? Math.sin(t * 0.45) * 0.22 : pointer.x * 0.5;
      const prevY = rot.y;
      rot.x += (tx - rot.x) * Math.min(1, dt * 5);
      rot.y += (ty - rot.y) * Math.min(1, dt * 5);
      tilt.rotation.set(rot.x, rot.y, Math.sin(t * 0.8) * 0.02);
      tilt.position.y = Math.sin(t * 1.3) * 0.045;
      // gantungan kunci ikut berayun (pegas teredam)
      swingV += -(rot.y - prevY) * 0.45 - swing * 0.08;
      swingV *= 0.9;
      swing = THREE.MathUtils.clamp(swing + swingV, -0.16, 0.16);
      moving = true;
    }
    keychain.rotation.z = swing * 0.6;
    keychain.rotation.x = Math.abs(swing) * 0.25;

    // tombol masuk saat ditekan, badan sedikit "membal"
    Object.values(buttons).forEach((b) => {
      if (b.press > 0.001) {
        b.press *= Math.pow(0.0015, dt);
        moving = true;
      } else b.press = 0;
      b.cap.position.z = b.base - 0.032 * b.press;
    });
    if (bump > 0.001) {
      bump *= Math.pow(0.004, dt);
      moving = true;
    } else bump = 0;
    const s = 1 - 0.035 * Math.sin(bump * Math.PI) * bump;
    device.scale.set(1 + (1 - s) * 0.4, s, 1);

    if (dirty || moving) {
      renderer.render(scene, camera);
      dirty = false;
    }
    if (moving || !reduceMotion) rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!rafId) {
      clock.getDelta();
      rafId = requestAnimationFrame(loop);
    }
  }

  new ResizeObserver(size).observe(canvas);
  window.addEventListener("resize", size);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", start);
  document.addEventListener("pointerdown", start);
  size();
  start();
}
