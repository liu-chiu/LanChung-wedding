'use strict';

// ==========================================
// RSVP & LỜI CHÚC — BACKEND GOOGLE SHEETS
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
  const retryDelays = [0, 300, 600, 1000];
  for (let attempt = 0; attempt < 4; attempt++) {
    if (retryDelays[attempt] > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
    }
    try {
      const result = await jsonp({ action: 'status', id, type: payload.type }, 2500);
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
