// Catalog of every object with 2D rotating planet and world switcher.
// Clicking an item directs immediately to its "Learn more" museum page.

import { t, getLang } from './i18n.js';
import { localizeArtifact } from './artifacts.js';
import { artifactTypeLabel, artifactPlace } from './museum.js';
import { CatalogPlanet } from './catalog_planet.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export class CatalogView {
  constructor(root, { onOpen, onBodyChange, staticUrl = '/static/' } = {}) {
    this.root = root;
    this.onOpen = onOpen;
    this.onBodyChange = onBodyChange;
    this.artifacts = [];
    this.activeBody = 'moon';

    this.list = root.querySelector('[data-catalog-list]');
    this.planetName = root.querySelector('[data-catalog-planet-name]');
    this.planetCount = root.querySelector('[data-catalog-planet-count]');
    this.canvas = root.querySelector('#catalog-planet-canvas');
    this.bodyButtons = [...root.querySelectorAll('[data-catalog-body]')];

    if (this.canvas) {
      try {
        this.planet = new CatalogPlanet(this.canvas, { staticUrl });
      } catch (err) {
        console.error('CatalogPlanet init error:', err);
      }
    }

    this.list.addEventListener('click', (e) => {
      const item = e.target.closest('[data-open-artifact]');
      if (item && this.onOpen) this.onOpen(item.dataset.openArtifact);
    });

    for (const btn of this.bodyButtons) {
      btn.addEventListener('click', () => {
        this.setBody(btn.dataset.catalogBody);
        if (this.onBodyChange) this.onBodyChange(btn.dataset.catalogBody);
      });
    }
  }

  setBody(body) {
    const key = (body || 'moon').toLowerCase();
    this.activeBody = key;
    for (const b of this.bodyButtons) {
      b.setAttribute('aria-pressed', String(b.dataset.catalogBody === key));
    }
    if (this.planet) {
      this.planet.setBody(key);
    }
    this.render();
  }

  startPlanet() {
    this.planet?.start();
  }

  stopPlanet() {
    this.planet?.stop();
  }

  render(artifacts) {
    if (artifacts) this.artifacts = artifacts;
    const items = this.artifacts.filter((a) => a.body === this.activeBody);

    if (this.planetName) {
      this.planetName.textContent = t(`body.${this.activeBody}`);
    }
    if (this.planetCount) {
      this.planetCount.textContent = `${items.length} ${t('panel.title').toLowerCase()}`;
    }

    const grid = el('ul', 'catalog-grid');
    for (const artifact of items) {
      grid.append(this.#item(artifact));
    }

    this.list.replaceChildren(grid);
  }

  refreshLanguage() {
    for (const b of this.bodyButtons) {
      const key = b.dataset.catalogBody;
      b.textContent = t(`body.${key}`);
    }
    this.render();
  }

  #item(artifact) {
    const local = localizeArtifact(artifact, getLang());
    const li = el('li');
    const button = el('button', 'catalog-item');
    button.type = 'button';
    button.dataset.openArtifact = artifact.code;

    if (artifact.image_url) {
      const img = el('img', 'catalog-item-image');
      img.src = artifact.image_url;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => img.replaceWith(el('div', 'catalog-item-image is-empty')), { once: true });
      button.append(img);
    } else {
      button.append(el('div', 'catalog-item-image is-empty'));
    }

    const text = el('div', 'catalog-item-text');
    text.append(
      el('span', 'catalog-item-name', local.name),
      el('span', 'catalog-item-meta', `${artifactTypeLabel(artifact.artifact_type)} · ${artifactPlace(local)}`),
    );
    if (local.brief_description) text.append(el('p', 'catalog-item-brief', local.brief_description));
    button.append(text);
    li.append(button);
    return li;
  }
}
