/**
 * Word Counter Plugin for Vexa MD
 *
 * Displays word/character count. Tests all 7 settings types.
 */

import { Plugin } from '../../core/plugin.js';

export default class WordCounterPlugin extends Plugin {
  static id = 'word-counter';
  static name = 'Word Counter';
  static version = '1.0.0';
  static description = 'Displays word/character count in the toolbar';
  static author = 'Vexa MD Team';

  static capabilities = {
    markdown: false,
    ui: true,
    toolbar: true,
    settings: true,
  };

  static defaultSettings = {
    showOnToolbar: true,
    countMode: 'words',
    separator: ' | ',
    fontSize: 12,
    badgeColor: '#4a9eff',
    opacity: 80,
    customFormat: '{words}W {chars}C',
  };

  constructor(api) {
    super(api);
    this.counterEl = null;
  }

  async init() {
    console.log(`[WordCounter] Initialized with settings:`, this.settings);

    // Create counter element in toolbar
    this.createCounter();

    // Listen for content changes to update count
    this._on('content:rendered', () => this.updateCount());
    this._on('file:loaded', () => this.updateCount());

    // Initial count
    setTimeout(() => this.updateCount(), 500);
  }

  createCounter() {
    if (!this.settings.showOnToolbar) return;

    // Inject CSS once
    this.injectStyles();

    // Create wrapper with icon + text
    this.counterEl = document.createElement('div');
    this.counterEl.id = 'word-counter-badge';
    this.counterEl.className = 'wc-badge';
    this.counterEl.innerHTML = `
      <svg class="wc-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 7V4h16v3"/>
        <path d="M9 20h6"/>
        <path d="M12 4v16"/>
      </svg>
      <span class="wc-text">0</span>
    `;
    this.textEl = this.counterEl.querySelector('.wc-text');

    this.applyDynamicStyles();

    // Insert before the plugin button divider
    const toolbar = document.getElementById('toolbar');
    const pluginDivider = toolbar?.querySelector('#btn-plugins')?.previousElementSibling;
    if (pluginDivider && pluginDivider.classList.contains('toolbar-divider')) {
      toolbar.insertBefore(this.counterEl, pluginDivider);
    } else if (toolbar) {
      toolbar.appendChild(this.counterEl);
    }
    this._trackElement(this.counterEl);
  }

  injectStyles() {
    if (document.getElementById('wc-plugin-styles')) return;
    const style = document.createElement('style');
    style.id = 'wc-plugin-styles';
    style.textContent = `
      .wc-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        margin: 0 2px;
        border-radius: 12px;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        white-space: nowrap;
        cursor: default;
        user-select: none;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        color: var(--text);
      }
      .wc-badge:hover {
        background: color-mix(in srgb, var(--accent) 22%, transparent);
        border-color: var(--border);
      }
      .wc-icon {
        opacity: 0.6;
        flex-shrink: 0;
      }
      .wc-text {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.3px;
      }
      [data-theme="dark"] .wc-badge {
        background: rgba(255, 255, 255, 0.08);
      }
      [data-theme="dark"] .wc-badge:hover {
        background: rgba(255, 255, 255, 0.14);
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  applyDynamicStyles() {
    if (!this.counterEl) return;
    const s = this.settings;
    this.counterEl.style.fontSize = `${s.fontSize}px`;
    this.counterEl.style.opacity = (s.opacity / 100).toString();
    if (s.badgeColor && s.badgeColor !== '#4a9eff') {
      this.counterEl.style.background = `color-mix(in srgb, ${s.badgeColor} 15%, transparent)`;
      this.counterEl.style.color = s.badgeColor;
      this.counterEl.querySelector('.wc-icon').style.stroke = s.badgeColor;
    }
  }

  updateCount() {
    if (!this.counterEl) return;

    const content = document.querySelector('#content');
    if (!content) return;

    const text = content.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const s = this.settings;
    let display = '';

    if (s.countMode === 'words') {
      display = `${words.toLocaleString()} words`;
    } else if (s.countMode === 'characters') {
      display = `${chars.toLocaleString()} chars`;
    } else {
      display = s.customFormat
        .replace('{words}', words.toLocaleString())
        .replace('{chars}', chars.toLocaleString());
    }

    if (this.textEl) this.textEl.textContent = display;
  }

  onSettingsChange(settings) {
    console.log(`[WordCounter] Settings changed:`, settings);

    // Recreate counter if visibility changed
    if (this.counterEl && !settings.showOnToolbar) {
      this.counterEl.remove();
      this.counterEl = null;
    } else if (!this.counterEl && settings.showOnToolbar) {
      this.createCounter();
    }

    // Update styles
    this.applyDynamicStyles();
    this.updateCount();
  }

  async destroy() {
    if (this.counterEl) {
      this.counterEl.remove();
      this.counterEl = null;
    }
    await super.destroy();
    console.log(`[WordCounter] Destroyed`);
  }
}
