/**
 * Copy as HTML Plugin for Vexa MD
 *
 * Adds a toolbar button to copy the rendered content as HTML to clipboard.
 */

import { Plugin } from '../../core/plugin.js';

export default class CopyAsHtmlPlugin extends Plugin {
  static id = 'copy-as-html';
  static name = 'Copy as HTML';
  static version = '1.0.0';
  static description = 'Copy rendered markdown to clipboard as HTML';
  static author = 'Vexa MD Team';

  static capabilities = { markdown: false, ui: true, toolbar: true, settings: false };
  static defaultSettings = {};

  constructor(api) {
    super(api);
    this.btnEl = null;
  }

  async init() {
    this.injectStyles();
    this.createButton();
  }

  injectStyles() {
    if (document.getElementById('copyhtml-styles')) return;
    const style = document.createElement('style');
    style.id = 'copyhtml-styles';
    style.textContent = `
      .copyhtml-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        margin: 0 2px;
        border-radius: 12px;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        font-size: 11px;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        color: var(--text);
      }
      .copyhtml-btn:hover {
        background: color-mix(in srgb, var(--accent) 22%, transparent);
        border-color: var(--border);
      }
      .copyhtml-btn svg {
        opacity: 0.6;
        flex-shrink: 0;
      }
      [data-theme="dark"] .copyhtml-btn {
        background: rgba(255, 255, 255, 0.08);
      }
      [data-theme="dark"] .copyhtml-btn:hover {
        background: rgba(255, 255, 255, 0.14);
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  createButton() {
    const existing = document.getElementById('copy-html-btn');
    if (existing) existing.remove();

    this.btnEl = document.createElement('button');
    this.btnEl.id = 'copy-html-btn';
    this.btnEl.className = 'copyhtml-btn';
    this.btnEl.title = 'Copy as HTML';
    this.btnEl.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
      <span>HTML</span>
    `;

    this.btnEl.addEventListener('click', () => this.copyHtml());

    const toolbar = document.getElementById('toolbar');
    const pluginDivider = toolbar?.querySelector('#btn-plugins')?.previousElementSibling;
    if (pluginDivider && pluginDivider.classList.contains('toolbar-divider')) {
      toolbar.insertBefore(this.btnEl, pluginDivider);
    } else if (toolbar) {
      toolbar.appendChild(this.btnEl);
    }
    this._trackElement(this.btnEl);
  }

  async copyHtml() {
    const content = document.querySelector('#content');
    if (!content) return;

    try {
      const html = content.innerHTML;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html], { type: 'text/plain' }),
        })
      ]);
      // Visual feedback
      const span = this.btnEl.querySelector('span');
      const orig = span.textContent;
      span.textContent = '✓';
      setTimeout(() => { span.textContent = orig; }, 1500);
    } catch (e) {
      console.error('Copy as HTML failed:', e);
    }
  }

  async destroy() {
    if (this.btnEl) {
      this.btnEl.remove();
      this.btnEl = null;
    }
    await super.destroy();
  }
}
