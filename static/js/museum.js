// Museum page for one artifact: the screen that opens after "Learn more" (no 3D here).
// Content: first-person story, mission facts, NASA image, sister missions, sources,
// "Ask this artifact", other artifacts on the same body and an overview of the body itself.

import { t, getLang } from './i18n.js';
import { localizeArtifact, hasSurfacePosition } from './artifacts.js';
import { getPlanetData } from './planet_data.js';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatCoord = (value, pos, neg) => `${Math.abs(value).toFixed(3)}° ${value >= 0 ? pos : neg}`;

export function artifactTypeLabel(type) {
  return t(`artifact.type.${type || 'equipment'}`);
}

export function artifactPlace(artifact) {
  if (hasSurfacePosition(artifact)) {
    const lon = ((artifact.longitude + 540) % 360) - 180;   // 354.47 E -> 5.53 W
    return `${formatCoord(artifact.latitude, 'N', 'S')}, ${formatCoord(lon, 'E', 'W')}`;
  }
  return artifact.orbit_parameters || t('card.orbital_or_deep');
}

export class MuseumView {
  constructor(root, { onSelectArtifact, onAsk }) {
    this.root = root;
    this.kicker = root.querySelector('[data-museum-kicker]');
    this.title = root.querySelector('[data-museum-title]');
    this.content = root.querySelector('[data-museum-content]');
    this.state = null;

    this.content.addEventListener('click', (e) => {
      const other = e.target.closest('[data-select-artifact]');
      if (other) onSelectArtifact(other.dataset.selectArtifact);
      if (e.target.closest('[data-ask-artifact]') && this.state) onAsk(this.state.detail);
    });
    // A photo that cannot load (e.g. no internet at the venue) is hidden instead of showing a broken icon.
    this.content.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') e.target.closest('figure')?.remove();
    }, true);
  }

  // detail: full API record; siblings: other artifacts on the same body.
  render(detail, siblings) {
    this.state = { detail, siblings };
    const lang = getLang();
    const a = localizeArtifact(detail, lang);
    const body = getPlanetData(a.body, lang);

    this.kicker.textContent = `${artifactTypeLabel(a.artifact_type)} · ${body.name}`;
    this.title.textContent = a.name;
    this.content.innerHTML = [
      this.#status(a),
      this.#meta(a),
      this.#image(a),
      this.#story(a),
      this.#facts(a),
      this.#fleet(a),
      this.#sources(a),
      this.#askButton(a),
      this.#siblings(siblings, lang, body),
      this.#bodyOverview(body),
    ].join('');
    this.root.scrollTop = 0;
  }

  refreshLanguage() {
    if (this.state) this.render(this.state.detail, this.state.siblings);
  }

  // ---------- Sections ----------

  #status(a) {
    return a.status ? `<p class="museum-status">${escapeHtml(a.status)}</p>` : '';
  }

  #meta(a) {
    const item = (label, value, mono = false) => `
      <div class="meta-item">
        <span class="meta-label">${escapeHtml(label)}</span>
        <span class="meta-val${mono ? ' mono' : ''}">${escapeHtml(value || '-')}</span>
      </div>`;
    return `<div class="card-meta-grid">
      ${item(t('card.location'), artifactPlace(a), hasSurfacePosition(a))}
      ${item(t('card.launch'), a.launch_date, true)}
      ${item(t('card.landing'), a.landing_date || t('card.orbital_or_deep'), Boolean(a.landing_date))}
      ${item(t('card.end'), a.end_of_mission_date, true)}
    </div>`;
  }

  #image(a) {
    if (!a.image_url) return '';
    return `<figure class="card-media">
      <img class="card-image" src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.name)}">
      <figcaption class="card-media-credit">${escapeHtml(t('card.image_credit'))}</figcaption>
    </figure>`;
  }

  #story(a) {
    const paragraphs = String(a.first_person_story || a.brief_description || '')
      .split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      .map((p) => `<p class="card-story-para">${escapeHtml(p)}</p>`).join('');
    return this.#section(t('card.story_title'), `<div class="card-story">${paragraphs}</div>`, 'museum-story');
  }

  #facts(a) {
    if (!a.key_facts?.length) return '';
    const items = a.key_facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
    return this.#section(t('card.facts'), `<ul class="card-facts-list">${items}</ul>`);
  }

  #fleet(a) {
    if (!a.fleet_members?.length) return '';
    const rows = a.fleet_members.map((m) => `<tr>
        <td class="fleet-name">${escapeHtml(m.mission || m.name)}</td>
        <td>${escapeHtml(m.landing_site || m.trajectory)}</td>
        <td class="mono">${escapeHtml(m.coordinates || m.operational_span)}</td>
        <td class="mono">${escapeHtml(m.landing_date || m.last_signal)}</td>
      </tr>`).join('');
    return this.#section(t('card.fleet'), `<div class="fleet-scroll"><table class="fleet-table">
      <thead><tr>
        <th>${escapeHtml(t('card.table_mission'))}</th><th>${escapeHtml(t('card.table_site'))}</th>
        <th>${escapeHtml(t('card.table_coords'))}</th><th>${escapeHtml(t('card.table_date'))}</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  #sources(a) {
    if (!a.sources?.length) return '';
    const items = a.sources.map((s) => `<li>
        <a class="card-source-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a>
        ${s.details ? `<div class="card-source-details">${escapeHtml(s.details)}</div>` : ''}
      </li>`).join('');
    return this.#section(t('card.sources'), `<ul class="card-sources-list">${items}</ul>`);
  }

  #askButton(a) {
    return `<div class="museum-actions">
      <button type="button" class="btn btn-accent" data-ask-artifact>${escapeHtml(t('card.ask_btn', { name: a.name }))}</button>
    </div>`;
  }

  #siblings(siblings, lang, body) {
    if (!siblings.length) return '';
    const cards = siblings.map((s) => {
      const loc = localizeArtifact(s, lang);
      return `<button type="button" class="planet-artifact-card" data-select-artifact="${escapeHtml(s.code)}">
        <span class="planet-artifact-name">${escapeHtml(loc.name)}</span>
        <span class="planet-artifact-meta">${escapeHtml(artifactTypeLabel(s.artifact_type))}</span>
      </button>`;
    }).join('');
    return this.#section(t('museum.also_here', { body: body.name }), `<div class="planet-artifacts-grid">${cards}</div>`);
  }

  #bodyOverview(body) {
    const stat = (label, value) => `<div class="meta-item">
        <span class="meta-label">${escapeHtml(label)}</span><span class="meta-val">${escapeHtml(value)}</span>
      </div>`;
    const story = body.story.map((p) => `<p class="card-story-para">${escapeHtml(p)}</p>`).join('');
    const facts = body.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
    return this.#section(t('museum.about_body', { body: body.name }), `
      <p class="museum-body-kicker">${escapeHtml(body.kicker)}</p>
      <div class="card-meta-grid">
        ${stat(t('card.meta.radius'), body.radius)}
        ${stat(t('card.meta.gravity'), body.gravity)}
        ${stat(t('card.meta.day_length'), body.day_length)}
        ${stat(t('card.meta.temperature'), body.temperature)}
      </div>
      <div class="card-story">${story}</div>
      <h4 class="card-section-title">${escapeHtml(t('planet.facts_title'))}</h4>
      <ul class="card-facts-list">${facts}</ul>`, 'museum-body');
  }

  #section(title, inner, extraClass = '') {
    return `<section class="card-section ${extraClass}">
      <h3 class="card-section-title">${escapeHtml(title)}</h3>${inner}
    </section>`;
  }
}
