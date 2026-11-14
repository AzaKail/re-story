import { t } from './i18n.js';

// Bar shown while the camera is focused on an artifact:
// its name, "Learn more" (scrolls to the museum) and a close button.
export class FocusBar {
  constructor(root, { onMore, onClose }) {
    this.root = root;
    this.name = root.querySelector('[data-focus-name]');
    this.code = null;

    root.querySelector('[data-focus-more]').addEventListener('click', () => onMore(this.code));
    root.querySelector('[data-focus-close]').addEventListener('click', () => onClose());
  }

  show(code) {
    this.code = code;
    this.refreshLanguage();
    this.root.hidden = false;
  }

  hide() {
    this.code = null;
    this.root.hidden = true;
  }

  refreshLanguage() {
    if (this.code) this.name.textContent = t(`artifact.${this.code}`);
  }
}
