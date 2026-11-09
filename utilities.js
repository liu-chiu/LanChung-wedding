'use strict';

// ==========================================
// CÁC TƯƠNG TÁC TIỆN ÍCH (COPY, RSVP SCROLL, SHARE)
// ==========================================
function initUtilities() {
  // Nút chọn sự kiện ở phần địa điểm để cuộn thẳng xuống form RSVP
  $$('[data-select]').forEach(button => {
    button.onclick = () => {
      const eventInput = $('[name=event]');
      if (eventInput) eventInput.value = button.dataset.select;
      $('#rsvp')?.scrollIntoView({ behavior: 'smooth' });
    };
  });

  // Tối ưu liên kết chỉ đường thông minh (Apple Maps trên iOS, Google Maps trên các thiết bị khác)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  $$('.route-link').forEach(link => {
    if (isIOS && link.dataset.destination) {
      link.href = `https://maps.apple.com/?daddr=${encodeURIComponent(link.dataset.destination)}`;
    }
  });

  // Sao chép địa chỉ / số tài khoản với hỗ trợ Zalo WebView & hiệu ứng phản hồi sinh động
  $$('[data-copy]').forEach(button => {
    button.onclick = async () => {
      const textToCopy = button.dataset.copy;
      const success = await copyText(textToCopy);
      if (success) {
        if (navigator.vibrate) {
          try { navigator.vibrate([20, 35]); } catch (e) {}
        }
        notify(button.dataset.copyMessage || 'Đã sao chép vào bộ nhớ tạm ✨');
        button.classList.add('is-copied');
        setTimeout(() => button.classList.remove('is-copied'), 1800);
      } else {
        notify('Không thể sao chép tự động. Vui lòng sao chép thủ công.');
      }
    };
  });

  // Nút chia sẻ trang thiệp cưới
  const shareButton = $('#share');
  if (shareButton) {
    shareButton.onclick = async () => {
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
}

initUtilities();
