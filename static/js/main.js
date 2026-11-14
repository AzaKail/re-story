import { MuseumScene, webglAvailable } from './scene.js';
import { BODIES, FOCUS_ORDER } from './bodies.js';

const container = document.getElementById('scene');
const loader = document.getElementById('loader');
const nameEl = document.getElementById('body-name');
const toast = document.getElementById('toast');
const buttons = [...document.querySelectorAll('[data-body]')];

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 6000);
}

function showFallback() {
  document.getElementById('fallback').hidden = false;
  loader.classList.add('done');
}

function setActive(key) {
  for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.body === key));
  nameEl.textContent = BODIES[key].name;
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
}

function start() {
  if (!webglAvailable()) return showFallback();

  let museum;
  try {
    museum = new MuseumScene(container, {
      staticUrl: document.body.dataset.static,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      onError: showToast,
    });
  } catch (err) {
    console.error(err);
    return showFallback();
  }

  const fromHash = location.hash.slice(1);
  const initial = FOCUS_ORDER.includes(fromHash) ? fromHash : FOCUS_ORDER[0];
  museum.focus(initial, { instant: true });
  setActive(initial);

  for (const b of buttons) {
    b.addEventListener('click', () => {
      const key = b.dataset.body;
      if (key === museum.current) return;
      museum.focus(key);
      setActive(key);
    });
  }

  requestAnimationFrame(() => loader.classList.add('done'));
}

start();
