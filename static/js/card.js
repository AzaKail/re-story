// Slide-out artifact card component and fleet renderer with dynamic i18n support
import { t, getLang } from './i18n.js';
import { getLocalizedArtifact } from './artifact_translations.js';

export function renderFleetMembers(fleetMembers) {
  if (!fleetMembers || fleetMembers.length === 0) {
    return '';
  }

  const rows = fleetMembers.map(item => {
    return `
      <tr>
        <td class="font-bold">${item.mission || item.name || 'N/A'}</td>
        <td>${item.landing_site || item.trajectory || 'N/A'}</td>
        <td class="font-mono text-xs">${item.coordinates || item.operational_span || 'N/A'}</td>
        <td>${item.landing_date || item.last_signal || 'N/A'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card-section fleet-section mt-4 pt-3 border-t border-gray-700">
      <h4 class="text-sm uppercase tracking-wider text-gray-400 mb-2">${t('card.fleet')}</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300 fleet-table">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-700">
              <th class="py-1">${t('card.table_mission')}</th>
              <th class="py-1">${t('card.table_site')}</th>
              <th class="py-1">${t('card.table_coords')}</th>
              <th class="py-1">${t('card.table_date')}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export class ArtifactCard {
  constructor(root, { onClose, onAsk }) {
    this.root = root;
    this.onClose = onClose || (() => {});
    this.onAsk = onAsk || (() => {});
    this.currentArtifact = null;

    this.backdrop = root.querySelector('[data-card-backdrop]');
    this.closeBtn = root.querySelector('[data-card-close]');
    this.cardName = root.querySelector('[data-card-name]');
    this.cardType = root.querySelector('[data-card-type]');
    this.cardStatus = root.querySelector('[data-card-status]');
    this.cardBody = root.querySelector('[data-card-body]');

    this.#initEvents();
  }

  #initEvents() {
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    this.root.addEventListener('click', (e) => {
      const askBtn = e.target.closest('[data-ask-artifact]');
      if (askBtn && this.currentArtifact) {
        this.onAsk(this.currentArtifact);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.root.classList.contains('is-open');
  }

  show(artifact) {
    this.currentArtifact = artifact;
    this.render(artifact);
    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('card-open');
  }

  close() {
    if (!this.isOpen()) return;
    this.root.classList.remove('is-open');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('card-open');
    this.currentArtifact = null;
    this.onClose();
  }

  refreshLanguage() {
    if (this.currentArtifact && this.isOpen()) {
      this.render(this.currentArtifact);
    }
  }

  render(rawArtifact) {
    const lang = getLang();
    const artifact = getLocalizedArtifact(rawArtifact, lang);

    if (this.cardName) {
      this.cardName.textContent = artifact.name || artifact.code;
    }
    if (this.cardType) {
      const rawType = artifact.artifact_type || 'equipment';
      this.cardType.textContent = t(`artifact.type.${rawType}`) || rawType.replace('_', ' ').toUpperCase();
    }
    if (this.cardStatus) {
      this.cardStatus.textContent = artifact.status || t('card.permanent_monument');
    }

    if (!this.cardBody) return;

    const storyParagraphs = (artifact.first_person_story || artifact.brief_description || '')
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="card-story-para">${p.trim()}</p>`)
      .join('');

    const factsList = Array.isArray(artifact.key_facts) && artifact.key_facts.length > 0
      ? `<div class="card-section">
           <h4 class="card-section-title">${t('card.facts')}</h4>
           <ul class="card-facts-list">
             ${artifact.key_facts.map(f => `<li>${f}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const fleetSection = renderFleetMembers(artifact.fleet_members);

    const sourcesSection = Array.isArray(artifact.sources) && artifact.sources.length > 0
      ? `<div class="card-section">
           <h4 class="card-section-title">${t('card.sources')}</h4>
           <ul class="card-sources-list">
             ${artifact.sources.map(s => `
               <li>
                 <a href="${s.url}" target="_blank" rel="noopener" class="card-source-link">
                   ${s.title}
                 </a>
                 ${s.details ? `<div class="card-source-details">${s.details}</div>` : ''}
               </li>
             `).join('')}
           </ul>
         </div>`
      : '';

    const locationText = (artifact.latitude != null && artifact.longitude != null)
      ? `${artifact.latitude.toFixed(4)}°, ${artifact.longitude.toFixed(4)}°`
      : (artifact.orbit_parameters || t('card.interstellar'));

    const imageHtml = artifact.image_url
      ? `<div class="card-media">
           <img src="${artifact.image_url}" alt="${artifact.name}" class="card-image" loading="lazy" />
         </div>`
      : '';

    const askLabel = t('card.ask_btn', { name: artifact.name });

    this.cardBody.innerHTML = `
      <div class="card-meta-grid">
        <div class="meta-item">
          <span class="meta-label">${t('card.location')}</span>
          <span class="meta-val font-mono">${locationText}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">${t('card.launch')}</span>
          <span class="meta-val">${artifact.launch_date || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">${t('card.landing')}</span>
          <span class="meta-val">${artifact.landing_date || t('card.orbital_or_deep')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">${t('card.end')}</span>
          <span class="meta-val">${artifact.end_of_mission_date || t('card.permanent_monument')}</span>
        </div>
      </div>

      ${imageHtml}

      <div class="card-section">
        <h4 class="card-section-title">${t('card.story_title')}</h4>
        <div class="card-story">
          ${storyParagraphs}
        </div>
      </div>

      ${factsList}

      ${fleetSection}

      ${sourcesSection}

      <div class="card-actions">
        <button type="button" class="btn btn-accent card-ask-btn" data-ask-artifact="${artifact.name}">
          ${askLabel}
        </button>
      </div>
    `;
  }
}
