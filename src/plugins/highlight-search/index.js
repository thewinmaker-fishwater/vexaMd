/**
 * Highlight Search Plugin for Vexa MD
 *
 * Permanently highlights specified keywords in the rendered viewer content.
 * Separate from the built-in search — these highlights persist.
 */

import { Plugin } from '../../core/plugin.js';

export default class HighlightSearchPlugin extends Plugin {
  static id = 'highlight-search';
  static name = 'Highlight Search';
  static version = '1.0.0';
  static description = 'Permanently highlight specific keywords';
  static author = 'Vexa MD Team';

  static capabilities = { markdown: false, ui: true, toolbar: true, settings: true };

  static defaultSettings = {
    keywords: '',
    highlightColor: '#fde047',
    caseSensitive: false,
  };

  async init() {
    this.injectStyles();
    this._on('content:rendered', () => this.highlight());
    this._on('file:loaded', () => setTimeout(() => this.highlight(), 100));
    setTimeout(() => this.highlight(), 500);
  }

  injectStyles() {
    if (document.getElementById('hlsearch-styles')) return;
    const style = document.createElement('style');
    style.id = 'hlsearch-styles';
    style.textContent = `
      mark.hl-keyword {
        background: var(--hl-keyword-bg, #fde047);
        color: inherit;
        padding: 1px 2px;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  getKeywords() {
    if (!this.settings.keywords) return [];
    return this.settings.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  highlight() {
    const content = document.querySelector('#content');
    if (!content) return;

    // Remove previous highlights
    this.removeHighlights(content);

    const keywords = this.getKeywords();
    if (keywords.length === 0) return;

    // Update CSS variable for color
    document.documentElement.style.setProperty('--hl-keyword-bg', this.settings.highlightColor);

    // Escape regex special chars
    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const flags = this.settings.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${escaped.join('|')})`, flags);

    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (regex.test(node.textContent)) {
        textNodes.push(node);
      }
      regex.lastIndex = 0;
    }

    for (const textNode of textNodes) {
      // Skip code blocks
      if (textNode.parentElement?.closest('pre, code')) continue;
      // Skip already marked
      if (textNode.parentElement?.classList?.contains('hl-keyword')) continue;

      const parts = textNode.textContent.split(regex);
      if (parts.length <= 1) continue;

      const frag = document.createDocumentFragment();
      for (const part of parts) {
        regex.lastIndex = 0;
        if (regex.test(part)) {
          const mark = document.createElement('mark');
          mark.className = 'hl-keyword';
          mark.textContent = part;
          frag.appendChild(mark);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
        regex.lastIndex = 0;
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  removeHighlights(container) {
    container.querySelectorAll('mark.hl-keyword').forEach(mark => {
      const text = document.createTextNode(mark.textContent);
      mark.replaceWith(text);
    });
    // Normalize adjacent text nodes
    container.normalize();
  }

  onSettingsChange() {
    this.highlight();
  }

  async destroy() {
    const content = document.querySelector('#content');
    if (content) this.removeHighlights(content);
    document.documentElement.style.removeProperty('--hl-keyword-bg');
    await super.destroy();
  }
}
