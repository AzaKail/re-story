import * as THREE from 'three';
import { latLonToVector3 } from './geo.js';

// ===================== EDIT HERE =====================
// Hidden two-line neon message on the Moon.
// Show / hide it: hold Shift and S, then press 9 (top row or numpad).
export const MOON_MESSAGE = {
  lines: ['HELLO FROM RESTORY', 'NASA SPACE APPS 2026'],   // the two lines
  latitude: 20,          // where on the Moon, degrees (north is positive)
  longitude: 0,          // degrees (east is positive)
  width: 0.9,            // width of the message, in Moon radii
  hover: 0.12,           // height above the surface, in Moon radii (it floats like a hologram)
  color: '#1e90ff',      // neon blue glow
};
// =====================================================

const CANVAS_W = 2048;
const CANVAS_H = 640;
const Z_AXIS_FLAT = new THREE.Vector3(0, 1, 0);

// Draws the two lines with a neon glow on a transparent canvas.
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
    ctx.fillStyle = '#8fe3ff';
    ctx.fillText(text, CANVAS_W / 2, y);
  });
  return canvas;
}


export function createMoonMessage(radius, config = MOON_MESSAGE) {
  const texture = new THREE.CanvasTexture(drawMessage(config));
  texture.colorSpace = THREE.SRGBColorSpace;
  const width = radius * config.width;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * (CANVAS_H / CANVAS_W)),
    new THREE.MeshBasicMaterial({
      map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }),
  );
  const normal = latLonToVector3(config.latitude, config.longitude, 1).normalize();
  const north = Z_AXIS_FLAT.clone().addScaledVector(normal, -normal.dot(Z_AXIS_FLAT));
  if (north.lengthSq() < 1e-6) north.set(1, 0, 0);
  north.normalize();
  const east = north.clone().cross(normal);
  mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, normal));
  mesh.position.copy(normal).multiplyScalar(radius * (1 + config.hover));
  mesh.userData.normal = normal;   // local direction, used to turn the camera towards the message
  return mesh;
}

export function disposeMoonMessage(mesh) {
  mesh.removeFromParent();
  mesh.geometry.dispose();
  mesh.material.map?.dispose();
  mesh.material.dispose();
}
