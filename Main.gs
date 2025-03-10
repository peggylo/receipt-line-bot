function doPost(e) {
  // 防止直接執行時的錯誤
  if (!e || !e.parameters) {
    console.log('直接執行測試');
    return ContentService.createTextOutput('測試執行成功')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // 1. 驗證請求是否來自 LINE Platform
  const signature = e.parameters['x-line-signature'];
  if (!validateSignature(e.postData.contents, signature)) {
    return ContentService.createTextOutput()
      .setResponseCode(401);
  }

  // 2. 回傳空的 200 OK 回應
  return ContentService.createTextOutput()
    .setResponseCode(200)
    .setMimeType(ContentService.MimeType.JSON)
    .setContent('{}');
}

function validateSignature(body, signature) {
  const secret = SECRET_CONFIG.LINE_CHANNEL_SECRET;
  // 使用 Apps Script 的內建函數計算 HMAC-SHA256
  const computedSignature = Utilities.computeHmacSha256Signature(
    body,
    secret
  );
  const encodedSignature = Utilities.base64Encode(computedSignature);
  return encodedSignature === signature;
}

function doGet(e) {
  return ContentService.createTextOutput('Bot is running')
    .setMimeType(ContentService.MimeType.TEXT);
} 