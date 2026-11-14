import * as THREE from 'three';

const IDENTITY = new THREE.Quaternion();
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// One animated camera move from the current view to `to` ({ position, target }).
// Around the same body the camera follows an arc (quaternion slerp), so it never cuts
// through the sphere. Between bodies it follows a straight line with a gentle lift.
// `done` resolves when the move is finished.
export class CameraFlight {
  constructor({ camera, controls, to, durationMs }) {
    this.camera = camera;
    this.controls = controls;
    this.durationMs = durationMs;
    this.start = performance.now();
    this.fromPos = camera.position.clone();
    this.fromTarget = controls.target.clone();
    this.toPos = to.position.clone();
    this.toTarget = to.target.clone();
    this.orbit = this.fromTarget.distanceTo(this.toTarget) < 1e-6 ? this.#orbitPath() : null;
    this.lift = this.orbit ? 0 : this.fromPos.distanceTo(this.toPos) * 0.15;
    this.done = new Promise((resolve) => { this.resolve = resolve; });
  }

  // Returns true when the flight has finished.
  update(now) {
    const t = Math.min(1, (now - this.start) / this.durationMs);
    const k = easeInOutCubic(t);
    if (this.orbit) this.#stepOrbit(k);
    else this.#stepLine(k);
    this.camera.lookAt(this.controls.target);
    if (t < 1) return false;
    this.resolve();
    return true;
  }

  #orbitPath() {
    const center = this.toTarget.clone();
    const from = this.fromPos.clone().sub(center);
    const to = this.toPos.clone().sub(center);
    const fromDir = from.clone().normalize();
    return {
      center,
      fromDir,
      fromDist: from.length(),
      toDist: to.length(),
      rotation: new THREE.Quaternion().setFromUnitVectors(fromDir, to.normalize()),
    };
  }

  #stepOrbit(k) {
    const o = this.orbit;
    const q = new THREE.Quaternion().slerpQuaternions(IDENTITY, o.rotation, k);
    const dist = THREE.MathUtils.lerp(o.fromDist, o.toDist, k);
    this.camera.position.copy(o.center).addScaledVector(o.fromDir.clone().applyQuaternion(q), dist);
    this.controls.target.copy(o.center);
  }

  #stepLine(k) {
    const arc = Math.sin(Math.PI * k) * this.lift;
    this.camera.position.lerpVectors(this.fromPos, this.toPos, k);
    this.camera.position.y += arc;
    this.camera.position.z += arc;
    this.controls.target.lerpVectors(this.fromTarget, this.toTarget, k);
  }
}
