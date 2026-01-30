/**
 * Image Modal Module
 * Image zoom, drag, open/close
 */

let imageModalZoom = 1;
const imageModalMinZoom = 0.5;
const imageModalMaxZoom = 3;
let isImageDragging = false;
let imageStartX = 0;
let imageStartY = 0;
let imageTranslateX = 0;
let imageTranslateY = 0;

let els = {};

export function init(context) {
  els = {
    imageModal: document.getElementById('image-modal'),
    imageModalImg: document.getElementById('image-modal-img'),
    imageZoomInfo: document.getElementById('image-zoom-info'),
    imageZoomIn: document.getElementById('image-zoom-in'),
    imageZoomOut: document.getElementById('image-zoom-out'),
    imageZoomReset: document.getElementById('image-zoom-reset'),
    imageModalClose: document.getElementById('image-modal-close'),
    content: document.getElementById('content'),
  };
  els.imageModalBackdrop = els.imageModal?.querySelector('.image-modal-backdrop');
  els.imageModalContent = els.imageModal?.querySelector('.image-modal-content');

  if (els.imageModal) {
    els.imageModalClose?.addEventListener('click', closeImageModal);
    els.imageModalBackdrop?.addEventListener('click', closeImageModal);
    els.imageZoomIn?.addEventListener('click', () => zoomIn());
    els.imageZoomOut?.addEventListener('click', () => zoomOut());
    els.imageZoomReset?.addEventListener('click', resetZoom);

    els.imageModalContent?.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn(0.1);
      } else {
        zoomOut(0.1);
      }
    }, { passive: false });

    els.imageModalContent?.addEventListener('mousedown', onDragStart);
    els.imageModalContent?.addEventListener('mousemove', onDrag);
    els.imageModalContent?.addEventListener('mouseup', onDragEnd);
    els.imageModalContent?.addEventListener('mouseleave', onDragEnd);
  }
}

export function openImageModal(src, alt = '') {
  if (!els.imageModal || !els.imageModalImg) return;
  els.imageModalImg.src = src;
  els.imageModalImg.alt = alt;
  resetZoom();
  els.imageModal.classList.remove('hidden');
}

export function closeImageModal() {
  if (!els.imageModal) return;
  els.imageModal.classList.add('hidden');
  if (els.imageModalImg) {
    els.imageModalImg.src = '';
  }
}

export function isOpen() {
  return els.imageModal && !els.imageModal.classList.contains('hidden');
}

function zoomIn(amount = 0.25) {
  imageModalZoom = Math.min(imageModalMaxZoom, imageModalZoom + amount);
  applyZoom();
}

function zoomOut(amount = 0.25) {
  imageModalZoom = Math.max(imageModalMinZoom, imageModalZoom - amount);
  applyZoom();
}

function resetZoom() {
  imageModalZoom = 1;
  imageTranslateX = 0;
  imageTranslateY = 0;
  applyZoom();
}

function applyZoom() {
  if (!els.imageModalImg || !els.imageZoomInfo) return;
  els.imageModalImg.style.transform = `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${imageModalZoom})`;
  els.imageZoomInfo.textContent = `${Math.round(imageModalZoom * 100)}%`;

  if (els.imageModalContent) {
    if (imageModalZoom > 1) {
      els.imageModalContent.style.cursor = isImageDragging ? 'grabbing' : 'grab';
    } else {
      els.imageModalContent.style.cursor = 'default';
    }
  }
}

function onDragStart(e) {
  if (imageModalZoom <= 1) return;
  isImageDragging = true;
  imageStartX = e.clientX - imageTranslateX;
  imageStartY = e.clientY - imageTranslateY;
  if (els.imageModalContent) {
    els.imageModalContent.style.cursor = 'grabbing';
  }
}

function onDrag(e) {
  if (!isImageDragging) return;
  imageTranslateX = e.clientX - imageStartX;
  imageTranslateY = e.clientY - imageStartY;
  applyZoom();
}

function onDragEnd() {
  isImageDragging = false;
  if (els.imageModalContent && imageModalZoom > 1) {
    els.imageModalContent.style.cursor = 'grab';
  }
}

export function attachImageClickListeners() {
  const images = els.content.querySelectorAll('img');
  images.forEach(img => {
    if (img.dataset.modalEnabled) return;
    img.dataset.modalEnabled = 'true';
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openImageModal(img.src, img.alt);
    });
  });
}
