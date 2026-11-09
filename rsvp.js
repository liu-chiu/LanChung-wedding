'use strict';

// ==========================================
// RSVP + LỜI CHÚC (FORM UI)
// ==========================================
const wishViewAllButton = $('#wishViewAll');
const wishBookDialog = $('#wishBookDialog');
const wishBookEntries = $('#wishBookEntries');

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
  if (wishBookDialog?.open) renderWishBook();
}

function renderWishBook() {
  if (!wishBookEntries) return;
  const wishes = $$('#wishList .wish').filter(wish => $('small', wish)?.textContent?.trim() !== 'Mẫu');
  wishBookEntries.replaceChildren();

  if (wishes.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'wish-book-empty';
    emptyMessage.textContent = 'Chưa có lời chúc nào. Hãy là người gửi lời chúc đầu tiên nhé!';
    wishBookEntries.append(emptyMessage);
    return;
  }

  wishes.forEach(wish => {
    const quoteText = $('blockquote', wish)?.textContent?.trim() || '';
    const authorText = $('p', wish)?.textContent?.trim() || '';
    const entry = document.createElement('article');
    entry.className = 'wish-book-entry';

    const quote = document.createElement('blockquote');
    quote.textContent = quoteText;
    const author = document.createElement('p');
    author.textContent = authorText;
    entry.append(quote, author);
    wishBookEntries.append(entry);
  });
}

if (wishViewAllButton && wishBookDialog?.showModal) {
  wishViewAllButton.addEventListener('click', () => {
    renderWishBook();
    wishBookDialog.showModal();
  });

  $('#wishBookClose')?.addEventListener('click', () => wishBookDialog.close());
  wishBookDialog.addEventListener('click', event => {
    if (event.target === wishBookDialog) wishBookDialog.close();
  });
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

  // Gửi form lời chúc
  if ($('#wishForm')) {
    const form = $('#wishForm');
    const wishTextarea = $('textarea[name="wish"]', form);
    const resizeWishTextarea = () => {
      if (!wishTextarea) return;
      wishTextarea.style.height = 'auto';
      const minHeight = Number.parseFloat(getComputedStyle(wishTextarea).minHeight) || 0;
      wishTextarea.style.height = `${Math.max(wishTextarea.scrollHeight, minHeight)}px`;
    };

    wishTextarea?.addEventListener('input', resizeWishTextarea);
    resizeWishTextarea();

    form.onsubmit = async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = Object.fromEntries(new FormData(form));
      const status = $('#wishStatus');
      const button = $('button[type="submit"]', form) || $('button', form);

      button.disabled = true;
      if (status) status.textContent = 'Cảm ơn bạn đã gửi lời chúc thật dễ thương! Tụi mình đã nhận được rồi nhé.';

      try {
        const wish = {
          name: data.guestName.trim(),
          wish: data.wish.trim()
        };

        await submitAndVerify({ type: 'wish', ...wish });
        appendWish(wish, 'Vừa gửi');
        $('#wishList .wish')?.classList.add('is-new');

        form.reset();
        resizeWishTextarea();
      } catch (error) {
        console.error('Không gửi được lời chúc:', error);
        if (status) status.textContent = 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Chúng mình nhé.';
      } finally {
        button.disabled = false;
      }
    };
  }

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

  function showRsvpConfirmation(attendance, transportation) {
    if (!rsvpConfirmationDialog?.showModal || !rsvpConfirmationTitle || !rsvpConfirmationContent) return;

    rsvpConfirmationContent.replaceChildren();
    const submissionStatus = document.createElement('p');
    submissionStatus.className = 'rsvp-confirmation-status';
    submissionStatus.setAttribute('role', 'status');
    submissionStatus.setAttribute('aria-live', 'polite');
    submissionStatus.textContent = 'Đang gửi xác nhận…';
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
      const button = $('button[type="submit"]', currentForm) || $('button', currentForm);

      isSubmitting = true;
      button.disabled = true;
      if (status) status.textContent = 'Cảm ơn bạn, tụi mình đang gửi phản hồi đến Lan & Chung nhé…';
      const confirmationStatus = showRsvpConfirmation(data.attendance, data.transportation);

      try {
        await submitAndVerify({
          type: 'rsvp',
          name: data.name.trim(),
          guests: data.guests,
          event: data.event,
          attendance: data.attendance,
          transportation: data.transportation || '',
          phone: data.phone || '',
          message: data.message || ''
        });

        if (status) status.textContent = '';
        if (confirmationStatus) {
          confirmationStatus.textContent = 'Đã gửi xác nhận thành công. Cảm ơn bạn!';
          confirmationStatus.classList.add('is-success');
        }
        currentForm.reset();
        updateTransportationVisibility();
      } catch (error) {
        console.error('Không gửi được xác nhận tham dự:', error);
        if (status) status.textContent = 'Tụi mình chưa nhận được xác nhận gửi thành công. Bạn thử lại sau hoặc nhắn trực tiếp cho Lan & Chung nhé.';
        if (confirmationStatus) {
          confirmationStatus.textContent = 'Chưa gửi được xác nhận. Vui lòng đóng cửa sổ này và thử gửi lại.';
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
