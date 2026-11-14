// Scene configuration for each body.
// Sizes keep real proportions (Moon = 1); distances are "museum" values, not real ones.

export const BODIES = {
  moon: {
    name: 'Moon',
    radius: 1,
    position: [0, 0, 0],
    texture: 'textures/moon_2k.jpg',
    fallbackColor: 0x8c8c8c,
    focus: true,
  },
  mars: {
    name: 'Mars',
    radius: 1.95,
    position: [34, 0, -6],
    texture: 'textures/mars_2k.jpg',
    fallbackColor: 0x9c5a3c,
    focus: true,
  },
  earth: {
    name: 'Earth',
    radius: 3.67,
    position: [-24, 3, -50],
    texture: 'textures/earth_2k.jpg',
    fallbackColor: 0x2a4a7a,
    focus: false,
  },
};

export const SUN = {
  position: [90, 30, 70],
  radius: 6,
};

export const FOCUS_ORDER = ['moon', 'mars'];
