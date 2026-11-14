// Scene configuration.
// Sizes of the main bodies keep real proportions (Moon = 1); distances are "museum" values, not real ones.
//
// Textures: `base` loads first (fast start), `detail` is loaded in the background for the body
// the visitor is looking at. The largest size the device supports is used (see scene.js).

export const BODIES = {
  moon: {
    name: 'Moon',
    radius: 1,
    position: [0, 0, 0],
    texture: {
      base: 'textures/moon_2k.jpg',
      detail: { 4096: 'textures/moon_4k.jpg', 8192: 'textures/moon_8k.jpg' },
    },
    fallbackColor: 0x8c8c8c,
    segments: [128, 64],
    focus: true,
  },
  mars: {
    name: 'Mars',
    radius: 1.95,
    position: [140, 0, -60],
    texture: {
      base: 'textures/mars_2k.jpg',
      detail: { 4096: 'textures/mars_4k.jpg', 8192: 'textures/mars_8k.jpg' },
    },
    fallbackColor: 0x9c5a3c,
    segments: [128, 64],
    focus: true,
  },
  earth: {
    name: 'Earth',
    radius: 3.67,
    position: [24, -6, -52],
    texture: { base: 'textures/earth_2k.jpg' },
    fallbackColor: 0x2a4a7a,
    segments: [64, 32],
    focus: false,
  },
};

export const SUN = {
  position: [400, 110, 330],
  radius: 22,
};

// Distant planets: flat NASA photos (sprites) that always face the camera.
// width is in scene units; the height follows the image aspect ratio.
export const BACKDROP_PLANETS = [
  { key: 'mercury', image: 'textures/planets/mercury.png', position: [-120, -150, -640], width: 12 },
  { key: 'venus', image: 'textures/planets/venus.png', position: [240, 160, -620], width: 22 },
  { key: 'jupiter', image: 'textures/planets/jupiter.png', position: [-330, 230, -700], width: 70 },
  { key: 'saturn', image: 'textures/planets/saturn.png', position: [500, 40, -800], width: 130 },
  { key: 'uranus', image: 'textures/planets/uranus.png', position: [-540, -60, -820], width: 30 },
  { key: 'neptune', image: 'textures/planets/neptune.png', position: [660, 170, -880], width: 28 },
];

export const FOCUS_ORDER = ['moon', 'mars'];
