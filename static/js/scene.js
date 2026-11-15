import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BODIES, SUN, BACKDROP_PLANETS } from './bodies.js';
import { latLonToVector3 } from './geo.js';
import { CameraFlight } from './flight.js';
import { SurfaceModel } from './surface_model.js';
import { createMoonMessage, disposeMoonMessage } from './moon_message.js';

const AUTO_SPIN = 0.04;            // rad/s, slow museum rotation
const RESUME_AFTER_MS = 20000;     // auto-rotation returns this long after the visitor lets go
const ARTIFACT_VIEW_FACTOR = 1.7;  // camera distance at an artifact (body radii); also the zoom limit
const DIVE_FACTOR = 1.03;          // camera distance at the end of the "Learn more" dive
const MARKER_SIZE_FACTOR = 0.014;  // marker radius, in body radii
const MARKER_COLOR = 0xfca311;
const MARKER_COLOR_BACK = 0x00e5ff;
const DEFAULT_VIEW_DIR = new THREE.Vector3(0, 0.18, 1).normalize();
const SHOWCASE_SPEED = 0.6;          // OrbitControls autoRotateSpeed: 2.0 is one orbit in 30 s
const PICK_RADIUS_PX = { mouse: 22, touch: 34 };   // how close a click must be to a marker
const CLICK_MAX_MOVE_PX = 6;         // a drag that moved further is a rotation, not a click
const CLICK_MAX_MS = 600;

// Next to a NASA 3D model the camera looks at the model, tilted towards the horizon, and orbits it.
const MODEL_VIEW_FACTOR = 0.32;      // camera distance from the model, in body radii
const MODEL_DIVE_FACTOR = 0.05;      // end of the "Learn more" dive towards a model
const MODEL_VIEW_TILT = THREE.MathUtils.degToRad(55);   // angle between the view and the surface normal
const MODEL_ZOOM = { min: 0.12, max: 1.0 };              // zoom limits around a model, in body radii
const MODEL_MAX_POLAR = THREE.MathUtils.degToRad(80);    // never look from under the surface
// Where to aim relative to the model (body radii). Desktop: above it, so the model sits lower and
// the plaque fits above. Phone: below it, so the model sits higher and the plaque fits underneath.
const MODEL_LOOK_OFFSET = { desktop: 0.05, phone: -0.035 };
const isPhoneScreen = () => window.matchMedia('(max-width: 600px)').matches;
const FLIGHT_MODEL_MS = 1100;
const FLIGHT_RISE_MS = 900;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

const FLIGHT_ORBIT_MS = 1600;
const FLIGHT_DIVE_MS = 1300;
const flightBetweenBodiesMs = (distance) => THREE.MathUtils.clamp(1400 + distance * 7, 1800, 3400);

// Adaptive quality: lower the pixel ratio when the frame rate drops, raise it back when there is headroom.
const QUALITY_WINDOW_S = 2;
const FPS_LOW = 40;
const FPS_HIGH = 57;
const PIXEL_RATIO_STEP = 0.25;

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
    this.textureLoader = new THREE.TextureLoader();
    this.quality = { frames: 0, elapsed: 0 };
    this.surfaceModel = new SurfaceModel(staticUrl);
    this.inModelView = false;
    this.diveCode = null;
    this.moonMessage = null;

    this.#initRenderer();
    this.#initWorld();
    this.#initControls();
    this.#initPicking();

    window.addEventListener('resize', () => this.#resize());
    this.#resize();
    this.setRunning(true);
  }

  // ---------- Public API ----------

  // Pauses rendering, e.g. while the museum view covers the scene.
  setRunning(running) {
    if (running === this.running) return;
    this.running = running;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(running ? () => this.#tick() : null);
  }

  // Adds a marker for every artifact with surface coordinates on a body that exists in the scene.
  addArtifacts(artifacts) {
    for (const artifact of artifacts) {
      const body = this.bodies[artifact.body];
      if (!body || artifact.latitude == null || artifact.longitude == null) continue;
      const r = body.cfg.radius;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(r * MARKER_SIZE_FACTOR, 16, 12),
        new THREE.MeshBasicMaterial({ color: MARKER_COLOR, transparent: true, opacity: 1.0 }),
      );
      marker.position.copy(latLonToVector3(artifact.latitude, artifact.longitude, r * 1.001));
      body.mesh.add(marker);   // child of the spinning mesh, so it turns with the surface
      const model = artifact.model?.url ? artifact.model : null;   // NASA 3D model, if there is one
      this.markers[artifact.code] = { marker, body: artifact.body, model };
    }
  }

  // Shows a whole body. keepDirection: zoom out along the current view instead of the default one.
  focus(key, { instant = false, keepDirection = false } = {}) {
    if (!this.bodies[key]?.cfg.focus) return Promise.resolve();
    const fromOtherBody = this.current && this.current !== key;
    this.current = key;
    this.focusedArtifact = null;
    this.surfaceModel.hide();
    this.autoSpin = !this.reducedMotion;
    this.#loadDetailTexture(key);
    const view = this.#bodyView(key, keepDirection);
    const durationMs = fromOtherBody
      ? flightBetweenBodiesMs(this.camera.position.distanceTo(view.position))
      : FLIGHT_ORBIT_MS;
    return this.#fly(view, { instant, durationMs });
  }

  // Flies close to an artifact and stops the rotation so it stays in view. If the artifact has a
  // NASA 3D model, the camera then descends to the model, which replaces the marker.
  // Returns a promise that resolves on arrival, or null if the artifact is not on this body.
  focusArtifact(code) {
    const view = this.#artifactView(code, ARTIFACT_VIEW_FACTOR);
    if (!view) return null;
    const previous = this.inModelView ? this.focusedArtifact : null;
    this.focusedArtifact = code;
    this.autoSpin = false;
    clearTimeout(this.resumeTimer);
    return this.#travelToArtifact(code, previous);
  }

  async #travelToArtifact(code, previous) {
    const entry = this.markers[code];
    // Next to another model: rise above it first, so the camera never flies through the ground.
    if (previous) {
      await this.#fly(this.#artifactView(previous, ARTIFACT_VIEW_FACTOR), { durationMs: FLIGHT_RISE_MS, release: false });
    }
    if (this.focusedArtifact !== code) return;
    this.surfaceModel.hide();
    await this.#fly(this.#artifactView(code, ARTIFACT_VIEW_FACTOR), { durationMs: FLIGHT_ORBIT_MS, release: !entry.model });
    if (entry.model && this.focusedArtifact === code) await this.#approachModel(code);
  }

  // Loads the model (while the camera moves) and flies to the tilted view around it.
  #approachModel(code) {
    const entry = this.markers[code];
    this.surfaceModel.show(entry, this.bodies[entry.body].cfg.radius)
      .then(() => this.onCameraMove?.())   // the plaque moves up to the top of the model
      .catch((err) => {
        console.error(err);
        entry.marker.visible = true;   // no model: keep the orange marker
      });
    return this.#fly(this.#modelView(code, MODEL_VIEW_FACTOR), { durationMs: FLIGHT_MODEL_MS });
  }

  clearArtifact() {
    if (this.focusedArtifact) this.focus(this.current, { keepDirection: true });
  }

  // "Learn more": plunge towards the focused artifact. Controls stay locked until surfaceFromDive().
  diveIntoArtifact() {
    const code = this.focusedArtifact;
    if (!code || !this.markers[code]) return Promise.resolve();
    const view = this.inModelView
      ? this.#modelView(code, MODEL_DIVE_FACTOR)
      : this.#artifactView(code, DIVE_FACTOR);
    if (!view) return Promise.resolve();
    this.diveCode = code;
    return this.#fly(view, { durationMs: FLIGHT_DIVE_MS, release: false });
  }

  // Back from the museum: rise from the dive point to the artifact view (and its model).
  // If another artifact was opened in the museum, rise above the old place and arc to the new one.
  async surfaceFromDive() {
    const code = this.focusedArtifact;
    const entry = code && this.markers[code];
    if (!entry || entry.body !== this.current) return this.focus(this.current, { keepDirection: true });
    const sameSpot = this.diveCode === code;
    this.diveCode = null;
    if (sameSpot && entry.model && this.surfaceModel.active?.entry === entry) {
      return this.#fly(this.#modelView(code, MODEL_VIEW_FACTOR), { durationMs: FLIGHT_DIVE_MS });
    }
    if (!sameSpot) await this.#fly(this.#riseView(), { durationMs: FLIGHT_RISE_MS, release: false });
    this.surfaceModel.hide();
    await this.#fly(this.#artifactView(code, ARTIFACT_VIEW_FACTOR), { durationMs: FLIGHT_DIVE_MS, release: !entry.model });
    if (entry.model && this.focusedArtifact === code) await this.#approachModel(code);
  }

  // Another artifact was picked inside the museum: remember it without moving the camera now,
  // so surfaceFromDive() rises next to it.
  setFocusedArtifact(code) {
    const entry = this.markers[code];
    if (!entry) return false;
    if (entry.body !== this.current) {
      this.focus(entry.body, { instant: true });
    }
    this.focusedArtifact = code;
    return true;
  }

  getArtifactScreenPosition(code) {
    const entry = code && this.markers[code];
    if (!entry || entry.body !== this.current) return null;
    const body = this.bodies[entry.body];
    const pos = new THREE.Vector3();
    entry.marker.getWorldPosition(pos);
    const normal = pos.clone().sub(body.group.position).normalize();
    // With a 3D model in place, point at the top of the model so the plaque does not cover it.
    pos.addScaledVector(normal, this.surfaceModel.heightOf(entry));
    const viewDir = this.camera.position.clone().sub(pos).normalize();
    const rawFacing = normal.dot(viewDir) > 0.02;
    const isFacing = entry.isBackside ? false : (rawFacing || (entry.obscuredSince && (performance.now() - entry.obscuredSince < 1000)));
    pos.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (pos.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-pos.y * 0.5 + 0.5) * rect.height + rect.top,
      visible: pos.z < 1,
      isFacing,
    };
  }

  // Slow camera orbit around the current body (for recording GIFs). Stops when the visitor drags.
  startShowcase() {
    this.autoSpin = false;
    clearTimeout(this.resumeTimer);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = SHOWCASE_SPEED;
  }

  stopShowcase() {
    this.controls.autoRotate = false;
  }

  // Hidden two-line neon message on the Moon (text and place: static/js/moon_message.js).
  // Shows it and turns the camera towards it, or hides it. Returns true when it is shown.
  async toggleMoonMessage() {
    const moon = this.bodies.moon;
    if (this.moonMessage) {
      disposeMoonMessage(this.moonMessage);
      this.moonMessage = null;
      this.autoSpin = !this.reducedMotion;
      return false;
    }
    const message = createMoonMessage(moon.cfg.radius);
    this.moonMessage = message;   // set first, so a second press while flying hides it
    moon.mesh.add(message);
    if (this.current !== 'moon') await this.focus('moon');
    if (this.moonMessage !== message) return false;
    this.autoSpin = false;
    clearTimeout(this.resumeTimer);
    moon.mesh.updateMatrixWorld(true);
    const dir = message.userData.normal.clone().transformDirection(moon.mesh.matrixWorld);
    const target = moon.group.position.clone();
    await this.#fly({ target, position: target.clone().addScaledVector(dir, this.#viewDistance(moon.cfg.radius)) });
    return true;
  }

  // ---------- Setup ----------

  #initRenderer() {
    this.lowPower = window.matchMedia('(pointer: coarse)').matches
      || Math.min(screen.width, screen.height) < 600;
    this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2);
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.lowPower, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this.maxPixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
    this.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 3000);
  }

  #initWorld() {
    this.#addStars();
    this.#addSun();
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    // Soft "headlight" from the camera: whatever the visitor looks at stays readable,
    // even on the night side. The Sun remains the main, directional light.
    const headlight = new THREE.DirectionalLight(0xffffff, 0.7);
    headlight.position.set(0, 0, 1);
    headlight.target.position.set(0, 0, -1);   // shine along the view direction
    this.camera.add(headlight, headlight.target);
    this.scene.add(this.camera);
    for (const [key, cfg] of Object.entries(BODIES)) this.#addBody(key, cfg);
    this.#addBackdropPlanets();
  }

  #addBody(key, cfg) {
    const material = new THREE.MeshStandardMaterial({ color: cfg.fallbackColor, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, ...cfg.segments), material);
    mesh.name = key;

    // The group holds the position; the mesh inside it spins.
    const group = new THREE.Group();
    group.position.fromArray(cfg.position);
    group.add(mesh);
    this.scene.add(group);
    this.bodies[key] = { cfg, group, mesh, detail: 'none' };

    this.#loadTexture(cfg.texture.base, (tex) => this.#applyMap(material, tex), () => {
      this.onError({ type: 'texture', body: key });
    });
  }

  #loadTexture(path, onLoad, onFail) {
    this.textureLoader.load(this.staticUrl + path, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.maxAnisotropy;
      onLoad(tex);
    }, undefined, onFail);
  }

  #applyMap(material, tex) {
    const old = material.map;
    material.map = tex;
    material.color.set(0xffffff);
    material.needsUpdate = true;
    old?.dispose();
  }

  // Loads the sharpest map the device can hold, once, for the body being viewed.
  #loadDetailTexture(key) {
    const body = this.bodies[key];
    const sizes = body.cfg.texture.detail;
    if (!sizes || body.detail !== 'none') return;
    const limit = Math.min(this.renderer.capabilities.maxTextureSize, this.lowPower ? 4096 : 8192);
    const best = Object.keys(sizes).map(Number).filter((s) => s <= limit).sort((a, b) => b - a)[0];
    if (!best) return;
    body.detail = 'loading';
    this.#loadTexture(sizes[best], (tex) => {
      this.#applyMap(body.mesh.material, tex);
      body.detail = 'loaded';
    }, () => { body.detail = 'failed'; });   // keep the base map, nothing else to do
  }

  #addStars() {
    // Procedural star field: a decorative backdrop, not a star catalogue.
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      v.randomDirection().multiplyScalar(1500);
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

  // Flat NASA photos of the other planets; sprites always face the camera and cost almost nothing.
  #addBackdropPlanets() {
    for (const planet of BACKDROP_PLANETS) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        color: 0xdddddd, transparent: true, depthWrite: false,
      }));
      sprite.position.fromArray(planet.position);
      sprite.visible = false;
      this.scene.add(sprite);
      this.#loadTexture(planet.image, (tex) => {
        sprite.material.map = tex;
        sprite.material.needsUpdate = true;
        sprite.scale.set(planet.width, planet.width * (tex.image.height / tex.image.width), 1);
        sprite.visible = true;
      }, () => {});   // decorative: a missing image is simply not shown
    }
  }

  #initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;

    this.controls.addEventListener('change', () => {
      if (this.onCameraMove) this.onCameraMove();
    });
    this.controls.addEventListener('start', () => {
      this.autoSpin = false;
      clearTimeout(this.resumeTimer);
      this.controls.autoRotate = false;
    });
    this.controls.addEventListener('end', () => {
      if (this.reducedMotion || this.focusedArtifact) return;
      clearTimeout(this.resumeTimer);
      this.resumeTimer = setTimeout(() => { this.autoSpin = true; }, RESUME_AFTER_MS);
    });
  }

  // Click or tap on an orange marker -> onMarkerClick(code). Uses screen distance, so small
  // markers are still easy to hit; drags (camera rotation) are ignored.
  #initPicking() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, time: performance.now() };
    });
    el.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.time < CLICK_MAX_MS;
      down = null;
      if (moved > CLICK_MAX_MOVE_PX || !quick) return;
      const code = this.#markerAt(e.clientX, e.clientY, e.pointerType);
      if (code) this.onMarkerClick?.(code);
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      el.style.cursor = this.#markerAt(e.clientX, e.clientY, 'mouse') ? 'pointer' : '';
    });
  }

  // Closest visible marker of the current body within the pick radius, or null.
  #markerAt(clientX, clientY, pointerType) {
    if (!this.current || this.flight) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const limit = pointerType === 'touch' ? PICK_RADIUS_PX.touch : PICK_RADIUS_PX.mouse;
    const center = this.bodies[this.current].group.position;
    const pos = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const toCamera = new THREE.Vector3();
    let best = null;
    let bestDist = limit;
    for (const [code, entry] of Object.entries(this.markers)) {
      if (entry.body !== this.current) continue;
      entry.marker.getWorldPosition(pos);
      normal.subVectors(pos, center).normalize();
      toCamera.subVectors(this.camera.position, pos).normalize();
      if (normal.dot(toCamera) <= 0.05) continue;   // on the far side of the body
      pos.project(this.camera);
      const x = (pos.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (-pos.y * 0.5 + 0.5) * rect.height + rect.top;
      const dist = Math.hypot(x - clientX, y - clientY);
      if (dist < bestDist) {
        best = code;
        bestDist = dist;
      }
    }
    return best;
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

  // Straight up from where the camera is now, to the usual artifact height.
  #riseView() {
    const { group, cfg } = this.bodies[this.current];
    const target = group.position.clone();
    const up = this.camera.position.clone().sub(target).setLength(cfg.radius * ARTIFACT_VIEW_FACTOR);
    return { target, position: target.clone().add(up) };
  }

  // Tilted view of a 3D model: the camera looks at the model from the south, above the horizon,
  // with the surface normal as "up", so orbiting turns around the model.
  #modelView(code, distanceFactor) {
    const entry = this.markers[code];
    const { group, cfg } = this.bodies[entry.body];
    const target = entry.marker.getWorldPosition(new THREE.Vector3());
    const normal = target.clone().sub(group.position).normalize();
    target.addScaledVector(normal, cfg.radius * MODEL_LOOK_OFFSET[isPhoneScreen() ? 'phone' : 'desktop']);
    const north = WORLD_UP.clone().addScaledVector(normal, -normal.dot(WORLD_UP));
    if (north.lengthSq() < 1e-6) north.set(1, 0, 0);
    north.normalize();
    const dir = normal.clone().multiplyScalar(Math.cos(MODEL_VIEW_TILT)).addScaledVector(north, -Math.sin(MODEL_VIEW_TILT));
    return { target, position: target.clone().addScaledVector(dir, cfg.radius * distanceFactor), up: normal };
  }

  #artifactView(code, distanceFactor) {
    const entry = code && this.markers[code];
    if (!entry || entry.body !== this.current) return null;
    const { group, cfg } = this.bodies[entry.body];
    const target = group.position.clone();
    const dir = entry.marker.getWorldPosition(new THREE.Vector3()).sub(target).normalize();
    return { target, position: target.clone().addScaledVector(dir, cfg.radius * distanceFactor) };
  }

  // Around a body the visitor can zoom in only as far as the artifact view (closer, the maps get
  // blurry). Around a 3D model the camera orbits the model and stays above the ground.
  #applyLimits() {
    const r = this.bodies[this.current].cfg.radius;
    if (this.inModelView) {
      this.controls.minDistance = r * MODEL_ZOOM.min;
      this.controls.maxDistance = r * MODEL_ZOOM.max;
      this.controls.maxPolarAngle = MODEL_MAX_POLAR;
    } else {
      this.controls.minDistance = r * ARTIFACT_VIEW_FACTOR;
      this.controls.maxDistance = Math.max(r * 7, this.#viewDistance(r) * 1.6);
      this.controls.maxPolarAngle = Math.PI;
    }
    // OrbitControls keeps the rotation for camera.up from its constructor; refresh it for the current up.
    this.controls._quat.setFromUnitVectors(this.camera.up, WORLD_UP);
    this.controls._quatInverse.copy(this.controls._quat).invert();
  }

  #releaseControls() {
    this.#applyLimits();
    this.controls.enabled = true;
    this.controls.update();
  }

  // release=false keeps the controls locked after arrival (used by the dive).
  #fly(view, { instant = false, durationMs = FLIGHT_ORBIT_MS, release = true } = {}) {
    this.inModelView = Boolean(view.up);
    if (instant || this.reducedMotion) {
      this.flight = null;
      this.camera.up.copy(view.up || WORLD_UP);
      this.camera.position.copy(view.position);
      this.controls.target.copy(view.target);
      this.camera.lookAt(view.target);
      if (release) this.#releaseControls();
      else this.controls.enabled = false;
      return Promise.resolve();
    }
    // Lift the zoom limits during the flight; they are restored on arrival.
    this.controls.minDistance = 0;
    this.controls.maxDistance = Infinity;
    this.controls.enabled = false;
    this.flight = new CameraFlight({ camera: this.camera, controls: this.controls, to: view, durationMs });
    this.flight.release = release;
    return this.flight.done;
  }

  // ---------- Loop ----------

  #resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.current && !this.flight && this.controls.enabled) this.#applyLimits();
  }

  #adjustQuality(dt) {
    const q = this.quality;
    q.frames += 1;
    q.elapsed += dt;
    if (q.elapsed < QUALITY_WINDOW_S) return;
    const fps = q.frames / q.elapsed;
    q.frames = 0;
    q.elapsed = 0;
    const ratio = this.renderer.getPixelRatio();
    if (fps < FPS_LOW && ratio > 1) {
      this.renderer.setPixelRatio(Math.max(1, ratio - PIXEL_RATIO_STEP));
    } else if (fps > FPS_HIGH && ratio < this.maxPixelRatio) {
      this.renderer.setPixelRatio(Math.min(this.maxPixelRatio, ratio + PIXEL_RATIO_STEP));
    }
  }

  #updateMarkers() {
    const vNormal = new THREE.Vector3();
    const vView = new THREE.Vector3();
    const markerPos = new THREE.Vector3();
    const now = performance.now();

    for (const [code, entry] of Object.entries(this.markers)) {
      const isSelected = code === this.focusedArtifact;
      const body = this.bodies[entry.body];
      if (!body) continue;

      if (!isSelected) {
        entry.obscuredSince = null;
        if (entry.isBackside) {
          entry.isBackside = false;
          entry.marker.material.color.setHex(MARKER_COLOR);
          entry.marker.material.opacity = 1.0;
          entry.marker.material.depthTest = true;
          entry.marker.renderOrder = 0;
          entry.marker.material.needsUpdate = true;
        }
        continue;
      }

      entry.marker.getWorldPosition(markerPos);
      vNormal.subVectors(markerPos, body.group.position).normalize();
      vView.subVectors(this.camera.position, markerPos).normalize();
      const rawObscured = vNormal.dot(vView) <= 0.02;

      let isBackside = entry.isBackside;
      if (rawObscured) {
        if (!entry.obscuredSince) {
          entry.obscuredSince = now;
        } else if (now - entry.obscuredSince >= 1000) {
          isBackside = true;
        }
      } else {
        entry.obscuredSince = null;
        isBackside = false;
      }

      if (entry.isBackside !== isBackside) {
        entry.isBackside = isBackside;
        if (isBackside) {
          entry.marker.material.color.setHex(MARKER_COLOR_BACK);
          entry.marker.material.opacity = 0.65;
          entry.marker.material.depthTest = false;
          entry.marker.renderOrder = 1;
        } else {
          entry.marker.material.color.setHex(MARKER_COLOR);
          entry.marker.material.opacity = 1.0;
          entry.marker.material.depthTest = true;
          entry.marker.renderOrder = 0;
        }
        entry.marker.material.needsUpdate = true;
      }
    }
  }

  #tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.autoSpin) {
      for (const b of Object.values(this.bodies)) b.mesh.rotation.y += AUTO_SPIN * dt;
    }
    if (this.flight) {
      if (this.flight.update(performance.now())) {
        const { release } = this.flight;
        this.flight = null;
        if (release) this.#releaseControls();
      }
    } else if (this.controls.enabled) {
      this.controls.update();
    }
    this.#updateMarkers();
    this.renderer.render(this.scene, this.camera);
    this.#adjustQuality(dt);
  }
}
