/* Hero WebGL scene: the two glossy blades from the FomoCLI banner, lit along their inner
   edges, with a travelling rim light, floating dust and bloom. Falls back silently to the
   CSS blades when WebGL is unavailable. */
import * as THREE from "three";
import { EffectComposer } from "../vendor/three/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/three/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/three/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../vendor/three/postprocessing/OutputPass.js";

const canvas = document.getElementById("webgl");
const hero = document.getElementById("hero");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch {
    return;
  }
  const mobile = window.matchMedia("(max-width: 860px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05060f, 9, 22);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const CAM_Z = 10;
  camera.position.set(0, 0, CAM_Z);

  /* ───── Blade geometry: a rounded square, extruded and bevelled ───── */
  const S = 2.4, R = 0.62, DEPTH = 0.3, BEVEL = 0.14;
  const shape = new THREE.Shape();
  const h = S / 2;
  shape.moveTo(-h + R, -h);
  shape.lineTo(h - R, -h);
  shape.quadraticCurveTo(h, -h, h, -h + R);
  shape.lineTo(h, h - R);
  shape.quadraticCurveTo(h, h, h - R, h);
  shape.lineTo(-h + R, h);
  shape.quadraticCurveTo(-h, h, -h, h - R);
  shape.lineTo(-h, -h + R);
  shape.quadraticCurveTo(-h, -h, -h + R, -h);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL,
    bevelSegments: 12, curveSegments: 48,
  });
  geo.center();

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1e2e, metalness: 0.55, roughness: 0.38,
    clearcoat: 1, clearcoatRoughness: 0.2,
  });

  /* Rim light: a thin tube around the silhouette with a light that travels along it. */
  const rimPts = shape.getSpacedPoints(360).map((p) => {
    const k = (h + BEVEL * 0.92) / h;
    return new THREE.Vector3(p.x * k, p.y * k, DEPTH / 2 + BEVEL * 0.35);
  });
  rimPts.pop();
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 720, 0.0065, 6, true);
  const makeRimMat = (offset) =>
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOffset: { value: offset }, uIntro: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime; uniform float uOffset; uniform float uIntro;
        float head(float h) { float d = abs(vUv.x - h); d = min(d, 1.0 - d); return exp(-d * d * 900.0); }
        void main() {
          float t = uTime * 0.045 + uOffset;
          float a = 0.05 + 1.9 * head(fract(t)) + 0.7 * head(fract(t + 0.5));
          gl_FragColor = vec4(vec3(0.86, 0.9, 1.0) * a * uIntro, 1.0);
        }`,
    });

  const blades = [-1, 1].map((side) => {
    const group = new THREE.Group();
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(geo, mat);
    const rim = new THREE.Mesh(rimGeo, makeRimMat(side < 0 ? 0.0 : 0.37));
    pivot.add(mesh, rim);
    pivot.rotation.z = Math.PI / 4;
    group.add(pivot);
    scene.add(group);
    return { side, group, rim };
  });

  /* ───── Lights: a cool source between the blades lights their inner edges ───── */
  scene.add(new THREE.AmbientLight(0x8890b0, 0.15));
  const core = new THREE.PointLight(0xdfe6ff, 60, 14, 1.6);
  core.position.set(0, 0.4, 2.2);
  scene.add(core);
  const top = new THREE.DirectionalLight(0xffffff, 1.4);
  top.position.set(0, 6, 3);
  scene.add(top);
  const back = new THREE.DirectionalLight(0x9aa6ff, 1.2);
  back.position.set(0, -2, -6);
  scene.add(back);

  /* ───── Dust ───── */
  const N = mobile ? 380 : 900;
  const dustPos = new Float32Array(N * 3);
  const dustSeed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 22;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 13;
    dustPos[i * 3 + 2] = -6 + Math.random() * 9;
    dustSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute("seed", new THREE.BufferAttribute(dustSeed, 1));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float seed; uniform float uTime; uniform float uPR; varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.05 + seed * 0.12) + 6.5, 13.0) - 6.5;
        p.x += sin(uTime * 0.2 + seed * 40.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.2 + seed * 2.4) * uPR * (6.0 / -mv.z);
        vA = 0.25 + 0.55 * (0.5 + 0.5 * sin(uTime * (0.6 + seed) + seed * 20.0));
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), (1.0 - d * 2.0) * vA);
      }`,
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  /* ───── Post ───── */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.35, 0.55);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ───── Layout ───── */
  let W = 1, H = 1, rest = 4, scale = 1;
  const layout = () => {
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    bloom.resolution.set(W / 2, H / 2);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    const hw = hh * camera.aspect;
    const halfDiag = (h + BEVEL) * Math.SQRT2;
    scale = (hh * (camera.aspect > 1 ? 1.02 : 0.5)) / halfDiag;
    const tip = hw * (camera.aspect > 1.4 ? 0.62 : camera.aspect > 1 ? 0.74 : 0.8);
    rest = tip + halfDiag * scale;
    blades.forEach((b) => b.group.scale.setScalar(scale));
  };
  layout();
  window.addEventListener("resize", layout);

  /* ───── Input ───── */
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  let intro = reduced ? 1 : 0;
  let introStart = null;
  const beginIntro = () => { if (introStart === null) introStart = performance.now(); };
  window.addEventListener("fc:ready", beginIntro);
  setTimeout(beginIntro, 4500);

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  const clock = new THREE.Clock();
  let first = true;
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();

    if (introStart !== null && intro < 1) intro = Math.min((performance.now() - introStart) / 2600, 1);
    const ei = 1 - Math.pow(1 - intro, 4);
    const p = Math.min(Math.max(window.scrollY / Math.max(H, 1), 0), 1);
    const ep = p * p * (3 - 2 * p);

    cx += (mx - cx) * 0.05;
    cy += (my - cy) * 0.05;

    blades.forEach(({ side, group, rim }) => {
      const out = (1 - ei) * 4 + ep * rest * 0.9;
      group.position.x = side * (rest + out) + cx * 0.35;
      group.position.y = Math.sin(t * 0.5 + side) * 0.08 - cy * 0.25;
      group.rotation.y = side * (-0.22 + ep * 0.7) + cx * 0.3;
      group.rotation.x = cy * 0.18;
      rim.material.uniforms.uTime.value = t;
      rim.material.uniforms.uIntro.value = ei * (1 - ep * 0.6);
    });
    dustMat.uniforms.uTime.value = t;
    core.intensity = 60 * ei * (1 + 0.08 * Math.sin(t * 1.3));
    camera.position.x = cx * 0.6;
    camera.position.y = -cy * 0.4;
    camera.position.z = CAM_Z - ep * 2.5;
    camera.lookAt(0, 0, 0);
    bloom.strength = 0.75 + ep * 0.5;

    composer.render();
    if (first) { first = false; document.documentElement.classList.add("has-webgl"); }
  };
  frame();
}

try { start(); } catch (err) { console.warn("FomoCLI scene disabled:", err); }
