/**
 * Reading Time Plugin for Vexa MD
 *
 * Displays estimated reading time with language-aware WPM:
 * - Korean (Hangul): character-based, ~500 CPM
 * - Chinese/Japanese (CJK + Kana): character-based, ~400 CPM
 * - Latin/Cyrillic (English, Russian, etc.): word-based, ~200 WPM
 */

import { Plugin } from '../../core/plugin.js';

export default class ReadingTimePlugin extends Plugin {
  static id = 'reading-time';
  static name = 'Reading Time';
  static version = '1.1.0';
  static description = 'Displays estimated reading time in the toolbar';
  static author = 'Vexa MD Team';

  static capabilities = {
    markdown: false,
    ui: true,
    toolbar: true,
    settings: true,
  };

  static defaultSettings = {
    showOnToolbar: true,
    koCpm: 500,    // Korean: characters per minute
    cjkCpm: 400,   // Chinese/Japanese: characters per minute
    wordWpm: 200,   // Latin/Cyrillic: words per minute
    showSeconds: false,
  };

  constructor(api) {
    super(api);
    this.badgeEl = null;
    this.textEl = null;
  }

  async init() {
    this.createBadge();

    this._on('content:rendered', () => this.update());
    this._on('file:loaded', () => this.update());
    this._on('tab:switched', () => this.update());

    setTimeout(() => this.update(), 500);
  }

  createBadge() {
    if (!this.settings.showOnToolbar) return;

    const existing = document.getElementById('reading-time-badge');
    if (existing) existing.remove();

    this.injectStyles();

    this.badgeEl = document.createElement('div');
    this.badgeEl.id = 'reading-time-badge';
    this.badgeEl.className = 'rt-badge';
    this.badgeEl.innerHTML = `
      <svg class="rt-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span class="rt-text">--</span>
    `;
    this.textEl = this.badgeEl.querySelector('.rt-text');

    const toolbar = document.getElementById('toolbar');
    const pluginDivider = toolbar?.querySelector('#btn-plugins')?.previousElementSibling;
    if (pluginDivider && pluginDivider.classList.contains('toolbar-divider')) {
      toolbar.insertBefore(this.badgeEl, pluginDivider);
    } else if (toolbar) {
      toolbar.appendChild(this.badgeEl);
    }
    this._trackElement(this.badgeEl);
  }

  injectStyles() {
    if (document.getElementById('rt-plugin-styles')) return;
    const style = document.createElement('style');
    style.id = 'rt-plugin-styles';
    style.textContent = `
      .rt-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        margin: 0 2px;
        border-radius: 12px;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        font-size: 11px;
        white-space: nowrap;
        cursor: default;
        user-select: none;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        color: var(--text);
      }
      .rt-badge:hover {
        background: color-mix(in srgb, var(--accent) 22%, transparent);
        border-color: var(--border);
      }
      .rt-icon {
        opacity: 0.6;
        flex-shrink: 0;
      }
      .rt-text {
        font-weight: 500;
        letter-spacing: 0.3px;
      }
      [data-theme="dark"] .rt-badge {
        background: rgba(255, 255, 255, 0.08);
      }
      [data-theme="dark"] .rt-badge:hover {
        background: rgba(255, 255, 255, 0.14);
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  /**
   * Calculate reading time from mixed-language text.
   *
   * Three groups:
   * 1. Korean (Hangul syllables + Jamo) → koCpm (chars/min)
   * 2. CJK ideographs + Japanese Kana → cjkCpm (chars/min)
   * 3. Latin/Cyrillic/other words → wordWpm (words/min)
   *
   * Returns total minutes (float).
   */
  calcMinutes(text) {
    if (!text || !text.trim()) return 0;

    // Group 1: Korean (Hangul syllables + Jamo + compatibility Jamo)
    const koChars = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;

    // Group 2: CJK ideographs + Japanese Hiragana/Katakana
    const cjkChars = (text.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF]/g) || []).length;

    // Group 3: Strip all Asian characters, count remaining words (Latin, Cyrillic, Arabic, etc.)
    const wordText = text.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF]/g, ' ');
    const words = wordText.trim() ? wordText.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

    const koMinutes = koChars / this.settings.koCpm;
    const cjkMinutes = cjkChars / this.settings.cjkCpm;
    const wordMinutes = words / this.settings.wordWpm;

    return koMinutes + cjkMinutes + wordMinutes;
  }

  formatTime(minutes) {
    if (minutes <= 0) return '--';

    if (minutes < 1) {
      if (this.settings.showSeconds) {
        const secs = Math.max(1, Math.round(minutes * 60));
        return `${secs}s`;
      }
      return '< 1 min';
    }

    const rounded = Math.ceil(minutes);
    return `${rounded} min`;
  }

  update() {
    if (!this.textEl) return;

    const content = document.querySelector('#content');
    if (!content) return;

    const text = content.innerText || '';
    const minutes = this.calcMinutes(text);
    this.textEl.textContent = this.formatTime(minutes);
  }

  onSettingsChange(settings) {
    if (this.badgeEl && !settings.showOnToolbar) {
      this.badgeEl.remove();
      this.badgeEl = null;
      this.textEl = null;
    } else if (!this.badgeEl && settings.showOnToolbar) {
      this.createBadge();
    }
    this.update();
  }

  async destroy() {
    if (this.badgeEl) {
      this.badgeEl.remove();
      this.badgeEl = null;
      this.textEl = null;
    }
    await super.destroy();
  }
}
