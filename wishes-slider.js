let currentSlideIndex = 0;
let autoSlideInterval = null;
const activeWishPointers = new Set();
let isMouseHoveringWishSlider = false;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Hiển thị 3 lời chúc trên desktop, 2 trên tablet và 1 trên điện thoại.
function getItemsPerPage() {
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

function updateWishSlider() {
  const wishList = document.getElementById('wishList');
  if (!wishList) return;

  const wishes = Array.from(wishList.querySelectorAll('.wish'));
  if (wishes.length === 0) return;

  const itemsPerPage = getItemsPerPage();
  const totalPages = Math.ceil(wishes.length / itemsPerPage);

  if (currentSlideIndex >= totalPages) currentSlideIndex = 0;
  if (currentSlideIndex < 0) currentSlideIndex = totalPages - 1;

  const startIndex = currentSlideIndex * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Sử dụng class .is-active để điều khiển hiển thị thay vì đổi trực tiếp style.display
  wishes.forEach((wish, index) => {
    if (index >= startIndex && index < endIndex) {
      wish.classList.add('is-active');
    } else {
      wish.classList.remove('is-active');
    }
  });

  const counter = document.getElementById('wishCounter');
  if (counter) {
    counter.textContent = `${currentSlideIndex + 1} / ${totalPages}`;
  }

  ['prevWish', 'nextWish'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.disabled = totalPages <= 1;
  });
}

function nextWishSlide() {
  currentSlideIndex++;
  updateWishSlider();
}

function prevWishSlide() {
  currentSlideIndex--;
  updateWishSlider();
}

function startAutoWishSlide() {
  stopAutoWishSlide();
  const wishList = document.getElementById('wishList');
  const wrapper = document.querySelector('.wish-slider-wrapper');
  if (
    reducedMotionQuery.matches ||
    document.hidden ||
    !wishList ||
    (wrapper && (activeWishPointers.size > 0 || isMouseHoveringWishSlider || wrapper.contains(document.activeElement))) ||
    Math.ceil(wishList.querySelectorAll('.wish').length / getItemsPerPage()) <= 1
  ) {
    return;
  }

  autoSlideInterval = setInterval(nextWishSlide, 3000);
}

function stopAutoWishSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
}

function initWishSlider() {
  const wishList = document.getElementById('wishList');
  if (!wishList) return;

  wishList.classList.add('wish-slider');
  updateWishSlider();
  startAutoWishSlide();

  const wishesObserver = new MutationObserver(() => {
    updateWishSlider();
    startAutoWishSlide();
  });
  wishesObserver.observe(wishList, { childList: true });

  reducedMotionQuery.addEventListener('change', startAutoWishSlide);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoWishSlide();
    } else {
      startAutoWishSlide();
    }
  });

  const prevBtn = document.getElementById('prevWish');
  const nextBtn = document.getElementById('nextWish');

  if (prevBtn) {
    prevBtn.onclick = () => {
      prevWishSlide();
      startAutoWishSlide();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      nextWishSlide();
      startAutoWishSlide();
    };
  }

  const wrapper = document.querySelector('.wish-slider-wrapper');
  if (wrapper) {
    wrapper.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      isMouseHoveringWishSlider = true;
      stopAutoWishSlide();
    });
    wrapper.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      isMouseHoveringWishSlider = false;
      startAutoWishSlide();
    });
    wrapper.addEventListener('pointerdown', event => {
      activeWishPointers.add(event.pointerId);
      stopAutoWishSlide();
    });
    const releaseWishPointer = event => {
      if (!activeWishPointers.delete(event.pointerId)) return;
      startAutoWishSlide();
    };
    window.addEventListener('pointerup', releaseWishPointer);
    window.addEventListener('pointercancel', releaseWishPointer);
    wrapper.addEventListener('focusin', stopAutoWishSlide);
    wrapper.addEventListener('focusout', event => {
      if (!wrapper.contains(event.relatedTarget)) startAutoWishSlide();
    });
  }
}

window.addEventListener('resize', () => {
  updateWishSlider();
  startAutoWishSlide();
});

document.addEventListener('DOMContentLoaded', () => {
  initWishSlider();
});
