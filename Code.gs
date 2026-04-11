function doPost(e) {
  var SPREADSHEET_ID = '1uroUi08Y5G5RscWt11D3JnHzet9wypftFbYgKZHUAio';
  var DRIVE_FOLDER_ID = '110QubbCeXeNet5ZbJOz3q96UR4WfXi0S';

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── 1. Write to spreadsheet FIRST ──
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheets()[0];
  var lastRow = sheet.getLastRow();
  var nextRow = Math.max(lastRow + 1, 5);
  var serialNumber = nextRow - 4;

  sheet.getRange(nextRow, 1, 1, 9).setValues([[
    serialNumber,
    data.name || '',
    data.year || '',
    data.referred_by || '—',
    data.phone || '',
    data.group_size || 1,
    data.total_due || 0,
    'Pending',
    ''
  ]]);

  // ── 2. Upload screenshot to Drive ──
  if (data.screenshot_data && data.screenshot_data.length > 0) {
    try {
      var fileName = (data.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_') + '_' + (data.screenshot_name || 'screenshot.jpg');
      var blob = Utilities.newBlob(
        Utilities.base64Decode(data.screenshot_data),
        data.screenshot_mime || 'image/jpeg',
        fileName
      );
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var file = folder.createFile(blob);
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
      var screenshotUrl = file.getUrl();

      // Update the row with screenshot info
      sheet.getRange(nextRow, 8).setValue('Screenshot uploaded');
      sheet.getRange(nextRow, 9).setValue(screenshotUrl);
    } catch (driveErr) {
      sheet.getRange(nextRow, 8).setValue('Screenshot failed: ' + driveErr.toString());
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', row: nextRow }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
