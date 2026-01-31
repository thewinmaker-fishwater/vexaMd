/**
 * Footnote Plugin for Vexa MD
 *
 * Processes [^1] inline references and [^1]: definitions in rendered content.
 * Renders superscript links and a footnotes section at the bottom.
 */

import { Plugin } from '../../core/plugin.js';

export default class FootnotePlugin extends Plugin {
  static id = 'footnote';
  static name = 'Footnote';
  static version = '1.0.0';
  static description = 'Renders [^1] footnote syntax';
  static author = 'Vexa MD Team';

  static capabilities = { markdown: true, ui: true, toolbar: false, settings: true };

  static defaultSettings = {
    backToRef: true,
  };

  async init() {
    this.injectStyles();
    this._on('content:rendered', () => this.processFootnotes());
    this._on('file:loaded', () => setTimeout(() => this.processFootnotes(), 100));
    setTimeout(() => this.processFootnotes(), 500);
  }

  injectStyles() {
    if (document.getElementById('footnote-styles')) return;
    const style = document.createElement('style');
    style.id = 'footnote-styles';
    style.textContent = `
      .fn-ref {
        font-size: 0.75em;
        vertical-align: super;
        line-height: 0;
        padding: 0 1px;
      }
      .fn-ref a {
        color: var(--accent, #6366f1);
        text-decoration: none;
        font-weight: 600;
      }
      .fn-ref a:hover {
        text-decoration: underline;
      }
      .fn-section {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid var(--border, #e0e0e0);
        font-size: 0.85em;
        color: var(--text-muted, #666);
      }
      .fn-section ol {
        padding-left: 20px;
        margin: 8px 0;
      }
      .fn-section li {
        margin: 4px 0;
        line-height: 1.5;
      }
      .fn-back {
        margin-left: 4px;
        color: var(--accent, #6366f1);
        text-decoration: none;
        font-size: 0.85em;
      }
      .fn-back:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
    this._trackElement(style);
  }

  processFootnotes() {
    const content = document.querySelector('#content');
    if (!content) return;

    // Remove previously inserted footnote sections
    content.querySelectorAll('.fn-section').forEach(el => el.remove());
    // Remove previously wrapped fn-ref spans
    content.querySelectorAll('.fn-ref').forEach(el => {
      el.replaceWith(el.textContent);
    });

    const html = content.innerHTML;

    // Collect footnote definitions: <p>[^id]: text</p>
    const defRegex = /\[\^([^\]]+)\]:\s*(.*)/g;
    const definitions = {};
    let match;

    // Search raw text of all paragraphs for definitions
    const allElements = content.querySelectorAll('p, li');
    const defElements = [];
    for (const el of allElements) {
      const text = el.textContent;
      defRegex.lastIndex = 0;
      while ((match = defRegex.exec(text)) !== null) {
        definitions[match[1]] = match[2].trim();
        defElements.push(el);
      }
    }

    if (Object.keys(definitions).length === 0) return;

    // Remove definition paragraphs from content
    for (const el of defElements) {
      // Only remove if the entire element is a definition
      defRegex.lastIndex = 0;
      const remaining = el.textContent.replace(defRegex, '').trim();
      if (!remaining) {
        el.remove();
      }
    }

    // Replace inline references [^id] with superscript links
    const refKeys = Object.keys(definitions);
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (/\[\^[^\]]+\]/.test(node.textContent) && !node.textContent.includes(']: ')) {
        textNodes.push(node);
      }
    }

    for (const textNode of textNodes) {
      const parts = textNode.textContent.split(/(\[\^[^\]]+\])/);
      if (parts.length <= 1) continue;

      const frag = document.createDocumentFragment();
      for (const part of parts) {
        const refMatch = part.match(/^\[\^([^\]]+)\]$/);
        if (refMatch && definitions[refMatch[1]]) {
          const id = refMatch[1];
          const idx = refKeys.indexOf(id) + 1;
          const span = document.createElement('span');
          span.className = 'fn-ref';
          span.id = `fnref-${id}`;
          span.innerHTML = `<a href="#fn-${id}" title="${this.escapeAttr(definitions[id])}">[${idx}]</a>`;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }

    // Build footnotes section
    const section = document.createElement('div');
    section.className = 'fn-section';
    let ol = '<ol>';
    for (const id of refKeys) {
      const backLink = this.settings.backToRef
        ? ` <a class="fn-back" href="#fnref-${id}" title="Back">↩</a>`
        : '';
      ol += `<li id="fn-${id}">${this.escapeHtml(definitions[id])}${backLink}</li>`;
    }
    ol += '</ol>';
    section.innerHTML = ol;

    // Click handler for smooth scroll
    section.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      e.preventDefault();
      const targetId = link.getAttribute('href')?.slice(1);
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    content.addEventListener('click', (e) => {
      const link = e.target.closest('.fn-ref a');
      if (!link) return;
      e.preventDefault();
      const targetId = link.getAttribute('href')?.slice(1);
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    content.appendChild(section);
  }

  escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
  }

  escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  onSettingsChange() {
    this.processFootnotes();
  }

  async destroy() {
    const content = document.querySelector('#content');
    if (content) {
      content.querySelectorAll('.fn-section').forEach(el => el.remove());
    }
    await super.destroy();
  }
}
