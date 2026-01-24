/**
 * Vexa MD - Plugin API Factory
 *
 * Creates a sandboxed API object for each plugin with access to
 * events, store, markdown, UI, and DOM utilities.
 */

import { eventBus, EVENTS } from './events.js';
import { store } from './store.js';
import { $, $$, $id, createElement, createFromHTML, toggleClass, show, hide, toggle } from './dom.js';

/**
 * Create markdown hooks registry
 */
const markdownHooks = {
  extensions: [],
  renderers: {},
  beforeRender: [],
  afterRender: [],
};

/**
 * Create UI extension registry
 */
const uiExtensions = {
  toolbarButtons: [],
  toolbarGroups: [],
  settingsSections: [],
};

/**
 * Get markdown hooks (used by main.js for rendering)
 */
export function getMarkdownHooks() {
  return markdownHooks;
}

/**
 * Get UI extensions (used by toolbar and settings UI)
 */
export function getUIExtensions() {
  return uiExtensions;
}

/**
 * Clear all extensions for a specific plugin
 */
export function clearPluginExtensions(pluginId) {
  // Clear markdown extensions
  markdownHooks.extensions = markdownHooks.extensions.filter(e => e.pluginId !== pluginId);

  // Clear renderers
  Object.keys(markdownHooks.renderers).forEach(key => {
    if (markdownHooks.renderers[key]?.pluginId === pluginId) {
      delete markdownHooks.renderers[key];
    }
  });

  // Clear hooks
  markdownHooks.beforeRender = markdownHooks.beforeRender.filter(h => h.pluginId !== pluginId);
  markdownHooks.afterRender = markdownHooks.afterRender.filter(h => h.pluginId !== pluginId);

  // Clear UI extensions
  uiExtensions.toolbarButtons = uiExtensions.toolbarButtons.filter(b => b.pluginId !== pluginId);
  uiExtensions.toolbarGroups = uiExtensions.toolbarGroups.filter(g => g.pluginId !== pluginId);
  uiExtensions.settingsSections = uiExtensions.settingsSections.filter(s => s.pluginId !== pluginId);
}

/**
 * Create Plugin API for a specific plugin
 * @param {string} pluginId - Unique plugin identifier
 * @returns {Object} Plugin API object
 */
export function createPluginAPI(pluginId) {
  return {
    /**
     * Event System API
     * Provides access to the application event bus
     */
    events: {
      /**
       * Subscribe to an event
       * @param {string} event - Event name
       * @param {Function} callback - Event handler
       * @returns {Function} Unsubscribe function
       */
      on: (event, callback) => eventBus.on(event, callback),

      /**
       * Subscribe to an event (one-time)
       * @param {string} event - Event name
       * @param {Function} callback - Event handler
       * @returns {Function} Unsubscribe function
       */
      once: (event, callback) => eventBus.once(event, callback),

      /**
       * Unsubscribe from an event
       * @param {string} event - Event name
       * @param {Function} callback - Event handler
       */
      off: (event, callback) => eventBus.off(event, callback),

      /**
       * Emit an event (prefixed with plugin ID for safety)
       * @param {string} event - Event name
       * @param {*} data - Event data
       */
      emit: (event, data) => eventBus.emit(`plugin:${pluginId}:${event}`, data),

      /**
       * Emit a global event (use sparingly)
       * @param {string} event - Event name
       * @param {*} data - Event data
       */
      emitGlobal: (event, data) => eventBus.emit(event, data),

      /**
       * Available event constants
       */
      EVENTS: { ...EVENTS },
    },

    /**
     * Store API
     * Provides access to application state with namespaced storage for plugins
     */
    store: {
      /**
       * Get a value from the store
       * @param {string} key - State key
       * @returns {*} Value
       */
      get: (key) => store.get(key),

      /**
       * Set a plugin-namespaced value
       * @param {string} key - State key (will be prefixed with plugin ID)
       * @param {*} value - Value to set
       */
      set: (key, value) => store.set(`plugin:${pluginId}:${key}`, value),

      /**
       * Get a plugin-namespaced value
       * @param {string} key - State key (will be prefixed with plugin ID)
       * @returns {*} Value
       */
      getPluginData: (key) => store.get(`plugin:${pluginId}:${key}`),

      /**
       * Subscribe to state changes
       * @param {string} key - State key
       * @param {Function} callback - Change handler
       * @returns {Function} Unsubscribe function
       */
      subscribe: (key, callback) => store.subscribe(key, callback),

      /**
       * Get current theme
       * @returns {string} 'light' or 'dark'
       */
      getTheme: () => store.get('theme'),

      /**
       * Get current language
       * @returns {string} Language code ('ko', 'en', 'ja')
       */
      getLanguage: () => store.get('language'),
    },

    /**
     * Markdown Extension API
     * Allows plugins to extend markdown rendering
     */
    markdown: {
      /**
       * Add a marked extension
       * @param {Object} extension - Marked extension object
       * @see https://marked.js.org/using_pro#extensions
       */
      addExtension: (extension) => {
        markdownHooks.extensions.push({
          pluginId,
          extension,
        });
        eventBus.emit(EVENTS.PLUGIN_MARKDOWN_CHANGED, { pluginId });
      },

      /**
       * Add a custom renderer for a specific element type
       * @param {string} name - Element type (e.g., 'code', 'blockquote')
       * @param {Function} renderer - Renderer function
       */
      addRenderer: (name, renderer) => {
        markdownHooks.renderers[name] = {
          pluginId,
          renderer,
        };
        eventBus.emit(EVENTS.PLUGIN_MARKDOWN_CHANGED, { pluginId });
      },

      /**
       * Add a hook to run before markdown rendering
       * @param {Function} callback - (markdown: string) => string
       */
      onBeforeRender: (callback) => {
        markdownHooks.beforeRender.push({
          pluginId,
          callback,
        });
      },

      /**
       * Add a hook to run after markdown rendering
       * @param {Function} callback - (html: string, container: HTMLElement) => void
       */
      onAfterRender: (callback) => {
        markdownHooks.afterRender.push({
          pluginId,
          callback,
        });
      },
    },

    /**
     * UI Extension API
     * Allows plugins to extend the user interface
     */
    ui: {
      /**
       * Add a button to the toolbar
       * @param {Object} config - Button configuration
       * @param {string} config.id - Unique button ID
       * @param {string} config.icon - SVG icon HTML
       * @param {string} config.title - Tooltip text
       * @param {Function} config.onClick - Click handler
       * @param {string} [config.position='end'] - Position ('start', 'end', or after specific ID)
       */
      addToolbarButton: (config) => {
        const button = {
          pluginId,
          ...config,
          id: `plugin-${pluginId}-${config.id}`,
        };
        uiExtensions.toolbarButtons.push(button);
        eventBus.emit(EVENTS.PLUGIN_UI_CHANGED, { type: 'toolbar', pluginId });
        return button.id;
      },

      /**
       * Add a group of buttons to the toolbar
       * @param {Object} config - Group configuration
       * @param {string} config.id - Unique group ID
       * @param {Array} config.buttons - Array of button configs
       * @param {string} [config.position='end'] - Position
       */
      addToolbarGroup: (config) => {
        const group = {
          pluginId,
          ...config,
          id: `plugin-${pluginId}-${config.id}`,
          buttons: config.buttons.map(btn => ({
            ...btn,
            id: `plugin-${pluginId}-${btn.id}`,
          })),
        };
        uiExtensions.toolbarGroups.push(group);
        eventBus.emit(EVENTS.PLUGIN_UI_CHANGED, { type: 'toolbar', pluginId });
        return group.id;
      },

      /**
       * Remove a toolbar button
       * @param {string} buttonId - Button ID
       */
      removeToolbarButton: (buttonId) => {
        const fullId = buttonId.startsWith('plugin-') ? buttonId : `plugin-${pluginId}-${buttonId}`;
        uiExtensions.toolbarButtons = uiExtensions.toolbarButtons.filter(b => b.id !== fullId);
        eventBus.emit(EVENTS.PLUGIN_UI_CHANGED, { type: 'toolbar', pluginId });
      },

      /**
       * Add a settings section for the plugin
       * @param {Object} config - Settings section configuration
       * @param {string} config.title - Section title
       * @param {Array} config.fields - Settings fields
       */
      addSettingsSection: (config) => {
        uiExtensions.settingsSections.push({
          pluginId,
          ...config,
        });
        eventBus.emit(EVENTS.PLUGIN_UI_CHANGED, { type: 'settings', pluginId });
      },

      /**
       * Show a notification toast
       * @param {string} message - Notification message
       * @param {Object} [options] - Options
       * @param {string} [options.type='info'] - Type ('info', 'success', 'warning', 'error')
       * @param {number} [options.duration=3000] - Duration in ms
       */
      showNotification: (message, options = {}) => {
        eventBus.emit(EVENTS.NOTIFICATION_SHOWN, {
          message,
          type: options.type || 'info',
          duration: options.duration || 3000,
          pluginId,
        });
      },

      /**
       * Create and show a modal dialog
       * @param {Object} config - Modal configuration
       * @param {string} config.title - Modal title
       * @param {string} config.content - HTML content
       * @param {Array} [config.buttons] - Action buttons
       * @returns {Object} Modal controller { close, element }
       */
      createModal: (config) => {
        const modalId = `plugin-modal-${pluginId}-${Date.now()}`;
        const modal = createElement('div', {
          id: modalId,
          className: 'modal plugin-modal',
          html: `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
              <div class="modal-header">
                <h2>${config.title || ''}</h2>
                <button class="modal-close plugin-modal-close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div class="modal-body plugin-modal-body">
                ${config.content || ''}
              </div>
              ${config.buttons ? `
                <div class="modal-footer plugin-modal-footer">
                  ${config.buttons.map(btn => `
                    <button class="${btn.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${btn.action || ''}">${btn.label}</button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `,
        });

        const close = () => {
          modal.classList.add('hidden');
          setTimeout(() => modal.remove(), 300);
          eventBus.emit(EVENTS.MODAL_CLOSED, { modalId, pluginId });
        };

        // Bind close button
        modal.querySelector('.plugin-modal-close')?.addEventListener('click', close);
        modal.querySelector('.modal-backdrop')?.addEventListener('click', close);

        // Bind action buttons
        if (config.buttons) {
          config.buttons.forEach(btn => {
            const el = modal.querySelector(`[data-action="${btn.action}"]`);
            if (el && btn.onClick) {
              el.addEventListener('click', () => {
                btn.onClick();
                if (btn.closeOnClick !== false) close();
              });
            }
          });
        }

        document.body.appendChild(modal);
        eventBus.emit(EVENTS.MODAL_OPENED, { modalId, pluginId });

        return { close, element: modal };
      },
    },

    /**
     * DOM Utilities
     * Safe DOM manipulation helpers
     */
    dom: {
      $,
      $$,
      $id,
      createElement,
      createFromHTML,
      toggleClass,
      show,
      hide,
      toggle,

      /**
       * Get the content container element
       * @returns {HTMLElement}
       */
      getContentContainer: () => $id('content'),

      /**
       * Get the toolbar container element
       * @returns {HTMLElement}
       */
      getToolbarContainer: () => $id('toolbar'),
    },

    /**
     * Plugin utilities
     */
    utils: {
      /**
       * Generate a unique ID
       * @param {string} [prefix=''] - Optional prefix
       * @returns {string}
       */
      generateId: (prefix = '') => `${prefix}${pluginId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

      /**
       * Debounce a function
       * @param {Function} fn - Function to debounce
       * @param {number} delay - Delay in ms
       * @returns {Function}
       */
      debounce: (fn, delay) => {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delay);
        };
      },

      /**
       * Throttle a function
       * @param {Function} fn - Function to throttle
       * @param {number} limit - Time limit in ms
       * @returns {Function}
       */
      throttle: (fn, limit) => {
        let inThrottle;
        return (...args) => {
          if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },
    },
  };
}

export default createPluginAPI;
