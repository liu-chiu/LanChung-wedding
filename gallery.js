'use strict';

// ==========================================
// ALBUM ẢNH — SLIDER / CAROUSEL
// ==========================================

// Use $ and $$ from window.__weddingHelpers (declared in helpers.js)
// Thu thập danh sách ảnh trong Album
const galleryPhotos = $$('.photo').map((btn, index) => {
  const img = $('img', btn);
  return {
    src: btn.dataset.img || (img ? img.src : ''),
    alt: img ? img.alt : `Khoảnh khắc ngày cưới ${index + 1}`
  };
});

const gallerySlider = $('#gallerySlider');
const galleryTrack = $('#galleryTrack');
const galleryCounter = $('#galleryCounter');
const gallerySlides = $$('.photo');
const galleryReducedMotion = window.__weddingHelpers.prefersReducedMotion;
const galleryFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let galleryVisualSlides = gallerySlides;
let galleryAutoSlideTimeout = null;
let galleryScrollTimeout = null;
let galleryPresentationFrame = null;
let galleryDragStartX = 0;
let galleryDragStartY = 0;
let galleryDragStartScrollLeft = 0;
let galleryDragPointerId = null;
let galleryIsDragging = false;
let galleryIsVisible = false;
let galleryIgnoreNextClick = false;
let galleryLastActivePhotoIndex = null;
let galleryTransitionVariant = 0;
let galleryTransitionCleanup = null;
let galleryTransitionSlide = null;
const galleryTransitionNames = ['soft', 'lift', 'focus'];

function animateGallerySlide(slide) {
  if (!slide || galleryReducedMotion.matches) return;
  const variant = galleryTransitionNames[galleryTransitionVariant % galleryTransitionNames.length];
  galleryTransitionVariant += 1;
  clearTimeout(galleryTransitionCleanup);
  galleryTransitionSlide?.classList.remove('is-entering');
  galleryTransitionSlide = slide;
  slide.dataset.transition = variant;
  slide.classList.remove('is-entering');
  // Restart the short entrance animation when a slide becomes active again.
  void slide.offsetWidth;
  slide.classList.add('is-entering');
  galleryTransitionCleanup = setTimeout(() => {
    slide.classList.remove('is-entering');
    if (galleryTransitionSlide === slide) galleryTransitionSlide = null;
  }, 850);
}

function getGalleryActiveSlideIndex() {
  if (!galleryTrack || galleryVisualSlides.length === 0) return 0;
  const trackCenter = galleryTrack.getBoundingClientRect().left + galleryTrack.clientWidth / 2;
  return galleryVisualSlides.reduce((closestIndex, slide, index) => {
    const currentDistance = Math.abs(slide.getBoundingClientRect().left + slide.offsetWidth / 2 - trackCenter);
    const closestSlide = galleryVisualSlides[closestIndex];
    const closestDistance = Math.abs(closestSlide.getBoundingClientRect().left + closestSlide.offsetWidth / 2 - trackCenter);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);
}

function toPhotoIndex(slideIndex) {
  if (slideIndex === 0) return galleryPhotos.length - 1;
  if (slideIndex === galleryPhotos.length + 1) return 0;
  return (slideIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
}

function getGalleryActiveIndex() {
  return galleryPhotos.length ? toPhotoIndex(getGalleryActiveSlideIndex()) : 0;
}

function updateGalleryPresentation() {
  if (!galleryTrack || galleryVisualSlides.length === 0 || galleryReducedMotion.matches) return;
  const trackCenter = galleryTrack.scrollLeft + galleryTrack.clientWidth / 2;

  galleryVisualSlides.forEach(slide => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const offset = (slideCenter - trackCenter) / Math.max(slide.offsetWidth, galleryTrack.clientWidth * 0.42);
    const distance = Math.min(Math.abs(offset), 1.25);
    slide.style.setProperty('--gallery-rotate', `${(-offset * 18).toFixed(2)}deg`);
    slide.style.setProperty('--gallery-scale', (1 - distance * 0.075).toFixed(3));
    slide.style.setProperty('--gallery-z', `${(-distance * 34).toFixed(1)}px`);
    slide.style.setProperty('--gallery-opacity', (1 - distance * 0.16).toFixed(3));
  });
}

function updateGalleryCounter() {
  if (!galleryCounter || galleryPhotos.length === 0) return;
  const activeSlideIndex = getGalleryActiveSlideIndex();
  const activeIndex = toPhotoIndex(activeSlideIndex);
  if (galleryLastActivePhotoIndex !== null && activeIndex !== galleryLastActivePhotoIndex) {
    animateGallerySlide(galleryVisualSlides[activeSlideIndex]);
  }
  galleryLastActivePhotoIndex = activeIndex;
  galleryCounter.textContent = `${activeIndex + 1} / ${galleryPhotos.length}`;
  galleryVisualSlides.forEach((slide, index) => {
    const photoIndex = toPhotoIndex(index);
    slide.setAttribute('aria-label', `Ảnh ${photoIndex + 1} trên ${galleryPhotos.length}: ${galleryPhotos[photoIndex].alt}`);
    slide.classList.toggle('is-active', index === activeSlideIndex);
    slide.setAttribute('aria-current', index === activeSlideIndex ? 'true' : 'false');

    let caption = $('.photo-caption', slide);
    if (!caption) {
      caption = document.createElement('span');
      caption.className = 'photo-caption';
      caption.setAttribute('aria-hidden', 'true');
      slide.append(caption);
    }
    caption.textContent = galleryPhotos[photoIndex].alt;
  });
}

function goToGallerySlide(index) {
  if (!galleryTrack || gallerySlides.length < 2 || galleryPhotos.length < 2 || !Number.isFinite(index)) return;
  const activeSlideIndex = getGalleryActiveSlideIndex();
  const activeIndex = toPhotoIndex(activeSlideIndex);
  const step = index - activeIndex;
  const targetPhotoIndex = ((Math.trunc(index) % galleryPhotos.length) + galleryPhotos.length) % galleryPhotos.length;
  let targetSlideIndex = targetPhotoIndex + 1;

  if (step === 1 && activeSlideIndex === galleryPhotos.length) {
    targetSlideIndex = galleryPhotos.length + 1;
  } else if (step === -1 && activeSlideIndex === 1) {
    targetSlideIndex = 0;
  }

  const slide = galleryVisualSlides[targetSlideIndex];
  if (!slide) return;
  const left = slide.offsetLeft - (galleryTrack.clientWidth - slide.clientWidth) / 2;
  galleryTrack.scrollTo({
    left,
    behavior: galleryReducedMotion.matches ? 'auto' : 'smooth'
  });
  updateGalleryPresentation();
  updateGalleryCounter();
}

function normalizeGalleryLoop() {
  if (!galleryTrack || galleryVisualSlides.length !== galleryPhotos.length + 2) return;
  const activeSlideIndex = getGalleryActiveSlideIndex();
  const targetSlideIndex = activeSlideIndex === 0
    ? galleryPhotos.length
    : activeSlideIndex === galleryPhotos.length + 1
      ? 1
      : activeSlideIndex;
  if (targetSlideIndex === activeSlideIndex) return;

  const slide = galleryVisualSlides[targetSlideIndex];
  galleryTrack.style.scrollBehavior = 'auto';
  galleryTrack.scrollLeft = slide.offsetLeft - (galleryTrack.clientWidth - slide.clientWidth) / 2;
  requestAnimationFrame(() => {
    galleryTrack.style.removeProperty('scroll-behavior');
  });
}

function stopGalleryAutoplay() {
  clearTimeout(galleryAutoSlideTimeout);
  galleryAutoSlideTimeout = null;
}

function scheduleGalleryAutoplay() {
  stopGalleryAutoplay();
  if (
    !gallerySlider ||
    !galleryIsVisible ||
    galleryReducedMotion.matches ||
    document.hidden ||
    (galleryFinePointer.matches && gallerySlider.matches(':hover')) ||
    (gallerySlider.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) ||
galleryPhotos.length < 2
  ) return;

  galleryAutoSlideTimeout = setTimeout(() => {
    goToGallerySlide(getGalleryActiveIndex() + 1);
    scheduleGalleryAutoplay();
  }, 3000);
}

setLightboxAutoplayControls({ stop: stopGalleryAutoplay, schedule: scheduleGalleryAutoplay });
// Đồng bộ danh sách ảnh cho lightbox (lightbox.js giữ mảng photos riêng của nó)
window.__weddingLightbox.setLightboxPhotos(galleryPhotos);

function initGallery() {
  if (!gallerySlider || !galleryTrack) return;

  if (gallerySlides.length > 1) {
    const firstClone = gallerySlides[0].cloneNode(true);
    const lastClone = gallerySlides[gallerySlides.length - 1].cloneNode(true);
    firstClone.setAttribute('aria-hidden', 'true');
    firstClone.tabIndex = -1;
    lastClone.setAttribute('aria-hidden', 'true');
    lastClone.tabIndex = -1;
    galleryTrack.prepend(lastClone);
    galleryTrack.append(firstClone);
    galleryVisualSlides = $$('.photo', galleryTrack);
  }

  galleryVisualSlides.forEach((slide, index) => {
    const photoIndex = toPhotoIndex(index);
    slide.dataset.galleryIndex = String(photoIndex);
    slide.setAttribute('aria-label', `Ảnh ${photoIndex + 1} trên ${galleryPhotos.length}: ${galleryPhotos[photoIndex].alt}`);
  });

  galleryTrack.addEventListener('click', event => {
    const button = event.target.closest('.photo');
    if (!button || !galleryTrack.contains(button)) return;
    if (galleryIgnoreNextClick) {
      galleryIgnoreNextClick = false;
      return;
    }
    // Lấy index từ danh sách slide trực tiếp để tránh NaN nếu thiếu dataset
    const slideIndex = galleryVisualSlides.indexOf(button);
    if (slideIndex === -1) return;
    openLightbox(toPhotoIndex(slideIndex), button);
  });

  $('#galleryPrev')?.addEventListener('click', () => {
    goToGallerySlide(getGalleryActiveIndex() - 1);
    scheduleGalleryAutoplay();
  });
  $('#galleryNext')?.addEventListener('click', () => {
    goToGallerySlide(getGalleryActiveIndex() + 1);
    scheduleGalleryAutoplay();
  });

  galleryTrack.addEventListener('scroll', () => {
    stopGalleryAutoplay();
    if (galleryPresentationFrame === null) {
      galleryPresentationFrame = requestAnimationFrame(() => {
        updateGalleryPresentation();
        galleryPresentationFrame = null;
      });
    }
    clearTimeout(galleryScrollTimeout);
    galleryScrollTimeout = setTimeout(() => {
      normalizeGalleryLoop();
      updateGalleryCounter();
      scheduleGalleryAutoplay();
    }, 120);
  }, { passive: true });

  galleryTrack.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    galleryDragStartX = event.clientX;
    galleryDragStartY = event.clientY;
    galleryDragStartScrollLeft = galleryTrack.scrollLeft;
    galleryDragPointerId = event.pointerId;
    galleryIsDragging = false;
    stopGalleryAutoplay();
  });

  galleryTrack.addEventListener('pointermove', event => {
    if (event.pointerId !== galleryDragPointerId) return;
    const deltaX = event.clientX - galleryDragStartX;
    const deltaY = event.clientY - galleryDragStartY;

    if (!galleryIsDragging) {
      if (Math.abs(deltaX) < 7 && Math.abs(deltaY) < 7) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        galleryDragPointerId = null;
        scheduleGalleryAutoplay();
        return;
      }

      galleryIsDragging = true;
      galleryTrack.classList.add('is-dragging');
      galleryTrack.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    galleryTrack.scrollLeft = galleryDragStartScrollLeft - deltaX;
  });

  const finishGalleryDrag = event => {
    if (event.pointerId !== galleryDragPointerId) return;
    const wasDragging = galleryIsDragging;
    galleryDragPointerId = null;
    galleryIsDragging = false;
    galleryTrack.classList.remove('is-dragging');

    if (galleryTrack.hasPointerCapture(event.pointerId)) {
      galleryTrack.releasePointerCapture(event.pointerId);
    }

    if (wasDragging) {
      galleryIgnoreNextClick = true;
      setTimeout(() => { galleryIgnoreNextClick = false; }, 400);
      updateGalleryCounter();
    } else {
      scheduleGalleryAutoplay();
    }
  };

  galleryTrack.addEventListener('pointerup', finishGalleryDrag);
  galleryTrack.addEventListener('pointercancel', finishGalleryDrag);

  gallerySlider.addEventListener('mouseenter', () => {
    if (galleryFinePointer.matches) stopGalleryAutoplay();
  });
  gallerySlider.addEventListener('mouseleave', () => {
    if (galleryFinePointer.matches) scheduleGalleryAutoplay();
  });
  gallerySlider.addEventListener('focusin', event => {
    if (event.target.matches(':focus-visible')) stopGalleryAutoplay();
  });
  gallerySlider.addEventListener('focusout', event => {
    const nextTarget = event.relatedTarget;
    if (!gallerySlider.contains(nextTarget) || !(nextTarget instanceof Element && nextTarget.matches(':focus-visible'))) {
      scheduleGalleryAutoplay();
    }
  });
  gallerySlider.addEventListener('pointerdown', stopGalleryAutoplay);
  galleryReducedMotion.addEventListener('change', () => {
    updateGalleryPresentation();
    scheduleGalleryAutoplay();
  });
  document.addEventListener('visibilitychange', scheduleGalleryAutoplay);
  const galleryVisibilityObserver = new IntersectionObserver(entries => {
    galleryIsVisible = entries.some(entry => entry.isIntersecting);
    if (galleryIsVisible) {
      scheduleGalleryAutoplay();
    } else {
      stopGalleryAutoplay();
    }
  }, { threshold: 0.1 });
  galleryVisibilityObserver.observe(gallerySlider);
  window.addEventListener('resize', () => {
    updateGalleryPresentation();
    updateGalleryCounter();
  });

  const firstSlide = galleryVisualSlides[gallerySlides.length > 1 ? 1 : 0];
  galleryTrack.style.scrollBehavior = 'auto';
  galleryTrack.scrollLeft = firstSlide.offsetLeft - (galleryTrack.clientWidth - firstSlide.clientWidth) / 2;
  galleryTrack.style.removeProperty('scroll-behavior');
  updateGalleryPresentation();
  updateGalleryCounter();
  scheduleGalleryAutoplay();
}

window.__weddingGallery = { initGallery };

initGallery();
