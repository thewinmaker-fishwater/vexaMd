/**
 * Vexa MD - Plugin UI Module
 *
 * Provides UI for managing plugins: listing, enabling/disabling, settings,
 * installation, uninstallation, and error display.
 */

import { pluginManager } from '../../core/plugin-manager.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { store } from '../../core/store.js';
import { i18n } from '../../i18n.js';
import { $id, createElement, show, hide } from '../../core/dom.js';
import { marked } from 'marked';

class PluginUI {
  constructor() {
    this.modal = null;
    this.initialized = false;
  }

  /**
   * Get current language translations
   */
  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  /**
   * Get current language code
   */
  get currentLang() {
    return store.get('language') || 'ko';
  }

  /**
   * Initialize the Plugin UI
   */
  init() {
    if (this.initialized) return;

    // Create modal if not exists
    this.createModal();

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
  }

  /**
   * Create the plugin management modal
   */
  createModal() {
    // Check if already exists
    if ($id('plugin-modal')) {
      this.modal = $id('plugin-modal');
      return;
    }

    this.modal = createElement('div', {
      id: 'plugin-modal',
      className: 'modal plugin-settings-modal hidden',
      html: `
        <div class="modal-backdrop"></div>
        <div class="modal-content plugin-settings-content">
          <div class="modal-header">
            <h2>${this.lang.pluginSettings || 'Plugins'}</h2>
            <div class="plugin-header-actions">
              <button class="btn-secondary plugin-dev-guide-btn" id="plugin-dev-guide-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                ${this.lang.pluginDevGuide || 'Dev Guide'}
              </button>
              <button class="btn-secondary plugin-install-btn" id="plugin-install-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                ${this.lang.installPlugin || 'Install Plugin'}
              </button>
              <button class="modal-close" id="plugin-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="plugin-list-container">
            <div id="plugin-list" class="plugin-list"></div>
          </div>
          <div class="modal-footer">
            <button id="plugin-modal-ok" class="btn-primary">${this.lang.confirm || 'OK'}</button>
          </div>
        </div>
      `,
    });

    document.body.appendChild(this.modal);

    // Bind modal events
    this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
    $id('plugin-modal-close')?.addEventListener('click', () => this.close());
    $id('plugin-modal-ok')?.addEventListener('click', () => this.close());
    $id('plugin-dev-guide-btn')?.addEventListener('click', () => this.openDevGuide());
    $id('plugin-install-btn')?.addEventListener('click', () => this.handleInstallPlugin());
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Update plugin list when plugins change
    eventBus.on(EVENTS.PLUGIN_ENABLED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGIN_DISABLED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGINS_LOADED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGIN_INSTALLED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGIN_UNINSTALLED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGIN_ERROR, () => this.updatePluginList());

    // Update texts on language change
    store.subscribe('language', () => {
      this.updateTexts();
      this.updatePluginList();
    });
  }

  /**
   * Open the plugin management modal
   */
  open() {
    if (!this.modal) this.createModal();

    this.updatePluginList();
    this.modal.classList.remove('hidden');
    eventBus.emit(EVENTS.MODAL_OPENED, { type: 'plugins' });
  }

  /**
   * Close the plugin management modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      eventBus.emit(EVENTS.MODAL_CLOSED, { type: 'plugins' });
    }
  }

  /**
   * Toggle the modal
   */
  toggle() {
    if (this.modal?.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Handle install plugin button click
   */
  async handleInstallPlugin() {
    try {
      if (!window.__TAURI__) {
        console.warn('Plugin installation requires Tauri environment');
        return;
      }

      const { open } = window.__TAURI__.dialog;
      const selected = await open({
        directory: true,
        title: this.lang.installPlugin || 'Install Plugin',
      });

      if (selected) {
        const success = await pluginManager.installFromFolder(selected);
        if (success) {
          this.updatePluginList();
        }
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  }

  /**
   * Handle uninstall plugin
   * @param {string} pluginId
   */
  async handleUninstallPlugin(pluginId) {
    const confirmed = confirm(this.lang.uninstallConfirm || 'Are you sure you want to uninstall this plugin?');
    if (!confirmed) return;

    await pluginManager.uninstall(pluginId);
    this.updatePluginList();
  }

  /**
   * Handle retry plugin
   * @param {string} pluginId
   */
  async handleRetryPlugin(pluginId) {
    await pluginManager.retry(pluginId);
    this.updatePluginList();
  }

  /**
   * Open plugin help: show help text in modal, or open homepage in browser
   * @param {string} pluginId
   */
  openPluginHelp(pluginId) {
    const plugins = pluginManager.getPluginList();
    const plugin = plugins.find(p => p.id === pluginId);
    if (!plugin) return;

    // If help field exists, show in modal
    if (plugin.help) {
      const helpText = this.resolveI18nLabel(plugin.help, null);
      if (helpText) {
        this.showHelpModal(plugin.name, helpText);
        return;
      }
    }

    // Otherwise open homepage URL
    if (plugin.homepage) {
      if (window.__TAURI__?.shell?.open) {
        window.__TAURI__.shell.open(plugin.homepage);
      } else {
        window.open(plugin.homepage, '_blank');
      }
    }
  }

  /**
   * Show a help text modal
   * @param {string} title
   * @param {string} content
   */
  showHelpModal(title, content) {
    const helpModal = createElement('div', {
      className: 'modal plugin-help-modal',
      html: `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.escapeHtml(title)} - ${this.lang.help || 'Help'}</h2>
            <button class="modal-close plugin-help-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="plugin-help-content" style="padding: 16px; white-space: pre-wrap;">${this.escapeHtml(content)}</div>
          <div class="modal-footer">
            <button class="btn-primary plugin-help-ok">${this.lang.confirm || 'OK'}</button>
          </div>
        </div>
      `,
    });

    document.body.appendChild(helpModal);

    const closeHelp = () => helpModal.remove();
    helpModal.querySelector('.modal-backdrop').addEventListener('click', closeHelp);
    helpModal.querySelector('.plugin-help-close').addEventListener('click', closeHelp);
    helpModal.querySelector('.plugin-help-ok').addEventListener('click', closeHelp);
  }

  /**
   * Open the plugin development guide modal
   */
  async openDevGuide() {
    const GITHUB_URL = 'https://github.com/pinkpong/workspace-mdView/blob/main/docs/plugin-development.md';

    try {
      const res = await fetch('/plugin-development.md');
      if (!res.ok) throw new Error('Failed to load guide');
      const md = await res.text();
      const html = marked.parse(md);

      const guideModal = createElement('div', {
        className: 'modal plugin-guide-modal',
        html: `
          <div class="modal-backdrop"></div>
          <div class="modal-content plugin-guide-content">
            <div class="modal-header">
              <h2>${this.lang.pluginDevGuide || 'Dev Guide'}</h2>
              <button class="modal-close plugin-guide-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="plugin-guide-body markdown-body">${html}</div>
            <div class="modal-footer">
              <button class="btn-secondary plugin-guide-github">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                ${this.lang.openOnGithub || 'View on GitHub'}
              </button>
              <button class="btn-primary plugin-guide-ok">${this.lang.confirm || 'OK'}</button>
            </div>
          </div>
        `,
      });

      document.body.appendChild(guideModal);

      const closeGuide = () => guideModal.remove();
      guideModal.querySelector('.modal-backdrop').addEventListener('click', closeGuide);
      guideModal.querySelector('.plugin-guide-close').addEventListener('click', closeGuide);
      guideModal.querySelector('.plugin-guide-ok').addEventListener('click', closeGuide);
      guideModal.querySelector('.plugin-guide-github').addEventListener('click', () => {
        if (window.__TAURI__?.shell?.open) {
          window.__TAURI__.shell.open(GITHUB_URL);
        } else {
          window.open(GITHUB_URL, '_blank');
        }
      });
    } catch (err) {
      console.error('Failed to open dev guide:', err);
      // Fallback: open GitHub directly
      if (window.__TAURI__?.shell?.open) {
        window.__TAURI__.shell.open(GITHUB_URL);
      } else {
        window.open(GITHUB_URL, '_blank');
      }
    }
  }

  /**
   * Update the plugin list display
   */
  updatePluginList() {
    const listContainer = $id('plugin-list');
    if (!listContainer) return;

    const plugins = pluginManager.getPluginList();

    if (plugins.length === 0) {
      listContainer.innerHTML = `
        <div class="plugin-empty">
          ${this.lang.noPlugins || 'No plugins available'}
        </div>
      `;
      return;
    }

    listContainer.innerHTML = plugins.map(plugin => this.renderPluginCard(plugin)).join('');

    // Bind toggle events
    listContainer.querySelectorAll('.plugin-toggle').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const pluginId = e.target.dataset.pluginId;
        if (e.target.checked) {
          await pluginManager.enable(pluginId);
        } else {
          await pluginManager.disable(pluginId);
        }
      });
    });

    // Bind settings button events
    listContainer.querySelectorAll('.plugin-settings-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pluginId = btn.dataset.pluginId;
        this.openPluginSettings(pluginId);
      });
    });

    // Bind uninstall button events
    listContainer.querySelectorAll('.plugin-uninstall-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pluginId = btn.dataset.pluginId;
        this.handleUninstallPlugin(pluginId);
      });
    });

    // Bind help button events
    listContainer.querySelectorAll('.plugin-help-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pluginId = btn.dataset.pluginId;
        this.openPluginHelp(pluginId);
      });
    });

    // Bind retry button events
    listContainer.querySelectorAll('.plugin-retry-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pluginId = btn.dataset.pluginId;
        this.handleRetryPlugin(pluginId);
      });
    });
  }

  /**
   * Render a plugin card
   * @param {Object} plugin - Plugin metadata
   * @returns {string} HTML string
   */
  renderPluginCard(plugin) {
    const hasSettings = plugin.capabilities?.settings;
    const hasError = !!plugin.error;
    const cardClass = hasError ? 'error' : (plugin.enabled ? 'enabled' : 'disabled');

    return `
      <div class="plugin-card ${cardClass}" data-plugin-id="${plugin.id}">
        <div class="plugin-card-header">
          <div class="plugin-info">
            <h3 class="plugin-name">${this.escapeHtml(plugin.name)}</h3>
            <span class="plugin-version">v${this.escapeHtml(plugin.version)}</span>
            ${plugin.builtIn
              ? `<span class="plugin-badge built-in">${this.lang.builtIn || 'Built-in'}</span>`
              : `<span class="plugin-badge user-installed">${this.lang.userInstalled || 'User Installed'}</span>`
            }
          </div>
          <label class="plugin-toggle-switch">
            <input type="checkbox" class="plugin-toggle" data-plugin-id="${plugin.id}" ${plugin.enabled ? 'checked' : ''} ${hasError ? 'disabled' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p class="plugin-description">${this.escapeHtml(plugin.description || '')}</p>
        ${plugin.author ? `<p class="plugin-author">${this.lang.author || 'Author'}: ${this.escapeHtml(plugin.author)}</p>` : ''}
        ${hasError ? this.renderPluginError(plugin) : ''}
        <div class="plugin-card-footer">
          ${hasError ? `
            <button class="plugin-retry-btn btn-secondary" data-plugin-id="${plugin.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              ${this.lang.pluginRetry || 'Retry'}
            </button>
          ` : ''}
          ${plugin.help || plugin.homepage ? `
            <button class="plugin-help-btn btn-secondary" data-plugin-id="${plugin.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              ${this.lang.help || 'Help'}
            </button>
          ` : ''}
          ${hasSettings && !hasError ? `
            <button class="plugin-settings-btn btn-secondary" data-plugin-id="${plugin.id}" ${!plugin.enabled ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              ${this.lang.settings || 'Settings'}
            </button>
          ` : ''}
          ${!plugin.builtIn ? `
            <button class="plugin-uninstall-btn btn-danger" data-plugin-id="${plugin.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              ${this.lang.uninstallPlugin || 'Uninstall'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render plugin error section
   * @param {Object} plugin
   * @returns {string}
   */
  renderPluginError(plugin) {
    return `
      <div class="plugin-error-section">
        <div class="plugin-error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${this.lang.pluginLoadError || 'Plugin load failed'}: ${this.escapeHtml(plugin.error.message)}</span>
        </div>
        ${plugin.error.stack ? `
          <details class="plugin-error-details">
            <summary>${this.lang.pluginErrorDetails || 'Error Details'}</summary>
            <pre class="plugin-error-stack">${this.escapeHtml(plugin.error.stack)}</pre>
          </details>
        ` : ''}
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Open plugin settings panel
   * @param {string} pluginId - Plugin ID
   */
  openPluginSettings(pluginId) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin?.instance) return;

    const settings = plugin.instance.getSettings();
    const defaultSettings = plugin.PluginClass.defaultSettings || {};
    const settingsSchema = plugin.settingsSchema || null;

    // Create settings modal
    const settingsModal = createElement('div', {
      id: `plugin-settings-${pluginId}`,
      className: 'modal plugin-settings-detail-modal',
      html: `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>${plugin.metadata.name} ${this.lang.settings || 'Settings'}</h2>
            <button class="modal-close plugin-settings-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="plugin-settings-form">
            ${settingsSchema
              ? this.renderSchemaSettingsForm(settingsSchema, settings)
              : this.renderSettingsForm(settings, defaultSettings)
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary plugin-settings-reset">${this.lang.reset || 'Reset'}</button>
            <button class="btn-primary plugin-settings-save">${this.lang.apply || 'Apply'}</button>
          </div>
        </div>
      `,
    });

    document.body.appendChild(settingsModal);

    // Bind events
    const closeSettings = () => {
      settingsModal.remove();
    };

    settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettings);
    settingsModal.querySelector('.plugin-settings-close').addEventListener('click', closeSettings);

    settingsModal.querySelector('.plugin-settings-reset').addEventListener('click', () => {
      // Reset to defaults from schema or defaultSettings
      const resetSettings = {};
      if (settingsSchema) {
        for (const [key, schema] of Object.entries(settingsSchema)) {
          resetSettings[key] = schema.default !== undefined ? schema.default : '';
        }
      } else {
        Object.assign(resetSettings, defaultSettings);
      }
      plugin.instance.updateSettings(resetSettings);
      pluginManager.savePluginSettings(pluginId, resetSettings);
      closeSettings();
    });

    settingsModal.querySelector('.plugin-settings-save').addEventListener('click', () => {
      const formData = this.getSettingsFormData(settingsModal.querySelector('.plugin-settings-form'));
      plugin.instance.updateSettings(formData);
      pluginManager.savePluginSettings(pluginId, formData);
      closeSettings();
    });
  }

  /**
   * Render schema-based settings form (from plugin.json settings)
   * @param {Object} schema - Settings schema from plugin.json
   * @param {Object} currentSettings - Current settings values
   * @returns {string} HTML string
   */
  renderSchemaSettingsForm(schema, currentSettings) {
    const fields = Object.entries(schema).map(([key, fieldSchema]) => {
      const value = currentSettings[key] ?? fieldSchema.default ?? '';
      return this.renderField(key, fieldSchema, value);
    });

    return fields.length > 0
      ? fields.join('')
      : `<p class="no-settings">${this.lang.noSettings || 'No settings available'}</p>`;
  }

  /**
   * Render a single settings field based on its schema type
   * @param {string} key - Setting key
   * @param {Object} schema - Field schema
   * @param {*} currentValue - Current value
   * @returns {string} HTML string
   */
  renderField(key, schema, currentValue) {
    const label = this.resolveI18nLabel(schema.label, key);
    const help = this.resolveI18nLabel(schema.help, null);
    const helpHtml = help ? `<p class="settings-field-help">${help}</p>` : '';
    const type = schema.type || (typeof currentValue);

    switch (type) {
      case 'boolean':
        return `
          <div class="settings-field">
            <label>
              <input type="checkbox" name="${key}" ${currentValue ? 'checked' : ''}>
              <span>${label}</span>
            </label>
            ${helpHtml}
          </div>
        `;

      case 'number':
        return `
          <div class="settings-field">
            <label>${label}</label>
            <input type="number" name="${key}" value="${currentValue}"
              ${schema.min !== undefined ? `min="${schema.min}"` : ''}
              ${schema.max !== undefined ? `max="${schema.max}"` : ''}
              ${schema.step !== undefined ? `step="${schema.step}"` : ''}>
            ${helpHtml}
          </div>
        `;

      case 'select':
        return `
          <div class="settings-field">
            <label>${label}</label>
            <select name="${key}">
              ${(schema.options || []).map(opt => `
                <option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>
              `).join('')}
            </select>
            ${helpHtml}
          </div>
        `;

      case 'color':
        return `
          <div class="settings-field settings-field-color">
            <label>${label}</label>
            <div class="settings-color-wrapper">
              <input type="color" name="${key}" value="${currentValue || '#000000'}">
              <span class="settings-color-value">${currentValue || '#000000'}</span>
            </div>
            ${helpHtml}
          </div>
        `;

      case 'textarea':
        return `
          <div class="settings-field">
            <label>${label}</label>
            <textarea name="${key}" rows="${schema.rows || 4}">${currentValue || ''}</textarea>
            ${helpHtml}
          </div>
        `;

      case 'range':
        return `
          <div class="settings-field settings-field-range">
            <label>${label}</label>
            <div class="settings-range-wrapper">
              <input type="range" name="${key}" value="${currentValue}"
                min="${schema.min ?? 0}" max="${schema.max ?? 100}" step="${schema.step ?? 1}">
              <span class="settings-range-value">${currentValue}</span>
            </div>
            ${helpHtml}
          </div>
        `;

      case 'string':
      default:
        return `
          <div class="settings-field">
            <label>${label}</label>
            <input type="text" name="${key}" value="${currentValue || ''}">
            ${helpHtml}
          </div>
        `;
    }
  }

  /**
   * Resolve an i18n label object or string
   * @param {Object|string|undefined} label - Label value (i18n object, string, or undefined)
   * @param {string|null} fallbackKey - Fallback: format key as label
   * @returns {string}
   */
  resolveI18nLabel(label, fallbackKey) {
    if (!label) {
      return fallbackKey ? this.formatSettingLabel(fallbackKey) : '';
    }
    if (typeof label === 'string') return label;
    if (typeof label === 'object') {
      return label[this.currentLang] || label['en'] || label[Object.keys(label)[0]] || (fallbackKey ? this.formatSettingLabel(fallbackKey) : '');
    }
    return fallbackKey ? this.formatSettingLabel(fallbackKey) : '';
  }

  /**
   * Render settings form fields (legacy: from defaultSettings object)
   * @param {Object} settings - Current settings
   * @param {Object} defaultSettings - Default settings schema
   * @returns {string} HTML string
   */
  renderSettingsForm(settings, defaultSettings) {
    const fields = Object.entries(defaultSettings).map(([key, defaultValue]) => {
      const value = settings[key] ?? defaultValue;
      const type = typeof defaultValue;

      if (type === 'boolean') {
        return `
          <div class="settings-field">
            <label>
              <input type="checkbox" name="${key}" ${value ? 'checked' : ''}>
              <span>${this.formatSettingLabel(key)}</span>
            </label>
          </div>
        `;
      }

      if (type === 'number') {
        return `
          <div class="settings-field">
            <label>${this.formatSettingLabel(key)}</label>
            <input type="number" name="${key}" value="${value}">
          </div>
        `;
      }

      if (Array.isArray(defaultValue)) {
        return `
          <div class="settings-field">
            <label>${this.formatSettingLabel(key)}</label>
            <select name="${key}">
              ${defaultValue.map(opt => `
                <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
              `).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div class="settings-field">
          <label>${this.formatSettingLabel(key)}</label>
          <input type="text" name="${key}" value="${value}">
        </div>
      `;
    });

    return fields.length > 0 ? fields.join('') : `<p class="no-settings">${this.lang.noSettings || 'No settings available'}</p>`;
  }

  /**
   * Format setting key to readable label
   * @param {string} key - Setting key
   * @returns {string} Formatted label
   */
  formatSettingLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get form data from settings form
   * @param {HTMLElement} form - Form element
   * @returns {Object} Settings object
   */
  getSettingsFormData(form) {
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.type === 'checkbox') {
        data[input.name] = input.checked;
      } else if (input.type === 'number' || input.type === 'range') {
        data[input.name] = parseFloat(input.value);
      } else {
        data[input.name] = input.value;
      }
    });
    return data;
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    if (!this.modal) return;

    const header = this.modal.querySelector('.modal-header h2');
    if (header) header.textContent = this.lang.pluginSettings || 'Plugins';

    const okBtn = $id('plugin-modal-ok');
    if (okBtn) okBtn.textContent = this.lang.confirm || 'OK';

    const installBtn = $id('plugin-install-btn');
    if (installBtn) {
      const textNode = installBtn.childNodes[installBtn.childNodes.length - 1];
      if (textNode) textNode.textContent = ` ${this.lang.installPlugin || 'Install Plugin'}`;
    }
  }
}

// Export singleton instance
export const pluginUI = new PluginUI();
export default pluginUI;
