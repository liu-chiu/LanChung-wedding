'use strict';

// ==========================================
// CÁC HÀM TIỆN ÍCH DÙNG CHUNG (HELPERS)
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

// Truy vấn dùng chung cho chế độ giảm chuyển động (MediaQueryList, dùng .matches và .addEventListener)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Scripts được tải bằng <script defer> (không phải ES modules), nên xuất global để các file khác dùng
window.__weddingHelpers = { $, $$, notify, copyText, prefersReducedMotion };
