import { t } from './i18n.js';

// Left panel: the list of artifacts on the current body. Can be collapsed.
// describe(artifact) -> { name, type, place } supplies localized text, so the panel stays data-agnostic.
export class ArtifactPanel {
  constructor(root, { onSelect, describe }) {
    this.root = root;
    this.onSelect = onSelect;
    this.describe = describe;
    this.list = root.querySelector('[data-panel-list]');
    this.count = root.querySelector('[data-panel-count]');
    this.toggle = root.querySelector('[data-panel-toggle]');
    this.items = [];
    this.selected = null;
    this.collapsed = false;

    this.toggle.addEventListener('click', () => this.setCollapsed(!this.collapsed));
    this.list.addEventListener('click', (e) => {
      const button = e.target.closest('[data-code]');
      if (button) this.onSelect(button.dataset.code);
    });
  }

  show(items) {
    this.items = items;
    this.selected = null;
    this.render();
  }

  setSelected(code) {
    this.selected = code;
    for (const button of this.list.querySelectorAll('[data-code]')) {
      const current = button.dataset.code === code;
      button.setAttribute('aria-current', String(current));
      // Keep the selected object visible in a scrolled list (e.g. during the tour).
      if (current && !this.collapsed) button.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    this.root.classList.toggle('collapsed', collapsed);
    this.toggle.setAttribute('aria-expanded', String(!collapsed));
    this.#updateToggleLabel();
  }

  refreshLanguage() {
    this.render();
  }

  render() {
    this.count.textContent = String(this.items.length);
    this.#updateToggleLabel();
    this.list.replaceChildren(...(this.items.length ? this.items.map((a) => this.#renderItem(a)) : [this.#renderEmpty()]));
  }

  #renderItem(artifact) {
    const { name, type, place } = this.describe(artifact);
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-item';
    button.dataset.code = artifact.code;
    button.setAttribute('aria-current', String(artifact.code === this.selected));

    const nameEl = document.createElement('span');
    nameEl.className = 'panel-item-name';
    nameEl.textContent = name;

    const meta = document.createElement('span');
    meta.className = 'panel-item-meta';
    const typeEl = document.createElement('span');
    typeEl.textContent = type;
    const placeEl = document.createElement('span');
    placeEl.className = 'mono';
    placeEl.textContent = place;
    meta.append(typeEl, placeEl);

    button.append(nameEl, meta);
    li.append(button);
    return li;
  }

  #renderEmpty() {
    const li = document.createElement('li');
    li.className = 'panel-empty';
    li.textContent = t('panel.empty');
    return li;
  }

  #updateToggleLabel() {
    this.toggle.setAttribute('aria-label', t(this.collapsed ? 'panel.expand' : 'panel.collapse'));
  }
}
