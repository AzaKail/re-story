import { MuseumScene, webglAvailable } from './scene.js';
import { FOCUS_ORDER } from './bodies.js';
import { ARTIFACTS } from './artifacts.js';
import { ArtifactPanel } from './panel.js';
import { FocusBar } from './focusbar.js';
import { t, getLang, setLang, applyTranslations } from './i18n.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = window.matchMedia('(max-width: 600px)').matches;

// Fade timings for the 3D <-> museum transition (ms).
const FADE = reducedMotion
  ? { outDelay: 0, out: 150, in: 150 }
  : { outDelay: 650, out: 650, in: 500 };

const dom = {
  experience: document.getElementById('experience'),
  scene: document.getElementById('scene'),
  loader: document.getElementById('loader'),
  fade: document.getElementById('fade'),
  bodyName: document.getElementById('body-name'),
  toast: document.getElementById('toast'),
  museum: document.getElementById('museum'),
  museumTitle: document.getElementById('museum-title'),
  bodyButtons: [...document.querySelectorAll('[data-body]')],
  langButtons: [...document.querySelectorAll('[data-lang]')],
};

const state = { body: null, artifact: null, museumArtifact: null, busy: false };
let museum = null;
let panel = null;
let focusBar = null;

// ---------- Helpers ----------

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { dom.toast.hidden = true; }, 6000);
}

function showFallback() {
  document.getElementById('fallback').hidden = false;
  dom.loader.classList.add('done');
}

// Animates the black overlay; resolves when the animation ends.
function fadeTo(opacity, { duration, delay = 0 }) {
  const from = getComputedStyle(dom.fade).opacity;
  const animation = dom.fade.animate([{ opacity: from }, { opacity }], { duration, delay, fill: 'forwards', easing: 'ease-in-out' });
  return animation.finished;
}

function updateMuseumTitle() {
  dom.museumTitle.textContent = state.museumArtifact ? t(`artifact.${state.museumArtifact}`) : t('museum.title');
}

// Shows either the 3D experience or the museum. Only one of them is interactive at a time.
function setView(view) {
  const museumOpen = view === 'museum';
  dom.museum.hidden = !museumOpen;
  dom.experience.inert = museumOpen;
  document.body.classList.toggle('view-museum', museumOpen);
  museum.setRunning(!museumOpen);
}

// ---------- Actions ----------

function selectBody(key, { instant = false } = {}) {
  if (key === state.body || state.busy) return;
  closeArtifact({ moveCamera: false });
  state.body = key;
  museum.focus(key, { instant });
  for (const b of dom.bodyButtons) b.setAttribute('aria-pressed', String(b.dataset.body === key));
  dom.bodyName.textContent = t(`body.${key}`);
  panel.show(ARTIFACTS.filter((a) => a.body === key));
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
}

function selectArtifact(code) {
  if (state.busy || !museum.focusArtifact(code)) return;
  state.artifact = code;
  panel.setSelected(code);
  focusBar.show(code);
  document.body.classList.add('is-focused');
}

function closeArtifact({ moveCamera = true } = {}) {
  if (!state.artifact || state.busy) return;
  if (moveCamera) museum.clearArtifact();
  state.artifact = null;
  panel.setSelected(null);
  focusBar.hide();
  document.body.classList.remove('is-focused');
}

// "Learn more": dive into the artifact, fade to black, open the museum.
async function openMuseum(code) {
  if (state.busy) return;
  state.busy = true;
  document.body.classList.add('is-transitioning');
  await Promise.all([
    museum.diveIntoArtifact(),
    fadeTo(1, { duration: FADE.out, delay: FADE.outDelay }),
  ]);
  state.museumArtifact = code;
  updateMuseumTitle();
  setView('museum');
  dom.museum.scrollTop = 0;
  dom.museumTitle.focus({ preventScroll: true });
  await fadeTo(0, { duration: FADE.in });
  document.body.classList.remove('is-transitioning');
  state.busy = false;
}

// "3D version": fade out, show the scene again and rise back from the artifact.
async function backTo3D() {
  if (state.busy) return;
  state.busy = true;
  document.body.classList.add('is-transitioning');
  await fadeTo(1, { duration: FADE.in });
  setView('3d');
  const rise = museum.surfaceFromDive();
  await fadeTo(0, { duration: FADE.out });
  await rise;
  document.body.classList.remove('is-transitioning');
  state.busy = false;
}

// ---------- Init ----------

function initLanguage() {
  const markActive = () => {
    for (const b of dom.langButtons) b.setAttribute('aria-pressed', String(b.dataset.lang === getLang()));
  };
  applyTranslations();
  markActive();
  for (const b of dom.langButtons) b.addEventListener('click', () => setLang(b.dataset.lang));
  window.addEventListener('langchange', () => {
    markActive();
    if (state.body) dom.bodyName.textContent = t(`body.${state.body}`);
    panel?.refreshLanguage();
    focusBar?.refreshLanguage();
    updateMuseumTitle();
  });
}

function start() {
  initLanguage();
  updateMuseumTitle();

  if (!webglAvailable()) return showFallback();

  try {
    museum = new MuseumScene(dom.scene, {
      staticUrl: document.body.dataset.static,
      reducedMotion,
      onError: ({ body }) => showToast(t('error.texture', { body: t(`body.${body}`) })),
    });
  } catch (err) {
    console.error(err);
    return showFallback();
  }
  museum.addArtifacts(ARTIFACTS);

  panel = new ArtifactPanel(document.getElementById('panel'), { onSelect: selectArtifact });
  panel.setCollapsed(isPhone);
  focusBar = new FocusBar(document.getElementById('focusbar'), {
    onMore: openMuseum,
    onClose: () => closeArtifact(),
  });

  const fromHash = location.hash.slice(1);
  selectBody(FOCUS_ORDER.includes(fromHash) ? fromHash : FOCUS_ORDER[0], { instant: true });

  for (const b of dom.bodyButtons) b.addEventListener('click', () => selectBody(b.dataset.body));
  document.querySelector('[data-action="to-3d"]').addEventListener('click', backTo3D);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.body.classList.contains('view-museum')) closeArtifact();
  });

  requestAnimationFrame(() => dom.loader.classList.add('done'));
}

start();
