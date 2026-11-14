import { MuseumScene, webglAvailable } from './scene.js';
import { FOCUS_ORDER } from './bodies.js';
import { loadArtifactsFromApi, fetchArtifactDetail } from './artifacts.js';
import { ArtifactPanel } from './panel.js';
import { FocusBar } from './focusbar.js';
import { ArtifactCard } from './card.js';
import { getLocalizedArtifact } from './artifact_translations.js';
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

const state = {
  body: null,
  artifact: null,
  artifactDetail: null,
  artifacts: [],
};

let museum = null;
let panel = null;
let focusBar = null;
let card = null;

// ---------- Helpers ----------

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    dom.toast.hidden = true;
  }, 6000);
}

function showFallback() {
  document.getElementById('fallback').hidden = false;
  dom.loader.classList.add('done');
}

function scrollToSection(section) {
  section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function updateMuseumContent(rawDetail) {
  if (!dom.museumTitle) return;
  if (!rawDetail) {
    dom.museumTitle.textContent = t('museum.title');
    return;
  }
  const lang = getLang();
  const detail = getLocalizedArtifact(rawDetail, lang);

  dom.museumTitle.textContent = detail.name;
  const inner = dom.museum.querySelector('.museum-inner');
  if (!inner) return;

  const existingDetail = inner.querySelector('.museum-artifact-content');
  if (existingDetail) {
    existingDetail.remove();
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'museum-artifact-content';

  const storyHtml = (detail.first_person_story || detail.brief_description || '')
    .split('\n\n')
    .map((p) => `<p>${p.trim()}</p>`)
    .join('');

  contentDiv.innerHTML = `
    <div class="card-meta-grid" style="margin: 24px 0;">
      <div class="meta-item">
        <span class="meta-label">${t('card.location')}</span>
        <span class="meta-val font-mono">${detail.latitude != null ? `${detail.latitude.toFixed(4)}°, ${detail.longitude.toFixed(4)}°` : (detail.orbit_parameters || t('card.interstellar'))}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">${t('card.end')}</span>
        <span class="meta-val">${detail.status || t('card.permanent_monument')}</span>
      </div>
    </div>
    ${detail.image_url ? `<div class="card-media" style="margin: 20px 0;"><img src="${detail.image_url}" alt="${detail.name}" class="card-image"></div>` : ''}
    <div style="margin: 24px 0;">
      ${storyHtml}
    </div>
  `;

  // Hide the generic placeholder paragraphs
  const paragraphs = inner.querySelectorAll('p:not(.museum-kicker)');
  paragraphs.forEach((p) => {
    if (!p.closest('.museum-artifact-content')) {
      p.style.display = 'none';
    }
  });

  inner.appendChild(contentDiv);
}

// ---------- Actions ----------

function selectBody(key, { instant = false } = {}) {
  if (key === state.body) return;
  closeArtifact({ moveCamera: false });
  state.body = key;
  museum.focus(key, { instant });

  for (const b of dom.bodyButtons) {
    b.setAttribute('aria-pressed', String(b.dataset.body === key));
  }
  dom.bodyName.textContent = t(`body.${key}`);

  const filtered = state.artifacts.filter((a) => a.body === key);
  panel.show(filtered);

  if (location.hash !== `#${key}`) {
    history.replaceState(null, '', `#${key}`);
  }
}

async function selectArtifact(code) {
  if (!museum.focusArtifact(code)) {
    // If not a surface marker, we still focus the parent body
    const found = state.artifacts.find((a) => a.code === code);
    if (found && found.body !== state.body) {
      selectBody(found.body);
    }
  }

  state.artifact = code;
  panel.setSelected(code);

  const localItem = state.artifacts.find((a) => a.code === code);
  focusBar.show(code, localItem?.name);
  document.body.classList.add('is-focused');

  const detail = await fetchArtifactDetail(code);
  if (detail) {
    state.artifactDetail = detail;
    focusBar.setName(detail.name);
  }
}

function closeArtifact({ moveCamera = true } = {}) {
  if (!state.artifact) return;
  if (moveCamera) museum.clearArtifact();
  state.artifact = null;
  state.artifactDetail = null;
  panel.setSelected(null);
  focusBar.hide();
  card.close();
  document.body.classList.remove('is-focused');
}

async function openArtifactCard(code) {
  let detail = state.artifactDetail;
  if (!detail || detail.code !== code) {
    detail = await fetchArtifactDetail(code);
    state.artifactDetail = detail;
  }
  if (detail) {
    card.show(detail);
    updateMuseumContent(detail);
  }
}

function handleAskArtifact(artifact) {
  const triggerBtn = document.querySelector('.aistronaut-btn-trigger');
  const chatCard = document.querySelector('.aistronaut-card');
  const input = document.querySelector('.aistronaut-input');

  if (triggerBtn && (!chatCard || !chatCard.classList.contains('open'))) {
    triggerBtn.click();
  }

  if (input) {
    const lang = getLang();
    const localized = getLocalizedArtifact(artifact, lang);
    const artifactName = (localized && localized.name) ? localized.name : (artifact ? artifact.name : '');
    const promptText = t('chat.ask_prompt', { name: artifactName });

    input.value = promptText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.selectionStart = input.selectionEnd = input.value.length;
  }
}

// ---------- Init ----------

function initLanguage() {
  const markActive = () => {
    for (const b of dom.langButtons) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === getLang()));
    }
  };
  applyTranslations();
  markActive();

  for (const b of dom.langButtons) {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  }

  window.addEventListener('langchange', () => {
    markActive();
    if (state.body) dom.bodyName.textContent = t(`body.${state.body}`);
    panel?.refreshLanguage();
    focusBar?.refreshLanguage();
    card?.refreshLanguage();
    if (state.artifactDetail) {
      updateMuseumContent(state.artifactDetail);
    }
  });
}

function initMuseumSection() {
  document.querySelector('[data-action="to-3d"]').addEventListener('click', () => scrollToSection(dom.experience));
}

function pauseWhenHidden() {
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => museum.setRunning(entry.isIntersecting)).observe(dom.experience);
}

async function start() {
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

  // Load NASA artifacts from API
  state.artifacts = await loadArtifactsFromApi();
  museum.addArtifacts(state.artifacts);

  panel = new ArtifactPanel(document.getElementById('panel'), { onSelect: selectArtifact });
  panel.setCollapsed(isPhone);

  focusBar = new FocusBar(document.getElementById('focusbar'), {
    onMore: (code) => openArtifactCard(code),
    onClose: () => closeArtifact(),
  });

  card = new ArtifactCard(document.getElementById('artifact-card'), {
    onClose: () => {},
    onAsk: handleAskArtifact,
  });

  const fromHash = location.hash.slice(1);
  const initial = FOCUS_ORDER.includes(fromHash) ? fromHash : FOCUS_ORDER[0];
  selectBody(initial, { instant: true });

  for (const b of dom.bodyButtons) {
    b.addEventListener('click', () => selectBody(b.dataset.body));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (card.isOpen()) {
        card.close();
      } else {
        closeArtifact();
      }
    }
  });

  pauseWhenHidden();
  requestAnimationFrame(() => dom.loader.classList.add('done'));
}

start();
