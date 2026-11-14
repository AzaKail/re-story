import { MuseumScene, webglAvailable } from './scene.js';
import { FOCUS_ORDER } from './bodies.js';
import { t, getLang, setLang, applyTranslations } from './i18n.js';

const container = document.getElementById('scene');
const loader = document.getElementById('loader');
const nameEl = document.getElementById('body-name');
const toast = document.getElementById('toast');
const bodyButtons = [...document.querySelectorAll('[data-body]')];
const langButtons = [...document.querySelectorAll('[data-lang]')];
const credits = document.getElementById('credits');

let currentBody = null;

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

function setActiveBody(key) {
  currentBody = key;
  for (const b of bodyButtons) b.setAttribute('aria-pressed', String(b.dataset.body === key));
  nameEl.textContent = t(`body.${key}`);
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
}

function initLanguage() {
  const mark = () => {
    for (const b of langButtons) b.setAttribute('aria-pressed', String(b.dataset.lang === getLang()));
  };
  applyTranslations();
  mark();
  for (const b of langButtons) b.addEventListener('click', () => setLang(b.dataset.lang));
  window.addEventListener('langchange', () => {
    mark();
    if (currentBody) nameEl.textContent = t(`body.${currentBody}`);
  });
}

// Sources pop up on hover/focus (CSS); on touch screens a tap toggles them.
function initCredits() {
  const button = credits.querySelector('button');
  button.addEventListener('click', () => {
    const open = credits.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!credits.contains(e.target)) {
      credits.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      credits.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });
}

function start() {
  initLanguage();
  initCredits();

  if (!webglAvailable()) return showFallback();

  let museum;
  try {
    museum = new MuseumScene(container, {
      staticUrl: document.body.dataset.static,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      onError: ({ body }) => showToast(t('error.texture', { body: t(`body.${body}`) })),
    });
  } catch (err) {
    console.error(err);
    return showFallback();
  }

  const fromHash = location.hash.slice(1);
  const initial = FOCUS_ORDER.includes(fromHash) ? fromHash : FOCUS_ORDER[0];
  museum.focus(initial, { instant: true });
  setActiveBody(initial);

  for (const b of bodyButtons) {
    b.addEventListener('click', () => {
      const key = b.dataset.body;
      if (key === museum.current) return;
      museum.focus(key);
      setActiveBody(key);
    });
  }

  requestAnimationFrame(() => loader.classList.add('done'));
}

start();
