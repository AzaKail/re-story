import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BODIES, SUN } from './bodies.js';
import { latLonToVector3 } from './geo.js';

const AUTO_SPIN = 0.04;            // rad/s, slow museum rotation
const RESUME_AFTER_MS = 20000;     // auto-rotation returns this long after the visitor lets go
const FLIGHT_MS = 1800;
const MIN_DISTANCE_FACTOR = 1.1;   // closest zoom, in body radii from the centre
const ARTIFACT_VIEW_FACTOR = 1.7;  // camera distance when focused on an artifact, in body radii
const MARKER_SIZE_FACTOR = 0.014;  // marker radius, in body radii
const MARKER_COLOR = 0xf2b54a;
const DEFAULT_VIEW_DIR = new THREE.Vector3(0, 0.18, 1).normalize();
const IDENTITY = new THREE.Quaternion();

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
    this.markers = {};
    this.current = null;
    this.focusedArtifact = null;
    this.flight = null;
    this.autoSpin = !reducedMotion;
    this.resumeTimer = null;
    this.running = false;
    this.clock = new THREE.Clock();

    this.#initRenderer();
    this.#initWorld();
    this.#initControls();

    window.addEventListener('resize', () => this.#resize());
    this.#resize();
    this.setRunning(true);
  }

  // ---------- Public API ----------

  // Pauses rendering while the scene is off screen (e.g. the visitor scrolled to the museum).
  setRunning(running) {
    if (running === this.running) return;
    this.running = running;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(running ? () => this.#tick() : null);
  }

  addArtifacts(artifacts) {
    for (const artifact of artifacts) {
      const body = this.bodies[artifact.body];
      if (!body) continue;
      const lat = artifact.latitude ?? artifact.lat;
      const lon = artifact.longitude ?? artifact.lon;
      if (lat == null || lon == null) continue;
      const r = body.cfg.radius;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(r * MARKER_SIZE_FACTOR, 16, 12),
        new THREE.MeshBasicMaterial({ color: MARKER_COLOR }),
      );
      marker.position.copy(latLonToVector3(lat, lon, r * 1.001));
      body.mesh.add(marker);   // child of the spinning mesh, so it turns with the surface
      this.markers[artifact.code] = { marker, body: artifact.body };
    }
  }

  // Shows a whole body. keepDirection: zoom out along the current view instead of the default one.
  focus(key, { instant = false, keepDirection = false } = {}) {
    if (!this.bodies[key]?.cfg.focus) return;
    this.current = key;
    this.focusedArtifact = null;
    this.autoSpin = !this.reducedMotion;
    this.#moveCamera(this.#bodyView(key, keepDirection), { instant });
  }

  // Flies close to an artifact marker and stops the rotation so it stays in view.
  focusArtifact(code) {
    const entry = this.markers[code];
    if (!entry || entry.body !== this.current) return false;
    this.focusedArtifact = code;
    this.autoSpin = false;
    clearTimeout(this.resumeTimer);

    const { group, cfg } = this.bodies[entry.body];
    const center = group.position.clone();
    const dir = entry.marker.getWorldPosition(new THREE.Vector3()).sub(center).normalize();
    this.#moveCamera({ target: center, position: center.clone().addScaledVector(dir, cfg.radius * ARTIFACT_VIEW_FACTOR) });
    return true;
  }

  clearArtifact() {
    if (this.focusedArtifact) this.focus(this.current, { keepDirection: true });
  }

  // ---------- Setup ----------

  #initRenderer() {
    const lowPower = window.matchMedia('(pointer: coarse)').matches
      || Math.min(screen.width, screen.height) < 600;
    this.renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 2000);
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
        () => this.onError({ type: 'texture', body: key }),
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
      if (this.reducedMotion || this.focusedArtifact) return;
      clearTimeout(this.resumeTimer);
      this.resumeTimer = setTimeout(() => { this.autoSpin = true; }, RESUME_AFTER_MS);
    });
  }

  // ---------- Camera ----------

  // Camera distance at which the whole body fits on screen with some margin.
  #viewDistance(radius) {
    const vHalf = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * this.camera.aspect);
    return (radius / Math.sin(Math.min(vHalf, hHalf))) * 1.25;
  }

  #bodyView(key, keepDirection) {
    const { cfg, group } = this.bodies[key];
    const target = group.position.clone();
    const dir = keepDirection
      ? this.camera.position.clone().sub(target).normalize()
      : DEFAULT_VIEW_DIR.clone();
    return { target, position: target.clone().addScaledVector(dir, this.#viewDistance(cfg.radius)) };
  }

  #applyLimits() {
    const r = this.bodies[this.current].cfg.radius;
    this.controls.minDistance = r * MIN_DISTANCE_FACTOR;
    this.controls.maxDistance = Math.max(r * 7, this.#viewDistance(r) * 1.6);
  }

  #moveCamera(view, { instant = false } = {}) {
    if (instant || this.reducedMotion) {
      this.flight = null;
      this.camera.position.copy(view.position);
      this.controls.target.copy(view.target);
      this.#applyLimits();
      this.controls.enabled = true;
      this.controls.update();
      return;
    }

    // Lift the zoom limits during the flight and restore them on arrival.
    this.controls.minDistance = 0;
    this.controls.maxDistance = Infinity;
    this.controls.enabled = false;

    const sameCenter = this.controls.target.distanceTo(view.target) < 1e-6;
    this.flight = {
      start: performance.now(),
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: view.position,
      toTarget: view.target,
      // Around the same body: travel along an arc so the camera never cuts through the sphere.
      orbit: sameCenter ? this.#orbitPath(view) : null,
      lift: this.camera.position.distanceTo(view.position) * 0.15,
    };
  }

  #orbitPath(view) {
    const center = view.target.clone();
    const from = this.camera.position.clone().sub(center);
    const to = view.position.clone().sub(center);
    const fromDir = from.clone().normalize();
    return {
      center,
      fromDir,
      fromDist: from.length(),
      toDist: to.length(),
      rotation: new THREE.Quaternion().setFromUnitVectors(fromDir, to.normalize()),
    };
  }

  #updateFlight() {
    const f = this.flight;
    const t = Math.min(1, (performance.now() - f.start) / FLIGHT_MS);
    const k = easeInOutCubic(t);

    if (f.orbit) {
      const o = f.orbit;
      const q = new THREE.Quaternion().slerpQuaternions(IDENTITY, o.rotation, k);
      const dist = THREE.MathUtils.lerp(o.fromDist, o.toDist, k);
      this.camera.position.copy(o.center).addScaledVector(o.fromDir.clone().applyQuaternion(q), dist);
      this.controls.target.copy(o.center);
    } else {
      const arc = Math.sin(Math.PI * k) * f.lift;
      this.camera.position.lerpVectors(f.fromPos, f.toPos, k);
      this.camera.position.y += arc;
      this.camera.position.z += arc;
      this.controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
    }
    this.camera.lookAt(this.controls.target);

    if (t >= 1) {
      this.flight = null;
      this.#applyLimits();
      this.controls.enabled = true;
    }
  }

  // ---------- Loop ----------

  #resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.current && !this.flight) this.#applyLimits();
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
