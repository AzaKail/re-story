import * as THREE from 'three';
import { latLonToVector3 } from './geo.js';


export const MOON_MESSAGE = {
  lines: ['Sanya Is', 'Happy'],   // the two lines
  latitude: 20,          // 
  longitude: 0,          // 
  width: 1.1,            // 
  lift: 0.003,
  color: '#3fc8ff',      
};
// =====================================================


const CANVAS_W = 2048;
const CANVAS_H = 640;
const Z_AXIS_FLAT = new THREE.Vector3(0, 1, 0);


function drawMessage({ lines, color }) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineHeight = CANVAS_H / 2;
  lines.slice(0, 2).forEach((text, i) => {
    const y = lineHeight * (i + 0.5);
    let size = 190;
    ctx.font = `800 ${size}px system-ui, "Segoe UI", sans-serif`;
    while (ctx.measureText(text).width > CANVAS_W * 0.92 && size > 40) {
      size -= 6;
      ctx.font = `800 ${size}px system-ui, "Segoe UI", sans-serif`;
    }
    ctx.shadowColor = color;
    for (const blur of [60, 30, 12]) {   
      ctx.shadowBlur = blur;
      ctx.fillStyle = color;
      ctx.fillText(text, CANVAS_W / 2, y);
    }
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#e8fbff';           
    ctx.fillText(text, CANVAS_W / 2, y);
  });
  return canvas;
}


export function createMoonMessage(radius, config = MOON_MESSAGE) {
  const texture = new THREE.CanvasTexture(drawMessage(config));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const width = radius * config.width;
  // A finely divided plane bent onto the sphere, so the text lies on the Moon's surface.
  const geometry = new THREE.PlaneGeometry(width, width * (CANVAS_H / CANVAS_W), 96, 32);
  const normal = latLonToVector3(config.latitude, config.longitude, 1).normalize();
  const north = Z_AXIS_FLAT.clone().addScaledVector(normal, -normal.dot(Z_AXIS_FLAT));
  if (north.lengthSq() < 1e-6) north.set(1, 0, 0);
  north.normalize();
  const east = north.clone().cross(normal);
  const pos = geometry.attributes.position;
  const point = new THREE.Vector3();
  const surface = radius * (1 + (config.lift ?? 0.003));
  for (let i = 0; i < pos.count; i += 1) {
    point.copy(normal).multiplyScalar(radius)
      .addScaledVector(east, pos.getX(i))
      .addScaledVector(north, pos.getY(i))
      .setLength(surface);
    pos.setXYZ(i, point.x, point.y, point.z);
  }
  pos.needsUpdate = true;
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  mesh.renderOrder = 2;
  mesh.userData.normal = normal;
  return mesh;
}

export function disposeMoonMessage(mesh) {
  mesh.removeFromParent();
  mesh.geometry.dispose();
  mesh.material.map?.dispose();
  mesh.material.dispose();
}
