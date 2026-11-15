// Catalog of every object as a plain page, no 3D. It opens instead of the 3D scene when the
// browser cannot show WebGL, and with ?view=catalog in the address (for testing and design work).
// Objects are grouped by where they stayed (Moon, Mars, then the rest); a click opens the museum page.

import { t, getLang } from './i18n.js';
import { localizeArtifact } from './artifacts.js';
import { artifactTypeLabel, artifactPlace } from './museum.js';

const BODY_ORDER = ['moon', 'mars', 'ceres', 'eros', 'solar_system'];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export class CatalogView {
  constructor(root, { onOpen }) {
    this.root = root;
    this.list = root.querySelector('[data-catalog-list]');
    this.artifacts = [];
    this.list.addEventListener('click', (e) => {
      const item = e.target.closest('[data-open-artifact]');
      if (item) onOpen(item.dataset.openArtifact);
    });
  }

  render(artifacts) {
    this.artifacts = artifacts;
    const bodies = [...new Set([...BODY_ORDER, ...artifacts.map((a) => a.body)])];
    const groups = bodies
      .map((body) => [body, artifacts.filter((a) => a.body === body)])
      .filter(([, items]) => items.length)
      .map(([body, items]) => this.#group(body, items));
    this.list.replaceChildren(...groups);
  }

  refreshLanguage() {
    this.render(this.artifacts);
  }

  #group(body, items) {
    const section = el('section', 'card-section catalog-group');
    const title = el('h3', 'card-section-title', `${t(`body.${body}`)} · ${items.length}`);
    const grid = el('ul', 'catalog-grid');
    for (const artifact of items) grid.append(this.#item(artifact));
    section.append(title, grid);
    return section;
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
