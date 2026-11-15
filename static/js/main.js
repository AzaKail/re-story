import { MuseumScene, webglAvailable } from './scene.js';
import { FOCUS_ORDER } from './bodies.js';
import { loadArtifacts, loadArtifactDetail, localizeArtifact } from './artifacts.js';
import { ArtifactPanel } from './panel.js';
import { FocusBar } from './focusbar.js';
import { TourCard } from './tour_card.js';
import { MuseumView, artifactTypeLabel, artifactPlace } from './museum.js';
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
  about: document.getElementById('about'),
  bodyButtons: [...document.querySelectorAll('[data-body]')],
  langButtons: [...document.querySelectorAll('[data-lang]')],
};

const state = { body: null, artifact: null, artifacts: [], busy: false, tourMode: 'off', cinematic: null };
let scene = null;
let panel = null;
let focusBar = null;
let tourCard = null;
let tourTimer = null;
let museumView = null;

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

// Animates the black curtain; resolves when the animation ends.
function fadeTo(opacity, { duration, delay = 0 }) {
  const from = getComputedStyle(dom.fade).opacity;
  return dom.fade.animate([{ opacity: from }, { opacity }], { duration, delay, fill: 'forwards', easing: 'ease-in-out' }).finished;
}

const findArtifact = (code) => state.artifacts.find((a) => a.code === code);
const artifactsOn = (body) => state.artifacts.filter((a) => a.body === body);
const artifactName = (code) => localizeArtifact(findArtifact(code), getLang())?.name || code;
const describeArtifact = (artifact) => ({
  name: localizeArtifact(artifact, getLang()).name,
  type: artifactTypeLabel(artifact.artifact_type),
  place: artifactPlace(artifact),
  hasModel: Boolean(artifact.model?.url),
});

// Shows one view: '3d', 'museum' or 'about'. Only the visible one is interactive,
// and the 3D scene renders only while it is on screen.
function setView(view) {
  dom.museum.hidden = view !== 'museum';
  dom.about.hidden = view !== 'about';
  dom.experience.inert = view !== '3d';
  document.body.dataset.view = view;
  scene.setRunning(view === '3d');
}

const currentView = () => document.body.dataset.view;

// Runs a transition once at a time and blocks the UI while it plays.
function withBusy(task) {
  return async (...args) => {
    if (state.busy) return;
    state.busy = true;
    document.body.classList.add('is-transitioning');
    try {
      await task(...args);
    } catch (err) {
      console.error(err);
      showToast(t('error.catalog'));
    } finally {
      document.body.classList.remove('is-transitioning');
      state.busy = false;
    }
  };
}

// ---------- Actions ----------

// Automatic tour: 'off', '1x' (15 s per object) or '2x' (5 s per object).
// Shows the current mode on the tour button: state, speed badge and an explaining tooltip.
function renderTourButton() {
  const mode = state.tourMode;
  const toggle = document.querySelector('[data-tour-toggle]');
  const badge = document.querySelector('[data-tour-speed]');
  if (toggle) {
    const hint = t(`tour.mode.${mode}`);
    toggle.dataset.tourState = mode;
    toggle.setAttribute('aria-pressed', String(mode !== 'off'));
    toggle.title = hint;
    toggle.setAttribute('aria-label', hint);
  }
  if (badge) {
    badge.hidden = mode === 'off';
    badge.textContent = mode;
  }
}

function setTourMode(mode) {
  state.tourMode = mode;
  renderTourButton();
  document.body.classList.toggle('is-tour-active', mode !== 'off');
  clearTimeout(tourTimer);
  if (mode === 'off') return;
  if (state.artifact) scheduleNextTourStep();
  else {
    const list = artifactsOn(state.body);
    if (list.length) selectArtifact(list[0].code);
  }
}

// Hidden showcase for recording GIFs: keys 1 / 2 make the camera circle the Moon / Mars
// slowly with the interface hidden. Esc, 0 or the same key again stops it.
async function startCinematic(key) {
  if (state.busy || currentView() !== '3d') return;
  if (state.cinematic === key) return stopCinematic();
  setTourMode('off');
  closeArtifact({ moveCamera: false });
  state.cinematic = key;
  document.body.classList.add('is-cinematic');
  if (key === state.body) await scene.focus(key);
  else await selectBody(key);
  if (state.cinematic === key) scene.startShowcase();
}

function stopCinematic() {
  if (!state.cinematic) return;
  state.cinematic = null;
  scene.stopShowcase();
  document.body.classList.remove('is-cinematic');
}

function selectBody(key, { instant = false } = {}) {
  if (key === state.body || state.busy) return Promise.resolve();
  closeArtifact({ moveCamera: false });
  tourCard?.hide();
  state.body = key;
  const flight = scene.focus(key, { instant });
  for (const b of dom.bodyButtons) b.setAttribute('aria-pressed', String(b.dataset.body === key));
  dom.bodyName.textContent = t(`body.${key}`);
  panel.show(artifactsOn(key));
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
  return flight;
}

function scheduleNextTourStep() {
  clearTimeout(tourTimer);
  if (state.tourMode === 'off') return;
  const interval = state.tourMode === '2x' ? 5000 : 15000;
  tourTimer = setTimeout(() => {
    if (state.tourMode !== 'off' && currentView() === '3d') {
      stepTour();
    }
  }, interval);
}

async function stepTour() {
  if (state.tourMode === 'off' || state.busy) return;
  const currentList = artifactsOn(state.body);
  const currentIndex = currentList.findIndex((a) => a.code === state.artifact);
  const nextIndex = currentIndex + 1;

  if (nextIndex < currentList.length) {
    await selectArtifact(currentList[nextIndex].code);
  } else {
    const currentBodyIndex = FOCUS_ORDER.indexOf(state.body);
    const nextBodyKey = FOCUS_ORDER[(currentBodyIndex + 1) % FOCUS_ORDER.length];
    await selectBody(nextBodyKey);
    await new Promise((r) => setTimeout(r, 900));
    const nextList = artifactsOn(nextBodyKey);
    if (nextList.length && state.tourMode !== 'off') {
      await selectArtifact(nextList[0].code);
    }
  }
}

function markSelected(code) {
  state.artifact = code;
  panel.setSelected(code);
  focusBar.hide();
  document.body.classList.add('is-focused');
  loadArtifactDetail(code).catch(() => {});
}

async function selectArtifact(code) {
  if (state.busy) return;
  const flight = scene.focusArtifact(code);
  if (!flight) return;
  markSelected(code);
  if (isPhone) panel.setCollapsed(true);   // on a phone the list would cover the object

  focusBar.hide();
  tourCard.hide();
  clearTimeout(tourTimer);
  await flight;
  if (state.artifact === code) {
    const pos = scene.getArtifactScreenPosition(code);
    tourCard.show(findArtifact(code), pos);
    if (state.tourMode !== 'off') {
      scheduleNextTourStep();
    }
  }
}

function closeArtifact({ moveCamera = true } = {}) {
  if (!state.artifact || state.busy) return;
  clearTimeout(tourTimer);
  if (moveCamera) scene.clearArtifact();
  state.artifact = null;
  panel.setSelected(null);
  focusBar.hide();
  tourCard.hide();
  document.body.classList.remove('is-focused');
}

async function showInMuseum(code) {
  const detail = await loadArtifactDetail(code);
  museumView.render(detail, artifactsOn(detail.body).filter((a) => a.code !== code));
}

// "Learn more": dive into the artifact, fade to black, open its museum page.
const openMuseum = withBusy(async (code) => {
  clearTimeout(tourTimer);
  const detail = loadArtifactDetail(code);   // usually already prefetched
  try {
    await Promise.all([scene.diveIntoArtifact(), fadeTo(1, { duration: FADE.out, delay: FADE.outDelay }), detail]);
    await showInMuseum(code);
  } catch (err) {
    // Could not load the page: come back up instead of leaving the visitor in the dark.
    await scene.surfaceFromDive();
    await fadeTo(0, { duration: FADE.in });
    throw err;
  }
  setView('museum');
  dom.museum.querySelector('[data-museum-title]').focus({ preventScroll: true });
  await fadeTo(0, { duration: FADE.in });
});

// Another artifact picked inside the museum: switch the page; the camera will rise next to it later.
async function switchMuseumArtifact(code) {
  if (scene.setFocusedArtifact(code)) markSelected(code);
  try {
    await showInMuseum(code);
  } catch (err) {
    console.error(err);
    showToast(t('error.catalog'));
  }
}

// "3D version": fade out, show the scene again and rise back from the artifact.
const backTo3D = withBusy(async () => {
  await fadeTo(1, { duration: FADE.in });
  setView('3d');
  const rise = scene.surfaceFromDive();
  await fadeTo(0, { duration: FADE.out });
  await rise;
  if (state.artifact) {
    const pos = scene.getArtifactScreenPosition(state.artifact);
    tourCard?.show(findArtifact(state.artifact), pos);
    if (state.tourMode !== 'off') scheduleNextTourStep();
  }
});

// "About": the project name opens a page about the project, NASA data and the team.
const openAbout = withBusy(async () => {
  await fadeTo(1, { duration: FADE.in });
  setView('about');
  dom.about.scrollTop = 0;
  dom.about.querySelector('#about-title').focus({ preventScroll: true });
  await fadeTo(0, { duration: FADE.in });
});

const closeAbout = withBusy(async () => {
  await fadeTo(1, { duration: FADE.in });
  setView('3d');
  await fadeTo(0, { duration: FADE.in });
});

// "Ask this artifact": open the chat and prefill a question about it (the visitor sends it).
function askAboutArtifact(detail) {
  const trigger = document.querySelector('.aistronaut-btn-trigger');
  const chat = document.querySelector('.aistronaut-card');
  const input = document.querySelector('.aistronaut-input');
  if (!trigger || !input) return;
  if (!chat?.classList.contains('open')) trigger.click();
  input.value = t('chat.ask_prompt', { name: localizeArtifact(detail, getLang()).name });
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
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
    tourCard?.refreshLanguage();
    renderTourButton();
    museumView?.refreshLanguage();
  });
}

async function loadCatalog() {
  try {
    state.artifacts = await loadArtifacts();
  } catch (err) {
    console.error(err);
  }
  if (!state.artifacts.length) showToast(t('error.catalog'));
}

async function start() {
  initLanguage();
  if (!webglAvailable()) return showFallback();

  try {
    scene = new MuseumScene(dom.scene, {
      staticUrl: document.body.dataset.static,
      reducedMotion,
      onError: ({ body }) => showToast(t('error.texture', { body: t(`body.${body}`) })),
    });
  } catch (err) {
    console.error(err);
    return showFallback();
  }

  panel = new ArtifactPanel(document.getElementById('panel'), { onSelect: selectArtifact, describe: describeArtifact });
  panel.setCollapsed(isPhone);
  focusBar = new FocusBar(document.getElementById('focusbar'), {
    onMore: openMuseum,
    onClose: () => closeArtifact(),
    nameOf: artifactName,
  });
  tourCard = new TourCard(
    document.getElementById('tour-card'),
    document.getElementById('tour-svg'),
    {
      onOpen: openMuseum,
      onClose: () => closeArtifact(),
    }
  );

  scene.onCameraMove = () => {
    if (state.artifact) {
      const pos = scene.getArtifactScreenPosition(state.artifact);
      tourCard.updatePosition(pos);
    }
  };

  const nextMode = { off: '1x', '1x': '2x', '2x': 'off' };
  document.querySelector('[data-tour-toggle]')?.addEventListener('click', () => setTourMode(nextMode[state.tourMode]));
  scene.onMarkerClick = (code) => {
    if (currentView() !== '3d' || state.cinematic) return;
    if (code !== state.artifact) selectArtifact(code);
  };

  renderTourButton();
  museumView = new MuseumView(dom.museum, { onSelectArtifact: switchMuseumArtifact, onAsk: askAboutArtifact });

  await loadCatalog();
  scene.addArtifacts(state.artifacts);

  const fromHash = location.hash.slice(1);
  selectBody(FOCUS_ORDER.includes(fromHash) ? fromHash : FOCUS_ORDER[0], { instant: true });

  for (const b of dom.bodyButtons) b.addEventListener('click', () => selectBody(b.dataset.body));
  dom.museum.querySelector('[data-action="to-3d"]').addEventListener('click', backTo3D);
  document.querySelector('[data-action="about"]').addEventListener('click', openAbout);
  dom.about.querySelector('[data-action="close-about"]').addEventListener('click', closeAbout);
  const CINEMATIC_KEYS = { 1: 'moon', 2: 'mars' };
  const heldKeys = new Set();   // for the hidden Shift + S + 9 combination
  document.addEventListener('keyup', (e) => heldKeys.delete(e.code));
  window.addEventListener('blur', () => heldKeys.clear());
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest?.('input, textarea, [contenteditable="true"]');
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    heldKeys.add(e.code);
    // Hidden: hold Shift and S, press 9 -> neon message on the Moon (static/js/moon_message.js).
    if (e.shiftKey && heldKeys.has('KeyS') && (e.code === 'Digit9' || e.code === 'Numpad9')) {
      e.preventDefault();
      if (currentView() !== '3d' || state.busy) return;
      stopCinematic();
      closeArtifact({ moveCamera: false });
      if (state.body !== 'moon') selectBody('moon');
      scene.toggleMoonMessage();
      return;
    }
    if (CINEMATIC_KEYS[e.key]) return startCinematic(CINEMATIC_KEYS[e.key]);
    if (e.key !== 'Escape' && e.key !== '0') return;
    if (state.cinematic) stopCinematic();
    else if (e.key !== 'Escape') return;
    else if (currentView() === 'about') closeAbout();
    else if (currentView() === '3d') closeArtifact();
  });

  window.addEventListener('resize', () => {
    if (state.artifact) {
      const pos = scene.getArtifactScreenPosition(state.artifact);
      tourCard.updatePosition(pos);
    }
  });

  requestAnimationFrame(() => dom.loader.classList.add('done'));
}

start().catch((err) => {
  console.error(err);
  showFallback();   // never leave the visitor on an endless loader
});
