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

    window[callback] = cleanup; // Chỉ cần fire-and-forget, không cần đọc kết quả

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
    script.onerror = cleanup;
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
