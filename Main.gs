function doPost(e) {
  // 初始化 logger
  let logger;
  try {
    logger = new LogManager();
    console.log('Logger 初始化成功');
  } catch (error) {
    console.error('Logger 初始化失敗：', error);
    // 即使 logger 失敗，我們仍然要處理 webhook
  }

  // 防止直接執行時的錯誤
  if (!e || !e.postData) {
    console.log('直接執行測試');
    return ContentService.createTextOutput('測試執行成功')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // 記錄收到的請求
  console.log('收到 POST 請求：', e.postData.contents);

  // 1. 驗證請求是否來自 LINE Platform
  let signature = null;
  
  // 檢查 headers 中的簽名（不區分大小寫）
  const headers = e.headers || {};
  for (const key in headers) {
    if (key.toLowerCase() === 'x-line-signature') {
      signature = headers[key];
      break;
    }
  }
  
  // 如果在 headers 找不到，嘗試從 parameters 取得（向下相容）
  if (!signature && e.parameters) {
    signature = e.parameters['x-line-signature'];
  }

  console.log('簽名：', signature);

  if (!signature) {
    console.error('找不到簽名');
    return ContentService.createTextOutput()
      .setResponseCode(401);
  }

  if (!validateSignature(e.postData.contents, signature)) {
    console.error('簽名驗證失敗');
    return ContentService.createTextOutput()
      .setResponseCode(401);
  }

  // 2. 解析 webhook 事件
  const body = JSON.parse(e.postData.contents);
  console.log('解析事件：', body);
  
  // 確認事件陣列存在
  if (!body.events || !Array.isArray(body.events)) {
    console.error('無效的 webhook 事件格式');
    return ContentService.createTextOutput()
      .setResponseCode(400)
      .setContent('{"message": "Invalid event format"}')
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 3. 處理每個事件
  body.events.forEach(function(event) {
    console.log('處理事件：', event);
    if (logger) {
      logger.logWebhook(event.type, event, null, 200);
    }
    handleEvent(event);
  });

  // 4. 回傳正確的 200 OK 回應
  return ContentService.createTextOutput()
    .setResponseCode(200)
    .setMimeType(ContentService.MimeType.JSON)
    .setContent('{}');  // 空的 JSON 物件
}

function validateSignature(body, signature) {
  try {
    const secret = SECRET_CONFIG.LINE_CHANNEL_SECRET;
    const computedSignature = Utilities.computeHmacSha256Signature(
      body,
      secret
    );
    const encodedSignature = Utilities.base64Encode(computedSignature);
    
    console.log('計算的簽名：', encodedSignature);
    console.log('收到的簽名：', signature);
    
    return encodedSignature === signature;
  } catch (error) {
    console.error('簽名驗證過程發生錯誤：', error);
    return false;
  }
}

// function doGet(e) {
//   // 初始化 logger
//   let logger;
//   try {
//     logger = new LogManager();
//     console.log('Logger 初始化成功');
    
//     // 記錄 webhook 訪問
//     const sheet = logger.spreadsheet.getSheetByName('API_Logs');
//     if (sheet) {
//       const now = new Date().toLocaleString();
//       sheet.getRange('A2').setValue(now);
//       sheet.getRange('B2').setValue('Webhook 訪問');
//       sheet.getRange('C2').setValue('GET 請求');
//       console.log('成功記錄 webhook 訪問');
//     }
//   } catch (error) {
//     console.error('Logger 操作失敗：', error);
//   }

//   return ContentService.createTextOutput('Bot is running')
//     .setMimeType(ContentService.MimeType.TEXT);
// } 

/**
 * Handles incoming POST requests from LINE.
 */
function doPost(e) {
  try {
    // Parse the JSON body from LINE
    var json = JSON.parse(e.postData.contents);
    
    // Loop through each event received
    json.events.forEach(function(event) {
      if (event.type === 'message' && event.message.type === 'text') {
        var replyToken = event.replyToken;
        var userMessage = event.message.text;
        
        // Reply with an echo message
        replyMessage(replyToken, userMessage);
      }
    });
    
    // Return a success response
    return ContentService.createTextOutput("OK");
    
  } catch (error) {
    // Log error for debugging
    console.error('Error processing request:', error);
    return ContentService.createTextOutput("Error");
  }
}

/**
 * Sends a reply message to the LINE Messaging API.
 */
function replyMessage(replyToken, text) {
  var url = "https://api.line.me/v2/bot/message/reply";
  
  // Construct the reply payload
  var payload = {
    "replyToken": replyToken,
    "messages": [
      {
        "type": "text",
        "text": "You said: " + text
      }
    ]
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + SECRET_CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify(payload)
  };
  
  // Send the reply using UrlFetchApp
  var response = UrlFetchApp.fetch(url, options);
  console.log("Response code: " + response.getResponseCode());
}