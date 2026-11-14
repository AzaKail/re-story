import { t } from './i18n.js';

// Bar shown while the camera is focused on an artifact:
// its name, "Learn more" (opens full artifact card / museum) and a close button.
export class FocusBar {
  constructor(root, { onMore, onClose }) {
    this.root = root;
    this.name = root.querySelector('[data-focus-name]');
    this.code = null;
    this.customName = null;

    root.querySelector('[data-focus-more]').addEventListener('click', () => onMore(this.code));
    root.querySelector('[data-focus-close]').addEventListener('click', () => onClose());
  }

  show(code, customName = null) {
    this.code = code;
    this.customName = customName;
    this.refreshLanguage();
    this.root.hidden = false;
  }

  hide() {
    this.code = null;
    this.customName = null;
    this.root.hidden = true;
  }

  setName(name) {
    this.customName = name;
    if (name) {
      this.name.textContent = name;
    }
  }

  refreshLanguage() {
    if (this.customName) {
      this.name.textContent = this.customName;
    } else if (this.code) {
      const translated = t(`artifact.${this.code}`);
      this.name.textContent = (translated && translated !== `artifact.${this.code}`) ? translated : this.code;
    }
  }
}
