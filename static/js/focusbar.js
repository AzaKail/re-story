// Bar shown while the camera is focused on an artifact:
// its name, "Learn more" (dive into the museum) and a close button.
// nameOf(code) supplies the localized name.
export class FocusBar {
  constructor(root, { onMore, onClose, nameOf }) {
    this.root = root;
    this.nameOf = nameOf;
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
    if (this.code) this.name.textContent = this.nameOf(this.code);
  }
}
