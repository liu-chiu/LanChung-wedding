const RSVP_SHEET = 'RSVP';
const WISH_SHEET = 'Wishes';
const VISIT_SHEET = 'Visits';

/* TTL dedupe truy cập: 1 phiên ít hơn 1 lần ghi trong TTL này */
const VISIT_DEDUPE_TTL = 1800;


/**
 * Tạo và chuẩn hóa hai sheet RSVP và Wishes.
 * Chạy thủ công một lần sau khi tạo Apps Script.
 */
function setupWeddingSheets() {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(
    spreadsheet,
    RSVP_SHEET,
    [
      'Submission ID',
      'Timestamp',
      'Name',
      'Guests',
      'Event',
      'Attendance',
      'Phone',
      'Message',
      'Transportation'
    ]
  );

  ensureSheet_(
    spreadsheet,
    WISH_SHEET,
    [
      'Submission ID',
      'Timestamp',
      'Name',
      'Wish',
      'Status'
    ]
  );

  ensureSheet_(
    spreadsheet,
    VISIT_SHEET,
    [
      'Visit ID',
      'Timestamp',
      'Guest Name',
      'Referrer',
      'Page URL',
      'User Agent',
      'Language',
      'Screen'
    ]
  );
}


/**
 * Nhận RSVP và lời chúc từ website.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    const parameters = e && e.parameter
      ? e.parameter
      : {};

    const submissionId =
      clean_(parameters.id, 80);

    const submissionType =
      clean_(parameters.type, 12)
        .toLowerCase();

    if (
      !submissionId ||
      !/^[A-Za-z0-9_-]{12,80}$/.test(submissionId)
    ) {
      return json_({
        ok: false,
        error: 'invalid_id'
      });
    }

    let targetSheetName;
    let row;
    if (submissionType === 'rsvp') {
      targetSheetName = RSVP_SHEET;
      row = createRsvpRow_(submissionId, parameters);
    } else if (submissionType === 'wish') {
      targetSheetName = WISH_SHEET;
      row = createWishRow_(submissionId, parameters);
    } else {
      return json_({
        ok: false,
        error: 'invalid_type'
      });
    }

    lock.waitLock(15000);

    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(targetSheetName);

    if (!sheet) {
      throw new Error(
        'Chưa khởi tạo Google Sheets. Hãy chạy setupWeddingSheets một lần.'
      );
    }

    if (find_(spreadsheet, submissionId, submissionType)) {
      return json_({
        ok: true,
        id: submissionId,
        duplicate: true
      });
    }

    sheet.appendRow(row);
    SpreadsheetApp.flush();
    CacheService
      .getScriptCache()
      .put(submissionCacheKey_(submissionId), '1', 21600);

    return json_({
      ok: true,
      id: submissionId,
      saved: true
    });
  } catch (error) {
    return json_({
      ok: false,
      error: String(
        error && error.message
          ? error.message
          : error
      )
    });
  } finally {
    /*
     * Chỉ giải phóng nếu script đã lấy được lock.
     */
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}


/**
 * Endpoint phục vụ:
 *
 * ?action=health
 * ?action=status&id=...&type=rsvp|wish
 * ?action=wishes
 *
 * Frontend gọi bằng JSONP.
 */
function doGet(e) {
  const parameters = e && e.parameter
    ? e.parameter
    : {};

  const action =
    clean_(parameters.action, 20)
      .toLowerCase();

  const requestedCallback =
    String(parameters.callback || 'callback');
  const callback =
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(requestedCallback)
      ? requestedCallback
      : 'callback';

  let output;

  if (action === 'health') {
    output = {
      ok: true,
      service: 'Lan Chung Wedding API',
      timestamp: new Date().toISOString()
    };
  } else if (action === 'status') {
    const submissionId =
      clean_(parameters.id, 80);
    const submissionType =
      clean_(parameters.type, 12).toLowerCase();

    output = {
      ok: true,
      saved: Boolean(
        find_(
          SpreadsheetApp.getActiveSpreadsheet(),
          submissionId,
          ['rsvp', 'wish'].includes(submissionType)
            ? submissionType
            : ''
        )
      )
    };
  } else if (action === 'wishes') {
    output = {
      ok: true,
      wishes: approvedWishes_()
    };
  } else if (action === 'logvisit') {
    output = logVisit_(parameters);
  } else if (action === 'visitstats') {
    output = visitStats_();
  } else {
    output = {
      ok: true,
      service: 'Lan Chung Wedding API'
    };
  }

  return ContentService
    .createTextOutput(
      callback +
      '(' +
      JSON.stringify(output) +
      ')'
    )
    .setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
}


/**
 * Ghi một lượt truy cập thiệp online vào sheet Visits.
 * Dedupe theo Visit ID (phiên trình duyệt) để F5/quay lại tab không ghi trùng
 * trong vòng VISIT_DEDUPE_TTL giây.
 */
function logVisit_(parameters) {
  const visitId =
    clean_(parameters.vid, 80);

  if (
    !visitId ||
    !/^[A-Za-z0-9_-]{8,80}$/.test(visitId)
  ) {
    return { ok: false, error: 'invalid_visit_id' };
  }

  const cache = CacheService.getScriptCache();
  const dedupeKey = `visited-${visitId}`;
  if (cache.get(dedupeKey) === '1') {
    return { ok: true, logged: false, duplicate: true };
  }

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    spreadsheet.getSheetByName(VISIT_SHEET);

  if (!sheet) {
    return { ok: false, error: 'sheet_not_initialized' };
  }

  /* Kiểm tra trùng Visit ID trong sheet (trường hợp cache hết hạn sau khi đã ghi) */
  if (sheet.getLastRow() > 1) {
    const found = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, 1)
      .createTextFinder(visitId)
      .matchEntireCell(true)
      .findNext();
    if (found) {
      cache.put(dedupeKey, '1', VISIT_DEDUPE_TTL);
      return { ok: true, logged: false, duplicate: true };
    }
  }

  /* Không có tên khách trên link (?to=...) → ghi là khách vãng lai */
  const guestName =
    clean_(parameters.name, 120) || 'Khách vãng lai';

  sheet.appendRow([
    visitId,
    new Date(),
    guestName,
    clean_(parameters.ref, 300),
    clean_(parameters.url, 300),
    clean_(parameters.ua, 250),
    clean_(parameters.lang, 20),
    clean_(parameters.screen, 30)
  ]);
  SpreadsheetApp.flush();

  cache.put(dedupeKey, '1', VISIT_DEDUPE_TTL);

  return { ok: true, logged: true };
}


/**
 * Thống kê lượt truy cập: dùng để kiểm tra log có đổ vào sheet không.
 * Gọi: ?action=visitStats&callback=...
 */
function visitStats_() {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    spreadsheet.getSheetByName(VISIT_SHEET);

  if (!sheet) {
    return {
      ok: true,
      initialized: false,
      total: 0,
      visits: []
    };
  }

  const lastRow = sheet.getLastRow();
  const lastRows = [];

  if (lastRow > 1) {
    const startRow = Math.max(2, lastRow - 9);
    const rows = sheet
      .getRange(startRow, 1, lastRow - startRow + 1, 3)
      .getValues();

    for (let index = rows.length - 1; index >= 0; index--) {
      const row = rows[index];
      lastRows.push({
        id: String(row[0] || ''),
        timestamp:
          row[1] instanceof Date
            ? row[1].toISOString()
            : String(row[1] || ''),
        name: String(row[2] || '')
      });
    }
  }

  return {
    ok: true,
    initialized: lastRow > 0,
    total: Math.max(0, lastRow - 1),
    visits: lastRows
  };
}


/**
 * Chuẩn hóa một RSVP trước khi lấy khóa ghi.
 */
function createRsvpRow_(
  submissionId,
  parameters
) {
  const name =
    clean_(parameters.name, 80);

  const event =
    clean_(parameters.event, 50);

  const attendance =
    clean_(parameters.attendance, 50);
  let transportation =
    clean_(parameters.transportation, 80);

  if (!name) {
    throw new Error(
      'Tên khách mời không được để trống'
    );
  }

  if (!['Tiệc nhà gái', 'Tiệc nhà trai', 'Cả hai buổi tiệc'].includes(event)) {
    throw new Error(
      'Sự kiện không hợp lệ'
    );
  }

  if (!['Sẽ tham dự', 'Không thể tham dự'].includes(attendance)) {
    throw new Error(
      'Trạng thái tham dự không hợp lệ'
    );
  }

  const allowedTransportation = [
    'Tự di chuyển',
    'Đi cùng xe đoàn về nhà gái',
    'Đi cùng xe đoàn về nhà trai'
  ];
  if (attendance === 'Sẽ tham dự' && !transportation) {
    transportation = event === 'Tiệc nhà trai'
      ? 'Đi cùng xe đoàn về nhà trai'
      : 'Đi cùng xe đoàn về nhà gái';
  }
  if (
    attendance === 'Sẽ tham dự' &&
    !allowedTransportation.includes(transportation)
  ) {
    throw new Error(
      'Phương tiện di chuyển không hợp lệ'
    );
  }
  if (attendance === 'Không thể tham dự') {
    transportation = '';
  }

  const guests = Number(parameters.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    throw new Error(
      'Số khách phải là số nguyên từ 1 đến 20'
    );
  }

  return [
    submissionId,
    new Date(),
    name,
    guests,
    event,
    attendance,
    clean_(parameters.phone, 30),
    clean_(parameters.message, 500),
    transportation
  ];
}


/**
 * Chuẩn hóa lời chúc trước khi lấy khóa ghi.
 *
 * Lời chúc cần được duyệt trước khi công khai.
 */
function createWishRow_(
  submissionId,
  parameters
) {
  const name =
    clean_(parameters.name, 80);

  const wish =
    clean_(parameters.wish, 500);

  if (!name) {
    throw new Error(
      'Tên khách mời không được để trống'
    );
  }

  if (!wish) {
    throw new Error(
      'Lời chúc không được để trống'
    );
  }

  return [
    submissionId,
    new Date(),
    name,
    wish,
    'Pending'
  ];
}


/**
 * Lấy tối đa 50 lời chúc Approved mới nhất.
 */
function approvedWishes_() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'approved-wishes-v1';
  const cachedWishes = cache.get(cacheKey);
  if (cachedWishes) {
    return JSON.parse(cachedWishes);
  }

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    spreadsheet.getSheetByName(WISH_SHEET);

  if (!sheet || sheet.getLastRow() < 2) {
    cache.put(cacheKey, '[]', 60);
    return [];
  }

  const wishes = [];
  let endRow = sheet.getLastRow();
  while (endRow >= 2 && wishes.length < 50) {
    const startRow = Math.max(2, endRow - 199);
    const rows = sheet
      .getRange(startRow, 1, endRow - startRow + 1, 5)
      .getValues();

    for (let index = rows.length - 1; index >= 0 && wishes.length < 50; index--) {
      const row = rows[index];
      if (String(row[4] || '').trim().toLowerCase() !== 'approved') {
        continue;
      }

      wishes.push({
        id: String(row[0] || ''),
        timestamp:
          row[1] instanceof Date
            ? row[1].toISOString()
            : String(row[1] || ''),
        name: String(row[2] || ''),
        wish: String(row[3] || '')
      });
    }

    endRow = startRow - 1;
  }

  cache.put(cacheKey, JSON.stringify(wishes), 60);
  return wishes;
}


/**
 * Tìm Submission ID trong sheet phù hợp; request cũ không có type sẽ tìm cả hai.
 */
function find_(spreadsheet, submissionId, submissionType) {
  if (!submissionId) {
    return false;
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = submissionCacheKey_(submissionId);
  if (cache.get(cacheKey) === '1') {
    return true;
  }

  const sheetNames = submissionType === 'rsvp'
    ? [RSVP_SHEET]
    : submissionType === 'wish'
      ? [WISH_SHEET]
      : [RSVP_SHEET, WISH_SHEET];

  for (const sheetName of sheetNames) {
    const sheet =
      spreadsheet.getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() < 2) {
      continue;
    }

    const found =
      sheet
        .getRange(
          2,
          1,
          sheet.getLastRow() - 1,
          1
        )
        .createTextFinder(submissionId)
        .matchEntireCell(true)
        .findNext();

    if (found) {
      cache.put(cacheKey, '1', 21600);
      return true;
    }
  }

  return false;
}

function submissionCacheKey_(submissionId) {
  return `saved-${submissionId}`;
}


/**
 * Tạo sheet và dòng tiêu đề nếu chưa có.
 */
function ensureSheet_(
  spreadsheet,
  sheetName,
  headers
) {
  let sheet =
    spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  /*
   * Chuẩn hóa tiêu đề kể cả khi sheet đã có.
   */
  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#397f7d')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);
}


/**
 * Làm sạch chuỗi đầu vào.
 */
function clean_(value, maxLength) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
    .replace(/^([=+\-@])/, "'$1");
}


/**
 * Trả JSON cho POST.
 */
function json_(data) {
  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * Chạy một lần nếu muốn duyệt toàn bộ
 * lời chúc Pending đã có.
 */
function approveAllPendingWishes() {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    spreadsheet.getSheetByName(WISH_SHEET);

  if (!sheet || sheet.getLastRow() < 2) {
    return;
  }

  const statusRange =
    sheet.getRange(
      2,
      5,
      sheet.getLastRow() - 1,
      1
    );

  const statuses =
    statusRange.getValues();

  const updatedStatuses =
    statuses.map(row => {
      const status =
        String(row[0] || '')
          .trim()
          .toLowerCase();

      if (status === 'pending') {
        return ['Approved'];
      }

      return [row[0]];
    });

  statusRange.setValues(updatedStatuses);

  SpreadsheetApp.flush();
  CacheService.getScriptCache().remove('approved-wishes-v1');
}
