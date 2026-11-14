import * as THREE from 'three';

// Converts planetocentric latitude/longitude (degrees, east-positive)
// to a point on a sphere textured with an equirectangular map
// (longitude -180 on the left edge, 0 in the middle), as three.js SphereGeometry lays it out.
export function latLonToVector3(latDeg, lonDeg, radius) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon),
  );
}
