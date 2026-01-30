/**
 * Keyboard Shortcuts Module
 */

import { open } from '@tauri-apps/plugin-shell';

let ctx = {};

export function init(context) {
  ctx = context;
  setupKeyboard();
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Presentation mode first
    if (ctx.handlePresentationKeydown?.(e)) return;

    // F5: Start presentation
    if (e.key === 'F5') {
      e.preventDefault();
      ctx.startPresentation();
    }
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      ctx.openFile();
    }
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      ctx.toggleTheme();
    }
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      ctx.exportTheme();
    }
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      ctx.printDocument();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      ctx.saveCurrentFile();
    }
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      ctx.zoomIn();
    }
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      ctx.zoomOut();
    }
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      ctx.zoomReset();
    }
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      ctx.toggleSearchBar();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      ctx.toggleToc();
    }
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      ctx.closeCurrentTab();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      ctx.handleEscape();
    }
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      ctx.nextTab();
    }
    // Arrow keys for paging
    if (!ctx.getIsSearchVisible() && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      if (ctx.getCurrentViewMode() === 'paging' && ctx.getPages().length > 1) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); ctx.goToPage(ctx.getCurrentPage() - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); ctx.goToPage(ctx.getCurrentPage() + 1); }
      }
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    ctx.handleDocumentClick(e);
  });

  // Link click handler
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    if (/^https?:\/\//.test(href)) {
      e.preventDefault();
      open(href);
      return;
    }
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = decodeURIComponent(href.slice(1));
      const target = document.getElementById(targetId);
      if (target) {
        const content = document.getElementById('content');
        const containerRect = content.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const scrollTop = content.scrollTop + (targetRect.top - containerRect.top);
        content.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  });

  // Code copy button event delegation
  const content = document.getElementById('content');
  content.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.code-copy-btn');
    if (!copyBtn) return;
    const wrapper = copyBtn.closest('.code-block-wrapper');
    const pre = wrapper?.querySelector('pre[data-code]');
    if (!pre) return;
    const code = pre.dataset.code
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.classList.add('copied');
      setTimeout(() => copyBtn.classList.remove('copied'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
}
