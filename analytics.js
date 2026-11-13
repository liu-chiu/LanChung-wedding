'use strict';

// ==========================================
// GOOGLE ANALYTICS 4 — THIỆP CƯỚI LAN & CHUNG
// ==========================================
// Theo dõi đầy đủ hành vi khách mời:
//  - page_view          : mở thiệp (kèm tên khách trên link)
//  - envelope_open      : mở phong bì / thiệp
//  - card_view          : xem thiệp 3D
//  - gallery_open       : mở album ảnh
//  - music_toggle       : bật/tắt nhạc nền
//  - rsvp_submit        : gửi xác nhận tham dự
//  - wish_submit        : gửi lời chúc
//  - bank_copy          : sao chép số tài khoản / QR
//  - map_open           : mở bản đồ chỉ đường
//  - calendar_add       : lưu sự kiện vào lịch (.ics)
//  - share              : chia sẻ thiệp
//
// Cấu hình: dán Measurement ID vào config.js (gaMeasurementId).
// Nếu chưa cấu hình GA thì toàn bộ module này tự tắt, không gây lỗi.
(function initAnalytics() {
  const GA_ID = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.gaMeasurementId) || '';

  /* ?debug=1 → hit được đánh dấu debug_mode để hiện trong GA4 DebugView */
  const IS_DEBUG = /[?&]debug=1/.test(window.location.search);

  // ---------- Nền tảng: nạp gtag.js ----------
  if (GA_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    gtag('js', new Date());
    const configParams = {
      send_page_view: true,
      anonymize_ip: true
    };
    if (IS_DEBUG) {
      configParams.debug_mode = true;
    }
    gtag('config', GA_ID, configParams);
  }

  /**
   * Gửi sự kiện an toàn: không có GA thì im lặng, không bao giờ văng lỗi.
   * @param {string} event Tên sự kiện
   * @param {Object} [params] Tham số bổ sung
   */
  function track(event, params) {
    try {
      if (GA_ID && typeof window.gtag === 'function') {
        window.gtag('event', event, params || {});
      }
    } catch (error) {
      /* Không bao giờ để analytics làm lỗi trang */
    }
    if (IS_DEBUG) {
      console.log('[Analytics]', event, params || {});
    }
  }

  // Xuất ra ngoài để các file khác (rsvp.js, main.js...) có thể gọi
  window.trackWeddingEvent = track;

  // ---------- Hỗ trợ chung ----------
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function currentGuest() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('to') || params.get('guest') || params.get('name');
    try {
      return raw ? String(raw).replace(/[-_]+/g, ' ').trim() : '';
    } catch (error) {
      return '';
    }
  }

  ready(function bindEvents() {
    const guest = currentGuest();

    // 1. page_view kèm ngữ cảnh khách mời (thêm vào page_view mặc định của GA)
    track('visit_context', {
      guest_name: guest || '(khách vãng lai)',
      has_personalized_link: Boolean(guest),
      language: navigator.language || ''
    });

    // 2. Mở phong bì (bìa thiệp đầu trang)
    document.querySelectorAll('.envelope-scene, #coverFlipBtn').forEach(el => {
      el.addEventListener('click', () => track('envelope_open'), { once: true });
    });

    // 3. Xem thiệp 3D
    ['#openCardViewer', '#heroCardWidget'].forEach(sel => {
      const el = $(sel);
      if (el) el.addEventListener('click', () => track('card_view'), { once: true });
    });

    // 4. Album ảnh
    const gallery = $('#gallerySlider');
    if (gallery) {
      gallery.addEventListener('click', e => {
        if (e.target.closest('.photo')) track('gallery_open');
        else if (e.target.closest('#galleryPrev, #galleryNext')) track('gallery_slide');
      });
    }

    // 5. Nhạc nền
    const musicBtn = $('#musicToggle') || $('.music-toggle');
    if (musicBtn) {
      let playing = false;
      musicBtn.addEventListener('click', () => {
        playing = !playing;
        track('music_toggle', { state: playing ? 'on' : 'off' });
      });
    }

    // 6. RSVP (submit bắt ở form để lấy dữ liệu)
    const rsvpForm = $('form[data-type="rsvp"], #rsvpForm, form[action*="rsvp"]') ||
      document.querySelector('.rsvp-form');
    if (rsvpForm) {
      rsvpForm.addEventListener('submit', () => {
        const eventSelect = rsvpForm.querySelector('select[name="event"], input[name="event"]:checked');
        const attendance = rsvpForm.querySelector('input[name="attendance"]:checked, select[name="attendance"]');
        track('rsvp_submit', {
          event_slot: eventSelect ? String(eventSelect.value) : '',
          attendance: attendance ? String(attendance.value || attendance.checked) : ''
        });
      });
    }

    // 7. Lời chúc
    const wishForm = $('#wishForm') || document.querySelector('form[data-type="wish"]');
    if (wishForm) {
      wishForm.addEventListener('submit', () => track('wish_submit'));
    }

    // 8. Sao chép số tài khoản (delegation — bắt cả nút copy hiện đại sau)
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-copy], .copy-btn, [class*="copy"]');
      if (target) track('bank_copy', { element: target.className.slice(0, 50) });

      // 9. Bản đồ chỉ đường
      const mapLink = e.target.closest('a[href*="maps"], a[href*="goo.gl/maps"], a[aria-label*="chỉ đường" i]');
      if (mapLink) track('map_open', { href: (mapLink.getAttribute('href') || '').slice(0, 100) });

      // 10. Lưu lịch .ics
      const icsLink = e.target.closest('a[download], a[href*=".ics"]');
      if (icsLink) track('calendar_add', { href: (icsLink.getAttribute('href') || '').slice(0, 100) });

      // 11. Chia sẻ
      const shareBtn = e.target.closest('[data-share], .share-btn, [class*="share"]');
      if (shareBtn) track('share', { element: shareBtn.className.slice(0, 50) });
    }, true);

    // 12. Thời gian ở trang (engagement)
    [30, 60, 120, 300].forEach(sec => {
      setTimeout(() => track('engagement_time', { seconds: sec }), sec * 1000);
    });
  });
})();
