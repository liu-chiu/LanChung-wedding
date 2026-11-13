'use strict';

// ==========================================
// ALBUM ẢNH — LIGHTBOX (XEM ẢNH TOÀN MÀN HÌNH)
// ==========================================
const lightbox = $('#lightbox');
const lightboxMobile = window.matchMedia('(max-width: 768px)');
const lightImg = $('#lightImg');
const lightCaption = $('#lightCaption');
const lightCounter = $('#lightCounter');
const lightPreviewLeft = $('#lightPreviewLeft');
const lightPreviewLeftImg = $('#lightPreviewLeftImg');
const lightPreviewRight = $('#lightPreviewRight');
const lightPreviewRightImg = $('#lightPreviewRightImg');
const lightThumbList = $('#lightThumbList');
const lightThumbTrack = $('#lightThumbTrack');
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
  // Render lại danh sách thumbnail khi danh sách ảnh được cập nhật (từ gallery.js)
  if (typeof renderLightboxThumbnails === 'function') renderLightboxThumbnails();
  if (typeof updateLightboxPreviews === 'function') updateLightboxPreviews();
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
  let maxPanX;
  let maxPanY;
  if (lightboxMobile.matches) {
    // Convert visible overflow to transform-space units because scale() is
    // applied before translate().
    maxPanX = Math.max(0, (lightImg.offsetWidth * zoomLevel - wrapperRect.width) / (2 * zoomLevel));
    maxPanY = Math.max(0, (lightImg.offsetHeight * zoomLevel - wrapperRect.height) / (2 * zoomLevel));
  } else {
    const imgRect = lightImg.getBoundingClientRect();
    maxPanX = Math.max(0, (imgRect.width * zoomLevel - wrapperRect.width) / 2);
    maxPanY = Math.max(0, (imgRect.height * zoomLevel - wrapperRect.height) / 2);
  }
  panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
  panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
}

// ==========================================
// HIỂN DANH SÁCH ẢNH & ẢNH MÔ (Thumbnails & Previews)
// ==========================================

function renderLightboxThumbnails() {
  if (!lightThumbTrack || photos.length === 0) return;
  lightThumbTrack.innerHTML = '';
  photos.forEach((photo, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'lightbox-thumb' + (index === currentPhotoIndex ? ' active' : '');
    thumb.setAttribute('aria-label', `Xem ảnh ${index + 1} trên ${photos.length}`);
    // Thumbnail dùng bản nén nhỏ (*-sm.webp) + lazy load để dải thumbnail tải nhanh, không chặn mở lightbox.
    const thumbSrc = photo.src.replace('-lg.webp', '-sm.webp');
    thumb.innerHTML = `<img src="${thumbSrc}" alt="${photo.alt}" loading="lazy" decoding="async"/>`;
    thumb.addEventListener('click', () => {
      if (index !== currentPhotoIndex) {
        updateLightboxPhoto(index, true);
      }
    });
    lightThumbTrack.appendChild(thumb);
  });
  // Ẩn danh sách nếu chỉ có 1 ảnh
  if (lightThumbList) lightThumbList.style.display = photos.length <= 1 ? 'none' : 'flex';
}

function updateLightboxThumbnails() {
  if (!lightThumbTrack) return;
  const thumbs = lightThumbTrack.querySelectorAll('.lightbox-thumb');
  thumbs.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentPhotoIndex);
  });
  const activeThumb = thumbs[currentPhotoIndex];
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function updateLightboxPreviews() {
  if (photos.length <= 1) {
    if (lightPreviewLeft) lightPreviewLeft.style.display = 'none';
    if (lightPreviewRight) lightPreviewRight.style.display = 'none';
    return;
  }
  if (lightPreviewLeft) lightPreviewLeft.style.display = 'flex';
  if (lightPreviewRight) lightPreviewRight.style.display = 'flex';

  const prevIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
  const nextIndex = (currentPhotoIndex + 1) % photos.length;

  // Preview cạnh dùng bản nén nhỏ để chuyển ảnh tức thì, không phải chờ tải bản full.
  if (lightPreviewLeftImg) lightPreviewLeftImg.src = photos[prevIndex].src.replace('-lg.webp', '-sm.webp');
  if (lightPreviewRightImg) lightPreviewRightImg.src = photos[nextIndex].src.replace('-lg.webp', '-sm.webp');

  // Click preview để chuyển ảnh
  if (lightPreviewLeft) {
    lightPreviewLeft.onclick = (e) => {
      e.stopPropagation();
      updateLightboxPhoto(currentPhotoIndex - 1, true);
    };
  }
  if (lightPreviewRight) {
    lightPreviewRight.onclick = (e) => {
      e.stopPropagation();
      updateLightboxPhoto(currentPhotoIndex + 1, true);
    };
  }
  // Phím Enter/Space trên preview (accessibility)
  const handlePreviewKey = (e, direction) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      updateLightboxPhoto(currentPhotoIndex + direction, true);
    }
  };
  if (lightPreviewLeft) {
    lightPreviewLeft.onkeydown = (e) => handlePreviewKey(e, -1);
  }
  if (lightPreviewRight) {
    lightPreviewRight.onkeydown = (e) => handlePreviewKey(e, +1);
  }
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
      // Progressive loading: hiển thị bản nén nhỏ (*-sm.webp, đã có sẵn trong cache
      // nhờ slider) NGAY LẬP TỨC để không có khung trống, sau đó nâng lên bản
      // full-size (*-lg.webp) khi tải xong — chuyển ảnh cảm giác gần như tức thì.
      const largeSrc = current.src;
      const smallSrc = largeSrc.replace('-lg.webp', '-sm.webp');
      if (smallSrc !== largeSrc) {
        // Chỉ progressive khi ảnh có cặp bản nhỏ (tránh ảnh ngoài gallery)
        lightImg.src = smallSrc;
        lightImg.alt = current.alt;
        lightImg.style.opacity = '1';
        applyTransform(animate);
        const expectedSmallUrl = new URL(smallSrc, location.href).href;
        const preload = new Image();
        preload.decoding = 'async';
        preload.onload = () => {
          // Nếu user đã chuyển sang ảnh khác thì không ghi đè (so sánh URL tuyệt đối)
          const displayUrl = new URL(lightImg.getAttribute('src') || '', location.href).href;
          if (displayUrl === expectedSmallUrl) {
            lightImg.src = largeSrc;
          }
        };
        preload.src = largeSrc;
      } else {
        lightImg.src = largeSrc;
        lightImg.alt = current.alt;
        lightImg.style.opacity = '1';
        applyTransform(animate);
      }
    }
    if (lightCaption) {
      lightCaption.textContent = current.alt;
    }
    if (lightCounter) {
      lightCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
    }
    // Cập nhật ảnh mô & danh sách thumbnail sau khi chuyển ảnh
    updateLightboxPreviews();
    updateLightboxThumbnails();
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
    onPinch: (scale, startZoom) => {
      setZoom(lightboxMobile.matches ? startZoom * scale : zoomLevel * scale, false);
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
    } else {
      // Phím số 1-9: nhảy đến ảnh tương ứng trong danh sách thumbnail
      const num = parseInt(event.key, 10);
      if (!isNaN(num) && num >= 1 && num <= photos.length) {
        updateLightboxPhoto(num - 1, true);
      }
    }
  });

  // Cử chỉ cảm ứng vuốt tay (Swipe Gesture) trên điện thoại
  // Chỉ cho phép swipe khi ảnh chưa zoom (zoomLevel === 1) để khôngConflict với kéo pan
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let multiTouchGesture = false;

  lightbox.addEventListener('touchstart', e => {
    if (lightboxMobile.matches && e.touches.length > 1) {
      multiTouchGesture = true;
      return;
    }
    if (lightboxMobile.matches && multiTouchGesture) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (lightboxMobile.matches && multiTouchGesture) {
      if (e.touches.length === 0) multiTouchGesture = false;
      return;
    }
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

  // Render danh sách thumbnail lần đầu
  renderLightboxThumbnails();
  updateLightboxPreviews();
}
