'use strict';

// ==========================================
// LỊCH THÁNG & TẠO SỰ KIỆN LỊCH (ICS)
// ==========================================

// Dữ liệu tạo file lịch cá nhân (.ics)
const calendarEvents = {
  bride: {
    title: 'Tiệc nhà gái - Lan & Chung',
    startUtc: '20261212T033000Z',
    endUtc: '20261212T053000Z',
    startLocal: '20261212T103000',
    endLocal: '20261212T123000',
    location: 'Ô Số H32, Khu đô thị dịch vụ Hùng Thắng, Phường Bãi Cháy, Hạ Long'
  },
  groom: {
    title: 'Tiệc nhà trai - Lan & Chung',
    startUtc: '20261212T100000Z',
    endUtc: '20261212T120000Z',
    startLocal: '20261212T170000',
    endLocal: '20261212T190000',
    location: 'Số 8, ngõ 3, đường Văn Hoá, Khối 8, Sóc Sơn, Hà Nội'
  }
};

// Hàm thuần: tạo URL Google Calendar từ dữ liệu sự kiện (không tác động DOM)
function buildGoogleCalendarUrl(event) {
  const calendarUrl = new URL('https://calendar.google.com/calendar/render');
  calendarUrl.search = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startLocal}/${event.endLocal}`,
    ctz: 'Asia/Ho_Chi_Minh',
    location: event.location
  }).toString();
  return calendarUrl.toString();
}

// Hàm thuần: tạo nội dung file .ics từ dữ liệu sự kiện (không tác động DOM)
function buildIcsBlob(event, uid) {
  const escapeICSText = value =>
    value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const blobContent =
    `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Lan & Chung//Wedding Invitation//VI\r\n` +
    `CALSCALE:GREGORIAN\r\nBEGIN:VEVENT\r\nUID:${uid}-lan-chung-20261212@liu-chiu.github.io\r\n` +
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\n` +
    `DTSTART:${event.startUtc}\r\nDTEND:${event.endUtc}\r\nSUMMARY:${escapeICSText(event.title)}\r\n` +
    `LOCATION:${escapeICSText(event.location)}\r\nEND:VEVENT\r\nEND:VCALENDAR`;

  return new Blob([blobContent], { type: 'text/calendar;charset=utf-8' });
}

// Hàm thuần: phát hiện iPhone/iPad để hiện hướng dẫn mở tệp lịch
function isIosDevice() {
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

// Render lịch tháng 12/2026 (Ngày 12 được đánh dấu class 'today')
function initCalendarIcs() {
  const cal = $('#cal');
  if (cal) {
    const daysHTML =
      '<span class="muted">30</span>' +
      Array.from(
        { length: 31 },
        (_, i) => i === 11
          ? '<span class="today" aria-label="Ngày cưới: 12 tháng 12"><img src="assets/images/CD-CR-optimized.jpg" alt="" loading="lazy" decoding="async"><span>12</span></span>'
          : `<span>${i + 1}</span>`
      ).join('') +
      '<span class="muted">1</span><span class="muted">2</span><span class="muted">3</span>';
    cal.innerHTML = daysHTML;
  }

  $$('[data-ics]').forEach(button => {
    button.onclick = () => {
      const ev = calendarEvents[button.dataset.ics];
      if (!ev) return;

      // Android: mở Google Calendar trong tab mới
      if (/Android/i.test(navigator.userAgent)) {
        const calendarUrl = buildGoogleCalendarUrl(ev);
        const calendarWindow = window.open(calendarUrl, '_blank');
        if (calendarWindow) {
          calendarWindow.opener = null;
        } else {
          window.location.assign(calendarUrl);
        }
        return;
      }

      // Còn lại: tải tệp .ics
      const blob = buildIcsBlob(ev, button.dataset.ics);
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `lan-chung-${button.dataset.ics}.ics`;
      downloadLink.click();
      setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);
      if (isIosDevice()) notify('Đã tải tệp lịch. Mở tệp vừa tải để thêm sự kiện vào Lịch trên iPhone.');
    };
  });
}

initCalendarIcs();
