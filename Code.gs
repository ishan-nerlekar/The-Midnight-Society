// ── Run this function ONCE from the Apps Script editor to authorize Drive + Sheets access ──
function authorize() {
  try {
    var ss = SpreadsheetApp.openById('1uroUi08Y5G5RscWt11D3JnHzet9wypftFbYgKZHUAio');
    Logger.log('SUCCESS — Sheet: ' + ss.getName());
  } catch (e) {
    Logger.log('FAILED — Spreadsheet: ' + e.toString());
  }
  try {
    var folder = DriveApp.getFolderById('110QubbCeXeNet5ZbJOz3q96UR4WfXi0S');
    Logger.log('SUCCESS — Folder: ' + folder.getName());
  } catch (e) {
    Logger.log('FAILED — Drive folder: ' + e.toString());
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ── Configuration ──
    var SPREADSHEET_ID = '1uroUi08Y5G5RscWt11D3JnHzet9wypftFbYgKZHUAio';
    var DRIVE_FOLDER_ID = '110QubbCeXeNet5ZbJOz3q96UR4WfXi0S';

    // ── Save screenshot to Google Drive ──
    var screenshotUrl = '';
    if (data.screenshot_data && data.screenshot_data.length > 0) {
      var fileName = (data.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_') + '_' + (data.screenshot_name || 'screenshot.jpg');
      var blob = Utilities.newBlob(
        Utilities.base64Decode(data.screenshot_data),
        data.screenshot_mime || 'image/jpeg',
        fileName
      );
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      screenshotUrl = file.getUrl();
    }

    // ── Append row to spreadsheet ──
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheets()[0];

    // Count existing data rows (only rows where column B has a name)
    var dataRange = sheet.getRange('B5:B' + sheet.getMaxRows());
    var values = dataRange.getValues();
    var dataRowCount = 0;
    for (var i = 0; i < values.length; i++) {
      if (values[i][0] !== '' && values[i][0] !== null) {
        dataRowCount++;
      }
    }
    var serialNumber = dataRowCount + 1;

    // Find first empty row in column B (starting from row 5)
    var nextRow = 5;
    for (var i = 0; i < values.length; i++) {
      if (values[i][0] === '' || values[i][0] === null) {
        nextRow = i + 5;
        break;
      }
    }

    // Columns: A:#  B:Full Name  C:Year  D:Referred By  E:Mobile  F:Group Size  G:Amount Due  H:Payment Status  I:Notes
    var row = [
      serialNumber,
      data.name || '',
      data.year || '',
      data.referred_by || '—',
      data.phone || '',
      data.group_size || 1,
      data.total_due || 0,
      screenshotUrl ? 'Screenshot uploaded' : 'Pending',
      screenshotUrl || ''
    ];

    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', row: nextRow, screenshot: screenshotUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log error for debugging via Executions tab
    console.error('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
