import { MuseumScene, webglAvailable } from './scene.js';
import { FOCUS_ORDER } from './bodies.js';
import { loadArtifactsFromApi, fetchArtifactDetail } from './artifacts.js';
import { ArtifactPanel } from './panel.js';
import { FocusBar } from './focusbar.js';
import { ArtifactCard, renderFleetMembers } from './card.js';
import { getLocalizedArtifact } from './artifact_translations.js';
import { getPlanetData } from './planet_data.js';
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
  museumKicker: document.getElementById('museum-kicker'),
  museumTitle: document.getElementById('museum-title'),
  museumDynamicContent: document.getElementById('museum-dynamic-content'),
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

function renderMuseumSection() {
  if (!dom.museumTitle || !dom.museumDynamicContent) return;
  const lang = getLang();

  // If an artifact is currently selected, render artifact museum card
  if (state.artifactDetail) {
    const detail = getLocalizedArtifact(state.artifactDetail, lang);
    if (dom.museumKicker) dom.museumKicker.textContent = t('card.equipment');
    dom.museumTitle.textContent = detail.name;

    const storyHtml = (detail.first_person_story || detail.brief_description || '')
      .split('\n\n')
      .filter((p) => p.trim())
      .map((p) => `<p class="card-story-para">${p.trim()}</p>`)
      .join('');

    const factsHtml = Array.isArray(detail.key_facts) && detail.key_facts.length > 0
      ? `<div class="card-section">
           <h4 class="card-section-title">${t('card.facts')}</h4>
           <ul class="card-facts-list">
             ${detail.key_facts.map((f) => `<li>${f}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const fleetHtml = renderFleetMembers(detail.fleet_members);

    const sourcesHtml = Array.isArray(detail.sources) && detail.sources.length > 0
      ? `<div class="card-section">
           <h4 class="card-section-title">${t('card.sources')}</h4>
           <ul class="card-facts-list">
             ${detail.sources.map((s) => `
               <li>
                 <a href="${s.url}" target="_blank" rel="noopener" class="card-source-link font-bold">
                   ${s.title}
                 </a>
                 ${s.details ? `<div style="font-size: 0.8rem; color: var(--muted); margin-top: 2px;">${s.details}</div>` : ''}
               </li>
             `).join('')}
           </ul>
         </div>`
      : '';

    dom.museumDynamicContent.innerHTML = `
      <div class="card-meta-grid" style="margin: 24px 0;">
        <div class="meta-item">
          <span class="meta-label">${t('card.location')}</span>
          <span class="meta-val font-mono">${detail.latitude != null ? `${detail.latitude.toFixed(4)}°, ${detail.longitude.toFixed(4)}°` : (detail.orbit_parameters || t('card.interstellar'))}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">${t('card.end')}</span>
          <span class="meta-val">${detail.status || t('card.permanent_monument')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">${t('card.launch')}</span>
          <span class="meta-val">${detail.launch_date || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">${t('card.landing')}</span>
          <span class="meta-val">${detail.landing_date || t('card.orbital_or_deep')}</span>
        </div>
      </div>
      ${detail.image_url ? `<div class="card-media" style="margin: 20px 0;"><img src="${detail.image_url}" alt="${detail.name}" class="card-image" loading="lazy"></div>` : ''}
      <div class="card-section" style="border-top: none; padding-top: 0;">
        <h4 class="card-section-title">${t('card.story_title')}</h4>
        <div class="card-story">
          ${storyHtml}
        </div>
      </div>
      ${factsHtml}
      ${fleetHtml}
      ${sourcesHtml}
    `;
    return;
  }

  // Equipment is UNSELECTED: Show rich planet/body overview
  const bodyKey = state.body || 'moon';
  const planet = getPlanetData(bodyKey, lang);

  if (dom.museumKicker) dom.museumKicker.textContent = planet.kicker;
  dom.museumTitle.textContent = planet.name;

  const storyParagraphs = planet.story
    .map((p) => `<p class="card-story-para">${p}</p>`)
    .join('');

  const factsList = planet.facts
    .map((f) => `<li>${f}</li>`)
    .join('');

  // Artifacts on this body
  const bodyArtifacts = state.artifacts.filter((a) => a.body === bodyKey);
  const artifactsGrid = bodyArtifacts.length > 0
    ? `<div class="card-section">
         <h4 class="card-section-title">${t('planet.artifacts_title')}</h4>
         <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 12px;">${t('planet.select_artifact_hint')}</p>
         <div class="planet-artifacts-grid">
           ${bodyArtifacts.map((a) => {
             const loc = getLocalizedArtifact(a, lang);
             const typeLabel = t(`artifact.type.${loc.artifact_type}`) || loc.artifact_type;
             return `
               <button type="button" class="planet-artifact-card" data-select-artifact="${loc.code}">
                 <span class="planet-artifact-name">${loc.name}</span>
                 <span class="planet-artifact-meta font-mono">${typeLabel}</span>
               </button>
             `;
           }).join('')}
         </div>
       </div>`
    : '';

  dom.museumDynamicContent.innerHTML = `
    <div class="card-meta-grid" style="margin: 24px 0;">
      <div class="meta-item">
        <span class="meta-label">${t('card.meta.radius')}</span>
        <span class="meta-val font-mono">${planet.radius}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">${t('card.meta.gravity')}</span>
        <span class="meta-val font-mono">${planet.gravity}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">${t('card.meta.day_length')}</span>
        <span class="meta-val">${planet.day_length}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">${t('card.meta.temperature')}</span>
        <span class="meta-val">${planet.temperature}</span>
      </div>
    </div>

    <div class="card-section" style="border-top: none; padding-top: 0;">
      <h4 class="card-section-title">${t('planet.overview_title')}</h4>
      <div class="card-story">
        ${storyParagraphs}
      </div>
    </div>

    <div class="card-section">
      <h4 class="card-section-title">${t('planet.facts_title')}</h4>
      <ul class="card-facts-list">
        ${factsList}
      </ul>
    </div>

    ${artifactsGrid}
  `;

  // Delegate click on planet artifact cards to open detail
  dom.museumDynamicContent.querySelectorAll('[data-select-artifact]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.selectArtifact;
      selectArtifact(code);
      openArtifactCard(code);
    });
  });
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

  renderMuseumSection();
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
    renderMuseumSection();
  }
}

function closeArtifact({ moveCamera = true } = {}) {
  if (!state.artifact && !state.artifactDetail) return;
  if (moveCamera && museum) museum.clearArtifact();
  state.artifact = null;
  state.artifactDetail = null;
  panel?.setSelected(null);
  focusBar?.hide();
  card?.close();
  document.body.classList.remove('is-focused');
  renderMuseumSection();
}

async function openArtifactCard(code) {
  let detail = state.artifactDetail;
  if (!detail || detail.code !== code) {
    detail = await fetchArtifactDetail(code);
    state.artifactDetail = detail;
  }
  if (detail) {
    card.show(detail);
    renderMuseumSection();
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
    renderMuseumSection();
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
    onClose: () => closeArtifact(),
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
