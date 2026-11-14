import { MuseumScene, webglAvailable } from './scene.js';
import { FOCUS_ORDER } from './bodies.js';
import { ARTIFACTS } from './artifacts.js';
import { ArtifactPanel } from './panel.js';
import { FocusBar } from './focusbar.js';
import { t, getLang, setLang, applyTranslations } from './i18n.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = window.matchMedia('(max-width: 600px)').matches;

const dom = {
  experience: document.getElementById('experience'),
  scene: document.getElementById('scene'),
  loader: document.getElementById('loader'),
  bodyName: document.getElementById('body-name'),
  toast: document.getElementById('toast'),
  museum: document.getElementById('museum'),
  museumTitle: document.getElementById('museum-title'),
  bodyButtons: [...document.querySelectorAll('[data-body]')],
  langButtons: [...document.querySelectorAll('[data-lang]')],
};

const state = { body: null, artifact: null, museumArtifact: null };
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

function scrollToSection(section) {
  section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function updateMuseumTitle() {
  dom.museumTitle.textContent = state.museumArtifact ? t(`artifact.${state.museumArtifact}`) : t('museum.title');
}

// ---------- Actions ----------

function selectBody(key, { instant = false } = {}) {
  if (key === state.body) return;
  closeArtifact({ moveCamera: false });
  state.body = key;
  museum.focus(key, { instant });
  for (const b of dom.bodyButtons) b.setAttribute('aria-pressed', String(b.dataset.body === key));
  dom.bodyName.textContent = t(`body.${key}`);
  panel.show(ARTIFACTS.filter((a) => a.body === key));
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
}

function selectArtifact(code) {
  if (!museum.focusArtifact(code)) return;
  state.artifact = code;
  panel.setSelected(code);
  focusBar.show(code);
  document.body.classList.add('is-focused');
}

function closeArtifact({ moveCamera = true } = {}) {
  if (!state.artifact) return;
  if (moveCamera) museum.clearArtifact();
  state.artifact = null;
  panel.setSelected(null);
  focusBar.hide();
  document.body.classList.remove('is-focused');
}

function openMuseum(code) {
  state.museumArtifact = code;
  updateMuseumTitle();
  scrollToSection(dom.museum);
  dom.museumTitle.focus({ preventScroll: true });
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

function initMuseumSection() {
  updateMuseumTitle();
  document.querySelector('[data-action="to-3d"]').addEventListener('click', () => scrollToSection(dom.experience));
}

// Stop rendering while the 3D block is scrolled out of view.
function pauseWhenHidden() {
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => museum.setRunning(entry.isIntersecting)).observe(dom.experience);
}

function start() {
  initLanguage();
  initMuseumSection();

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
  const initial = FOCUS_ORDER.includes(fromHash) ? fromHash : FOCUS_ORDER[0];
  selectBody(initial, { instant: true });

  for (const b of dom.bodyButtons) b.addEventListener('click', () => selectBody(b.dataset.body));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeArtifact();
  });
  pauseWhenHidden();

  requestAnimationFrame(() => dom.loader.classList.add('done'));
}

start();
