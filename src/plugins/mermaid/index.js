/**
 * Mermaid Diagrams Plugin for Vexa MD
 *
 * Renders Mermaid diagrams from ```mermaid code blocks.
 * Supports: flowchart, sequence, class, state, gantt, pie, er, journey diagrams
 */

import { Plugin } from '../../core/plugin.js';
import mermaid from 'mermaid';

export default class MermaidPlugin extends Plugin {
  static id = 'mermaid';
  static name = 'Mermaid Diagrams';
  static version = '1.0.0';
  static description = 'Render Mermaid diagrams in markdown code blocks';
  static author = 'Vexa MD Team';
  static homepage = 'https://mermaid.js.org';

  static capabilities = {
    markdown: true,
    ui: false,
    toolbar: false,
    settings: true,
  };

  static defaultSettings = {
    theme: 'auto',        // 'auto', 'default', 'dark', 'forest', 'neutral'
    securityLevel: 'loose',
  };

  constructor(api) {
    super(api);
    this.mermaid = null;
    this.diagramCounter = 0;
    this.processingBlocks = new Set(); // 중복 렌더링 방지
  }

  async init() {
    // Load Mermaid library dynamically
    await this.loadMermaid();

    // Configure Mermaid
    this.configureMermaid();

    // Register markdown hook to process mermaid blocks after rendering
    this.api.markdown.onAfterRender((html, container) => {
      this.renderMermaidBlocks(container);
    });

    // Listen for content rendered event (for re-renders and late initialization)
    this._on(this.api.events.EVENTS.CONTENT_RENDERED, ({ container }) => {
      this.renderMermaidBlocks(container);
    });

    // Listen for theme changes
    this._subscribe('theme', () => {
      this.configureMermaid();
      this.reRenderDiagrams();
    });

    // Process any existing content (in case plugin loads after content is already rendered)
    const existingContent = this.api.dom.getContentContainer();
    if (existingContent && (
      existingContent.querySelector('code.language-mermaid') ||
      existingContent.querySelector('.code-block-wrapper[data-language="mermaid"]')
    )) {
      this.renderMermaidBlocks(existingContent);
    }

    console.log('[Mermaid Plugin] Initialized');
  }

  async destroy() {
    await super.destroy();
  }

  /**
   * Load Mermaid library
   */
  async loadMermaid() {
    if (this.mermaid) return;
    this.mermaid = mermaid;
  }

  /**
   * Configure Mermaid with current settings
   * Note: Most styling is done via CSS overrides for better theme integration
   */
  configureMermaid() {
    if (!this.mermaid) return;

    this.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        background: 'transparent',
        primaryColor: 'transparent',
        edgeLabelBackground: 'transparent',
      },
      securityLevel: this.settings.securityLevel,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
      },
      sequence: {
        useMaxWidth: false,
        wrap: true,
      },
      gantt: {
        useMaxWidth: false,
      },
      stateDiagram: {
        useMaxWidth: false,
      },
      classDiagram: {
        useMaxWidth: false,
      },
    });
  }

  /**
   * Find and render all Mermaid code blocks in a container
   */
  async renderMermaidBlocks(container) {
    if (!this.mermaid || !container) return;

    // Find all code blocks with mermaid language
    // 1. Try class-based selector
    let codeBlocks = container.querySelectorAll('code.language-mermaid');

    // 2. Try data-language attribute on wrapper
    if (codeBlocks.length === 0) {
      const wrappers = container.querySelectorAll('.code-block-wrapper[data-language="mermaid"]');
      codeBlocks = Array.from(wrappers).map(w => w.querySelector('code')).filter(Boolean);
    }

    // 3. Fallback: check code-lang-label text
    if (codeBlocks.length === 0) {
      const wrappers = container.querySelectorAll('.code-block-wrapper');
      codeBlocks = Array.from(wrappers)
        .filter(w => w.querySelector('.code-lang-label')?.textContent?.toLowerCase() === 'mermaid')
        .map(w => w.querySelector('code'))
        .filter(Boolean);
    }

    for (const codeElement of codeBlocks) {
      const wrapper = codeElement.closest('.code-block-wrapper') || codeElement.parentElement;

      // Skip if already rendered or currently being processed
      if (wrapper.classList.contains('mermaid-wrapper')) {
        continue;
      }

      // 중복 처리 방지: wrapper를 키로 사용
      const blockKey = codeElement.textContent.trim().substring(0, 50);
      if (this.processingBlocks.has(blockKey)) {
        continue;
      }
      this.processingBlocks.add(blockKey);

      const code = codeElement.textContent;

      if (!code.trim()) continue;

      try {
        // Generate unique ID for this diagram
        const diagramId = `mermaid-diagram-${++this.diagramCounter}`;

        // Render the diagram
        const { svg } = await this.mermaid.render(diagramId, code.trim());

        // Create diagram container
        const diagramContainer = document.createElement('div');
        diagramContainer.className = 'mermaid-diagram';
        diagramContainer.innerHTML = svg;

        // Get SVG element for processing
        const svgEl = diagramContainer.querySelector('svg');

        // Make SVG responsive: keep original size but allow shrinking
        if (svgEl) {
          // Get original dimensions from viewBox or attributes
          const viewBox = svgEl.getAttribute('viewBox');
          let originalWidth, originalHeight;

          if (viewBox) {
            const parts = viewBox.split(/\s+/);
            originalWidth = parseFloat(parts[2]) || 800;
            originalHeight = parseFloat(parts[3]) || 600;
          } else {
            originalWidth = parseFloat(svgEl.getAttribute('width')) || 800;
            originalHeight = parseFloat(svgEl.getAttribute('height')) || 600;
            svgEl.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
          }

          // Set max dimensions to original size (never expand beyond original)
          // Set width/height to 100% so it can shrink if container is smaller
          svgEl.setAttribute('width', '100%');
          svgEl.setAttribute('height', 'auto');
          svgEl.style.maxWidth = `${originalWidth}px`;
          svgEl.style.maxHeight = `${originalHeight}px`;
          svgEl.style.display = 'block';
        }

        // Add toggle for viewing source
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mermaid-toggle-source';
        toggleBtn.textContent = '< >';
        toggleBtn.title = 'View source';
        toggleBtn.onclick = () => {
          wrapper.classList.toggle('show-source');
          diagramContainer.classList.toggle('hidden');
        };
        diagramContainer.appendChild(toggleBtn);

        // Replace code block with diagram
        wrapper.classList.add('mermaid-wrapper');
        wrapper.insertBefore(diagramContainer, wrapper.firstChild);

        // Hide code block but keep it for source view
        const pre = codeElement.parentElement;
        if (pre) pre.classList.add('mermaid-source');

        // 처리 완료 후 Set에서 제거
        this.processingBlocks.delete(blockKey);
      } catch (error) {
        this.processingBlocks.delete(blockKey);
        console.warn('[Mermaid Plugin] Failed to render diagram:', error);

        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        errorDiv.innerHTML = `
          <span class="mermaid-error-icon">&#9888;</span>
          <span class="mermaid-error-text">Mermaid syntax error</span>
        `;
        wrapper.insertBefore(errorDiv, wrapper.firstChild);
      }
    }
  }

  /**
   * Re-render all diagrams (e.g., after theme change)
   */
  reRenderDiagrams() {
    // Get the content container
    const content = this.api.dom.getContentContainer();
    if (!content) return;

    // Remove existing rendered diagrams
    content.querySelectorAll('.mermaid-diagram').forEach(el => el.remove());
    content.querySelectorAll('.mermaid-wrapper').forEach(el => {
      el.classList.remove('mermaid-wrapper', 'show-source');
    });
    content.querySelectorAll('.mermaid-source').forEach(el => {
      el.classList.remove('mermaid-source');
    });
    content.querySelectorAll('.mermaid-error').forEach(el => el.remove());

    // Re-render
    this.renderMermaidBlocks(content);
  }

  onSettingsChange(settings) {
    this.configureMermaid();
    this.reRenderDiagrams();
  }
}
