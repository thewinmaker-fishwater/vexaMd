/**
 * Presentation Mode Module
 */

import { showNotification } from '../notification/notification.js';

let isPresentationMode = false;
let presentationPage = 0;

let els = {};
let getPages = null;
let tFn = null;

export function init(context) {
  els = {
    presentationOverlay: document.getElementById('presentation-overlay'),
    presentationContent: document.querySelector('.presentation-content'),
    presIndicator: document.getElementById('pres-indicator'),
    presPrev: document.getElementById('pres-prev'),
    presNext: document.getElementById('pres-next'),
    presExit: document.getElementById('pres-exit'),
    btnPresentation: document.getElementById('btn-presentation'),
  };
  getPages = context.getPages;
  tFn = context.t;

  els.btnPresentation.addEventListener('click', startPresentation);
  els.presPrev.addEventListener('click', presentationPrev);
  els.presNext.addEventListener('click', presentationNext);
  els.presExit.addEventListener('click', exitPresentation);

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isPresentationMode) {
      exitPresentation();
    }
  });
}

export function getIsPresentationMode() {
  return isPresentationMode;
}

export function startPresentation() {
  const pages = getPages();
  if (pages.length === 0) {
    showNotification(tFn('noPresentDoc'));
    return;
  }

  isPresentationMode = true;
  presentationPage = 0;
  els.presentationOverlay.classList.remove('hidden');
  renderSlide();

  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

export function exitPresentation() {
  isPresentationMode = false;
  els.presentationOverlay.classList.add('hidden');
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

export function presentationPrev() {
  if (presentationPage > 0) {
    presentationPage--;
    renderSlide();
  }
}

export function presentationNext() {
  const pages = getPages();
  if (presentationPage < pages.length - 1) {
    presentationPage++;
    renderSlide();
  }
}

function renderSlide() {
  if (!els.presentationContent) return;
  const pages = getPages();
  els.presentationContent.innerHTML = pages[presentationPage] || '';
  els.presIndicator.textContent = `${presentationPage + 1} / ${pages.length}`;
  els.presPrev.disabled = presentationPage === 0;
  els.presNext.disabled = presentationPage >= pages.length - 1;
}

export function handleKeydown(e) {
  if (!isPresentationMode) return false;
  if (e.key === 'Escape') {
    e.preventDefault();
    exitPresentation();
    return true;
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    presentationPrev();
    return true;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    presentationNext();
    return true;
  }
  return true; // block other keys in presentation mode
}
