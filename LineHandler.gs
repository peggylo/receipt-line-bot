/**
 * 處理從 LINE 平台接收到的事件
 * @param {Object} event - LINE 事件物件，包含類型、訊息內容等資訊
 * @return {Object|null} - 處理結果，如果不需處理則返回 null
 */
function handleEvent(event) {
  // 防止 undefined 錯誤
  if (!event) {
    console.error('收到無效的事件物件');
    return null;
  }

  // 測試寫入試算表
  try {
    const logger = new LogManager();
    const sheet = logger.spreadsheet.getSheetByName('API_Logs');
    sheet.getRange('B2').setValue('hello');
    console.log('成功寫入 hello 到試算表');
  } catch (error) {
    console.error('寫入試算表失敗：', error);
  }

  console.log('事件類型：', event.type);
  console.log('完整事件：', JSON.stringify(event));
  
  // LINE 平台會發送不同類型的事件（message、follow、unfollow 等）
  // 目前我們只處理訊息事件
  if (event.type === 'message') {
    return handleMessage(event);
  }
  
  // 其他類型的事件（如：加入好友、封鎖等）暫時不處理
  return null;
}

/**
 * 處理訊息事件
 * @param {Object} event - LINE 訊息事件物件
 * @return {Object|null} - 處理結果，如果不需處理則返回 null
 */
function handleMessage(event) {
  // 防止 undefined 錯誤
  if (!event || !event.message) {
    console.error('收到無效的訊息事件');
    return null;
  }

  const message = event.message;
  
  // LINE 訊息可能是文字、圖片、貼圖等不同類型
  // message.type 會告訴我們是哪種類型
  switch (message.type) {
    case 'text':
      // 如果是文字訊息，我們簡單地回覆一樣的內容
      // event.replyToken 是回覆此訊息所需的憑證
      return replyText(event.replyToken, `您說：${message.text}`);
    default:
      // 其他類型的訊息（圖片、貼圖等）暫時不處理
      return null;
  }
}

/**
 * 使用 LINE Messaging API 回覆文字訊息
 * @param {string} replyToken - 回覆用的 token，由 LINE 平台提供
 * @param {string} text - 要回覆的文字內容
 * @return {Object} - API 呼叫結果
 */
function replyText(replyToken, text) {
  let logger;
  try {
    logger = new LogManager();
    console.log('Logger 初始化成功');
  } catch (error) {
    console.error('Logger 初始化失敗：', error);
  }

  // LINE Messaging API 的端點
  const url = 'https://api.line.me/v2/bot/message/reply';
  
  // 準備 API 要求的資料格式
  const payload = {
    replyToken: replyToken,  // 回覆用的 token
    messages: [{             // 訊息內容（可以一次發送多則）
      type: 'text',
      text: text
    }]
  };
  
  // 發送 HTTP POST 請求到 LINE 平台
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      // 使用 channel access token 進行身份驗證
      'Authorization': `Bearer ${SECRET_CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    payload: JSON.stringify(payload)  // 將資料轉換為 JSON 字串
  });
  
  // 記錄 API 呼叫
  if (logger) {
    logger.logApiCall(
      response.getHeaders()['x-line-request-id'],
      'POST',
      url,
      response.getResponseCode(),
      response.getContentText()
    );
  }
  
  return response;
}

/**
 * 測試寫入試算表
 * 這個函數會在試算表的 B2 儲存格寫入 "hello"
 */
function testWriteToSheet() {
  let logger;
  
  try {
    // 1. 初始化 LogManager
    console.log('開始初始化 LogManager...');
    logger = new LogManager();
    console.log('LogManager 初始化成功');

    // 2. 取得試算表
    console.log('嘗試取得 API_Logs 工作表...');
    const sheet = logger.spreadsheet.getSheetByName('API_Logs');
    if (!sheet) {
      throw new Error('找不到 API_Logs 工作表');
    }
    console.log('成功取得工作表');

    // 3. 寫入資料
    console.log('開始寫入資料到 B2...');
    sheet.getRange('B2').setValue('hello');
    console.log('成功寫入 hello 到試算表 B2');

    // 4. 記錄成功訊息
    sheet.getRange('A2').setValue(new Date().toLocaleString());
    sheet.getRange('C2').setValue('測試成功');
    
    return '測試成功完成';
  } catch (error) {
    // 詳細記錄錯誤
    console.error('測試過程發生錯誤：');
    console.error('錯誤類型：', error.name);
    console.error('錯誤訊息：', error.message);
    console.error('錯誤堆疊：', error.stack);
    
    // 如果 logger 初始化成功，也寫入錯誤到試算表
    if (logger && logger.spreadsheet) {
      try {
        const sheet = logger.spreadsheet.getSheetByName('API_Logs');
        sheet.getRange('A2').setValue(new Date().toLocaleString());
        sheet.getRange('B2').setValue('ERROR');
        sheet.getRange('C2').setValue(error.message);
      } catch (logError) {
        console.error('無法記錄錯誤到試算表：', logError);
      }
    }
    
    throw error;
  }
}

/**
 * 測試 handleEvent 函數
 */
function testHandleEvent() {
  // 建立一個模擬的 LINE 事件物件
  const mockEvent = {
    type: 'message',
    message: {
      type: 'text',
      text: '測試訊息'
    },
    replyToken: 'test-reply-token'
  };

  try {
    console.log('開始測試 handleEvent...');
    const result = handleEvent(mockEvent);
    console.log('handleEvent 測試完成，結果：', result);
    return '測試成功';
  } catch (error) {
    console.error('handleEvent 測試失敗：');
    console.error('錯誤類型：', error.name);
    console.error('錯誤訊息：', error.message);
    console.error('錯誤堆疊：', error.stack);
    throw error;
  }
} 