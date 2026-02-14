/**
 * Markdown Renderer Module
 * marked setup, githubSlug, processAlerts, renderMarkdown, renderPages
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import { i18n } from '../../i18n.js';
import { showError } from '../notification/notification.js';
import { generateToc } from '../toc/toc.js';
import { getMarkdownHooks } from '../../core/plugin-api.js';
import { eventBus, EVENTS } from '../../core/events.js';

// ========== Marked 설정 ==========
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
});

const renderer = new marked.Renderer();

// ========== GFM Task List (Checkbox) 스타일링 ==========
// marked의 기본 GFM 체크박스 렌더링을 사용하고, CSS로 스타일링만 적용

function githubSlug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s\u3131-\uD79D가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const headingCount = {};
renderer.heading = function(text, level) {
  const rawText = typeof text === 'object' ? text.text : text;
  let slug = githubSlug(rawText);
  if (headingCount[slug] !== undefined) {
    headingCount[slug]++;
    slug = `${slug}-${headingCount[slug]}`;
  } else {
    headingCount[slug] = 0;
  }
  return `<h${level} id="${slug}">${rawText}</h${level}>`;
};

renderer.code = function(code, language) {
  if (typeof code === 'object') {
    language = code.lang;
    code = code.text;
  }

  const originalLanguage = language || '';
  const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
  const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const langLabel = originalLanguage || '';

  const copyBtn = `<button class="code-copy-btn" title="복사">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
    </svg>
  </button>`;

  try {
    const highlighted = hljs.highlight(code, { language: validLanguage }).value;
    const languageClass = originalLanguage ? `language-${originalLanguage}` : '';
    return `<div class="code-block-wrapper" data-language="${originalLanguage}">
      ${langLabel ? `<span class="code-lang-label">${langLabel}</span>` : ''}
      ${copyBtn}
      <pre data-code="${escapedCode}"><code class="hljs ${languageClass}">${highlighted}</code></pre>
    </div>`;
  } catch (e) {
    console.warn('Highlight error:', e);
    const languageClass = originalLanguage ? `language-${originalLanguage}` : '';
    return `<div class="code-block-wrapper" data-language="${originalLanguage}">
      ${copyBtn}
      <pre data-code="${escapedCode}"><code class="hljs ${languageClass}">${hljs.highlightAuto(code).value}</code></pre>
    </div>`;
  }
};

marked.use({ renderer });

// ========== GitHub-style Alerts ==========
const ALERT_TYPES = {
  NOTE: { icon: '📝', class: 'alert-note', label: { ko: '참고', en: 'Note' } },
  TIP: { icon: '💡', class: 'alert-tip', label: { ko: '팁', en: 'Tip' } },
  IMPORTANT: { icon: '❗', class: 'alert-important', label: { ko: '중요', en: 'Important' } },
  WARNING: { icon: '⚠️', class: 'alert-warning', label: { ko: '경고', en: 'Warning' } },
  CAUTION: { icon: '🚨', class: 'alert-caution', label: { ko: '주의', en: 'Caution' } }
};

function processAlerts(text, currentLanguage) {
  const alertPattern = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n((?:>.*\n?)*)/gim;
  return text.replace(alertPattern, (match, type, contentBlock) => {
    const alertType = ALERT_TYPES[type.toUpperCase()];
    if (!alertType) return match;
    const contentText = contentBlock
      .split('\n')
      .map(line => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();
    const label = alertType.label[currentLanguage] || alertType.label.en;
    return `\n<div class="alert-box ${alertType.class}">
<div class="alert-header">
<span class="alert-icon">${alertType.icon}</span>
<span class="alert-title">${label}</span>
</div>
<div class="alert-content">

${contentText}

</div>
</div>\n`;
  });
}

// ========== State ==========
let pages = [];
let currentPage = 0;
let lastCtx = null;

export function getPages() {
  return pages;
}

export function getCurrentPage() {
  return currentPage;
}

export function goToPage(pageNum, contentEl) {
  if (pageNum < 0) pageNum = 0;
  if (pageNum >= pages.length) pageNum = pages.length - 1;
  currentPage = pageNum;
  renderPages(contentEl);
  contentEl.scrollTop = 0;
}

export function renderMarkdown(text, isNewFile, ctx) {
  const { contentEl, currentLanguage, currentViewMode, attachImageClickListeners } = ctx;
  const startTime = performance.now();

  try {
    let normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const markdownHooks = getMarkdownHooks();
    for (const hook of markdownHooks.beforeRender) {
      try {
        normalizedText = hook.callback(normalizedText) || normalizedText;
      } catch (err) {
        console.error(`[Plugin] beforeRender hook error (${hook.pluginId}):`, err);
      }
    }

    const processedText = processAlerts(normalizedText, currentLanguage);
    const pageTexts = processedText.split(/\n\s*-{3,}\s*\n|\n\s*-{3,}\s*$|^\s*-{3,}\s*\n/);
    Object.keys(headingCount).forEach(k => delete headingCount[k]);
    pages = pageTexts.filter(p => p.trim()).map(p => marked.parse(p));

    if (isNewFile) {
      currentPage = 0;
    }

    renderPages(contentEl, ctx);

    const elapsed = (performance.now() - startTime).toFixed(1);
    console.log(`Rendered ${pages.length} pages in ${elapsed}ms`);
  } catch (error) {
    showError('Markdown 파싱 오류', error.message);
  }
}

export function renderPages(contentEl, ctx) {
  if (ctx) lastCtx = ctx;
  else if (lastCtx) ctx = lastCtx;
  else return;
  const { currentViewMode, currentLanguage, attachImageClickListeners } = ctx;

  contentEl.classList.add('markdown-body');

  if (currentViewMode === 'single') {
    const allContent = pages.join('<hr class="page-break">');
    contentEl.innerHTML = `<div class="markdown-content-wrapper">${allContent}</div>`;
  } else if (currentViewMode === 'double') {
    let doubleContent = '';
    for (let i = 0; i < pages.length; i += 2) {
      const leftPage = pages[i] || '';
      const rightPage = pages[i + 1] || '';
      doubleContent += `
        <div class="double-page-row">
          <div class="page-left">${leftPage}</div>
          <div class="page-right">${rightPage}</div>
        </div>
      `;
      if (i + 2 < pages.length) {
        doubleContent += '<hr class="page-break">';
      }
    }
    contentEl.innerHTML = `<div class="markdown-content-wrapper double-scroll-view">${doubleContent}</div>`;
  } else if (currentViewMode === 'paging') {
    const totalPages = pages.length;
    const currentDisplay = currentPage + 1;

    if (totalPages <= 1) {
      contentEl.innerHTML = `<div class="markdown-content-wrapper">${pages[0] || ''}</div>`;
    } else {
      contentEl.innerHTML = `
        <div class="markdown-content-wrapper paging-view">
          ${pages[currentPage] || ''}
        </div>
        <div class="page-nav">
          <button id="page-prev" class="page-nav-btn" ${currentPage === 0 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="page-indicator-group">
            <input type="number" id="page-input" class="page-input" value="${currentDisplay}" min="1" max="${totalPages}" />
            <span class="page-total">/ ${totalPages}</span>
          </div>
          <button id="page-next" class="page-nav-btn" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      `;

      const prevBtn = document.getElementById('page-prev');
      const nextBtn = document.getElementById('page-next');
      const pageInput = document.getElementById('page-input');

      if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1, contentEl));
      if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1, contentEl));
      if (pageInput) {
        pageInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            goToPage(parseInt(pageInput.value) - 1, contentEl);
          }
        });
        pageInput.addEventListener('blur', () => {
          goToPage(parseInt(pageInput.value) - 1, contentEl);
        });
      }
    }
  } else {
    const allContent = pages.join('<hr class="page-break">');
    contentEl.innerHTML = `<div class="markdown-content-wrapper">${allContent}</div>`;
  }

  attachImageClickListeners();
  generateToc();

  const markdownHooks = getMarkdownHooks();
  for (const hook of markdownHooks.afterRender) {
    try {
      hook.callback(contentEl.innerHTML, contentEl);
    } catch (err) {
      console.error(`[Plugin] afterRender hook error (${hook.pluginId}):`, err);
    }
  }

  eventBus.emit(EVENTS.CONTENT_RENDERED, { container: contentEl });
}
