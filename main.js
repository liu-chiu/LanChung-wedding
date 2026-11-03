'use strict';

// ==========================================
// 1. CÁC HÀM TIỆN ÍCH DÙNG CHUNG (HELPERS)
// ==========================================
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Hiển thị thông báo dạng Toast (nổi lên rồi tự ẩn)
const notify = message => {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
};

// Hàm sao chép đa nền tảng (Hoạt động 100% trên Zalo In-App WebView & Mobile Safari/Chrome)
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard bị hạn chế, chuyển sang cơ chế fallback:', err);
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Không thể sao chép bằng execCommand:', err);
    return false;
  }
}

// ==========================================
// 2. MỞ PHONG BÌ THƯ HOÀNG GIA & CON DẤU SÁP L & C
// ==========================================
const openBtn = $('#open');
const coverElem = $('#cover');
const envelopeScene = $('#envelopeScene');

// Hiệu ứng pháo hoa bụi vàng & cánh hoa bùng nổ khi mở thiệp
function triggerOpeningBurst(originEl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('burstCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const particles = [];
  const count = window.innerWidth <= 768 ? 18 : 28;
  const colors = [
    '#f7d59b', '#e6bf70', '#d4a853', // Vàng gold
    '#e29590', '#c87670', '#f4c3be', // Cánh hoa hồng
    '#ffffff', '#fff5eb'            // Ánh sáng trắng
  ];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 4;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.025 + Math.random() * 0.015,
      gravity: 0.12,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      isFlowerPetal: Math.random() > 0.5
    });
  }

  function renderBurst() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0) continue;
      alive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.isFlowerPetal) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.2, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    if (alive) {
      requestAnimationFrame(renderBurst);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  renderBurst();
}

// Hiệu ứng 3D Parallax Tilt khi di chuột trên màn hình bìa
if (envelopeScene && coverElem && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  coverElem.addEventListener('mousemove', e => {
    if (envelopeScene.classList.contains('is-open')) return;
    const rect = coverElem.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    envelopeScene.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  });

  coverElem.addEventListener('mouseleave', () => {
    if (envelopeScene.classList.contains('is-open')) return;
    envelopeScene.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
  });
}

function openEnvelopeInvitation() {
  if (!coverElem || coverElem.classList.contains('is-opening') || coverElem.classList.contains('open')) return;
  coverElem.classList.add('is-opening');
  coverElem.setAttribute('aria-hidden', 'true');
  coverElem.inert = true;

  if (navigator.vibrate) {
    try { navigator.vibrate([25, 45, 25]); } catch (e) {}
  }

  // 1. Kích hoạt bùng nổ pháo hoa cánh hoa & bụi vàng
  const burstOrigin = openBtn || envelopeScene || coverElem;
  triggerOpeningBurst(burstOrigin);

  // 2. Mở nắp phong bì và nhô lá thiệp mời lên
  if (envelopeScene) {
    envelopeScene.style.transform = 'none';
    envelopeScene.classList.add('is-open');
  }

  // 3. Bắt đầu phát nhạc nền
  startBackgroundMusic();

  // 4. Chờ nắp mở xong rồi chuyển nhẹ sang nội dung chính
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const openingDelay = (reducedMotion ? 0 : 900) + 500;
  setTimeout(() => {
    coverElem.classList.add('open');
    document.body.classList.remove('locked');

    setTimeout(() => {
      coverElem.remove();
    }, 700);
  }, openingDelay);
}

if (openBtn) openBtn.onclick = openEnvelopeInvitation;
if (envelopeScene) envelopeScene.onclick = openEnvelopeInvitation;
const coverCta = $('#coverCta');
if (coverCta) {
  coverCta.onclick = openEnvelopeInvitation;
  coverCta.onkeydown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelopeInvitation();
    }
  };
}

// Bật/tắt danh mục điều hướng
const menuButton = $('#menu');
const navigation = $('#nav');
const mobileNavigation = window.matchMedia('(max-width: 768px)');

function setNavigationOpen(isOpen) {
  if (!navigation || !menuButton) return;
  navigation.classList.toggle('open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
}

if (menuButton && navigation) {
  menuButton.onclick = () => {
    const isOpen = !navigation.classList.contains('open');
    setNavigationOpen(isOpen);
  };
}

// Click chọn menu sẽ tự đóng menu mobile lại
$$('nav a').forEach(link => {
  link.onclick = () => {
    setNavigationOpen(false);
  };
});

const siteHeader = $('.site-header');
let previousScrollY = window.scrollY;
let headerScrollFrame = null;
let scrollDirection = 0;
let scrollDirectionDistance = 0;

function showSiteHeader() {
  siteHeader?.classList.remove('is-hidden');
}

window.addEventListener('scroll', () => {
  if (!siteHeader || headerScrollFrame !== null) return;
  headerScrollFrame = requestAnimationFrame(() => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - previousScrollY;
    const nextDirection = Math.sign(scrollDelta);

    if (nextDirection && nextDirection !== scrollDirection) {
      scrollDirection = nextDirection;
      scrollDirectionDistance = 0;
    }

    scrollDirectionDistance += Math.abs(scrollDelta);
    if (currentScrollY <= siteHeader.offsetHeight) {
      showSiteHeader();
      if (Math.abs(scrollDelta) >= 6) setNavigationOpen(false);
    } else if (scrollDirection < 0 && scrollDelta < 0) {
      setNavigationOpen(false);
      showSiteHeader();
    } else if (scrollDirectionDistance >= 6 && scrollDirection > 0) {
      setNavigationOpen(false);
      siteHeader.classList.add('is-hidden');
      scrollDirectionDistance = 0;
    }

    previousScrollY = currentScrollY;
    headerScrollFrame = null;
  });
}, { passive: true });

mobileNavigation.addEventListener('change', event => {
  setNavigationOpen(false);
});

// Hiệu ứng cuộn trang hiện dần (Scroll Reveal)
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

$$('.reveal').forEach(element => observer.observe(element));

// ==========================================
// 3. BỘ ĐẾM NGƯỢC THỜI GIAN (COUNTDOWN)
// ==========================================
const targetTime = new Date('2026-12-12T10:30:00+07:00').getTime();

function updateCountdown() {
  const now = Date.now();
  const timeLeft = targetTime - now;

  if (timeLeft <= 0) {
    ['days', 'hours', 'mins', 'secs'].forEach(id => {
      const element = $('#' + id);
      if (element) element.textContent = '00';
    });

    const message = $('#countMsg');
    if (message) message.textContent = 'Ngày hạnh phúc đã đến!';
    return;
  }

  const days = $('#days');
  const hours = $('#hours');
  const minutes = $('#mins');
  const seconds = $('#secs');

  if (days) days.textContent = String(Math.floor(timeLeft / 864e5));
  if (hours) {
    hours.textContent = String(Math.floor((timeLeft % 864e5) / 36e5)).padStart(2, '0');
  }
  if (minutes) {
    minutes.textContent = String(Math.floor((timeLeft % 36e5) / 6e4)).padStart(2, '0');
  }
  if (seconds) {
    seconds.textContent = String(Math.floor((timeLeft % 6e4) / 1e3)).padStart(2, '0');
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ==========================================
// 4. LỊCH THÁNG & TẠO SỰ KIỆN LỊCH (ICS)
// ==========================================
// Render lịch tháng 12/2026 (Ngày 12 được đánh dấu class 'today')
if ($('#cal')) {
  const daysHTML =
    '<span class="muted">30</span>' +
    Array.from(
      { length: 31 },
      (_, i) => `<span class="${i === 11 ? 'today' : ''}">${i + 1}</span>`
    ).join('') +
    '<span class="muted">1</span><span class="muted">2</span><span class="muted">3</span>';
  $('#cal').innerHTML = daysHTML;
}

// Dữ liệu tạo file lịch cá nhân (.ics)
const calendarEvents = {
  bride: {
    title: 'Tiệc nhà gái - Lan & Chung',
    startUtc: '20261212T033000Z',
    endUtc: '20261212T053000Z',
    startLocal: '20261212T103000',
    endLocal: '20261212T123000',
    location: 'SeaBay Hạ Long, X232+7MW, Bãi Cháy, Quảng Ninh'
  },
  groom: {
    title: 'Tiệc nhà trai - Lan & Chung',
    startUtc: '20261212T100000Z',
    endUtc: '20261212T120000Z',
    startLocal: '20261212T170000',
    endLocal: '20261212T190000',
    location: 'Số 8, ngõ 3, đường Văn Hoá, Khối 8, Sóc Sơn, Hà Nội'
  }
};

$$('[data-ics]').forEach(button => {
  button.onclick = () => {
    const ev = calendarEvents[button.dataset.ics];
    if (!ev) return;

    const isIOS =
      /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (/Android/i.test(navigator.userAgent)) {
      const calendarUrl = new URL('https://calendar.google.com/calendar/render');
      calendarUrl.search = new URLSearchParams({
        action: 'TEMPLATE',
        text: ev.title,
        dates: `${ev.startLocal}/${ev.endLocal}`,
        ctz: 'Asia/Ho_Chi_Minh',
        location: ev.location
      }).toString();
      const calendarWindow = window.open(calendarUrl.toString(), '_blank');
      if (calendarWindow) {
        calendarWindow.opener = null;
      } else {
        window.location.assign(calendarUrl.toString());
      }
      return;
    }

    const escapeICSText = value =>
      value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const blobContent =
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Lan & Chung//Wedding Invitation//VI\r\n` +
      `CALSCALE:GREGORIAN\r\nBEGIN:VEVENT\r\nUID:${button.dataset.ics}-lan-chung-20261212@liu-chiu.github.io\r\n` +
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\n` +
      `DTSTART:${ev.startUtc}\r\nDTEND:${ev.endUtc}\r\nSUMMARY:${escapeICSText(ev.title)}\r\n` +
      `LOCATION:${escapeICSText(ev.location)}\r\nEND:VEVENT\r\nEND:VCALENDAR`;

    const blob = new Blob([blobContent], { type: 'text/calendar;charset=utf-8' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `lan-chung-${button.dataset.ics}.ics`;
    downloadLink.click();
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);
    if (isIOS) notify('Đã tải tệp lịch. Mở tệp vừa tải để thêm sự kiện vào Lịch trên iPhone.');
  };
});

// ==========================================
// 5. CÁC TƯƠNG TÁC TIỆN ÍCH (COPY, RSVP SCROLL, SHARE)
// ==========================================
// Sao chép địa chỉ / số tài khoản với hỗ trợ Zalo WebView
$$('[data-copy]').forEach(button => {
  button.onclick = async () => {
    const textToCopy = button.dataset.copy;
    const success = await copyText(textToCopy);
    if (success) {
      notify(button.dataset.copyMessage || 'Đã sao chép vào bộ nhớ tạm');
    } else {
      notify('Không thể sao chép tự động. Vui lòng thử sao chép thủ công.');
    }
  };
});

// Nút chọn sự kiện ở phần địa điểm để cuộn thẳng xuống form RSVP
$$('[data-select]').forEach(button => {
  button.onclick = () => {
    const eventInput = $('[name=event]');
    if (eventInput) eventInput.value = button.dataset.select;
    $('#rsvp')?.scrollIntoView({ behavior: 'smooth' });
  };
});

// Nút chia sẻ trang thiệp cưới
if ($('#share')) {
  $('#share').onclick = async () => {
    const shareData = {
      title: 'Lan & Chung | 12.12.2026',
      text: 'Lan và Chung trân trọng mời bạn cùng hiện diện trong ngày cưới 12.12.2026.',
      url: location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    // Fallback: Tự động sao chép link website để gửi qua Zalo/Facebook
    const success = await copyText(location.href);
    if (success) {
      notify('Đã sao chép liên kết thiệp cưới! Bạn có thể dán và gửi cho bạn bè.');
    } else {
      notify('Hãy sao chép liên kết trên thanh địa chỉ để chia sẻ.');
    }
  };
}

// ==========================================
// 6. ALBUM ẢNH (TOUCH / SWIPE LIGHTBOX PRO)
// ==========================================
const lightbox = $('#lightbox');
const lightImg = $('#lightImg');
const lightCaption = $('#lightCaption');
const lightCounter = $('#lightCounter');
let lightboxTrigger = null;
let currentPhotoIndex = 0;

// Thu thập danh sách ảnh trong Album
const photos = $$('.photo').map((btn, index) => {
  const img = $('img', btn);
  return {
    src: btn.dataset.img || (img ? img.src : ''),
    alt: img ? img.alt : `Khoảnh khắc ngày cưới ${index + 1}`
  };
});
let galleryIgnoreNextClick = false;

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
}

// Gán click cho từng ảnh trong gallery
$$('.photo').forEach((button, index) => {
  button.onclick = () => {
    if (galleryIgnoreNextClick) {
      galleryIgnoreNextClick = false;
      return;
    }
    openLightbox(index, button);
  };
});

const gallerySlider = $('#gallerySlider');
const galleryTrack = $('#galleryTrack');
const galleryCounter = $('#galleryCounter');
const gallerySlides = $$('.photo');
const galleryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let galleryAutoSlideTimeout = null;
let galleryScrollTimeout = null;
let galleryPresentationFrame = null;
let galleryDragStartX = 0;
let galleryDragStartY = 0;
let galleryDragStartScrollLeft = 0;
let galleryDragPointerId = null;
let galleryIsDragging = false;

function getGalleryActiveIndex() {
  if (!galleryTrack || photos.length === 0) return 0;
  const trackCenter = galleryTrack.getBoundingClientRect().left + galleryTrack.clientWidth / 2;
  return gallerySlides.reduce((closestIndex, slide, index) => {
    const currentDistance = Math.abs(slide.getBoundingClientRect().left + slide.offsetWidth / 2 - trackCenter);
    const closestSlide = gallerySlides[closestIndex];
    const closestDistance = Math.abs(closestSlide.getBoundingClientRect().left + closestSlide.offsetWidth / 2 - trackCenter);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);
}

function updateGalleryPresentation() {
  if (!galleryTrack || gallerySlides.length === 0 || galleryReducedMotion.matches) return;
  const trackCenter = galleryTrack.scrollLeft + galleryTrack.clientWidth / 2;

  gallerySlides.forEach(slide => {
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
  if (!galleryCounter || photos.length === 0) return;
  const activeIndex = getGalleryActiveIndex();
  galleryCounter.textContent = `${activeIndex + 1} / ${photos.length}`;
  gallerySlides.forEach((slide, index) => {
    slide.setAttribute('aria-label', `Ảnh ${index + 1} trên ${photos.length}: ${photos[index].alt}`);
  });
}

function goToGallerySlide(index) {
  if (!galleryTrack || gallerySlides.length === 0) return;
  const slides = gallerySlides;
  const normalizedIndex = (index + slides.length) % slides.length;
  const slide = slides[normalizedIndex];
  const left = slide.offsetLeft - (galleryTrack.clientWidth - slide.clientWidth) / 2;
  galleryTrack.scrollTo({
    left,
    behavior: galleryReducedMotion.matches ? 'auto' : 'smooth'
  });
  updateGalleryPresentation();
  updateGalleryCounter();
}

function stopGalleryAutoplay() {
  clearTimeout(galleryAutoSlideTimeout);
  galleryAutoSlideTimeout = null;
}

function scheduleGalleryAutoplay() {
  stopGalleryAutoplay();
  if (
    !gallerySlider ||
    galleryReducedMotion.matches ||
    document.hidden ||
    gallerySlider.matches(':hover') ||
    gallerySlider.contains(document.activeElement) ||
    photos.length < 2
  ) return;

  galleryAutoSlideTimeout = setTimeout(() => {
    goToGallerySlide(getGalleryActiveIndex() + 1);
    scheduleGalleryAutoplay();
  }, 3000);
}

if (gallerySlider && galleryTrack) {
  gallerySlides.forEach((slide, index) => {
    slide.setAttribute('aria-label', `Ảnh ${index + 1} trên ${gallerySlides.length}: ${photos[index].alt}`);
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

  gallerySlider.addEventListener('mouseenter', stopGalleryAutoplay);
  gallerySlider.addEventListener('mouseleave', scheduleGalleryAutoplay);
  gallerySlider.addEventListener('focusin', stopGalleryAutoplay);
  gallerySlider.addEventListener('focusout', event => {
    if (!gallerySlider.contains(event.relatedTarget)) scheduleGalleryAutoplay();
  });
  gallerySlider.addEventListener('pointerdown', stopGalleryAutoplay);
  galleryReducedMotion.addEventListener('change', () => {
    updateGalleryPresentation();
    scheduleGalleryAutoplay();
  });
  document.addEventListener('visibilitychange', scheduleGalleryAutoplay);
  window.addEventListener('resize', () => {
    updateGalleryPresentation();
    updateGalleryCounter();
  });

  updateGalleryPresentation();
  updateGalleryCounter();
  scheduleGalleryAutoplay();
}

// Nút Đóng & Nút Next / Prev
$('#close')?.addEventListener('click', closeLightbox);
$('#lightPrev')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex - 1, true));
$('#lightNext')?.addEventListener('click', () => updateLightboxPhoto(currentPhotoIndex + 1, true));

// Click vùng tối ra ngoài ảnh để đóng
if (lightbox) {
  lightbox.onclick = event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  };
}

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

if (lightbox) {
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleLightboxSwipe();
  }, { passive: true });
}

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

// ==========================================
// 7. HIỆU ỨNG CÁNH HOA RƠI LÃNG MẠN (CANVAS PETALS)
// ==========================================
class FallingPetals {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.catchEffects = [];
    this.animationId = null;
    this.isRunning = false;
    this.pointer = { x: 0, y: 0, active: false, pressed: false };
    this.pointerIdleTimer = null;
    this.catchSequence = 0;
    this.maxPetals = window.innerWidth <= 768 ? 16 : 28;

    this.colors = [
      { fill: 'rgba(231, 160, 164, 0.78)', vein: 'rgba(255, 245, 239, 0.72)' },
      { fill: 'rgba(244, 191, 190, 0.8)', vein: 'rgba(255, 250, 243, 0.78)' },
      { fill: 'rgba(246, 213, 205, 0.84)', vein: 'rgba(255, 253, 247, 0.8)' },
      { fill: 'rgba(216, 174, 190, 0.76)', vein: 'rgba(255, 245, 246, 0.74)' },
      { fill: 'rgba(238, 180, 142, 0.76)', vein: 'rgba(255, 247, 225, 0.76)' }
    ];

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.init();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.maxPetals = window.innerWidth <= 768 ? 16 : 28;
  }

  createPetal() {
    return {
      x: Math.random() * this.canvas.width,
      y: -20 - Math.random() * 40,
      size: 11 + Math.random() * 7,
      type: Math.random() < 0.28 ? 'flower' : 'petal',
      caught: false,
      thrown: false,
      speedX: -0.55 + Math.random() * 1.1,
      speedY: 0.65 + Math.random() * 1.05,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.035,
      oscillationSpeed: 0.015 + Math.random() * 0.02,
      oscillationDistance: 0.55 + Math.random() * 1.3,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      angle: Math.random() * Math.PI * 2
    };
  }

  init() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', this.handlePointerUp, { passive: true });
    window.addEventListener('pointerleave', this.handlePointerLeave);

    for (let i = 0; i < this.maxPetals; i++) {
      const petal = this.createPetal();
      petal.y = Math.random() * this.canvas.height;
      this.petals.push(petal);
    }

    this.start();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else if (this.isRunning) {
        this.start();
      }
    });
  }

  handlePointerMove(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    this.pointer.active = event.pointerType === 'mouse' || this.pointer.pressed;
    if (this.pointer.active) this.schedulePetalThrow();
  }

  handlePointerDown(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    this.pointer.pressed = true;
    this.pointer.active = true;
    this.schedulePetalThrow();
  }

  handlePointerUp(event) {
    this.pointer.pressed = false;
    this.pointer.active = event.pointerType === 'mouse';
    if (this.pointer.active) this.schedulePetalThrow();
    else this.throwCaughtPetals();
  }

  handlePointerLeave() {
    this.pointer.active = false;
    this.pointer.pressed = false;
    this.throwCaughtPetals();
  }

  schedulePetalThrow() {
    if (this.pointerIdleTimer !== null) clearTimeout(this.pointerIdleTimer);
    this.pointerIdleTimer = window.setTimeout(() => {
      this.pointerIdleTimer = null;
      this.throwCaughtPetals();
    }, 260);
  }

  throwCaughtPetals() {
    if (this.pointerIdleTimer !== null) {
      clearTimeout(this.pointerIdleTimer);
      this.pointerIdleTimer = null;
    }

    const gatheredPetals = this.petals.filter(petal => petal.caught);
    if (gatheredPetals.length === 0) return;

    gatheredPetals.forEach(petal => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.2;
      petal.caught = false;
      petal.thrown = true;
      petal.throwLife = 72 + Math.floor(Math.random() * 24);
      petal.speedX = Math.cos(angle) * speed;
      petal.speedY = Math.sin(angle) * speed - 0.5;
      petal.rotationSpeed = (Math.random() - 0.5) * 0.06;
    });

    this.catchEffects.push({ x: this.pointer.x, y: this.pointer.y, life: 1 });
  }

  start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.isRunning = true;
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  toggle() {
    if (this.animationId) {
      this.stop();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return false;
    } else {
      this.start();
      return true;
    }
  }

  drawSinglePetal(length, width, color) {
    const ctx = this.ctx;
    const halfWidth = width / 2;
    const tip = -length / 2;
    const base = length / 2;
    const gradient = ctx.createLinearGradient(0, tip, 0, base);
    gradient.addColorStop(0, 'rgba(255, 250, 246, 0.92)');
    gradient.addColorStop(0.28, color.fill);
    gradient.addColorStop(1, color.fill);

    ctx.beginPath();
    ctx.moveTo(0, base);
    ctx.bezierCurveTo(-halfWidth * 0.18, base - length * 0.2, -halfWidth * 1.25, tip + length * 0.25, 0, tip);
    ctx.bezierCurveTo(halfWidth * 1.25, tip + length * 0.25, halfWidth * 0.18, base - length * 0.2, 0, base);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(169, 105, 117, 0.18)';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, base - length * 0.12);
    ctx.quadraticCurveTo(width * 0.08, 0, 0, tip + length * 0.08);
    ctx.strokeStyle = color.vein;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  drawPetal(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.type === 'flower') {
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * i) / 5);
        ctx.translate(0, -p.size * 0.2);
        this.drawSinglePetal(p.size * 0.9, p.size * 0.48, p.color);
        ctx.restore();
      }

      const center = ctx.createRadialGradient(-1, -1, 0, 0, 0, p.size * 0.18);
      center.addColorStop(0, 'rgba(255, 244, 193, 0.98)');
      center.addColorStop(1, 'rgba(205, 151, 73, 0.92)');
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.17, 0, Math.PI * 2);
      ctx.fillStyle = center;
      ctx.fill();
    } else {
      this.drawSinglePetal(p.size * 1.55, p.size * 0.9, p.color);
    }

    ctx.restore();
  }

  drawCatchEffects() {
    const ctx = this.ctx;
    for (let i = this.catchEffects.length - 1; i >= 0; i--) {
      const effect = this.catchEffects[i];
      const progress = 1 - effect.life;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 1 + progress * 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 231, 190, ${effect.life * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      effect.life -= 0.06;
      if (effect.life <= 0) this.catchEffects.splice(i, 1);
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      if (this.pointer.active && !p.caught && !p.thrown) {
        const dx = this.pointer.x - p.x;
        const dy = this.pointer.y - p.y;
        const catchRadius = p.type === 'flower' ? 42 : 34;
        if (dx * dx + dy * dy < catchRadius * catchRadius) {
          p.caught = true;
          p.catchOrder = this.catchSequence++;
        }
      }

      if (p.caught) {
        const angle = p.catchOrder * 2.4;
        const radius = (4 + Math.sqrt(p.catchOrder) * 3) / 3;
        const targetX = this.pointer.x + Math.cos(angle) * radius;
        const targetY = this.pointer.y + Math.sin(angle) * radius;
        p.x += (targetX - p.x) * 0.22;
        p.y += (targetY - p.y) * 0.22;
        p.rotation += p.rotationSpeed * 2;
      } else if (p.thrown) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedX *= 0.99;
        p.speedY = p.speedY * 0.99 + 0.02;
        p.rotation += p.rotationSpeed;
        p.throwLife--;
        if (p.throwLife <= 0) {
          this.petals[i] = this.createPetal();
          continue;
        }
      } else {
        p.angle += p.oscillationSpeed;
        p.x += Math.sin(p.angle) * p.oscillationDistance + p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
      }

      if (p.y > this.canvas.height + p.size * 2 || p.x < -p.size * 2 || p.x > this.canvas.width + p.size * 2) {
        this.petals[i] = this.createPetal();
      }

      this.drawPetal(p);
    }

    this.drawCatchEffects();
    this.animationId = requestAnimationFrame(this.animate);
  }
}

const petalsManager = new FallingPetals('petalsCanvas');

const petalsToggle = $('#petalsToggle');
if (petalsToggle) {
  petalsToggle.onclick = () => {
    const active = petalsManager.toggle();
    petalsToggle.classList.toggle('is-paused', !active);
    petalsToggle.setAttribute('aria-pressed', String(active));
    notify(active ? 'Đã bật hiệu ứng cánh hoa rơi' : 'Đã tắt hiệu ứng cánh hoa rơi');
  };
}

// ==========================================
// 8. BACKEND GOOGLE SHEETS: RSVP + LỜI CHÚC
// ==========================================
const CONFIG = window.WEDDING_CONFIG || {};

function createSubmissionId() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  return `lc_${Date.now().toString(36)}_${random}`;
}

function jsonp(params, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.apiUrl) {
      reject(new Error('Backend Google Sheets chưa được cấu hình'));
      return;
    }

    const callback = `lc_callback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(
      () => finish(new Error('Hết thời gian chờ phản hồi từ Google Sheets')),
      timeout
    );

    function finish(error, data) {
      clearTimeout(timer);
      delete window[callback];
      if (script.parentNode) script.remove();

      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }

    window[callback] = data => finish(null, data);
    script.onerror = () => finish(new Error('Không thể kết nối đến Google Sheets'));
    script.src = `${CONFIG.apiUrl}?${new URLSearchParams({ ...params, callback })}`;
    document.head.appendChild(script);
  });
}

async function submitAndVerify(payload) {
  if (!CONFIG.apiUrl) {
    throw new Error('Backend Google Sheets chưa được cấu hình');
  }

  const id = createSubmissionId();
  await fetch(CONFIG.apiUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...payload, id })
  });

  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 800 + attempt * 400));
    try {
      const result = await jsonp({ action: 'status', id }, 5000);
      if (result && result.saved) return id;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    'Không xác minh được dữ liệu đã lưu vào Google Sheets. Vui lòng thử lại sau.',
    { cause: lastError }
  );
}

async function checkBackend() {
  const state = $('#backendState');
  if (!state) return;

  if (!CONFIG.apiUrl) {
    state.textContent = 'Biểu mẫu chưa sẵn sàng. Bạn vui lòng thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
    return;
  }

  try {
    const result = await jsonp({ action: 'health' });
    state.textContent = result.ok
      ? 'Biểu mẫu đã sẵn sàng. Cảm ơn bạn đã ghé thăm!'
      : 'Biểu mẫu đang gặp chút trục trặc. Bạn vui lòng thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
  } catch (error) {
    state.textContent = 'Không kết nối được với biểu mẫu. Bạn vui lòng thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
  }
}

function appendWish(wish, label = 'Đã duyệt') {
  const wishList = $('#wishList');
  if (!wishList) return;

  const article = document.createElement('article');
  article.className = 'wish';

  const small = document.createElement('small');
  small.textContent = label;

  const quote = document.createElement('blockquote');
  quote.textContent = wish.wish;

  const author = document.createElement('p');
  author.textContent = wish.name;

  article.append(small, quote, author);
  wishList.prepend(article);
  if (wishBookDialog?.open) renderWishBook();
}

const wishViewAllButton = $('#wishViewAll');
const wishBookDialog = $('#wishBookDialog');
const wishBookEntries = $('#wishBookEntries');

function renderWishBook() {
  if (!wishBookEntries) return;
  const wishes = $$('#wishList .wish').filter(wish => $('small', wish)?.textContent?.trim() !== 'Mẫu');
  wishBookEntries.replaceChildren();

  if (wishes.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'wish-book-empty';
    emptyMessage.textContent = 'Chưa có lời chúc nào. Hãy là người gửi lời chúc đầu tiên nhé!';
    wishBookEntries.append(emptyMessage);
    return;
  }

  wishes.forEach(wish => {
    const quoteText = $('blockquote', wish)?.textContent?.trim() || '';
    const authorText = $('p', wish)?.textContent?.trim() || '';
    const entry = document.createElement('article');
    entry.className = 'wish-book-entry';

    const quote = document.createElement('blockquote');
    quote.textContent = quoteText;
    const author = document.createElement('p');
    author.textContent = authorText;
    entry.append(quote, author);
    wishBookEntries.append(entry);
  });
}

if (wishViewAllButton && wishBookDialog?.showModal) {
  wishViewAllButton.addEventListener('click', () => {
    renderWishBook();
    wishBookDialog.showModal();
  });

  $('#wishBookClose')?.addEventListener('click', () => wishBookDialog.close());
  wishBookDialog.addEventListener('click', event => {
    if (event.target === wishBookDialog) wishBookDialog.close();
  });
}

async function loadApprovedWishes() {
  if (!CONFIG.apiUrl) return;

  try {
    const result = await jsonp({ action: 'wishes' });
    if (!result || !result.ok || !Array.isArray(result.wishes)) {
      throw new Error('Google Sheets trả về danh sách lời chúc không hợp lệ');
    }

    if (result.wishes.length > 0) {
      $$('#wishList .wish').filter(wish => $('small', wish)?.textContent?.trim() === 'Mẫu')
        .forEach(wish => wish.remove());
    }
    [...result.wishes].reverse().forEach(wish => appendWish(wish));
  } catch (error) {
    console.warn('Không tải được danh sách lời chúc từ server:', error);
  }
}

checkBackend();
loadApprovedWishes();

// Gửi form lời chúc
if ($('#wishForm')) {
  $('#wishForm').onsubmit = async event => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const status = $('#wishStatus');
    const button = $('button[type="submit"]', form) || $('button', form);

    button.disabled = true;
    if (status) status.textContent = 'Cảm ơn bạn, tụi mình đang gửi lời chúc đến Lan & Chung nhé…';

    try {
      const wish = {
        name: data.guestName.trim(),
        wish: data.wish.trim()
      };

      await submitAndVerify({ type: 'wish', ...wish });
      appendWish(wish, 'Vừa gửi');
      $('#wishList .wish')?.classList.add('is-new');

      if (status) status.textContent = 'Cảm ơn bạn đã gửi lời chúc thật dễ thương! Tụi mình đã nhận được rồi nhé.';
      form.reset();
    } catch (error) {
      console.error('Không gửi được lời chúc:', error);
      if (status) status.textContent = 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
    } finally {
      button.disabled = false;
    }
  };
}

const rsvpTransportOptions = {
  self: 'Tự di chuyển',
  bride: 'Đi cùng xe đoàn về nhà gái',
  groom: 'Đi cùng xe đoàn về nhà trai'
};

const rsvpTravelDetails = {
  bride: {
    title: 'Thông tin di chuyển về nhà gái',
    items: [
      ['Thời gian đoàn di chuyển', '7:00 sáng ngày 12/12/2026'],
      ['Địa điểm đón khách', 'Ngõ 36 Giang Văn Minh, Phường Kim Mã, Hà Nội'],
      ['Trưởng đoàn', 'Anh A'],
      ['Số điện thoại trưởng đoàn', '0081028124', 'phone'],
      ['Cô dâu', 'Ngọc Lan'],
      ['Số điện thoại cô dâu', '0325022345', 'phone']
    ]
  },
  groom: {
    title: 'Thông tin di chuyển về nhà trai',
    items: [
      ['Thời gian đoàn di chuyển', '15:00 chiều ngày 12/12/2026'],
      ['Địa điểm đón khách', '11 A Cát Linh, Ô Chợ Dừa, Hà Nội'],
      ['Trưởng đoàn', 'Anh B'],
      ['Số điện thoại trưởng đoàn', '0081028124', 'phone'],
      ['Chú rể', 'Văn Chung'],
      ['Số điện thoại chú rể', '0376147556', 'phone']
    ]
  }
};

const rsvpConfirmationDialog = $('#rsvpConfirmationDialog');
const rsvpConfirmationTitle = $('#rsvpConfirmationTitle');
const rsvpConfirmationContent = $('#rsvpConfirmationContent');

function createRsvpInfoCard(title, items) {
  const card = document.createElement('section');
  card.className = 'rsvp-info-card';

  const heading = document.createElement('h3');
  heading.textContent = title;
  const list = document.createElement('dl');
  const copyLines = [];

  items.forEach(([label, value, type]) => {
    const row = document.createElement('div');
    row.className = 'rsvp-info-row';
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');

    if (type === 'phone') {
      const link = document.createElement('a');
      link.href = `tel:${value.replace(/[^\d+]/g, '')}`;
      link.textContent = value;
      description.append(link);
    } else {
      description.textContent = value;
    }

    row.append(term, description);
    list.append(row);
    copyLines.push(`${label}: ${value}`);
  });

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'rsvp-copy-info';
  copyButton.textContent = 'Sao chép thông tin';
  copyButton.addEventListener('click', async () => {
    const copied = await copyText(copyLines.join('\n'));
    copyButton.textContent = copied ? 'Đã sao chép' : 'Không thể sao chép';
    window.setTimeout(() => {
      copyButton.textContent = 'Sao chép thông tin';
    }, 1800);
  });

  card.append(heading, list, copyButton);
  return card;
}

function showRsvpConfirmation(attendance, transportation) {
  if (!rsvpConfirmationDialog?.showModal || !rsvpConfirmationTitle || !rsvpConfirmationContent) return;

  rsvpConfirmationContent.replaceChildren();
  const submissionStatus = document.createElement('p');
  submissionStatus.className = 'rsvp-confirmation-status';
  submissionStatus.setAttribute('role', 'status');
  submissionStatus.setAttribute('aria-live', 'polite');
  submissionStatus.textContent = 'Đang gửi xác nhận…';
  rsvpConfirmationContent.append(submissionStatus);

  if (attendance === 'Không thể tham dự') {
    rsvpConfirmationTitle.textContent = 'Cảm ơn bạn đã phản hồi';
    const message = document.createElement('p');
    message.textContent = 'Lan & Chung rất tiếc vì chưa thể đón bạn trong ngày vui. Cảm ơn bạn đã gửi lời chúc và luôn yêu thương, đồng hành cùng chúng mình. Hẹn gặp bạn trong dịp gần nhất nhé!';
    rsvpConfirmationContent.append(message);
  } else if (transportation === rsvpTransportOptions.bride) {
    rsvpConfirmationTitle.textContent = 'Cảm ơn bạn sẽ đến chung vui';
    const details = rsvpTravelDetails.bride;
    rsvpConfirmationContent.append(createRsvpInfoCard(details.title, details.items));
  } else if (transportation === rsvpTransportOptions.groom) {
    rsvpConfirmationTitle.textContent = 'Cảm ơn bạn sẽ đến chung vui';
    const details = rsvpTravelDetails.groom;
    rsvpConfirmationContent.append(createRsvpInfoCard(details.title, details.items));
  } else {
    rsvpConfirmationTitle.textContent = 'Hẹn gặp bạn trong ngày vui';
    const message = document.createElement('p');
    message.textContent = 'Cảm ơn bạn đã xác nhận tham dự. Chúc bạn di chuyển an toàn và hẹn gặp bạn tại buổi tiệc nhé!';

    const brideContacts = [
      ['Cô dâu', 'Ngọc Lan'],
      ['Số điện thoại cô dâu', '0325022345', 'phone'],
      ['Chú rể', 'Văn Chung'],
      ['Số điện thoại chú rể', '0376147556', 'phone']
    ];
    const brideEvent = [
      ['Thời gian', '10:30, Thứ Bảy 12/12/2026'],
      ['Địa điểm', 'Trung tâm tiệc cưới SeaBay Hạ Long'],
      ['Địa chỉ', 'X232+7MW, Bãi Cháy, Quảng Ninh']
    ];
    const groomEvent = [
      ['Thời gian', '17:00, Thứ Bảy 12/12/2026'],
      ['Địa điểm', 'Tư gia nhà trai'],
      ['Địa chỉ', 'Số 8, ngõ 3, đường Văn Hoá, Khối 8 (Xóm Đồng), Sóc Sơn, Hà Nội']
    ];

    rsvpConfirmationContent.append(
      message,
      createRsvpInfoCard('Liên hệ cô dâu & chú rể', brideContacts),
      createRsvpInfoCard('Tiệc nhà gái', brideEvent),
      createRsvpInfoCard('Tiệc nhà trai', groomEvent)
    );
  }

  rsvpConfirmationDialog.showModal();
  return submissionStatus;
}

if (rsvpConfirmationDialog) {
  $('.rsvp-confirmation-close', rsvpConfirmationDialog)?.addEventListener('click', () => {
    rsvpConfirmationDialog.close();
  });
  rsvpConfirmationDialog.addEventListener('click', event => {
    if (event.target === rsvpConfirmationDialog) rsvpConfirmationDialog.close();
  });
}

// Gửi form RSVP xác nhận tham dự
if ($('#rsvpForm')) {
  const form = $('#rsvpForm');
  const eventSelect = $('[name="event"]', form);
  const transportationField = $('#rsvpTransportationField');
  const transportationSelect = $('[name="transportation"]', form);
  const attendanceInputs = $$('[name="attendance"]', form);
  const status = $('#rsvpStatus');
  let isSubmitting = false;

  const clearPreviousStatus = () => {
    if (!isSubmitting && status) status.textContent = '';
  };
  form.addEventListener('input', clearPreviousStatus);
  form.addEventListener('change', clearPreviousStatus);

  function setDefaultTransportation() {
    if (!transportationSelect || !eventSelect) return;
    transportationSelect.value = eventSelect.value === 'Tiệc nhà trai'
      ? rsvpTransportOptions.groom
      : rsvpTransportOptions.bride;
  }

  function updateTransportationVisibility() {
    const attendance = $('[name="attendance"]:checked', form)?.value;
    const attending = attendance === 'Sẽ tham dự';
    if (eventSelect) {
      eventSelect.required = attendance !== 'Không thể tham dự';
      if (attendance === 'Không thể tham dự') {
        eventSelect.value = 'Cả hai buổi tiệc';
      }
    }
    if (!transportationField || !transportationSelect) return;
    transportationField.hidden = !attending;
    transportationSelect.required = attending;
    if (attending) setDefaultTransportation();
    else transportationSelect.value = '';
  }

  attendanceInputs.forEach(input => input.addEventListener('change', updateTransportationVisibility));
  eventSelect?.addEventListener('change', () => {
    if ($('[name="attendance"]:checked', form)?.value === 'Sẽ tham dự') {
      setDefaultTransportation();
    }
  });
  updateTransportationVisibility();

  $('#rsvpForm').onsubmit = async event => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const button = $('button[type="submit"]', form) || $('button', form);

    isSubmitting = true;
    button.disabled = true;
    if (status) status.textContent = 'Cảm ơn bạn, tụi mình đang gửi phản hồi đến Lan & Chung nhé…';
    const confirmationStatus = showRsvpConfirmation(data.attendance, data.transportation);

    try {
      const id = await submitAndVerify({
        type: 'rsvp',
        name: data.name.trim(),
        guests: data.guests,
        event: data.event,
        attendance: data.attendance,
        transportation: data.transportation || '',
        phone: data.phone || '',
        message: data.message || ''
      });

      if (status) status.textContent = '';
      if (confirmationStatus) {
        confirmationStatus.textContent = 'Đã gửi xác nhận thành công. Cảm ơn bạn!';
        confirmationStatus.classList.add('is-success');
      }
      form.reset();
      updateTransportationVisibility();
    } catch (error) {
      console.error('Không gửi được xác nhận tham dự:', error);
      if (status) status.textContent = 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Lan & Chung nhé.';
      if (confirmationStatus) {
        confirmationStatus.textContent = 'Chưa gửi được xác nhận. Vui lòng đóng cửa sổ này và thử gửi lại.';
        confirmationStatus.classList.add('is-error');
      }
    } finally {
      isSubmitting = false;
      button.disabled = false;
    }
  };
}

// ==========================================
// 9. TRÌNH PHÁT NHẠC NỀN (AUDIO PLAYER)
// ==========================================
const musicButton = $('#music');
const musicPlayer = $('#musicPlayer');
const backgroundTracks = [
  { title: 'Beautiful In White', src: 'assets/audio/Beautiful In White.mp3' },
  { title: 'Hoa và Váy (RnB ver)', src: 'assets/audio/Hoa và Váy (RnB ver).mp3' },
  { title: 'Hơn Cả Yêu', src: 'assets/audio/Hon-Ca-Yeu-Duc-Phuc.mp3' },
  { title: 'Thế Giới Của Anh', src: 'assets/audio/THẾ GIỚI CỦA ANH.mp3' }
];
let globalAudio = null;
let musicQueue = [];
let currentMusicTrack = null;
let lastMusicTrack = null;

function refillMusicQueue() {
  musicQueue = [...backgroundTracks];
  for (let i = musicQueue.length - 1; i > 0; i--) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [musicQueue[i], musicQueue[swapIndex]] = [musicQueue[swapIndex], musicQueue[i]];
  }

  if (musicQueue.length > 1 && musicQueue[musicQueue.length - 1] === lastMusicTrack) {
    const swapIndex = Math.floor(Math.random() * (musicQueue.length - 1));
    [musicQueue[swapIndex], musicQueue[musicQueue.length - 1]] = [musicQueue[musicQueue.length - 1], musicQueue[swapIndex]];
  }
}

function playNextRandomTrack() {
  if (!globalAudio || !backgroundTracks.length) return;
  if (!musicQueue.length) refillMusicQueue();

  currentMusicTrack = musicQueue.pop();
  lastMusicTrack = currentMusicTrack;
  globalAudio.src = currentMusicTrack.src;
  globalAudio.load();
  globalAudio.play().catch(error => {
    console.warn(`Không thể phát bài nhạc "${currentMusicTrack.title}":`, error);
  });
}

function getOrCreateAudio() {
  if (!globalAudio) {
    globalAudio = document.createElement('audio');
    globalAudio.preload = 'auto';
    globalAudio.setAttribute('aria-hidden', 'true');
    globalAudio.addEventListener('ended', playNextRandomTrack);
    globalAudio.addEventListener('error', () => {
      console.error(`Không thể tải bài nhạc "${currentMusicTrack?.title || 'không xác định'}":`, globalAudio.error);
    });

    globalAudio.addEventListener('play', () => {
      if (musicButton) {
        musicButton.classList.add('is-open');
        musicButton.setAttribute('aria-pressed', 'true');
        musicButton.setAttribute('aria-label', 'Tắt nhạc nền');
        const label = $('.music-label', musicButton);
        if (label) label.textContent = 'Tắt nhạc';
      }
    });

    globalAudio.addEventListener('pause', () => {
      if (musicButton) {
        musicButton.classList.remove('is-open');
        musicButton.setAttribute('aria-pressed', 'false');
        musicButton.setAttribute('aria-label', 'Phát nhạc nền');
        const label = $('.music-label', musicButton);
        if (label) label.textContent = 'Nghe nhạc';
      }
    });

    if (musicPlayer) musicPlayer.appendChild(globalAudio);
  }
  return globalAudio;
}

function startBackgroundMusic() {
  getOrCreateAudio();
  if (!currentMusicTrack) {
    playNextRandomTrack();
    return;
  }

  globalAudio.play().catch(error => {
    console.warn('Tự động phát nhạc bị chặn bởi trình duyệt:', error);
  });
}

function stopBackgroundMusic() {
  if (globalAudio) {
    globalAudio.pause();
  }
}

if (musicButton) {
  musicButton.onclick = () => {
    const player = getOrCreateAudio();
    if (player.paused) {
      if (!currentMusicTrack) {
        playNextRandomTrack();
      } else {
        player.play().catch(err => console.warn('Không thể phát nhạc:', err));
      }
    } else {
      player.pause();
    }
  };
}

// ==========================================
// 10. CÁ NHÂN HÓA THIỆP MỜI (?to=... & ?side=...)
// ==========================================
function applyPersonalization() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get('to') || urlParams.get('guest') || urlParams.get('name');
  const sideParam = (urlParams.get('side') || urlParams.get('event') || '').toLowerCase();

  // 1. Nếu có tên khách mời
  if (guestParam) {
    const guestName = guestParam.trim();

    // Hiển thị trên lá thiệp bìa phong bì
    const guestCardBadge = $('#guestCardBadge');
    const guestCoverName = $('#guestCoverName');
    if (guestCardBadge && guestCoverName) {
      guestCoverName.textContent = guestName;
      guestCardBadge.hidden = false;
    }

    // Hiển thị trong lời mời Hero
    const guestHeroName = $('#guestHeroName');
    if (guestHeroName) {
      guestHeroName.textContent = guestName;
    }

    // Điền sẵn vào Form RSVP
    const rsvpNameInput = $('input[name="name"]');
    if (rsvpNameInput) {
      rsvpNameInput.value = guestName;
    }

    // Điền sẵn vào Form Gửi lời chúc
    const wishNameInput = $('input[name="guestName"]');
    if (wishNameInput) {
      wishNameInput.value = guestName;
    }
  }

  // 2. Nếu có chỉ định buổi tiệc (nhà trai / nhà gái)
  if (sideParam) {
    const eventSelect = $('select[name="event"]');
    if (eventSelect) {
      if (sideParam === 'bride' || sideParam.includes('gai') || sideParam.includes('nha-gai')) {
        eventSelect.value = 'Tiệc nhà gái';
      } else if (sideParam === 'groom' || sideParam.includes('trai') || sideParam.includes('nha-trai')) {
        eventSelect.value = 'Tiệc nhà trai';
      } else if (sideParam === 'both' || sideParam.includes('ca-hai')) {
        eventSelect.value = 'Cả hai buổi tiệc';
      }
    }
  }
}

applyPersonalization();

// ==========================================
// 11. CÔNG CỤ TẠO LINK GỬI KHÁCH (LINK GENERATOR)
// ==========================================
const linkModal = $('#linkModal');
const openLinkModalBtn = $('#openLinkModalBtn');
const closeLinkModalBtn = $('#closeLinkModal');
const genGuestName = $('#genGuestName');
const genGuestSide = $('#genGuestSide');
const genLinkPreview = $('#genLinkPreview');
const btnCopyGenLink = $('#btnCopyGenLink');

function updateGeneratedLink() {
  const base = CONFIG.siteUrl || (window.location.origin + window.location.pathname);
  const nameVal = genGuestName ? genGuestName.value.trim() : '';
  const sideVal = genGuestSide ? genGuestSide.value : '';

  const params = new URLSearchParams();
  if (nameVal) params.set('to', nameVal);
  if (sideVal) params.set('side', sideVal);

  const qs = params.toString();
  const finalUrl = qs ? `${base}?${qs}` : base;

  if (genLinkPreview) {
    genLinkPreview.textContent = finalUrl;
  }
  return finalUrl;
}

if (openLinkModalBtn && linkModal) {
  openLinkModalBtn.onclick = () => {
    linkModal.hidden = false;
    updateGeneratedLink();
    setTimeout(() => genGuestName?.focus(), 100);
  };
}

if (closeLinkModalBtn && linkModal) {
  closeLinkModalBtn.onclick = () => {
    linkModal.hidden = true;
  };

  linkModal.onclick = event => {
    if (event.target === linkModal) {
      linkModal.hidden = true;
    }
  };
}

genGuestName?.addEventListener('input', updateGeneratedLink);
genGuestSide?.addEventListener('change', updateGeneratedLink);

if (btnCopyGenLink) {
  btnCopyGenLink.onclick = async () => {
    const finalUrl = updateGeneratedLink();
    const ok = await copyText(finalUrl);
    if (ok) {
      notify('Đã sao chép link mời! Bạn có thể dán và gửi qua Zalo/Facebook.');
      if (linkModal) linkModal.hidden = true;
    } else {
      notify('Không thể tự sao chép, bạn hãy bôi đen link và copy nhé.');
    }
  };
}

// ==========================================
// 12. XỬ LÝ HỘP QUÀ MỪNG CƯỚI LẮC LƯ (GIFT BOX INTERACTION)
// ==========================================
const giftTabs = $$('.gift-tab');
const giftTabsMobile = window.matchMedia('(max-width: 768px)');
let activeGiftTab = $('#giftBrideTab');

function updateGiftTabs() {
  giftTabs.forEach(tab => {
    const isActive = tab === activeGiftTab;
    const panel = $('#' + tab.getAttribute('aria-controls'));
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (panel) panel.hidden = giftTabsMobile.matches && !isActive;
  });
}

function activateGiftTab(tab, moveFocus = false) {
  if (!giftTabs.includes(tab)) return;
  activeGiftTab = tab;
  updateGiftTabs();
  if (moveFocus) tab.focus();
}

giftTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateGiftTab(tab));
  tab.addEventListener('keydown', event => {
    let nextIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % giftTabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + giftTabs.length) % giftTabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = giftTabs.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    activateGiftTab(giftTabs[nextIndex], true);
  });
});

giftTabsMobile.addEventListener('change', updateGiftTabs);
updateGiftTabs();

function spawnGiftSparkles(element) {
  if (!element) return;
  const icons = ['✨', '💖', '🎁', '⭐', '🌸'];
  for (let i = 0; i < 6; i++) {
    const span = document.createElement('span');
    span.className = 'gift-sparkle-float';
    span.textContent = icons[i % icons.length];
    span.style.left = `${15 + Math.random() * 70}%`;
    span.style.top = `35%`;
    span.style.animationDelay = `${i * 70}ms`;
    element.appendChild(span);
    setTimeout(() => span.remove(), 1200);
  }
}

$$('.gift-box-btn').forEach(button => {
  button.onclick = () => {
    if (navigator.vibrate) {
      try { navigator.vibrate([18, 30]); } catch (e) {}
    }
    const card = button.closest('.gift-box-card');
    if (!card) return;

    spawnGiftSparkles(card);

    const content = card.querySelector('.gift-content');
    card.classList.add('is-open');
    if (content) {
      content.hidden = false;
      const copyBtn = content.querySelector('.copy-account');
      if (copyBtn) setTimeout(() => copyBtn.focus(), 350);
    }
    button.setAttribute('aria-expanded', 'true');
  };
});

$$('.gift-close-btn').forEach(btn => {
  btn.onclick = () => {
    const targetId = btn.dataset.closeTarget;
    const card = targetId ? $('#' + targetId) : btn.closest('.gift-box-card');
    if (!card) return;
    const content = card.querySelector('.gift-content');
    const trigger = card.querySelector('.gift-box-btn');
    card.classList.remove('is-open');
    if (content) content.hidden = true;
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  };
});
