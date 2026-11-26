'use strict';

// ==========================================
// ĐIỂM CHẠM ĐẶC BIỆT DÀNH CHO KHÁCH MỜI (Guest Delights)
//  1. Băng chào mừng cá nhân hóa theo tên khách (?to=...)
//  2. Nút "Gửi yêu thương" — thả tim & lời chúc dễ thương
//  3. Lá thư tình bí mật (Easter egg) — chạm 5 lần vào chữ ký chân trang
// Tôn trọng prefers-reduced-motion; không cản trở luồng chính.
// ==========================================
(function initGuestDelights() {
  const H = window.__weddingHelpers;
  if (!H) return;
  const { $, notify } = H;
  const reduceMotion = H.prefersReducedMotion;

  // ---------- Tiện ích ----------
  function getGuestName() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('to') || params.get('guest') || params.get('name') || '';
      return String(raw).replace(/[-_]+/g, ' ').trim().slice(0, 80);
    } catch (error) {
      return '';
    }
  }

  // ==========================================
  // 1. BĂNG CHÀO MỪNG CÁ NHÂN HÓA
  // ==========================================
  const guestName = getGuestName();
  const welcomeBanner = $('#welcomeBanner');
  const welcomeText = $('#welcomeBannerText');
  const welcomeClose = $('#welcomeBannerClose');
  let welcomeShown = false;

  function hideWelcome() {
    if (!welcomeBanner) return;
    welcomeBanner.classList.remove('is-visible');
    window.setTimeout(() => { welcomeBanner.hidden = true; }, 400);
  }

  function showWelcome() {
    if (welcomeShown || !welcomeBanner || !welcomeText) return;
    welcomeShown = true;
    welcomeText.textContent = guestName
      ? `Chào mừng ${guestName} — Lan & Chung rất vui được đón bạn 💛`
      : 'Chào mừng bạn đã ghé thăm thiệp cưới của Lan & Chung 💛';
    welcomeBanner.hidden = false;
    requestAnimationFrame(() => welcomeBanner.classList.add('is-visible'));
    if (window.trackWeddingEvent) {
      window.trackWeddingEvent('welcome_shown', { personalized: Boolean(guestName) });
    }
    window.setTimeout(hideWelcome, 7000);
  }

  if (welcomeBanner && guestName) {
    welcomeClose?.addEventListener('click', hideWelcome);
    if (document.getElementById('cover')) {
      window.addEventListener('wedding:coverRemoved', showWelcome, { once: true });
      // Dự phòng: nếu sự kiện không bắn (đã bỏ bìa trước đó), vẫn chào sau 9s.
      window.setTimeout(() => {
        if (!document.getElementById('cover')) showWelcome();
      }, 9000);
    } else {
      showWelcome();
    }
  }

  // ==========================================
  // 2. NÚT "GỬI YÊU THƯƠNG"
  // ==========================================
  const sendLove = $('#sendLove');
  const sendLoveCount = $('#sendLoveCount');
  const LOVE_MESSAGES = [
    'Đã gửi một trái tim vàng đến Lan & Chung 💛',
    'Một lời chúc ngọt ngào đang bay về phía cô dâu chú rể ✨',
    'Cảm ơn bạn đã lan tỏa yêu thương 💕',
    'Lan & Chung cảm nhận được sự ấm áp từ bạn 🌸',
    'Chúc hai bạn trăm năm hạnh phúc — từ một người bạn 💖'
  ];
  const LOVE_MILESTONES = {
    5: 'Bạn đã gửi 5 yêu thương — cả một vườn hoa đó! 🌷',
    10: '10 trái tim! Bạn là người bạn tuyệt vời nhất 💝',
    25: '25 yêu thương — Lan & Chung sẽ nhớ mãi tấm lòng này 💞'
  };
  const LOVE_STORE_KEY = 'lc_love_count';
  let loveCount = 0;
  let loveMessageIndex = 0;

  try {
    const stored = Number.parseInt(window.sessionStorage.getItem(LOVE_STORE_KEY) || '0', 10);
    if (Number.isFinite(stored) && stored > 0) loveCount = stored;
  } catch (error) { /* sessionStorage bị chặn — dùng bộ đếm trong phiên tải trang */ }

  function renderLoveCount() {
    if (!sendLoveCount) return;
    sendLoveCount.textContent = loveCount > 0 ? String(loveCount) : '';
    sendLoveCount.classList.toggle('is-visible', loveCount > 0);
  }

  function spawnLoveHearts() {
    if (!sendLove || reduceMotion.matches) return;
    const rect = sendLove.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const glyphs = ['💛', '💖', '✨', '🌸', '💛', '💕'];
    const total = window.innerWidth <= 768 ? 5 : 8;
    for (let i = 0; i < total; i++) {
      const heart = document.createElement('span');
      heart.className = 'love-heart';
      heart.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      heart.style.left = `${originX + (Math.random() - 0.5) * 30}px`;
      heart.style.top = `${originY}px`;
      heart.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
      heart.style.setProperty('--rot', `${(Math.random() - 0.5) * 80}deg`);
      heart.style.animationDelay = `${i * 60}ms`;
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
      document.body.appendChild(heart);
    }
  }

  function handleSendLove() {
    loveCount += 1;
    try { window.sessionStorage.setItem(LOVE_STORE_KEY, String(loveCount)); } catch (error) {}
    renderLoveCount();
    spawnLoveHearts();

    if (navigator.vibrate) {
      try { navigator.vibrate([15, 30]); } catch (error) {}
    }

    const message = LOVE_MILESTONES[loveCount] ||
      LOVE_MESSAGES[loveMessageIndex % LOVE_MESSAGES.length];
    loveMessageIndex += 1;
    notify(message);

    if (window.trackWeddingEvent) {
      window.trackWeddingEvent('send_love', { count: loveCount });
    }
  }

  if (sendLove) {
    renderLoveCount();
    sendLove.addEventListener('click', handleSendLove);
  }

  // ==========================================
  // 3. LÁ THƯ TÌNH BÍ MẬT (EASTER EGG)
  // ==========================================
  const wordmark = $('#footerWordmark');
  const loveLetter = $('#loveLetter');
  const loveLetterClose = $('#loveLetterClose');

  if (wordmark && loveLetter && typeof loveLetter.showModal === 'function') {
    let tapCount = 0;
    let tapTimer = null;

    const registerTap = () => {
      tapCount += 1;
      wordmark.classList.remove('is-tapped');
      void wordmark.offsetWidth;
      wordmark.classList.add('is-tapped');

      if (tapCount >= 5) {
        tapCount = 0;
        clearTimeout(tapTimer);
        if (!loveLetter.open) {
          loveLetter.showModal();
          if (window.trackWeddingEvent) window.trackWeddingEvent('love_letter_open');
        }
        return;
      }
      clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => { tapCount = 0; }, 2000);
    };

    wordmark.addEventListener('click', registerTap);
    wordmark.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        registerTap();
      }
    });

    loveLetterClose?.addEventListener('click', () => loveLetter.close());
    loveLetter.addEventListener('click', event => {
      if (event.target === loveLetter) loveLetter.close();
    });
  }
})();