/**
 * External Link Icon Plugin for Vexa MD
 *
 * Adds a small external-link icon after links that point to external URLs.
 */

import { Plugin } from '../../core/plugin.js';

export default class ExternalLinkIconPlugin extends Plugin {
  static id = 'external-link-icon';
  static name = 'External Link Icon';
  static version = '1.0.0';
  static description = 'Adds an icon to external links';
  static author = 'Vexa MD Team';

  static capabilities = { markdown: true, ui: true, toolbar: false, settings: true };

  static defaultSettings = {
    showIcon: true,
  };

  async init() {
    this.injectStyles();
    this._on('content:rendered', () => this.markExternalLinks());
    this._on('file:loaded', () => setTimeout(() => this.markExternalLinks(), 100));
    setTimeout(() => this.markExternalLinks(), 500);
  }

  injectStyles() {
    if (document.getElementById('extlink-styles')) return;
    const style = document.createElement('style');
    style.id = 'extlink-styles';
    style.textContent = `
      .extlink-icon {
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-left: 2px;
        vertical-align: middle;
        opacity: 0.5;
        transition: opacity 0.15s;
      }
      a:hover .extlink-icon {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  isExternal(href) {
    if (!href) return false;
    return /^https?:\/\//i.test(href) && !href.startsWith(location.origin);
  }

  markExternalLinks() {
    const content = document.querySelector('#content');
    if (!content) return;

    const links = content.querySelectorAll('a[href]');
    for (const link of links) {
      // Remove existing icons first
      link.querySelectorAll('.extlink-icon').forEach(el => el.remove());

      if (!this.isExternal(link.getAttribute('href'))) continue;

      if (this.settings.showIcon) {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.classList.add('extlink-icon');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '2');
        icon.setAttribute('stroke-linecap', 'round');
        icon.innerHTML = '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>';
        link.appendChild(icon);
      }
    }
  }

  onSettingsChange() {
    this.markExternalLinks();
  }

  async destroy() {
    const content = document.querySelector('#content');
    if (content) {
      content.querySelectorAll('.extlink-icon').forEach(el => el.remove());
    }
    await super.destroy();
  }
}
