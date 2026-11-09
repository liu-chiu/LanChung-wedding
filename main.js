'use strict';

// ==========================================
// ENTRY POINT — NẠP CÁC MODULE TÍNH NĂNG
// ==========================================
// Scripts được tải bằng <script defer> (không phải ES modules) nên mỗi module
// tự thực thi khi tải. File này giữ lại các mảnh glue dùng chung.

// ==========================================
// CÁC MODULE CON ĐƯỢC NẠP TRƯỚC (helpers.js, envelope.js, card-viewer.js,
// lightbox.js, gallery.js, ics.js, backend.js, rsvp.js, utilities.js)
// File này chứa các mảnh glue còn lại của trang.
// ==========================================

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('pageshow', () => {
  const fragment = window.location.hash.slice(1);
  const target = fragment ? document.getElementById(fragment) : null;
  if (target) {
    target.scrollIntoView();
    return;
  }
  window.scrollTo(0, 0);
});

// ==========================================
// MENU & THANH HEADER (NAVIGATION)
// ==========================================

const menuButton = window.__weddingHelpers.$('#menu');
const navigation = window.__weddingHelpers.$('#nav');
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
window.__weddingHelpers.$$('nav a').forEach(link => {
  link.onclick = () => {
    setNavigationOpen(false);
  };
});

const siteHeader = window.__weddingHelpers.$('.site-header');
let previousScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  if (!siteHeader) return;

  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - previousScrollY;

  if (currentScrollY <= siteHeader.offsetHeight || scrollDelta < 0) {
    siteHeader?.classList.remove('is-hidden');
    if (scrollDelta < 0 || currentScrollY <= siteHeader.offsetHeight) {
      setNavigationOpen(false);
    }
  } else if (scrollDelta > 0) {
    siteHeader.classList.add('is-hidden');
    setNavigationOpen(false);
  }

  previousScrollY = currentScrollY;
}, { passive: true });

mobileNavigation.addEventListener('change', () => {
  setNavigationOpen(false);
});

// Hiệu ứng cuộn trang hiện dần (Scroll Reveal)
function setupRevealObserver() {
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

  window.__weddingHelpers.$$('.reveal').forEach(element => observer.observe(element));
}

// Initialize reveal observer after cover is removed (or immediately if no cover)
if (document.getElementById('cover')) {
  window.addEventListener('wedding:coverRemoved', setupRevealObserver, { once: true });
} else {
  setupRevealObserver();
}

// ==========================================
// BỘ ĐẾM NGƯỢC THỜI GIAN (COUNTDOWN)
// ==========================================
const targetTime = new Date('2026-12-12T10:30:00+07:00').getTime();

function updateCountdown() {
  const now = Date.now();
  const timeLeft = targetTime - now;

  if (timeLeft <= 0) {
    ['days', 'hours', 'mins', 'secs'].forEach(id => {
      const element = window.__weddingHelpers.$('#' + id);
      if (element) element.textContent = '00';
    });

    const message = window.__weddingHelpers.$('#countMsg');
    if (message) message.textContent = 'Ngày hạnh phúc đã đến!';
    return;
  }

  const days = window.__weddingHelpers.$('#days');
  const hours = window.__weddingHelpers.$('#hours');
  const minutes = window.__weddingHelpers.$('#mins');
  const seconds = window.__weddingHelpers.$('#secs');

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
// HIỆU ỨNG CÁNH HOA RƠI LÃNG MẠN (CANVAS PETALS)
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
    if (window.__weddingHelpers.prefersReducedMotion.matches) return;

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

const petalsToggle = window.__weddingHelpers.$('#petalsToggle');
if (petalsToggle) {
  petalsToggle.onclick = () => {
    const active = petalsManager.toggle();
    petalsToggle.classList.toggle('is-paused', !active);
    petalsToggle.setAttribute('aria-pressed', String(active));
    notify(active ? 'Đã bật hiệu ứng cánh hoa rơi' : 'Đã tắt hiệu ứng cánh hoa rơi');
  };
}

// ==========================================
// TRÌNH PHÁT NHẠC NỀN (AUDIO PLAYER)
// ==========================================
const musicButton = window.__weddingHelpers.$('#music');
const musicPlayer = window.__weddingHelpers.$('#musicPlayer');
const backgroundTracks = [
  { title: 'Beautiful In White', src: 'assets/audio/Beautiful In White.mp3' },
  { title: 'Hoa và Váy (RnB ver)', src: 'assets/audio/Hoa và Váy (RnB ver).mp3' },
  { title: 'Hơn Cả Yêu', src: 'assets/audio/Hon-Ca-Yeu-Duc-Phuc.mp3' },
  { title: 'Thế Giới Của Anh', src: 'assets/audio/THẾ GIỚI CỦA ANH.mp3' }
];

let globalAudio = null;
let currentTrackIndex = 0;

function updateMusicButtonState(isPlaying) {
  if (!musicButton) return;
  musicButton.classList.toggle('is-open', isPlaying);
  musicButton.setAttribute('aria-pressed', String(isPlaying));
  musicButton.setAttribute('aria-label', isPlaying ? 'Tắt nhạc nền' : 'Phát nhạc nền');
  const label = window.__weddingHelpers.$('.music-label', musicButton);
  if (label) label.textContent = isPlaying ? 'Tắt nhạc' : 'Nghe nhạc';
}

function playTrackAtIndex(index) {
  if (index < 0) index = backgroundTracks.length - 1;
  if (index >= backgroundTracks.length) index = 0;
  currentTrackIndex = index;

  const audio = getOrCreateAudio();
  const track = backgroundTracks[currentTrackIndex];
  if (!track) return;

  audio.src = track.src;
  audio.load();
  audio.play().then(() => {
    updateMusicButtonState(true);
  }).catch(err => {
    console.warn(`Không thể phát bài "${track.title}":`, err);
    updateMusicButtonState(false);
  });
}

function playNextTrack() {
  playTrackAtIndex(currentTrackIndex + 1);
}

function getOrCreateAudio() {
  if (!globalAudio) {
    globalAudio = document.createElement('audio');
    globalAudio.preload = 'none';
    globalAudio.setAttribute('aria-hidden', 'true');
    globalAudio.addEventListener('ended', playNextTrack);
    globalAudio.addEventListener('play', () => updateMusicButtonState(true));
    globalAudio.addEventListener('pause', () => updateMusicButtonState(false));
    globalAudio.addEventListener('error', () => {
      console.error(`Không thể tải bài nhạc: ${backgroundTracks[currentTrackIndex]?.title}`);
      updateMusicButtonState(false);
    });

    if (musicPlayer) musicPlayer.appendChild(globalAudio);
  }
  return globalAudio;
}

function startBackgroundMusicFromMain() {
  const audio = getOrCreateAudio();
  if (audio.paused) {
    if (!audio.src) {
      playTrackAtIndex(0);
    } else {
      audio.play().then(() => updateMusicButtonState(true)).catch(() => {});
    }
  }
}

window.__weddingEnvelope?.setEnvelopeMusicStarter(startBackgroundMusicFromMain);

if (musicButton) {
  musicButton.onclick = () => {
    const audio = getOrCreateAudio();
    if (audio.paused) {
      if (!audio.src) {
        playTrackAtIndex(0);
      } else {
        audio.play().then(() => updateMusicButtonState(true)).catch(err => console.warn('Không thể phát nhạc:', err));
      }
    } else {
      audio.pause();
    }
  };
}

// ==========================================
// CÁ NHÂN HÓA THIỆP MỜI & VIETQR THÔNG MINH (?to=... & ?side=...)
// ==========================================
function cleanGuestName(raw) {
  if (!raw) return '';
  // Giữ nguyên 100% cách viết hoa/thường và chính tả ban đầu của người tạo link
  // Chỉ giải mã URI và thay thế dấu gạch ngang/dưới thành khoảng trắng (nếu link truyền dạng slug)
  return decodeURIComponent(raw).replace(/[-_]+/g, ' ').trim();
}

function applyPersonalization() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get('to') || urlParams.get('guest') || urlParams.get('name');
  const roleParam = urlParams.get('role');
  const sideParam = (urlParams.get('side') || urlParams.get('event') || '').toLowerCase();

  let guestName = cleanGuestName(guestParam);
  if (roleParam && guestName && !guestName.toLowerCase().startsWith(roleParam.toLowerCase())) {
    guestName = `${cleanGuestName(roleParam)} ${guestName}`;
  }

  // 1. Nếu có tên khách mời
  if (guestName) {
    // Hiển thị trên lá thiệp bìa phong bì
    const guestCardBadge = window.__weddingHelpers.$('#guestCardBadge');
    const guestCoverName = window.__weddingHelpers.$('#guestCoverName');
    if (guestCardBadge && guestCoverName) {
      guestCoverName.textContent = guestName;
      guestCardBadge.hidden = false;
    }

    // Hiển thị trong Chế độ xem thiệp 3D
    const guestViewerName = window.__weddingHelpers.$('#guestViewerName');
    if (guestViewerName) {
      guestViewerName.textContent = guestName;
    }

    // Hiển thị trên thẻ thiệp 3D ở Hero
    const heroCardGuestName = window.__weddingHelpers.$('#heroCardGuestName');
    if (heroCardGuestName) {
      heroCardGuestName.textContent = guestName;
    }

    // Hiển thị trong lời mời Hero
    const guestHeroName = window.__weddingHelpers.$('#guestHeroName');
    if (guestHeroName) {
      guestHeroName.textContent = guestName;
    }

    // Điền sẵn vào Form RSVP
    const rsvpNameInput = window.__weddingHelpers.$('input[name="name"]');
    if (rsvpNameInput) {
      rsvpNameInput.value = guestName;
    }

    // Điền sẵn vào Form Gửi lời chúc
    const wishNameInput = window.__weddingHelpers.$('input[name="guestName"]');
    if (wishNameInput) {
      wishNameInput.value = guestName;
    }

    // Cập nhật mã VietQR động với lời chúc cá nhân hóa
    const qrBride = window.__weddingHelpers.$('#giftContentBride img.qr');
    if (qrBride) {
      const brideQRUrl = `https://img.vietqr.io/image/TCB-19037213961014-compact2.png?addInfo=${encodeURIComponent(`${guestName} - Mung cuoi Lan Chung`)}&accountName=BUI%20NGOC%20LAN`;
      const fallbackBride = qrBride.src;
      qrBride.onerror = () => { qrBride.src = fallbackBride; };
      qrBride.src = brideQRUrl;
    }

    const qrGroom = window.__weddingHelpers.$('#giftContentGroom img.qr');
    if (qrGroom) {
      const groomQRUrl = `https://img.vietqr.io/image/TCB-19031119300014-compact2.png?addInfo=${encodeURIComponent(`${guestName} - Mung cuoi Lan Chung`)}&accountName=NGUYEN%20VAN%20CHUNG`;
      const fallbackGroom = qrGroom.src;
      qrGroom.onerror = () => { qrGroom.src = fallbackGroom; };
      qrGroom.src = groomQRUrl;
    }
  } else {
    // Không có tên khách mời → hiển thị mặc định "Quý Khách"
    const defaultName = 'Quý Khách';

    const guestCardBadge = window.__weddingHelpers.$('#guestCardBadge');
    const guestCoverName = window.__weddingHelpers.$('#guestCoverName');
    if (guestCardBadge && guestCoverName) {
      guestCoverName.textContent = defaultName;
      guestCardBadge.hidden = false;
    }

    const guestViewerName = window.__weddingHelpers.$('#guestViewerName');
    if (guestViewerName) {
      guestViewerName.textContent = defaultName;
    }

    const heroCardGuestName = window.__weddingHelpers.$('#heroCardGuestName');
    if (heroCardGuestName) {
      heroCardGuestName.textContent = defaultName;
    }

    const guestHeroName = window.__weddingHelpers.$('#guestHeroName');
    if (guestHeroName) {
      guestHeroName.textContent = defaultName;
    }
  }

  // 2. Nếu có chỉ định buổi tiệc (nhà trai / nhà gái)
  if (sideParam) {
    const eventSelect = window.__weddingHelpers.$('select[name="event"]');
    const isBride = sideParam === 'bride' || sideParam.includes('gai') || sideParam.includes('nha-gai');
    const isGroom = sideParam === 'groom' || sideParam.includes('trai') || sideParam.includes('nha-trai');

    if (eventSelect) {
      if (isBride) {
        eventSelect.value = 'Tiệc nhà gái';
      } else if (isGroom) {
        eventSelect.value = 'Tiệc nhà trai';
      } else if (sideParam === 'both' || sideParam.includes('ca-hai')) {
        eventSelect.value = 'Cả hai buổi tiệc';
      }
    }

    // Tự động kích hoạt tab mừng cưới và highlight tiệc tương ứng
    if (isBride) {
      const brideTab = window.__weddingHelpers.$('#giftBrideTab');
      if (brideTab) brideTab.click();
      const eventBride = window.__weddingHelpers.$('#eventBride');
      if (eventBride) eventBride.classList.add('is-highlighted');
    } else if (isGroom) {
      const groomTab = window.__weddingHelpers.$('#giftGroomTab');
      if (groomTab) groomTab.click();
      const eventGroom = window.__weddingHelpers.$('#eventGroom');
      if (eventGroom) eventGroom.classList.add('is-highlighted');
    }
  }
}

applyPersonalization();

// ==========================================
// CÔNG CỤ TẠO LINK GỬI KHÁCH (LINK GENERATOR)
// ==========================================
const linkModal = window.__weddingHelpers.$('#linkModal');
const openLinkModalBtn = window.__weddingHelpers.$('#openLinkModalBtn');
const closeLinkModalBtn = window.__weddingHelpers.$('#closeLinkModal');
const genGuestName = window.__weddingHelpers.$('#genGuestName');
const genGuestSide = window.__weddingHelpers.$('#genGuestSide');
const genLinkPreview = window.__weddingHelpers.$('#genLinkPreview');
const btnCopyGenLink = window.__weddingHelpers.$('#btnCopyGenLink');

function updateGeneratedLink() {
  const base = window.WEDDING_CONFIG?.siteUrl || (window.location.origin + window.location.pathname);
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
// XỬ LÝ HỘP QUÀ MỪNG CƯỚI LẮC LƯ (GIFT BOX INTERACTION)
// ==========================================
const giftTabs = window.__weddingHelpers.$$('.gift-tab');
const giftTabsMobile = window.matchMedia('(max-width: 768px)');
let activeGiftTab = window.__weddingHelpers.$('#giftBrideTab');

function updateGiftTabs() {
  giftTabs.forEach(tab => {
    const isActive = tab === activeGiftTab;
    const panel = window.__weddingHelpers.$('#' + tab.getAttribute('aria-controls'));
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

window.__weddingHelpers.$$('.gift-box-btn').forEach(button => {
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

window.__weddingHelpers.$$('.gift-close-btn').forEach(btn => {
  btn.onclick = () => {
    const targetId = btn.dataset.closeTarget;
    const card = targetId ? window.__weddingHelpers.$('#' + targetId) : btn.closest('.gift-box-card');
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
