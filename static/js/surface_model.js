import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Largest side of a model, in body radii. Models are enlarged so they can be seen and turned:
// they are not to scale with the planet.
const MODEL_SIZE_FACTOR = 0.08;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Shows one NASA 3D model at a time on the surface, in place of its orange marker.
// The model is loaded only when the camera comes to its object and is freed when it leaves.
export class SurfaceModel {
  constructor(staticUrl) {
    this.staticUrl = staticUrl;
    this.loader = null;
    this.active = null;     // { entry, pivot }
    this.requestId = 0;     // ignores loads that finish after the visitor moved on
  }

  // entry: marker record from MuseumScene ({ marker, model: { url, keep_below } }).
  async show(entry, bodyRadius) {
    if (this.active?.entry === entry) return;
    this.hide();
    const requestId = ++this.requestId;
    const gltf = await this.#getLoader().loadAsync(this.staticUrl + entry.model.url);
    if (requestId !== this.requestId) {
      disposeObject(gltf.scene);
      return;
    }
    const pivot = buildPivot(gltf.scene, entry.model, bodyRadius);
    // Stand on the surface: the model's up axis follows the surface normal at the marker.
    pivot.position.copy(entry.marker.position);
    pivot.quaternion.setFromUnitVectors(Y_AXIS, entry.marker.position.clone().normalize());
    entry.marker.parent.add(pivot);   // the spinning body mesh, like the marker
    entry.marker.visible = false;
    this.active = { entry, pivot };
  }

  // Height of the shown model above the surface (scene units), or 0.
  heightOf(entry) {
    return this.active?.entry === entry ? this.active.pivot.userData.height : 0;
  }

  hide() {
    this.requestId += 1;
    if (!this.active) return;
    const { entry, pivot } = this.active;
    pivot.removeFromParent();
    disposeObject(pivot);
    entry.marker.visible = true;
    this.active = null;
  }

  #getLoader() {
    if (!this.loader) {
      const draco = new DRACOLoader();
      draco.setDecoderPath(`${this.staticUrl}vendor/three/draco/`);
      this.loader = new GLTFLoader();
      this.loader.setDRACOLoader(draco);
    }
    return this.loader;
  }
}

// Centres the model on its footprint, puts its lowest point at the surface and scales it.
// model.keep_below (0..1) hides parts whose centre is above that share of the height:
// for Apollo only the descent stage stayed on the Moon, the ascent stage flew away.
function buildPivot(scene, model, bodyRadius) {
  scene.updateMatrixWorld(true);
  const partBox = new THREE.Box3();
  const partCenter = new THREE.Vector3();

  if (model.keep_below) {
    const full = new THREE.Box3().setFromObject(scene);
    const limit = full.min.y + (full.max.y - full.min.y) * model.keep_below;
    scene.traverse((obj) => {
      if (obj.isMesh && partBox.setFromObject(obj).getCenter(partCenter).y > limit) obj.visible = false;
    });
  }

  const box = new THREE.Box3();
  scene.traverse((obj) => {
    if (obj.isMesh && obj.visible) box.union(partBox.setFromObject(obj));
  });
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  scene.position.set(-center.x, -box.min.y, -center.z);

  const pivot = new THREE.Group();
  pivot.add(scene);
  const scale = (bodyRadius * MODEL_SIZE_FACTOR) / Math.max(size.x, size.y, size.z);
  pivot.scale.setScalar(scale);
  pivot.userData.height = size.y * scale;   // used to place the plaque above the model
  return pivot;
}

function disposeObject(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
}
