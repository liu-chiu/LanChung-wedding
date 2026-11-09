'use strict';

// ==========================================
// MỞ PHONG BÌ THƯ HOÀNG GIA & CON DẤU SÁP L & C
// ==========================================
const openBtn = $('#open');
const coverElem = $('#cover');
const envelopeScene = $('#envelopeScene');
// Use prefersReducedMotion from window.__weddingHelpers (declared in helpers.js)

// Hiệu ứng pháo hoa bụi vàng & cánh hoa bùng nổ khi mở thiệp
function triggerOpeningBurst(originEl) {
  if (window.__weddingHelpers.prefersReducedMotion.matches) return;
  const canvas = document.getElementById('burstCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const particles = [];
  const count = window.innerWidth <= 768 ? 36 : 56;
  const colors = [
    '#f7d59b', '#e6bf70', '#d4a853', // Vàng gold
    '#e29590', '#c87670', '#f4c3be', // Cánh hoa hồng
    '#ffffff', '#fff5eb'            // Ánh sáng trắng
  ];
  const burstStartedAt = performance.now();
  const burstDuration = 850;
  const burstRadius = Math.min(Math.hypot(canvas.width, canvas.height) * 0.18, 190);

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
    const elapsed = performance.now() - burstStartedAt;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = elapsed < burstDuration;

    const flash = Math.max(0, 1 - elapsed / 240);
    if (flash > 0) {
      const gradient = ctx.createRadialGradient(originX, originY, 0, originX, originY, 24 + elapsed * 0.28);
      gradient.addColorStop(0, `rgba(255, 249, 229, ${flash})`);
      gradient.addColorStop(0.35, `rgba(247, 213, 155, ${flash * 0.72})`);
      gradient.addColorStop(1, 'rgba(247, 213, 155, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(originX - 100, originY - 100, 200, 200);
    }

    for (let ring = 0; ring < 3; ring++) {
      const ringElapsed = elapsed - ring * 115;
      if (ringElapsed < 0 || ringElapsed > 680) continue;

      const progress = ringElapsed / 680;
      const radius = 8 + burstRadius * progress;
      const alpha = (1 - progress) * 0.72;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ring === 1 ? '#f4c3be' : '#f7d59b';
      ctx.lineWidth = 2.4 - progress * 1.4;
      ctx.beginPath();
      ctx.arc(originX, originY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

let isEnvelopeFlipped = false;
let applyEnvelopeTransform = null;
let startBackgroundMusic = null;

window.__weddingEnvelope = { setEnvelopeMusicStarter: fn => { startBackgroundMusic = fn; } };

if (envelopeScene && coverElem) {
  let zoom = 1;
  const minZoom = 0.8;
  const maxZoom = 2.4;
  let rotationX = 0;
  let rotationY = 0;
  let suppressClick = false;
  let lastTapTime = 0;

  const clampZoom = value => Math.min(maxZoom, Math.max(minZoom, value));

  applyEnvelopeTransform = (animate = false) => {
    if (envelopeScene.classList.contains('is-open')) return;
    envelopeScene.style.transition = animate ? 'transform 0.35s cubic-bezier(0.2, 0.75, 0.25, 1)' : 'none';
    envelopeScene.style.transform = `perspective(1200px) scale(${zoom}) rotateY(${rotationY}deg) rotateX(${rotationX}deg)`;
    isEnvelopeFlipped = ((((rotationY % 360) + 360) % 360) > 90 && (((rotationY % 360) + 360) % 360) < 270);
  };

  // 1. Phóng to / thu nhỏ bằng con lăn chuột (Mouse Wheel)
  coverElem.addEventListener('wheel', event => {
    if (envelopeScene.classList.contains('is-open') || coverElem.classList.contains('open')) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.09 : -0.09;
    zoom = clampZoom(zoom + delta);
    applyEnvelopeTransform(true);
  }, { passive: false });

  // 2. Parallax theo chuyển động chuột trên Desktop khi không kéo/pinch
  if (!window.__weddingHelpers.prefersReducedMotion.matches) {
    coverElem.addEventListener('mousemove', e => {
      if (
        envelopeScene.classList.contains('is-open') ||
        envelopeScene.classList.contains('is-dragging') ||
        envelopeGestures.activePointers.size > 0
      ) return;
      const rect = coverElem.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      envelopeScene.style.transition = 'transform 0.15s ease-out';
      envelopeScene.style.transform = `perspective(1200px) scale(${zoom}) rotateY(${rotationY + x * 4}deg) rotateX(${rotationX - y * 4}deg)`;
    });

    coverElem.addEventListener('mouseleave', () => {
      if (envelopeScene.classList.contains('is-open')) return;
      applyEnvelopeTransform(true);
    });
  }

  const coverFlipBtn = $('#coverFlipBtn');
  if (coverFlipBtn) {
    coverFlipBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (envelopeScene.classList.contains('is-open')) return;
      isEnvelopeFlipped = !isEnvelopeFlipped;
      rotationY = isEnvelopeFlipped ? 180 : 0;
      rotationX = 0;
      applyEnvelopeTransform(true);
      updateCoverFlipLabel();
      window.__weddingHelpers.playPaperSound?.('flip');
    });
  }

  function updateCoverFlipLabel() {
    const textSpan = coverFlipBtn?.querySelector('.cover-flip-text');
    if (textSpan) {
      textSpan.textContent = isEnvelopeFlipped ? 'Quay lại mặt trước phong bì' : 'Lật xem lịch trình sự kiện';
    }
    coverFlipBtn?.classList.toggle('is-flipped', isEnvelopeFlipped);
  }

  // 3. Pointer Events: Kéo xoay 3D (1 ngón) & Pinch-to-zoom (2 ngón trên điện thoại)
  // Dùng bộ điều khiển chung trong pinch-zoom.js
  const envelopeGestures = createPinchZoomController(coverElem, {
    dragSlop: 7,
    draggingClass: '',
    canStart: () => !envelopeScene.classList.contains('is-open') && !coverElem.classList.contains('open'),
    onStart: (_event, pointerCount) => {
      // Double-tap để zoom nhanh 1.5x / 1.0x
      const now = Date.now();
      if (pointerCount === 1 && now - lastTapTime < 300) {
        zoom = zoom > 1.15 ? 1.0 : 1.55;
        rotationX = 0;
        rotationY = 0;
        applyEnvelopeTransform(true);
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 250);
        lastTapTime = 0;
        // Hủy cú chạm này khỏi bộ điều khiển để không bị xử lý thành kéo
        envelopeGestures.activePointers.clear();
        envelopeScene.classList.remove('is-dragging');
        return;
      }
      lastTapTime = now;

      if (pointerCount === 2) {
        suppressClick = true;
        envelopeScene.classList.add('is-dragging');
      }
    },
    getZoom: () => zoom,
    onPinch: (scale, startZoom) => {
      zoom = clampZoom(startZoom * scale);
      applyEnvelopeTransform(false);
    },
    onDrag: (deltaX, deltaY) => {
      envelopeScene.classList.add('is-dragging');
      rotationY += deltaX * 360 / (envelopeScene.clientWidth || 360);
      rotationX -= deltaY * 360 / (envelopeScene.clientHeight || 220);
      rotationX = Math.max(-45, Math.min(45, rotationX));
      applyEnvelopeTransform(false);
    },
    onSettle: ({ dragged }) => {
      if (dragged) suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 200);
      envelopeScene.classList.remove('is-dragging');
      const modY = ((rotationY % 360) + 360) % 360;
      isEnvelopeFlipped = modY > 90 && modY < 270;
      rotationY = isEnvelopeFlipped ? 180 : 0;
      rotationX = 0;
      applyEnvelopeTransform(true);
      updateCoverFlipLabel();
    }
  });

  envelopeScene.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);
}

function openEnvelopeInvitation() {
  if (!coverElem || coverElem.classList.contains('is-opening') || coverElem.classList.contains('open')) return;
  coverElem.classList.add('is-opening');
  coverElem.setAttribute('aria-hidden', 'true');
  coverElem.inert = true;

  if (isEnvelopeFlipped) {
    isEnvelopeFlipped = false;
    // Reset transform trực tiếp (các biến rotationX/Y là block-scoped)
    if (envelopeScene) {
      envelopeScene.style.transition = 'none';
      envelopeScene.style.transform = 'perspective(1200px) scale(1) rotateY(0deg) rotateX(0deg)';
    }
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([25, 45, 25]); } catch (e) { }
  }

  // 1. Kích hoạt âm thanh mở giấy mỹ thực tế & pháo hoa cánh hoa bụi vàng
  window.__weddingHelpers.playPaperSound?.('open');
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
  const openingDelay = (window.__weddingHelpers.prefersReducedMotion.matches ? 0 : 900) + 500;
  setTimeout(() => {
    coverElem.classList.add('open');
    document.body.classList.remove('locked');

    setTimeout(() => {
      coverElem.remove();
      // Dispatch event so other modules (like reveal observer) know cover is gone
      window.dispatchEvent(new CustomEvent('wedding:coverRemoved'));
    }, 700);
  }, openingDelay);
}

function initEnvelope() {
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
}

initEnvelope();
