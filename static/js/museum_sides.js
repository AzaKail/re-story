

import { t, getLang } from './i18n.js';
import { localizeArtifact, hasSurfacePosition } from './artifacts.js';

const TEX_W = 2048;
const TEX_H = 1024;
const SPEED = 5;            // degrees per second
const FRAME_MS = 1000 / 30;
const LIGHT = normalize([-0.45, 0.35, 0.82]);
const TEXTURES = { moon: 'textures/moon_2k.jpg', mars: 'textures/mars_2k.jpg' };
const FALLBACK = { moon: [140, 140, 140], mars: [156, 90, 60] };
const SIDE_BODIES = ['moon', 'mars'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const textureCache = new Map();   // body -> Promise<Uint8ClampedArray | null>

function normalize(v) {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
}

function loadTexture(staticUrl, body) {
  if (!textureCache.has(body)) {
    textureCache.set(body, new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = TEX_W;
        c.height = TEX_H;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, TEX_W, TEX_H);
        resolve(ctx.getImageData(0, 0, TEX_W, TEX_H).data);
      };
      img.onerror = () => resolve(null);   // plain coloured disc instead
      img.src = staticUrl + TEXTURES[body];
    }));
  }
  return textureCache.get(body);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// Automatically determines the optimal diameter of the globe.
// On phones it scales proportionally with the viewport width and height,
// ensuring the globe never clips or overflows on any device.
function getAdaptiveGlobeSize() {
  const width = window.innerWidth || document.documentElement?.clientWidth || 360;
  const height = window.innerHeight || document.documentElement?.clientHeight || 640;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isPhone = width <= 768 || (isTouch && Math.min(width, height) <= 768);

  if (isPhone) {
    if (height < 500 && width > height) {
      return Math.max(90, Math.min(140, Math.round(height * 0.38)));
    }
    if (width <= 400) {
      return Math.max(110, Math.min(140, Math.round(width * 0.36)));
    }
    return Math.max(120, Math.min(160, Math.round(width * 0.38)));
  }
  if (width <= 1100) {
    return 160;
  }
  return 180;
}

// One turning globe on a canvas, with clickable dots on top.
// Can be rotated by dragging with mouse or touch.
class FlatGlobe {
  constructor(body, staticUrl, onPick, onHover = null) {
    this.body = body;
    this.onPick = onPick;
    this.onHover = onHover;
    this.root = el('div', 'side-globe');
    this.canvas = el('canvas', 'side-globe-canvas');
    this.dots = el('div', 'side-globe-dots');
    this.root.append(this.canvas, this.dots);
    this.ctx = this.canvas.getContext('2d');
    this.rotation = 0;         // longitude at the centre of the disc, degrees
    this.markers = [];
    this.texture = null;
    this.size = 0;
    this.paused = false;
    this.dragged = false;

    this.updateSize();
    this.#initInteractions();

    loadTexture(staticUrl, body).then((data) => {
      this.texture = data;
      this.draw();
    });
  }

  updateSize() {
    const adaptiveSize = getAdaptiveGlobeSize();
    this.root.style.width = `${adaptiveSize}px`;
    this.root.style.height = `${adaptiveSize}px`;
  }

  #initInteractions() {
    let dragging = false;
    let startX = 0;
    let startLon = 0;
    let idleTimer = null;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!dragging) this.paused = false;
      }, 3000);
    };

    this.root.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      this.dragged = false;
      startX = e.clientX;
      startLon = this.rotation;
      this.paused = true;
      this.root.classList.add('is-dragging');
      this.root.setPointerCapture(e.pointerId);
    });

    this.root.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        this.dragged = true;
      }
      const cssWidth = this.root.clientWidth || getAdaptiveGlobeSize();
      const sensitivity = 180 / cssWidth;
      this.rotation = startLon - dx * sensitivity;
      this.draw();
      resetIdle();
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      this.root.classList.remove('is-dragging');
      try {
        if (this.root.hasPointerCapture(e.pointerId)) {
          this.root.releasePointerCapture(e.pointerId);
        }
      } catch { }

      setTimeout(() => {
        this.dragged = false;
      }, 60);

      resetIdle();
    };

    this.root.addEventListener('pointerup', endDrag);
    this.root.addEventListener('pointercancel', endDrag);

    this.root.addEventListener('pointerenter', () => {
      if (!dragging) this.paused = true;
    });

    this.root.addEventListener('pointerleave', () => {
      if (!dragging) {
        clearTimeout(idleTimer);
        this.paused = false;
      }
    });
  }

  // Precomputes, for every pixel inside the disc, its latitude row, longitude offset and light.
  #layout() {
    this.updateSize();
    const css = this.root.clientWidth || getAdaptiveGlobeSize();
    if (!css) return false;
    const size = Math.round(css * Math.min(window.devicePixelRatio || 1, 2));
    if (size === this.size && this.pixels) return true;
    this.size = size;
    this.canvas.width = size;
    this.canvas.height = size;
    this.image = this.ctx.createImageData(size, size);
    const pixels = [];
    for (let y = 0; y < size; y += 1) {
      const ny = 1 - ((y + 0.5) / size) * 2;
      for (let x = 0; x < size; x += 1) {
        const nx = ((x + 0.5) / size) * 2 - 1;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        const lat = Math.asin(ny);
        const row = Math.min(TEX_H - 1, Math.max(0, Math.floor((0.5 - lat / Math.PI) * TEX_H)));
        const lonCols = (Math.atan2(nx, nz) / (2 * Math.PI)) * TEX_W;
        const light = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
        const shade = 0.28 + 0.9 * light;
        const edge = Math.min(1, (1 - Math.sqrt(r2)) * size * 0.5);   // soft rim
        pixels.push((y * size + x) * 4, row * TEX_W, lonCols, shade, edge);
      }
    }
    this.pixels = Float64Array.from(pixels);
    return true;
  }

  isVisible() {
    return Boolean(this.root.offsetWidth || this.root.offsetHeight || (this.root.getClientRects && this.root.getClientRects().length));
  }

  resize() {
    this.updateSize();
    if (this.#layout()) {
      this.draw();
    }
  }

  draw() {
    if (!this.#layout()) return;
    const out = this.image.data;
    const tex = this.texture;
    const base = FALLBACK[this.body];
    const normLon = ((this.rotation % 360) + 360) % 360;
    const centerCol = ((normLon + 180) / 360) * TEX_W;
    const p = this.pixels;
    for (let i = 0; i < p.length; i += 5) {
      const o = p[i];
      const shade = p[i + 3];
      let r = base[0];
      let g = base[1];
      let b = base[2];
      if (tex) {
        let col = Math.floor(centerCol + p[i + 2]) % TEX_W;
        if (col < 0) col += TEX_W;
        const ti = (p[i + 1] + col) * 4;
        r = tex[ti];
        g = tex[ti + 1];
        b = tex[ti + 2];
      }
      out[o] = r * shade;
      out[o + 1] = g * shade;
      out[o + 2] = b * shade;
      out[o + 3] = 255 * p[i + 4];
    }
    this.ctx.putImageData(this.image, 0, 0);
    this.#placeDots();
  }

  setMarkers(artifacts) {
    this.dots.replaceChildren();
    this.markers = artifacts.map((a) => {
      const dot = el('button', 'side-globe-dot');
      dot.type = 'button';
      dot.dataset.code = a.code;
      dot.addEventListener('click', (e) => {
        if (this.dragged) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        this.onPick(a.code);
      });
      dot.addEventListener('pointerenter', () => this.onHover?.(a.code));
      dot.addEventListener('pointerleave', () => this.onHover?.(null));
      this.dots.append(dot);
      return { code: a.code, lat: (a.latitude * Math.PI) / 180, lon: a.longitude, dot };
    });
  }

  setHighlighted(code) {
    for (const m of this.markers) {
      m.dot.classList.toggle('is-highlighted', m.code === code);
    }
  }

  setNames(nameOf) {
    for (const m of this.markers) {
      const name = nameOf(m.code);
      m.dot.title = name;
      m.dot.setAttribute('aria-label', name);
    }
  }

  setCurrent(code) {
    for (const m of this.markers) m.dot.classList.toggle('is-current', m.code === code);
  }

  turnTo(lon) {
    this.rotation = lon;
    this.draw();
  }

  #placeDots() {
    for (const m of this.markers) {
      const d = ((m.lon - this.rotation) * Math.PI) / 180;
      const x = Math.cos(m.lat) * Math.sin(d);
      const y = Math.sin(m.lat);
      const z = Math.cos(m.lat) * Math.cos(d);
      const visible = z > 0.08;
      m.dot.hidden = !visible;
      if (visible) {
        m.dot.style.left = `${((x + 1) / 2) * 100}%`;
        m.dot.style.top = `${((1 - y) / 2) * 100}%`;
      }
    }
  }

  step(dt) {
    if (this.paused || reducedMotion) return;
    this.rotation -= SPEED * dt;   // the surface moves from west to east, as seen from space
    this.draw();
  }
}

export class MuseumSides {
  // root: the museum layer; it contains [data-museum-side="moon"] and [data-museum-side="mars"].
  constructor(root, { staticUrl, onSelect }) {
    this.onSelect = onSelect;
    this.sides = {};
    this.globes = {};
    for (const body of SIDE_BODIES) {
      const side = root.querySelector(`[data-museum-side="${body}"]`);
      const title = el('h3', 'museum-side-title');
      const globe = new FlatGlobe(
        body,
        staticUrl,
        (code) => this.onSelect(code),
        (code) => this.highlightListItem(code)
      );
      const list = el('ul', 'museum-side-list');
      side.append(title, globe.root, list);
      this.sides[body] = { side, title, list };
      this.globes[body] = globe;
    }
    const right = this.sides.mars.side;
    this.beyondTitle = el('h3', 'museum-side-title museum-side-title-beyond');
    this.beyondList = el('ul', 'museum-side-list');
    right.append(this.beyondTitle, this.beyondList);
    this.artifacts = [];
    this.current = null;
    this.running = false;
    this.last = 0;

    const handleResize = () => {
      for (const globe of Object.values(this.globes)) {
        globe.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  // All artifacts of the catalog and the one being read.
  render(artifacts, currentCode) {
    const isNew = this.artifacts !== artifacts || !this.artifacts.length;
    this.artifacts = artifacts;
    if (isNew) {
      for (const body of SIDE_BODIES) {
        this.globes[body].setMarkers(artifacts.filter((a) => a.body === body && hasSurfacePosition(a)));
      }
      this.#fillTexts();
    }
    this.setCurrent(currentCode, { turn: true });
  }

  refreshLanguage() {
    if (this.artifacts.length) this.#fillTexts();
  }

  setCurrent(code, { turn = true } = {}) {
    this.current = code;
    for (const button of this.#allButtons()) {
      const isCurrent = button.dataset.code === code;
      button.setAttribute('aria-current', String(isCurrent));
      if (isCurrent) {
        button.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    const current = this.artifacts.find((a) => a.code === code);
    for (const body of SIDE_BODIES) {
      this.globes[body].setCurrent(code);
      if (turn && current?.body === body && hasSurfacePosition(current)) {
        this.globes[body].turnTo(current.longitude);
      } else {
        this.globes[body].draw();
      }
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    for (const globe of Object.values(this.globes)) {
      globe.resize();
    }
    const tick = (now) => {
      if (!this.running) return;
      if (now - this.last >= FRAME_MS) {
        const dt = Math.min(0.1, (now - this.last) / 1000);
        this.last = now;
        for (const globe of Object.values(this.globes)) {
          if (globe.isVisible()) globe.step(dt);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    for (const globe of Object.values(this.globes)) globe.draw();
  }

  stop() {
    this.running = false;
  }

  #fillTexts() {
    const lang = getLang();
    const nameOf = (code) => localizeArtifact(this.artifacts.find((a) => a.code === code), lang).name;
    for (const body of SIDE_BODIES) {
      const { title, list } = this.sides[body];
      title.textContent = t(`body.${body}`);
      this.#fillList(list, this.artifacts.filter((a) => a.body === body), lang);
      this.globes[body].setNames(nameOf);
    }
    this.beyondTitle.textContent = t('museum.side_beyond');
    this.#fillList(this.beyondList, this.artifacts.filter((a) => !SIDE_BODIES.includes(a.body)), lang);
    for (const button of this.#allButtons()) {
      button.setAttribute('aria-current', String(button.dataset.code === this.current));
    }
  }

  highlight(code) {
    for (const body of SIDE_BODIES) {
      this.globes[body].setHighlighted(code);
    }
  }

  highlightListItem(code) {
    for (const button of this.#allButtons()) {
      button.classList.toggle('is-hovered', Boolean(code && button.dataset.code === code));
    }
  }

  #fillList(list, artifacts, lang) {
    list.replaceChildren(...artifacts.map((a) => {
      const li = el('li');
      const button = el('button', 'museum-side-item', localizeArtifact(a, lang).name);
      button.type = 'button';
      button.dataset.code = a.code;
      button.addEventListener('click', () => this.onSelect(a.code));
      button.addEventListener('pointerenter', () => this.highlight(a.code));
      button.addEventListener('pointerleave', () => this.highlight(null));
      button.addEventListener('focus', () => this.highlight(a.code));
      button.addEventListener('blur', () => this.highlight(null));
      li.append(button);
      return li;
    }));
  }

  #allButtons() {
    return Object.values(this.sides).flatMap(({ list }) => [...list.querySelectorAll('[data-code]')])
      .concat([...this.beyondList.querySelectorAll('[data-code]')]);
  }
}
