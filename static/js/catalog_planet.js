import * as THREE from 'three';

const TEXTURES = {
  moon: 'textures/moon_2k.jpg',
  mars: 'textures/mars_2k.jpg',
};

export class CatalogPlanet {
  constructor(canvas, { staticUrl = '/static/' } = {}) {
    this.canvas = canvas;
    this.staticUrl = staticUrl.endsWith('/') ? staticUrl : staticUrl + '/';
    this.currentBody = 'moon';
    this.running = false;
    this.textureCache = {};

    this.#initThree();
  }

  #initThree() {
    const width = this.canvas.width || 480;
    const height = this.canvas.height || 480;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, 0.1, 10);
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Realistic cosmic lighting for 2D presentation
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
    sunLight.position.set(2.5, 1.2, 2.0).normalize();
    this.scene.add(sunLight);

    // Planet sphere
    const geometry = new THREE.SphereGeometry(1, 48, 36);
    this.material = new THREE.MeshStandardMaterial({
      roughness: 0.88,
      metalness: 0.05,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.loader = new THREE.TextureLoader();
    this.setBody('moon');
  }

  setBody(bodyKey) {
    const body = (bodyKey || 'moon').toLowerCase();
    this.currentBody = body;
    const relPath = TEXTURES[body] || TEXTURES.moon;
    const fullUrl = this.staticUrl + relPath;

    if (this.textureCache[body]) {
      this.material.map = this.textureCache[body];
      this.material.needsUpdate = true;
    } else {
      this.loader.load(fullUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.textureCache[body] = tex;
        if (this.currentBody === body) {
          this.material.map = tex;
          this.material.needsUpdate = true;
        }
      });
    }

    // Slightly different axial tilts for variety
    if (body === 'mars') {
      this.mesh.rotation.z = (25.19 * Math.PI) / 180;
    } else {
      this.mesh.rotation.z = (1.54 * Math.PI) / 180;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.#tick();
  }

  stop() {
    this.running = false;
  }

  #tick = () => {
    if (!this.running) return;
    this.mesh.rotation.y += 0.0035;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.#tick);
  };
}
