function doPost(e) {
  var SPREADSHEET_ID = '1uroUi08Y5G5RscWt11D3JnHzet9wypftFbYgKZHUAio';
  var DRIVE_FOLDER_ID = '110QubbCeXeNet5ZbJOz3q96UR4WfXi0S';

  // Debug: write raw postData info to cell K1 so we can see what's arriving
  try {
    var debugSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
    debugSheet.getRange('K1').setValue('doPost called at ' + new Date().toString());
    debugSheet.getRange('K2').setValue('postData type: ' + (e.postData ? e.postData.type : 'NO postData'));
    debugSheet.getRange('K3').setValue('contents length: ' + (e.postData && e.postData.contents ? e.postData.contents.length : 'NONE'));
  } catch (debugErr) {
    // ignore debug errors
  }

  try {
    var data = JSON.parse(e.postData.contents);

    // Debug: confirm data parsed
    try {
      var debugSheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
      debugSheet2.getRange('K4').setValue('Parsed name: ' + data.name);
    } catch (x) {}

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

    var lastRow = sheet.getLastRow();
    var nextRow = Math.max(lastRow + 1, 5);
    var serialNumber = nextRow - 4;

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

    // Debug: confirm write
    try {
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0].getRange('K5').setValue('SUCCESS - wrote to row ' + nextRow);
    } catch (x) {}

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', row: nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Write error to spreadsheet so we can see it
    try {
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0].getRange('K5').setValue('ERROR: ' + err.toString());
    } catch (x) {}

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
