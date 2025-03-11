function doPost(e) {
  // 防止直接執行時的錯誤
  if (!e || !e.parameters) {
    console.log('直接執行測試');
    return ContentService.createTextOutput('測試執行成功')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // 記錄收到的請求
  console.log('收到 POST 請求：', e.postData.contents);

  // 1. 驗證請求是否來自 LINE Platform
  const signature = e.parameters['x-line-signature'];
  console.log('signature:', signature);

  if (!validateSignature(e.postData.contents, signature)) {
    console.log('簽名驗證失敗');
    return ContentService.createTextOutput()
      .setResponseCode(401);
  }

  // 2. 解析 webhook 事件
  const body = JSON.parse(e.postData.contents);
  console.log('解析事件：', body);
  
  // 3. 處理每個事件
  body.events.forEach(function(event) {
    console.log('處理事件：', event);
    handleEvent(event);
  });

  // 4. 回傳正確的 200 OK 回應
  return ContentService.createTextOutput()
    .setResponseCode(200)
    .setMimeType(ContentService.MimeType.JSON)
    .setContent('{}');  // 空的 JSON 物件
}

function validateSignature(body, signature) {
  // 注意：signature 可能在 headers 而不是 parameters
  if (!signature) {
    console.log('找不到 signature，嘗試從 headers 取得');
    signature = e.headers['x-line-signature'];
  }
  
  const secret = SECRET_CONFIG.LINE_CHANNEL_SECRET;
  const computedSignature = Utilities.computeHmacSha256Signature(
    body,
    secret
  );
  const encodedSignature = Utilities.base64Encode(computedSignature);
  console.log('計算的簽名：', encodedSignature);
  console.log('收到的簽名：', signature);
  return encodedSignature === signature;
}

function doGet(e) {
  return ContentService.createTextOutput('Bot is running')
    .setMimeType(ContentService.MimeType.TEXT);
} 