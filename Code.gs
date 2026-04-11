// ── Run this ONCE from the editor before deploying to authorize Drive + Sheets ──
function authorize() {
  var ss = SpreadsheetApp.openById('1uroUi08Y5G5RscWt11D3JnHzet9wypftFbYgKZHUAio');
  Logger.log('Sheet: ' + ss.getName());
  var folder = DriveApp.getFolderById('110QubbCeXeNet5ZbJOz3q96UR4WfXi0S');
  Logger.log('Folder: ' + folder.getName());
  var testBlob = Utilities.newBlob('test', 'text/plain', 'auth_test.txt');
  var testFile = folder.createFile(testBlob);
  testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log('File sharing set OK: ' + testFile.getUrl());
  DriveApp.getFileById(testFile.getId()).setTrashed(true);
  Logger.log('Authorization complete.');
}

function doPost(e) {
  var SPREADSHEET_ID = '1uroUi08Y5G5RscWt11D3JnHzet9wypftFbYgKZHUAio';
  var DRIVE_FOLDER_ID = '110QubbCeXeNet5ZbJOz3q96UR4WfXi0S';

  try {
    var data = JSON.parse(e.postData.contents);

    // ── Write to spreadsheet FIRST ──
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheets()[0];

    var lastRow = sheet.getLastRow();
    var nextRow = Math.max(lastRow + 1, 5);
    var serialNumber = nextRow - 4;

    // Columns: A:#  B:Full Name  C:Year  D:Referred By  E:Mobile  F:Group Size  G:Amount Due  H:Payment Status  I:Notes
    var row = [
      serialNumber,
      data.name || '',
      data.year || '',
      data.referred_by || '—',
      data.phone || '',
      data.group_size || 1,
      data.total_due || 0,
      'Pending',
      ''
    ];

    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    // ── Then attempt screenshot upload to Drive ──
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
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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

  } catch (err) {
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
