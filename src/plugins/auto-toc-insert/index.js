/**
 * Auto TOC Insert Plugin for Vexa MD
 *
 * Replaces [TOC] markers in rendered content with a generated table of contents.
 */

import { Plugin } from '../../core/plugin.js';

export default class AutoTocInsertPlugin extends Plugin {
  static id = 'auto-toc-insert';
  static name = 'Auto TOC Insert';
  static version = '1.0.0';
  static description = 'Renders a table of contents at [TOC] marker position';
  static author = 'Vexa MD Team';

  static capabilities = {
    markdown: true,
    ui: true,
    toolbar: false,
    settings: true,
  };

  static defaultSettings = {
    maxDepth: '3',
    ordered: false,
    title: '',
  };

  async init() {
    this.injectStyles();
    this._on('content:rendered', () => this.insertToc());
    this._on('file:loaded', () => setTimeout(() => this.insertToc(), 100));
    setTimeout(() => this.insertToc(), 500);
  }

  injectStyles() {
    if (document.getElementById('auto-toc-styles')) return;
    const style = document.createElement('style');
    style.id = 'auto-toc-styles';
    style.textContent = `
      .auto-toc {
        background: var(--bg-secondary, #f8f9fa);
        border: 1px solid var(--border, #e0e0e0);
        border-radius: 8px;
        padding: 16px 20px;
        margin: 16px 0;
        line-height: 1.6;
      }
      .auto-toc-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text);
        margin: 0 0 8px 0;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border, #e0e0e0);
      }
      .auto-toc ul, .auto-toc ol {
        margin: 0;
        padding-left: 20px;
        list-style: none;
      }
      .auto-toc > ul, .auto-toc > ol {
        padding-left: 0;
      }
      .auto-toc li {
        margin: 2px 0;
      }
      .auto-toc ol {
        list-style: decimal;
      }
      .auto-toc a {
        color: var(--accent, #6366f1);
        text-decoration: none;
        font-size: 13px;
        transition: color 0.15s;
      }
      .auto-toc a:hover {
        text-decoration: underline;
      }
      [data-theme="dark"] .auto-toc {
        background: rgba(255, 255, 255, 0.04);
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  /**
   * Find all headings in the rendered content and build TOC data.
   */
  collectHeadings(container) {
    const maxDepth = parseInt(this.settings.maxDepth) || 3;
    const selector = Array.from({ length: maxDepth }, (_, i) => `h${i + 1}`).join(',');
    const headings = container.querySelectorAll(selector);

    return Array.from(headings).map(h => {
      const level = parseInt(h.tagName[1]);
      const text = h.textContent.trim();
      // Use existing id or generate slug
      const id = h.id || this.slugify(text);
      if (!h.id) h.id = id;
      return { level, text, id };
    });
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\u00C0-\u024F\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Build nested HTML list from flat headings array.
   */
  buildTocHtml(headings) {
    if (headings.length === 0) return '';

    const tag = this.settings.ordered ? 'ol' : 'ul';
    const minLevel = Math.min(...headings.map(h => h.level));
    let html = '';

    // Normalize levels relative to min
    const items = headings.map(h => ({
      ...h,
      depth: h.level - minLevel,
    }));

    let currentDepth = 0;
    html += `<${tag}>`;

    for (const item of items) {
      while (currentDepth < item.depth) {
        html += `<${tag}>`;
        currentDepth++;
      }
      while (currentDepth > item.depth) {
        html += `</${tag}></li>`;
        currentDepth--;
      }
      html += `<li><a href="#${item.id}">${this.escapeHtml(item.text)}</a>`;
    }

    // Close remaining tags
    while (currentDepth > 0) {
      html += `</${tag}></li>`;
      currentDepth--;
    }
    html += `</${tag}>`;

    return html;
  }

  escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
  }

  /**
   * Find [TOC] markers in rendered content and replace with generated TOC.
   */
  insertToc() {
    const content = document.querySelector('#content');
    if (!content) return;

    // Find [TOC] markers — rendered as <p>[TOC]</p>
    const paragraphs = content.querySelectorAll('p');
    const tocMarkers = [];
    for (const p of paragraphs) {
      if (p.textContent.trim() === '[TOC]') {
        tocMarkers.push(p);
      }
    }

    if (tocMarkers.length === 0) return;

    const headings = this.collectHeadings(content);
    const tocHtml = this.buildTocHtml(headings);
    if (!tocHtml) return;

    const titleHtml = this.settings.title
      ? `<div class="auto-toc-title">${this.escapeHtml(this.settings.title)}</div>`
      : '';

    for (const marker of tocMarkers) {
      const tocEl = document.createElement('div');
      tocEl.className = 'auto-toc';
      tocEl.innerHTML = titleHtml + tocHtml;

      // Click handler for smooth scroll
      tocEl.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        const targetId = link.getAttribute('href')?.slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      marker.replaceWith(tocEl);
    }
  }

  onSettingsChange() {
    // Re-render TOC with new settings — need to restore [TOC] markers first
    const content = document.querySelector('#content');
    if (!content) return;
    // Remove existing auto-toc elements and re-insert from scratch
    content.querySelectorAll('.auto-toc').forEach(el => {
      const p = document.createElement('p');
      p.textContent = '[TOC]';
      el.replaceWith(p);
    });
    this.insertToc();
  }

  async destroy() {
    // Restore [TOC] markers
    const content = document.querySelector('#content');
    if (content) {
      content.querySelectorAll('.auto-toc').forEach(el => {
        const p = document.createElement('p');
        p.textContent = '[TOC]';
        el.replaceWith(p);
      });
    }
    await super.destroy();
  }
}
