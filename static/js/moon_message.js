import * as THREE from 'three';
import { latLonToVector3 } from './geo.js';


export const MOON_MESSAGE = {
  lines: ['Думан:', 'У меня лучшаяя 3d печать', 'в г. Уральск'],
  latitude: 18,
  longitude: 0,
  width: 1.1,
  lift: 0.003,
  color: '#61c9f1',
};


const CANVAS_W = 2048;
const Z_AXIS_FLAT = new THREE.Vector3(0, 1, 0);


function getCanvasHeight(lineCount) {
  if (lineCount <= 1) return 420;
  if (lineCount === 2) return 640;
  return Math.min(1200, lineCount * 260);
}


function drawMessage({ lines, color }) {
  const lineList = (lines && lines.length) ? lines : [''];
  const count = lineList.length;
  const canvasH = getCanvasHeight(count);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = canvasH / count;
  const baseSize = Math.min(190, Math.floor(lineHeight * 0.68));

  lineList.forEach((text, i) => {
    const y = lineHeight * (i + 0.5);
    let size = baseSize;
    ctx.font = `800 ${size}px system-ui, "Segoe UI", sans-serif`;
    while (ctx.measureText(text).width > CANVAS_W * 0.92 && size > 30) {
      size -= 4;
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
  const canvas = drawMessage(config);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const width = radius * config.width;
  const height = width * (canvas.height / canvas.width);
  // A finely divided plane bent onto the sphere, so the text lies on the Moon's surface.
  const geometry = new THREE.PlaneGeometry(width, height, 96, 32);
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
