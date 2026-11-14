import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BODIES, SUN } from './bodies.js';

const AUTO_SPIN = 0.04;          // rad/s, slow museum rotation
const RESUME_AFTER_MS = 20000;   // autorotation returns this long after the visitor lets go
const FLIGHT_MS = 1800;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export class MuseumScene {
  constructor(container, { staticUrl, reducedMotion, onError }) {
    this.container = container;
    this.staticUrl = staticUrl;
    this.reducedMotion = reducedMotion;
    this.onError = onError || (() => {});
    this.bodies = {};
    this.current = null;
    this.flight = null;
    this.autoSpin = !reducedMotion;
    this.resumeTimer = null;
    this.clock = new THREE.Clock();

    this.#initRenderer();
    this.#initWorld();
    this.#initControls();

    window.addEventListener('resize', () => this.#resize());
    this.#resize();
    this.renderer.setAnimationLoop(() => this.#tick());
  }

  #initRenderer() {
    const lowPower = window.matchMedia('(pointer: coarse)').matches
      || Math.min(screen.width, screen.height) < 600;
    this.renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.05, 2000);
  }

  #initWorld() {
    this.#addStars();
    this.#addSun();
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const loader = new THREE.TextureLoader();
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    for (const [key, cfg] of Object.entries(BODIES)) {
      const material = new THREE.MeshStandardMaterial({ color: cfg.fallbackColor, roughness: 1, metalness: 0 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, 96, 64), material);
      mesh.name = key;

      // The group holds the position; the mesh inside it spins.
      // Artifact markers (stage 3) will be children of the mesh so they turn with the surface.
      const group = new THREE.Group();
      group.position.fromArray(cfg.position);
      group.add(mesh);
      this.scene.add(group);
      this.bodies[key] = { cfg, group, mesh };

      loader.load(
        this.staticUrl + cfg.texture,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAniso;
          material.map = tex;
          material.color.set(0xffffff);
          material.needsUpdate = true;
        },
        undefined,
        () => this.onError(`Could not load the ${cfg.name} surface map. Showing a plain sphere instead.`),
      );
    }
  }

  #addStars() {
    // Procedural star field: a decorative backdrop, not a star catalogue.
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      v.randomDirection().multiplyScalar(900);
      positions.set([v.x, v.y, v.z], i * 3);
      c.setHSL(Math.random() < 0.7 ? 0.6 : 0.1, 0.25, 0.55 + Math.random() * 0.4);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false });
    this.scene.add(new THREE.Points(geo, mat));
  }

  #addSun() {
    const pos = new THREE.Vector3().fromArray(SUN.position);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(SUN.radius, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff1d0 }),
    );
    sun.position.copy(pos);
    this.scene.add(sun);

    // Soft glow drawn on a canvas; no external image needed.
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.2, 'rgba(255,200,120,0.55)');
    g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }));
    glow.scale.setScalar(SUN.radius * 8);
    glow.position.copy(pos);
    this.scene.add(glow);

    const light = new THREE.DirectionalLight(0xffffff, 2.6);
    light.position.copy(pos);
    this.scene.add(light);
  }

  #initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;

    this.controls.addEventListener('start', () => {
      this.autoSpin = false;
      clearTimeout(this.resumeTimer);
    });
    this.controls.addEventListener('end', () => {
      if (this.reducedMotion) return;
      clearTimeout(this.resumeTimer);
      this.resumeTimer = setTimeout(() => { this.autoSpin = true; }, RESUME_AFTER_MS);
    });
  }

  // Camera distance at which the whole body fits on screen with some margin.
  #viewDistance(radius) {
    const vHalf = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * this.camera.aspect);
    return (radius / Math.sin(Math.min(vHalf, hHalf))) * 1.25;
  }

  #viewFor(key) {
    const { cfg, group } = this.bodies[key];
    const target = group.position.clone();
    const dir = new THREE.Vector3(0, 0.18, 1).normalize();
    const position = target.clone().addScaledVector(dir, this.#viewDistance(cfg.radius));
    return { target, position };
  }

  #applyLimits(key) {
    const r = this.bodies[key].cfg.radius;
    this.controls.minDistance = r * 1.25;
    this.controls.maxDistance = Math.max(r * 7, this.#viewDistance(r) * 1.6);
  }

  focus(key, { instant = false } = {}) {
    if (!this.bodies[key] || !this.bodies[key].cfg.focus) return;
    const view = this.#viewFor(key);
    this.current = key;

    if (instant || this.reducedMotion) {
      this.flight = null;
      this.camera.position.copy(view.position);
      this.controls.target.copy(view.target);
      this.#applyLimits(key);
      this.controls.enabled = true;
      this.controls.update();
      return;
    }

    // Lift the zoom limits during the flight and restore them on arrival.
    this.controls.minDistance = 0;
    this.controls.maxDistance = Infinity;
    this.controls.enabled = false;
    this.flight = {
      key,
      start: performance.now(),
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: view.position,
      toTarget: view.target,
      lift: this.camera.position.distanceTo(view.position) * 0.15,
    };
  }

  #updateFlight() {
    const f = this.flight;
    const t = Math.min(1, (performance.now() - f.start) / FLIGHT_MS);
    const k = easeInOutCubic(t);
    const arc = Math.sin(Math.PI * k) * f.lift;
    this.camera.position.lerpVectors(f.fromPos, f.toPos, k);
    this.camera.position.y += arc;
    this.camera.position.z += arc;
    this.controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
    this.camera.lookAt(this.controls.target);
    if (t >= 1) {
      this.flight = null;
      this.#applyLimits(f.key);
      this.controls.enabled = true;
    }
  }

  #resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.current && !this.flight) this.#applyLimits(this.current);
  }

  #tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.autoSpin) {
      for (const b of Object.values(this.bodies)) b.mesh.rotation.y += AUTO_SPIN * dt;
    }
    if (this.flight) this.#updateFlight();
    else this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
