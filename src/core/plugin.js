/**
 * Vexa MD - Plugin Base Class
 *
 * All plugins should extend this class and implement the required methods.
 *
 * @example
 * ```javascript
 * import { Plugin } from './core/plugin.js';
 *
 * export default class MyPlugin extends Plugin {
 *   static id = 'my-plugin';
 *   static name = 'My Plugin';
 *   static version = '1.0.0';
 *   static description = 'A sample plugin';
 *
 *   async init() {
 *     // Initialize plugin
 *     this.api.events.on('file:loaded', this.onFileLoaded.bind(this));
 *   }
 *
 *   async destroy() {
 *     // Cleanup
 *   }
 * }
 * ```
 */
export class Plugin {
  // Static metadata - override in subclass
  static id = 'base-plugin';
  static name = 'Base Plugin';
  static version = '1.0.0';
  static description = '';
  static author = '';
  static homepage = '';

  // Plugin capabilities declaration
  static capabilities = {
    markdown: false,    // Uses markdown extension API
    ui: false,          // Uses UI extension API
    toolbar: false,     // Adds toolbar buttons
    settings: false,    // Has settings panel
  };

  // Default settings schema (override in subclass)
  static defaultSettings = {};

  /**
   * @param {Object} api - Plugin API provided by PluginManager
   */
  constructor(api) {
    this.api = api;
    this.settings = { ...this.constructor.defaultSettings };
    this._eventUnsubscribers = [];
    this._uiElements = [];
  }

  /**
   * Plugin metadata getter
   */
  get metadata() {
    return {
      id: this.constructor.id,
      name: this.constructor.name,
      version: this.constructor.version,
      description: this.constructor.description,
      author: this.constructor.author,
      homepage: this.constructor.homepage,
      capabilities: this.constructor.capabilities,
    };
  }

  /**
   * Initialize the plugin. Override in subclass.
   * Called when plugin is enabled.
   * @returns {Promise<void>}
   */
  async init() {
    // Override in subclass
  }

  /**
   * Destroy the plugin. Override in subclass.
   * Called when plugin is disabled. Should cleanup all resources.
   * @returns {Promise<void>}
   */
  async destroy() {
    // Cleanup event subscriptions
    this._eventUnsubscribers.forEach(unsub => unsub());
    this._eventUnsubscribers = [];

    // Cleanup UI elements
    this._uiElements.forEach(el => el.remove());
    this._uiElements = [];
  }

  /**
   * Get plugin settings
   * @returns {Object}
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update plugin settings
   * @param {Object} newSettings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.onSettingsChange(this.settings);
  }

  /**
   * Called when settings change. Override in subclass.
   * @param {Object} settings
   */
  onSettingsChange(settings) {
    // Override in subclass
  }

  /**
   * Register an event listener (auto-cleanup on destroy)
   * @protected
   */
  _on(event, callback) {
    const unsub = this.api.events.on(event, callback);
    this._eventUnsubscribers.push(unsub);
    return unsub;
  }

  /**
   * Register a store subscription (auto-cleanup on destroy)
   * @protected
   */
  _subscribe(key, callback) {
    const unsub = this.api.store.subscribe(key, callback);
    this._eventUnsubscribers.push(unsub);
    return unsub;
  }

  /**
   * Track a UI element for auto-cleanup
   * @protected
   */
  _trackElement(element) {
    this._uiElements.push(element);
    return element;
  }
}

export default Plugin;
