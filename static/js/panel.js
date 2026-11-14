import { t } from './i18n.js';

const formatCoord = (value) => `${value.toFixed(1)}°`;

// Left panel: the list of artifacts on the current body. Can be collapsed.
export class ArtifactPanel {
  constructor(root, { onSelect }) {
    this.root = root;
    this.onSelect = onSelect;
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
      button.setAttribute('aria-current', String(button.dataset.code === code));
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
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-item';
    button.dataset.code = artifact.code;
    button.setAttribute('aria-current', String(artifact.code === this.selected));

    const name = document.createElement('span');
    name.className = 'panel-item-name';
    name.textContent = t(`artifact.${artifact.code}`);

    const meta = document.createElement('span');
    meta.className = 'panel-item-meta';
    const type = document.createElement('span');
    type.textContent = t('artifact.type.placeholder');
    const coords = document.createElement('span');
    coords.className = 'mono';
    coords.textContent = `${formatCoord(artifact.lat)}, ${formatCoord(artifact.lon)}`;
    meta.append(type, coords);

    button.append(name, meta);
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
