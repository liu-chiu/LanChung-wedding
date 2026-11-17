'use strict';

// ==========================================
// RSVP + LỜI CHÚC (FORM UI)
// ==========================================
function appendWish(wish, label = 'Đã duyệt') {
  const wishList = $('#wishList');
  if (!wishList) return;

  const article = document.createElement('article');
  article.className = 'wish';

  const small = document.createElement('small');
  small.textContent = label;

  const quote = document.createElement('blockquote');
  quote.textContent = wish.wish;

  const author = document.createElement('p');
  author.textContent = wish.name;

  article.append(small, quote, author);
  wishList.prepend(article);
}

async function loadApprovedWishes() {
  if (!window.WEDDING_CONFIG?.apiUrl) return;

  try {
    const result = await jsonp({ action: 'wishes' });
    if (!result || !result.ok || !Array.isArray(result.wishes)) {
      throw new Error('Google Sheets trả về danh sách lời chúc không hợp lệ');
    }

    if (result.wishes.length > 0) {
      $$('#wishList .wish').filter(wish => $('small', wish)?.textContent?.trim() === 'Mẫu')
        .forEach(wish => wish.remove());
    }
    [...result.wishes].reverse().forEach(wish => appendWish(wish));
  } catch (error) {
    console.warn('Không tải được danh sách lời chúc từ server:', error);
  }
}

function deferUntilVisible(selector, callback) {
  const target = $(selector);
  if (!target) return;

  let hasRun = false;
  const checkVisibility = () => {
    if (hasRun) return;
    const rect = target.getBoundingClientRect();
    if (rect.bottom < -250 || rect.top > window.innerHeight + 250) return;

    hasRun = true;
    window.removeEventListener('scroll', checkVisibility);
    window.removeEventListener('resize', checkVisibility);
    callback();
  };

  window.addEventListener('scroll', checkVisibility, { passive: true });
  window.addEventListener('resize', checkVisibility, { passive: true });
  checkVisibility();
}

function initRsvpAndWishes() {
  deferUntilVisible('#rsvp', checkBackend);
  deferUntilVisible('#wishes', loadApprovedWishes);

  const rsvpTransportOptions = {
    self: 'Tự di chuyển',
    bride: 'Đi cùng xe đoàn về nhà gái',
    groom: 'Đi cùng xe đoàn về nhà trai'
  };

  const rsvpTravelDetails = {
    bride: {
      title: 'Thông tin di chuyển về nhà gái',
      items: [
        ['Thời gian đoàn di chuyển', '7:00 sáng ngày 12/12/2026'],
        ['Địa điểm đón khách', 'Ngõ 36 Giang Văn Minh, Phường Kim Mã, Hà Nội'],
        ['Trưởng đoàn', 'Anh A'],
        ['Số điện thoại trưởng đoàn', '0081028124', 'phone'],
        ['Cô dâu', 'Ngọc Lan'],
        ['Số điện thoại cô dâu', '0325022345', 'phone']
      ]
    },
    groom: {
      title: 'Thông tin di chuyển về nhà trai',
      items: [
        ['Thời gian đoàn di chuyển', '15:00 chiều ngày 12/12/2026'],
        ['Địa điểm đón khách', '11 A Cát Linh, Ô Chợ Dừa, Hà Nội'],
        ['Trưởng đoàn', 'Anh B'],
        ['Số điện thoại trưởng đoàn', '0081028124', 'phone'],
        ['Chú rể', 'Văn Chung'],
        ['Số điện thoại chú rể', '0376147556', 'phone']
      ]
    }
  };

  const rsvpConfirmationDialog = $('#rsvpConfirmationDialog');
  const rsvpConfirmationTitle = $('#rsvpConfirmationTitle');
  const rsvpConfirmationContent = $('#rsvpConfirmationContent');

  function createRsvpInfoCard(title, items) {
    const card = document.createElement('section');
    card.className = 'rsvp-info-card';

    const heading = document.createElement('h3');
    heading.textContent = title;
    const list = document.createElement('dl');
    const copyLines = [];

    items.forEach(([label, value, type]) => {
      const row = document.createElement('div');
      row.className = 'rsvp-info-row';
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');

      if (type === 'phone') {
        const link = document.createElement('a');
        link.href = `tel:${value.replace(/[^\d+]/g, '')}`;
        link.textContent = value;
        description.append(link);
      } else {
        description.textContent = value;
      }

      row.append(term, description);
      list.append(row);
      copyLines.push(`${label}: ${value}`);
    });

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'rsvp-copy-info';
    copyButton.textContent = 'Sao chép thông tin';
    copyButton.addEventListener('click', async () => {
      const copied = await copyText(copyLines.join('\n'));
      copyButton.textContent = copied ? 'Đã sao chép' : 'Không thể sao chép';
      window.setTimeout(() => {
        copyButton.textContent = 'Sao chép thông tin';
      }, 1800);
    });

    card.append(heading, list, copyButton);
    return card;
  }

  function showRsvpTravelInfo() {
    if (!rsvpConfirmationDialog?.showModal || !rsvpConfirmationTitle || !rsvpConfirmationContent) return;

    rsvpConfirmationTitle.textContent = 'Lịch trình di chuyển';
    rsvpConfirmationContent.replaceChildren(
      createRsvpInfoCard(rsvpTravelDetails.bride.title, rsvpTravelDetails.bride.items),
      createRsvpInfoCard(rsvpTravelDetails.groom.title, rsvpTravelDetails.groom.items)
    );
    rsvpConfirmationDialog.showModal();
  }

  $('#rsvpTravelInfoButton')?.addEventListener('click', showRsvpTravelInfo);

  function showRsvpConfirmation(attendance, transportation, hasWish) {
    if (!rsvpConfirmationDialog?.showModal || !rsvpConfirmationTitle || !rsvpConfirmationContent) return;

    rsvpConfirmationContent.replaceChildren();
    const submissionStatus = document.createElement('p');
    submissionStatus.className = 'rsvp-confirmation-status';
    submissionStatus.setAttribute('role', 'status');
    submissionStatus.setAttribute('aria-live', 'polite');
    submissionStatus.textContent = hasWish
      ? 'Đang gửi lời chúc và xác nhận…'
      : 'Đang gửi xác nhận…';
    rsvpConfirmationContent.append(submissionStatus);

    if (attendance === 'Không thể tham dự') {
      rsvpConfirmationTitle.textContent = 'Cảm ơn bạn đã phản hồi';
      const message = document.createElement('p');
      message.textContent = 'Lan & Chung rất tiếc vì chưa thể đón bạn trong ngày vui. Cảm ơn bạn đã gửi lời chúc và luôn yêu thương, đồng hành cùng chúng mình. Hẹn gặp bạn trong dịp gần nhất nhé!';
      rsvpConfirmationContent.append(message);
    } else if (transportation === rsvpTransportOptions.bride) {
      rsvpConfirmationTitle.textContent = 'Cảm ơn bạn sẽ đến chung vui';
      const details = rsvpTravelDetails.bride;
      rsvpConfirmationContent.append(createRsvpInfoCard(details.title, details.items));
    } else if (transportation === rsvpTransportOptions.groom) {
      rsvpConfirmationTitle.textContent = 'Cảm ơn bạn sẽ đến chung vui';
      const details = rsvpTravelDetails.groom;
      rsvpConfirmationContent.append(createRsvpInfoCard(details.title, details.items));
    } else {
      rsvpConfirmationTitle.textContent = 'Hẹn gặp bạn trong ngày vui';
      const message = document.createElement('p');
      message.textContent = 'Cảm ơn bạn đã xác nhận tham dự. Chúc bạn di chuyển an toàn và hẹn gặp bạn tại buổi tiệc nhé!';

      const brideContacts = [
        ['Cô dâu', 'Ngọc Lan'],
        ['Số điện thoại cô dâu', '0325022345', 'phone'],
        ['Chú rể', 'Văn Chung'],
        ['Số điện thoại chú rể', '0376147556', 'phone']
      ];
      const brideEvent = [
        ['Thời gian', '10:30, Thứ Bảy 12/12/2026'],
        ['Địa điểm', 'Tư gia nhà gái'],
        ['Địa chỉ', 'Ô Số H32, Khu đô thị dịch vụ Hùng Thắng, Phường Bãi Cháy, Hạ Long']
      ];
      const groomEvent = [
        ['Thời gian', '17:00, Thứ Bảy 12/12/2026'],
        ['Địa điểm', 'Tư gia nhà trai'],
        ['Địa chỉ', 'Số 8, ngõ 3, đường Văn Hoá, Khối 8 (Xóm Đồng), Sóc Sơn, Hà Nội']
      ];

      rsvpConfirmationContent.append(
        message,
        createRsvpInfoCard('Liên hệ cô dâu & chú rể', brideContacts),
        createRsvpInfoCard('Tiệc nhà gái', brideEvent),
        createRsvpInfoCard('Tiệc nhà trai', groomEvent)
      );
    }

    rsvpConfirmationDialog.showModal();
    return submissionStatus;
  }

  if (rsvpConfirmationDialog) {
    $('.rsvp-confirmation-close', rsvpConfirmationDialog)?.addEventListener('click', () => {
      rsvpConfirmationDialog.close();
    });
    rsvpConfirmationDialog.addEventListener('click', event => {
      if (event.target === rsvpConfirmationDialog) rsvpConfirmationDialog.close();
    });
  }

  // Gửi form RSVP xác nhận tham dự
  if ($('#rsvpForm')) {
    const form = $('#rsvpForm');
    const eventSelect = $('[name="event"]', form);
    const transportationField = $('#rsvpTransportationField');
    const transportationSelect = $('[name="transportation"]', form);
    const attendanceInputs = $$('[name="attendance"]', form);
    const status = $('#rsvpStatus');
    let isSubmitting = false;
    let savedRsvpSignature = '';

    const clearPreviousStatus = () => {
      if (!isSubmitting && status) status.textContent = '';
    };
    form.addEventListener('input', clearPreviousStatus);
    form.addEventListener('change', clearPreviousStatus);

    function setDefaultTransportation() {
      if (!transportationSelect || !eventSelect) return;
      transportationSelect.value = eventSelect.value === 'Tiệc nhà trai'
        ? rsvpTransportOptions.groom
        : rsvpTransportOptions.bride;
    }

    function updateTransportationVisibility() {
      const attendance = $('[name="attendance"]:checked', form)?.value;
      const attending = attendance === 'Sẽ tham dự';
      if (eventSelect) {
        eventSelect.required = attendance !== 'Không thể tham dự';
        if (attendance === 'Không thể tham dự') {
          eventSelect.value = 'Cả hai buổi tiệc';
        }
      }
      if (!transportationField || !transportationSelect) return;
      transportationField.hidden = !attending;
      transportationSelect.required = attending;
      if (attending) setDefaultTransportation();
      else transportationSelect.value = '';
    }

    attendanceInputs.forEach(input => input.addEventListener('change', updateTransportationVisibility));
    eventSelect?.addEventListener('change', () => {
      if ($('[name="attendance"]:checked', form)?.value === 'Sẽ tham dự') {
        setDefaultTransportation();
      }
    });
    updateTransportationVisibility();

    form.onsubmit = async event => {
      event.preventDefault();

      const currentForm = event.currentTarget;
      if (!currentForm.reportValidity()) return;

      const data = Object.fromEntries(new FormData(currentForm));
      const wishText = String(data.wish || '').trim();
      const rsvpPayload = {
        type: 'rsvp',
        website: data.website || '',
        name: data.name.trim(),
        guests: data.guests,
        event: data.event,
        attendance: data.attendance,
        transportation: data.transportation || '',
        phone: data.phone || '',
        message: data.message || ''
      };
      const rsvpSignature = JSON.stringify(rsvpPayload);
      const button = $('button[type="submit"]', currentForm) || $('button', currentForm);

      isSubmitting = true;
      button.disabled = true;
      if (status) status.textContent = 'Tụi mình đang gửi lời chúc và xác nhận đến Lan & Chung nhé…';
      const confirmationStatus = showRsvpConfirmation(data.attendance, data.transportation, Boolean(wishText));

      try {
        if (rsvpSignature !== savedRsvpSignature) {
          await submitAndVerify(rsvpPayload);
          savedRsvpSignature = rsvpSignature;

          if (window.trackWeddingEvent) {
            window.trackWeddingEvent('rsvp_success', {
              event_slot: data.event,
              attendance: data.attendance,
              guests: Number(data.guests) || 0
            });
          }
        }

        if (wishText) {
          const wish = { name: data.name.trim(), wish: wishText };
          await submitAndVerify({
            type: 'wish',
            website: data.website || '',
            ...wish
          });
          if (window.trackWeddingEvent) {
            window.trackWeddingEvent('wish_success', { length: wishText.length });
          }
          appendWish(wish, 'Vừa gửi');
        }

        if (status) status.textContent = '';
        if (confirmationStatus) {
          confirmationStatus.textContent = wishText
            ? 'Đã gửi lời chúc và xác nhận thành công. Cảm ơn bạn!'
            : 'Đã gửi xác nhận thành công. Cảm ơn bạn!';
          confirmationStatus.classList.add('is-success');
        }
        currentForm.reset();
        savedRsvpSignature = '';
        updateTransportationVisibility();
      } catch (error) {
        const rsvpWasSaved = rsvpSignature === savedRsvpSignature;
        if (!rsvpWasSaved && window.trackWeddingEvent) {
          window.trackWeddingEvent('rsvp_error', { message: String(error && error.message || error).slice(0, 100) });
        }
        if (rsvpWasSaved && wishText && window.trackWeddingEvent) {
          window.trackWeddingEvent('wish_error', { message: String(error && error.message || error).slice(0, 100) });
        }
        console.error(rsvpWasSaved ? 'Không gửi được lời chúc:' : 'Không gửi được xác nhận tham dự:', error);
        if (status) {
          status.textContent = rsvpWasSaved && wishText
            ? 'Đã nhận xác nhận tham dự nhưng lời chúc chưa gửi được. Giữ nguyên thông tin và lời chúc rồi gửi lại nhé.'
            : 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Lan & Chung nhé.';
        }
        if (confirmationStatus) {
          confirmationStatus.textContent = rsvpWasSaved && wishText
            ? 'Đã nhận xác nhận tham dự nhưng lời chúc chưa gửi được. Vui lòng đóng cửa sổ này và gửi lại để thử gửi lời chúc.'
            : 'Chưa gửi được xác nhận. Vui lòng đóng cửa sổ này và thử gửi lại.';
          confirmationStatus.classList.add('is-error');
        }
      } finally {
        isSubmitting = false;
        button.disabled = false;
      }
    };
  }
}

initRsvpAndWishes();
