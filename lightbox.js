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

function updateLightboxPhoto(index, animate = false) {
  if (photos.length === 0) return;
  currentPhotoIndex = (index + photos.length) % photos.length;
  const current = photos[currentPhotoIndex];

  if (animate && lightImg) {
    lightImg.style.opacity = '0.35';
    lightImg.style.transform = 'scale(0.97)';
  }

  setTimeout(() => {
    if (lightImg) {
      lightImg.src = current.src;
      lightImg.alt = current.alt;
      lightImg.style.opacity = '1';
      lightImg.style.transform = 'none';
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
}

function initLightbox() {
  if (!lightbox) return;

  // Nút Đóng & Nút Next / Prev
  $('#close')?.addEventListener('click', closeLightbox);
  $('#lightPrev')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex - 1, true));
  $('#lightNext')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex + 1, true));

  // Click vùng tối ra ngoài ảnh để đóng
  lightbox.onclick = event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  };

  // Phím mũi tên & Escape
  document.addEventListener('keydown', event => {
    if (lightbox?.hidden) return;

    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      updateLightboxPhoto(currentPhotoIndex - 1, true);
    } else if (event.key === 'ArrowRight') {
      updateLightboxPhoto(currentPhotoIndex + 1, true);
    }
  });

  // Cử chỉ cảm ứng vuốt tay (Swipe Gesture) trên điện thoại
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
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
}
