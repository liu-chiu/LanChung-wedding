'use strict';

// ==========================================
// LOG LƯỢT TRUY CẬP THIỆP ONLINE → GOOGLE SHEETS (Visits)
// ==========================================
// Mỗi phiên trình duyệt (sessionStorage) chỉ ghi 1 dòng.
// Ghi kèm tên khách nếu link có ?to=... / ?guest=... / ?name=...
(function logVisit() {
  function initVisitLog() {
    if (!window.WEDDING_CONFIG || !window.WEDDING_CONFIG.apiUrl) return Enums_noop();

    const STORE_KEY = 'lc_visit_id';

    // 1. Visit ID theo phiên — F5 hoặc quay lại tab không ghi thêm
    let visitId = null;
    try {
      visitId = sessionStorage.getItem(STORE_KEY);
      if (!visitId) {
        visitId = 'v_' + Date.now().toString(36) + '_' +
          Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(STORE_KEY, visitId);
      }
    } catch (error) {
      // Trình duyệt chặn sessionStorage → tạo ID tạm cho phiên tải trang này
      visitId = 'v_' + Date.now().toString(36) + '_' +
        Math.random().toString(36).slice(2, 10);
    }

    // 2. Tên khách mời từ link cá nhân hóa
    let guestName = '';
    try {
      const params = new URLSearchParams(window.location.search);
      guestName = decodeURIComponent(
        params.get('to') || params.get('guest') || params.get('name') || ''
      ).replace(/[-_]+/g, ' ').trim().slice(0, 120);
    } catch (error) {
      guestName = '';
    }

    // 3. Gửi lên Apps Script bằng JSONP (không bị chặn CORS)
    const callback = 'lc_visit_' + Date.now().toString(36);
    const script = document.createElement('script');
    const timer = setTimeout(() => cleanup(), 8000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callback];
      if (script.parentNode) script.remove();
    }

    window[callback] = function (result) {
      cleanup();
      // Ghi kết quả ra console để kiểm tra
      if (result && result.logged) {
        console.log('[VisitLog] Đã ghi lượt truy cập vào Google Sheets (Visits).');
      } else if (result && result.duplicate) {
        console.log('[VisitLog] Phiên này đã được ghi trước đó (tránh trùng).');
      } else if (result && result.error) {
        console.warn('[VisitLog] Apps Script từ chối:', result.error);
      } else {
        console.warn('[VisitLog] Phản hồi không xác định:', result);
      }
      if (isDebug()) {
        console.log('[VisitLog] Visit ID:', visitId, '| Guest:', guestName || '(không có ?to=)');
      }
    };

    const query = new URLSearchParams({
      action: 'logVisit',
      vid: visitId,
      name: guestName,
      ref: document.referrer || '',
      url: window.location.href,
      ua: navigator.userAgent,
      lang: navigator.language || '',
      screen: window.innerWidth + 'x' + window.innerHeight,
      callback: callback
    });

    script.src = window.WEDDING_CONFIG.apiUrl + '?' + query.toString();
    script.onerror = function () {
      cleanup();
      console.error('[VisitLog] Không gửi được request — kiểm tra apiUrl trong config.js và trạng thái Deploy của Apps Script.');
    };
    document.head.appendChild(script);

    // Chế độ ?debug=1 — hỏi ngược Apps Script xem sheet Visits có bao nhiêu dòng
    if (isDebug()) {
      checkVisitStats();
    }
  }

  function isDebug() {
    return /[?&]debug=1/.test(window.location.search);
  }

  function checkVisitStats() {
    const callback = 'lc_stats_' + Date.now().toString(36);
    const script = document.createElement('script');
    const timer = setTimeout(function () { cleanup(); }, 8000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callback];
      if (script.parentNode) script.remove();
    }

    window[callback] = function (result) {
      cleanup();
      if (result && result.ok) {
        console.log(
          '[VisitLog] Sheet Visits — tổng dòng:', result.total,
          '| đã tạo sheet:', result.initialized
        );
        if (result.visits && result.visits.length) {
          console.table(result.visits);
        }
      } else {
        console.warn('[VisitLog] Không đọc được visitStats:', result);
      }
    };

    script.src = window.WEDDING_CONFIG.apiUrl + '?action=visitStats&callback=' + callback;
    script.onerror = function () {
      cleanup();
      console.error('[VisitLog] Không gọi được action=visitStats.');
    };
    document.head.appendChild(script);
  }

  // Placeholder tránh lỗi cú pháp khi chưa cấu hình apiUrl
  function Enums_noop() { return; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisitLog);
  } else {
    initVisitLog();
  }
})();
