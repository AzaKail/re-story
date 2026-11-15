import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createModelLoader, buildPivot, disposeObject } from './surface_model.js';
import { t } from './i18n.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const VIEW_DIRECTION = new THREE.Vector3(1.5, 0.6, 1.9).normalize();   // slightly from above and the side

// Дисплей показывать
function showUnsupported(stage) {
  stage.classList.remove('is-loading');
  stage.classList.add('museum-model-off');
  const note = document.createElement('p');
  note.textContent = t('museum.model_unsupported');
  stage.replaceChildren(note);
}

export class ModelViewer {
  constructor(staticUrl) {
    this.staticUrl = staticUrl;
    this.loader = null;
    this.active = null;
    this.requestId = 0;
  }

  // stage
  async mount(stage, model) {
    this.unmount();
    const requestId = ++this.requestId;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.error(err);
      showUnsupported(stage);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.append(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3550, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(3, 4, 5);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;   // the mouse wheel keeps scrolling the page
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.2;

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    this.active = { stage, renderer, scene, controls, observer };

    try {
      const gltf = await this.#getLoader().loadAsync(this.staticUrl + model.url);
      if (requestId !== this.requestId) {
        disposeObject(gltf.scene);
        return;
      }
      const pivot = buildPivot(gltf.scene, model, 1);   // largest side = 1
      scene.add(pivot);
      // Надо починить чуть камеру, чтобы она смотрела на центр модели и была на правильном расстоянии
      pivot.updateMatrixWorld(true);
      const box = new THREE.Box3();
      const part = new THREE.Box3();
      pivot.traverse((obj) => {
        if (obj.isMesh && obj.visible) box.union(part.setFromObject(obj));
      });
      // Вертится по х у коорде
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfWidth = Math.hypot(size.x, size.z) / 2;
      const distance = Math.max(size.y / 2 / tanHalf, halfWidth / (tanHalf * camera.aspect)) * 1.12 + halfWidth * 0.5;
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance);
      controls.update();
      stage.classList.remove('is-loading');
      renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
      });
    } catch (err) {
      console.error(err);
      if (requestId === this.requestId) {
        this.unmount();
        showUnsupported(stage);   // a short note instead of an empty box
      }
    }
  }

  unmount() {
    this.requestId += 1;
    if (!this.active) return;
    const { renderer, scene, controls, observer } = this.active;
    renderer.setAnimationLoop(null);
    observer.disconnect();
    controls.dispose();
    disposeObject(scene);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    this.active = null;
  }

  #getLoader() {
    if (!this.loader) this.loader = createModelLoader(this.staticUrl);
    return this.loader;
  }
}
