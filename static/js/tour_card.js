import { localizeArtifact } from './artifacts.js';
import { artifactTypeLabel, artifactPlace } from './museum.js';
import { getLang, t } from './i18n.js';

// The plaque never goes over the top bar (title and switches); on phones the bar is taller.
function topLimit() {
  const bar = document.querySelector('.topbar .controls');
  return Math.round((bar?.getBoundingClientRect().bottom ?? 76) + 8);
}

export class TourCard {
  constructor(root, svgRoot, { onOpen, onClose }) {
    this.root = root;
    this.svgRoot = svgRoot;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.artifact = null;
    this.lastScreenPoint = null;
    this.offset = null;

    this.isDragging = false;
    this.hasMoved = false;
    this.dragStart = { x: 0, y: 0 };
    this.cardStart = { x: 0, y: 0 };

    this.moreBtn = root.querySelector('[data-tour-more]');
    this.coords = root.querySelector('[data-tour-coords]');
    this.media = root.querySelector('[data-tour-media]');
    this.img = root.querySelector('[data-tour-img]');
    this.type = root.querySelector('[data-tour-type]');
    this.title = root.querySelector('[data-tour-title]');
    this.desc = root.querySelector('[data-tour-desc]');
    this.modelCredit = root.querySelector('[data-tour-model]');
    this.closeBtn = root.querySelector('[data-tour-close]');

    this.reticle = svgRoot.querySelector('#tour-reticle');
    this.dot = svgRoot.querySelector('#tour-dot');
    this.line = svgRoot.querySelector('#tour-line');

    this.#initDrag();

    if (this.moreBtn) {
      this.moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.artifact) this.onOpen(this.artifact.code);
      });
      this.moreBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
    }

    this.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      this.onClose();
    });
  }

  #initDrag() {
    this.root.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-tour-close]') || e.target.closest('[data-tour-more]')) return;
      this.isDragging = true;
      this.hasMoved = false;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.cardStart = {
        x: parseFloat(this.root.style.left) || 0,
        y: parseFloat(this.root.style.top) || 0,
      };
      this.root.setPointerCapture(e.pointerId);
      this.root.classList.add('is-dragging');
    });

    this.root.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (Math.hypot(dx, dy) > 4) this.hasMoved = true;

      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const cardW = this.root.offsetWidth || 320;
      const cardH = this.root.offsetHeight || 290;

      const newLeft = Math.max(16, Math.min(winW - cardW - 16, this.cardStart.x + dx));
      const newTop = Math.max(topLimit(), Math.min(winH - cardH - 24, this.cardStart.y + dy));

      this.root.style.left = `${Math.round(newLeft)}px`;
      this.root.style.top = `${Math.round(newTop)}px`;

      if (this.lastScreenPoint) {
        this.offset = {
          dx: newLeft - this.lastScreenPoint.x,
          dy: newTop - this.lastScreenPoint.y,
        };
        this.#updateConnector(this.lastScreenPoint, newLeft, newTop, cardW, cardH);
      }
    });

    const stopDrag = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.root.classList.remove('is-dragging');
        try { this.root.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    this.root.addEventListener('pointerup', stopDrag);
    this.root.addEventListener('pointercancel', stopDrag);
  }

  show(artifact, screenPoint) {
    this.artifact = artifact;
    if (!artifact) return this.hide();
    const localized = localizeArtifact(artifact, getLang());
    this.title.textContent = localized.name || artifact.code;
    this.desc.textContent = localized.brief_description || '';
    // Objects with a NASA 3D model: name its author and say it is enlarged.
    const credit = artifact.model?.credit;
    this.modelCredit.hidden = !credit;
    this.modelCredit.textContent = credit ? t('tour.model', { credit }) : '';
    this.type.textContent = artifactTypeLabel(artifact.artifact_type);
    if (this.coords) {
      this.coords.textContent = artifactPlace(artifact);
    }

    if (artifact.image_url) {
      this.img.src = artifact.image_url;
      this.img.alt = localized.name || '';
      this.media.hidden = false;
    } else {
      this.media.hidden = true;
    }

    this.root.hidden = false;
    this.offset = this.#choosePlacement(screenPoint);
    this.updatePosition(screenPoint, true);
  }

  // The plaque stands right above its marker, centred, with a short callout line.
  // If there is no room above (marker near the top of the screen), it goes below.
  #choosePlacement(screenPoint) {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const cardW = this.root.offsetWidth || Math.min(360, winW - 32);
    const cardH = this.root.offsetHeight || 170;
    const gap = 44;
    const minTop = topLimit();

    const px = screenPoint?.x ?? winW / 2;
    const py = screenPoint?.y ?? winH / 2;

    const left = Math.max(16, Math.min(winW - cardW - 16, px - cardW / 2));
    const above = py - gap - cardH;
    const top = above >= minTop ? above : Math.min(winH - cardH - 24, py + gap);

    return { dx: left - px, dy: top - py };
  }

  #findClosestAnchor(px, py, left, top, cardW, cardH) {
    const anchors = [
      { x: left, y: top },
      { x: left + cardW, y: top },
      { x: left, y: top + cardH },
      { x: left + cardW, y: top + cardH },
      { x: left + cardW / 2, y: top },
      { x: left + cardW / 2, y: top + cardH },
      { x: left, y: top + cardH / 2 },
      { x: left + cardW, y: top + cardH / 2 },
    ];

    let closest = anchors[0];
    let minDist = Infinity;
    for (const a of anchors) {
      const d = (a.x - px) ** 2 + (a.y - py) ** 2;
      if (d < minDist) {
        minDist = d;
        closest = a;
      }
    }
    return closest;
  }

  #updateConnector(screenPoint, left, top, cardW, cardH) {
    const startX = Math.round(screenPoint.x);
    const startY = Math.round(screenPoint.y);

    const anchor = this.#findClosestAnchor(startX, startY, left, top, cardW, cardH);
    const targetX = Math.round(anchor.x);
    const targetY = Math.round(anchor.y);

    this.reticle.setAttribute('cx', startX);
    this.reticle.setAttribute('cy', startY);
    this.dot.setAttribute('cx', startX);
    this.dot.setAttribute('cy', startY);

    const midX = Math.round(startX + (targetX - startX) * 0.45);
    const midY = Math.round(startY + (targetY - startY) * 0.55);

    this.line.setAttribute('points', `${startX},${startY} ${midX},${midY} ${targetX},${targetY}`);

    const isBackside = screenPoint.isFacing === false;
    this.root.classList.toggle('is-backside', isBackside);
    this.svgRoot.classList.toggle('is-backside', isBackside);
    this.svgRoot.classList.add('active');
  }

  updatePosition(screenPoint, isInitial = false) {
    if (!screenPoint || this.root.hidden) return;
    this.lastScreenPoint = screenPoint;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const cardW = Math.min(320, winW - 32);
    const cardH = this.root.offsetHeight || 290;

    let left = this.offset
      ? screenPoint.x + this.offset.dx
      : screenPoint.x - cardW / 2;
    let top = this.offset
      ? screenPoint.y + this.offset.dy
      : screenPoint.y - cardH - 55;

    left = Math.max(16, Math.min(winW - cardW - 16, left));
    top = Math.max(topLimit(), Math.min(winH - cardH - 24, top));

    this.root.style.left = `${Math.round(left)}px`;
    this.root.style.top = `${Math.round(top)}px`;

    if (isInitial) {
      const originX = Math.round(screenPoint.x - left);
      const originY = Math.round(screenPoint.y - top);
      this.root.style.transformOrigin = `${originX}px ${originY}px`;
      this.root.classList.remove('animate-in');
      void this.root.offsetWidth;
      this.root.classList.add('animate-in');
    }

    this.#updateConnector(screenPoint, left, top, cardW, cardH);
  }

  hide() {
    this.artifact = null;
    this.lastScreenPoint = null;
    this.offset = null;
    this.root.hidden = true;
    this.root.classList.remove('animate-in');
    this.svgRoot.classList.remove('active');
  }

  refreshLanguage() {
    if (this.artifact && !this.root.hidden) {
      this.show(this.artifact, this.lastScreenPoint);
    }
  }
}
