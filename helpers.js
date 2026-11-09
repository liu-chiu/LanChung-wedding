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

// Hiệu ứng âm thanh mở giấy mỹ thuật & lật thiệp chân thực (Micro-interaction SFX qua Web Audio API)
let sharedAudioCtx = null;
function getSharedAudioContext() {
  if (!sharedAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playPaperSound(type = 'open') {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    if (type === 'open') {
      // Tiếng mở phong bì: Giấy mỹ thuật trượt nhẹ kết hợp nhấc con dấu sáp
      const duration = 0.22;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.06));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
      filter.Q.value = 1.4;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (type === 'flip') {
      // Tiếng lật trang thiệp êm ái
      const duration = 0.16;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.04));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + duration);
      filter.Q.value = 2.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  } catch (err) {
    // Không làm gián đoạn tương tác người dùng nếu Web Audio bị chặn
  }
}

// Truy vấn dùng chung cho chế độ giảm chuyển động (MediaQueryList, dùng .matches và .addEventListener)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Scripts được tải bằng <script defer> (không phải ES modules), nên xuất global để các file khác dùng
window.__weddingHelpers = { $, $$, notify, copyText, prefersReducedMotion, playPaperSound };
