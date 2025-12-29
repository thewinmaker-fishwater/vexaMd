/**
 * Store - 중앙 상태 관리 시스템
 * Observer 패턴을 사용하여 상태 변경 시 자동으로 구독자에게 알림
 */

const PERSIST_KEYS = [
  'theme', 'colorTheme', 'language', 'fontSize',
  'fontFamily', 'viewMode', 'contentWidth', 'zoom',
  'recentFiles', 'customStyles'
];

class Store {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.initialized = false;
  }

  /**
   * 초기 상태 설정 및 localStorage에서 복원
   */
  init(defaultState = {}) {
    if (this.initialized) return;

    this.state = { ...defaultState };

    PERSIST_KEYS.forEach(key => {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        try {
          this.state[key] = JSON.parse(saved);
        } catch {
          this.state[key] = saved;
        }
      }
    });

    this.initialized = true;
  }

  get(key) {
    return this.state[key];
  }

  getMultiple(keys) {
    return keys.reduce((acc, key) => {
      acc[key] = this.state[key];
      return acc;
    }, {});
  }

  set(key, value, options = {}) {
    const oldValue = this.state[key];
    if (!options.force && oldValue === value) return;

    this.state[key] = value;
    this.notify(key, value, oldValue);

    if (PERSIST_KEYS.includes(key)) {
      this.persist(key, value);
    }
  }

  setMultiple(updates, options = {}) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value, { ...options, silent: true });
    });

    if (!options.silent) {
      Object.keys(updates).forEach(key => {
        this.notify(key, this.state[key]);
      });
    }
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  subscribeMultiple(keys, callback) {
    const unsubscribes = keys.map(key => this.subscribe(key, callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }

  notify(key, value, oldValue) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value, oldValue, key);
        } catch (error) {
          console.error(`Store listener error for key "${key}":`, error);
        }
      });
    }

    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback(value, oldValue, key);
        } catch (error) {
          console.error('Store wildcard listener error:', error);
        }
      });
    }
  }

  persist(key, value) {
    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
      } else if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Failed to persist "${key}":`, error);
    }
  }

  reset(key = null) {
    if (key) {
      delete this.state[key];
      localStorage.removeItem(key);
      this.notify(key, undefined);
    } else {
      PERSIST_KEYS.forEach(k => {
        localStorage.removeItem(k);
      });
      this.state = {};
      this.initialized = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export const store = new Store();

export const DEFAULT_STATE = {
  theme: 'light',
  colorTheme: 'default',
  language: 'ko',
  fontSize: 'medium',
  fontFamily: 'system',
  viewMode: 'single',
  contentWidth: 'narrow',
  zoom: 100,
  recentFiles: [],
  customStyles: null,
  activeTabId: 'home',
  tabs: [],
  currentPage: 0,
  pages: [],
  isSearchVisible: false,
  isPresentationMode: false,
  presentationPage: 0
};
