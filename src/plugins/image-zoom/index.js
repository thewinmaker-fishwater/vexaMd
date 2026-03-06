/**
 * Image Zoom Plugin for Vexa MD
 *
 * Adds lightbox zoom on image click in rendered content.
 */

import { Plugin } from '../../core/plugin.js';

export default class ImageZoomPlugin extends Plugin {
  static id = 'image-zoom';
  static name = 'Image Zoom';
  static version = '1.0.0';
  static description = 'Click images to view in a lightbox overlay';
  static author = 'Vexa MD Team';

  static capabilities = { markdown: false, ui: true, toolbar: false, settings: true };

  static defaultSettings = {
    zoomOnClick: true,
    backdropOpacity: 85,
  };

  constructor(api) {
    super(api);
    this._onClick = this._handleClick.bind(this);
    this._onKey = this._handleKey.bind(this);
    this.overlay = null;
  }

  async init() {
    this.injectStyles();
    document.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKey);
  }

  injectStyles() {
    if (document.getElementById('imgzoom-styles')) return;
    const style = document.createElement('style');
    style.id = 'imgzoom-styles';
    style.textContent = `
      .imgzoom-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: zoom-out;
        animation: imgzoom-fadein 0.2s ease;
      }
      .imgzoom-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, var(--imgzoom-opacity, 0.85));
      }
      .imgzoom-img {
        position: relative;
        max-width: 92vw;
        max-height: 92vh;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        animation: imgzoom-scalein 0.2s ease;
      }
      @keyframes imgzoom-fadein {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes imgzoom-scalein {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      #content img {
        cursor: zoom-in;
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  _handleClick(e) {
    if (!this.settings.zoomOnClick) return;

    // Close overlay
    if (this.overlay) {
      this._closeOverlay();
      return;
    }

    // Check if clicked on an image inside #content
    const img = e.target.closest('#content img');
    if (!img) return;

    e.preventDefault();
    e.stopPropagation();
    this._openOverlay(img.src);
  }

  _handleKey(e) {
    if (this.overlay && e.key === 'Escape') {
      this._closeOverlay();
    }
  }

  _openOverlay(src) {
    const opacity = this.settings.backdropOpacity / 100;
    this.overlay = document.createElement('div');
    this.overlay.className = 'imgzoom-overlay';
    this.overlay.style.setProperty('--imgzoom-opacity', opacity);
    this.overlay.innerHTML = `
      <div class="imgzoom-backdrop"></div>
      <img class="imgzoom-img" src="${src}" />
    `;
    document.body.appendChild(this.overlay);
  }

  _closeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  async destroy() {
    document.removeEventListener('click', this._onClick);
    document.removeEventListener('keydown', this._onKey);
    this._closeOverlay();
    await super.destroy();
  }
}
