/**
 * 공통 유틸리티 함수들
 */

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

export function isMarkdownFile(filename) {
  const ext = getFileExtension(filename);
  return ['md', 'markdown', 'txt'].includes(ext);
}

export function getFileName(path) {
  return path.split(/[/\\]/).pop() || path;
}

export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function findClosest(arr, target) {
  return arr.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

export function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return '#ffffff';
  if (rgb.startsWith('#')) return rgb;

  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#ffffff';

  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function getCssVariable(name, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

export function setCssVariable(name, value, element = document.documentElement) {
  element.style.setProperty(name, value);
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
