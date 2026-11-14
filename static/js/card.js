// Slide-out artifact card component and fleet renderer

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
      <h4 class="text-sm uppercase tracking-wider text-gray-400 mb-2">Sister Craft & Fleet Sites</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300 fleet-table">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-700">
              <th class="py-1">Mission</th>
              <th class="py-1">Site / Trajectory</th>
              <th class="py-1">Coordinates / Lifespan</th>
              <th class="py-1">Date</th>
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

  render(artifact) {
    if (this.cardName) {
      this.cardName.textContent = artifact.name || artifact.code;
    }
    if (this.cardType) {
      this.cardType.textContent = (artifact.artifact_type || 'Equipment').toUpperCase();
    }
    if (this.cardStatus) {
      this.cardStatus.textContent = artifact.status || 'Archived Artifact';
    }

    if (!this.cardBody) return;

    const storyParagraphs = (artifact.first_person_story || artifact.brief_description || '')
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="card-story-para">${p.trim()}</p>`)
      .join('');

    const factsList = Array.isArray(artifact.key_facts) && artifact.key_facts.length > 0
      ? `<div class="card-section">
           <h4 class="card-section-title">Key Scientific and Engineering Facts</h4>
           <ul class="card-facts-list">
             ${artifact.key_facts.map(f => `<li>${f}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const fleetSection = renderFleetMembers(artifact.fleet_members);

    const sourcesSection = Array.isArray(artifact.sources) && artifact.sources.length > 0
      ? `<div class="card-section">
           <h4 class="card-section-title">Official NASA Master Sources</h4>
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
      : (artifact.orbit_parameters || 'Interstellar trajectory');

    const imageHtml = artifact.image_url
      ? `<div class="card-media">
           <img src="${artifact.image_url}" alt="${artifact.name}" class="card-image" loading="lazy" />
         </div>`
      : '';

    this.cardBody.innerHTML = `
      <div class="card-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Location</span>
          <span class="meta-val font-mono">${locationText}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Launch</span>
          <span class="meta-val">${artifact.launch_date || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Touchdown</span>
          <span class="meta-val">${artifact.landing_date || 'Orbital / Deep Space'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Mission End</span>
          <span class="meta-val">${artifact.end_of_mission_date || 'Permanent Silent Monument'}</span>
        </div>
      </div>

      ${imageHtml}

      <div class="card-section">
        <h4 class="card-section-title">First-Person Narrative</h4>
        <div class="card-story">
          ${storyParagraphs}
        </div>
      </div>

      ${factsList}

      ${fleetSection}

      ${sourcesSection}

      <div class="card-actions">
        <button type="button" class="btn btn-accent card-ask-btn" data-ask-artifact="${artifact.name}">
          Ask ${artifact.name}
        </button>
      </div>
    `;
  }
}
