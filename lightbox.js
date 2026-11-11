'use strict';

// ==========================================
// ALBUM ẢNH — LIGHTBOX (XEM ẢNH TOÀN MÀN HÌNH)
// ==========================================
const lightbox = $('#lightbox');
const lightImg = $('#lightImg');
const lightCaption = $('#lightCaption');
const lightCounter = $('#lightCounter');
let lightboxTrigger = null;
let currentPhotoIndex = 0;
let photos = [];

// Hooks do gallery.js đăng ký để lightbox tạm dừng/tiếp tục autoplay
let autoplayControls = { stop: () => {}, schedule: () => {} };

// Trạng thái zoom & kéo (pan) cho ảnh trong lightbox
let zoomLevel = 1;
const minZoom = 1;
const maxZoom = 3;
let panX = 0;
let panY = 0;
let pinchZoomCtrl = null;

function setLightboxAutoplayControls(controls) {
  autoplayControls = controls;
}

function setLightboxPhotos(photoList) {
  photos = photoList;
}

window.__weddingLightbox = {
  openLightbox,
  setLightboxAutoplayControls,
  setLightboxPhotos,
  initLightbox
};

initLightbox();

function clampZoom(value) {
  return Math.min(maxZoom, Math.max(minZoom, value));
}

function setZoom(value, animate = true) {
  zoomLevel = clampZoom(value);
  updateZoomUI();
  applyTransform(animate);
}

function applyTransform(animate = true) {
  if (!lightImg) return;
  lightImg.style.transition = animate ? 'transform 0.15s ease-out' : 'none';
  lightImg.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
  const canPan = zoomLevel > minZoom;
  lightImg.classList.toggle('is-zoomable', canPan);
  lightImg.classList.toggle('is-dragging', false);
}

function updateZoomUI() {
  const zoomLevelEl = $('#lightZoomLevel');
  const zoomInBtn = $('#lightZoomIn');
  const zoomOutBtn = $('#lightZoomOut');
  if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(zoomLevel * 100)}%`;
  if (zoomInBtn) zoomInBtn.disabled = zoomLevel >= maxZoom;
  if (zoomOutBtn) zoomOutBtn.disabled = zoomLevel <= minZoom;
}

function resetLightboxView() {
  panX = 0;
  panY = 0;
  setZoom(1, true);
}

function clampPan() {
  if (!lightImg) return;
  const wrapper = $('#lightWrapper');
  if (!wrapper) return;
  const wrapperRect = wrapper.getBoundingClientRect();
  const imgRect = lightImg.getBoundingClientRect();
  const displayWidth = imgRect.width * zoomLevel;
  const displayHeight = imgRect.height * zoomLevel;
  const maxPanX = Math.max(0, (displayWidth - wrapperRect.width) / 2);
  const maxPanY = Math.max(0, (displayHeight - wrapperRect.height) / 2);
  panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
  panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
}

function updateLightboxPhoto(index, animate = false) {
  if (photos.length === 0) return;
  currentPhotoIndex = (index + photos.length) % photos.length;
  const current = photos[currentPhotoIndex];

  // Reset zoom & pan khi chuyển ảnh
  resetLightboxView();

  if (animate && lightImg) {
    lightImg.style.opacity = '0.35';
    lightImg.style.transform = 'scale(0.97)';
  }

  setTimeout(() => {
    if (lightImg) {
      lightImg.src = current.src;
      lightImg.alt = current.alt;
      lightImg.style.opacity = '1';
      // Áp dụng lại transform (scale & pan) sau khi ảnh mới đã tải
      applyTransform(animate);
    }
    if (lightCaption) {
      lightCaption.textContent = current.alt;
    }
    if (lightCounter) {
      lightCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
    }
  }, animate ? 150 : 0);
}

function openLightbox(index, triggerElement) {
  if (!lightbox) return;
  autoplayControls.stop();
  lightboxTrigger = triggerElement;
  updateLightboxPhoto(index, false);
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
  $('#close')?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  lightboxTrigger?.focus();
  lightboxTrigger = null;
  autoplayControls.schedule();
  // Reset trạng thái zoom & pan khi đóng
  resetLightboxView();
  if (pinchZoomCtrl) {
    pinchZoomCtrl.reset();
  }
}

function initLightboxGestures() {
  if (!lightImg) return;
  if (pinchZoomCtrl) {
    pinchZoomCtrl.reset();
    pinchZoomCtrl = null;
  }

  // Bộ điều khiển pinch-zoom & kéo dùng chung từ pinch-zoom.js
  pinchZoomCtrl = createPinchZoomController(lightImg, {
    draggingClass: 'is-dragging',
    preventDefaultOnStart: true,
    canStart: () => !lightbox?.hidden,
    onStart: event => {
      lightImg.setPointerCapture(event.pointerId);
      lightImg.classList.add('is-dragging');
    },
    getZoom: () => zoomLevel,
    onPinch: scale => {
      setZoom(zoomLevel * scale, false);
    },
    onDrag: (deltaX, deltaY) => {
      if (zoomLevel <= minZoom) return;
      panX += deltaX;
      panY += deltaY;
      applyTransform(false);
    },
    onSettle: () => {
      lightImg.classList.remove('is-dragging');
      clampPan();
      applyTransform(true);
    }
  });

  // Zoom bằng chuột (wheel) khi con trỏ đang nằm trên ảnh
  lightImg.addEventListener('wheel', event => {
    if (!lightbox || lightbox.hidden) return;
    if (zoomLevel <= minZoom && event.deltaY > 0) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.15 : -0.15;
    setZoom(zoomLevel + delta, true);
  }, { passive: false });
}

function initLightbox() {
  if (!lightbox) return;

  // Nút Đóng & Nút Next / Prev
  $('#close')?.addEventListener('click', closeLightbox);
  $('#lightPrev')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex - 1, true));
  $('#lightNext')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex + 1, true));

  // Nút công cụ zoom
  $('#lightZoomOut')?.addEventListener('click', () => setZoom(zoomLevel - 0.2));
  $('#lightZoomIn')?.addEventListener('click', () => setZoom(zoomLevel + 0.2));
  $('#lightZoomReset')?.addEventListener('click', resetLightboxView);

  // Click vùng tối ra ngoài ảnh để đóng
  lightbox.onclick = event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  };

  // Phím mũi tên, Escape và phím điều khiển zoom
  document.addEventListener('keydown', event => {
    if (lightbox?.hidden) return;

    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      updateLightboxPhoto(currentPhotoIndex - 1, true);
    } else if (event.key === 'ArrowRight') {
      updateLightboxPhoto(currentPhotoIndex + 1, true);
    } else if (event.key === '+' || event.key === '=') {
      setZoom(zoomLevel + 0.2);
    } else if (event.key === '-') {
      setZoom(zoomLevel - 0.2);
    } else if (event.key === '0') {
      resetLightboxView();
    }
  });

  // Cử chỉ cảm ứng vuốt tay (Swipe Gesture) trên điện thoại
  // Chỉ cho phép swipe khi ảnh chưa zoom (zoomLevel === 1) để khôngConflict với kéo pan
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (zoomLevel > minZoom) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleLightboxSwipe();
  }, { passive: true });

  function handleLightboxSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Vuốt ngang: chuyển ảnh trước / sau
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        updateLightboxPhoto(currentPhotoIndex + 1, true);
      } else {
        updateLightboxPhoto(currentPhotoIndex - 1, true);
      }
    }
    // Vuốt dọc xuống dưới mạnh: đóng lightbox
    else if (diffY > 90 && Math.abs(diffY) > Math.abs(diffX) * 1.4) {
      closeLightbox();
    }
  }

  // Khởi tạo gestures pinch-zoom & kéo khi lightbox sẵn sàng
  initLightboxGestures();
}
