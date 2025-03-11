/**
 * 處理從 LINE 平台接收到的事件
 * @param {Object} event - LINE 事件物件，包含類型、訊息內容等資訊
 * @return {Object|null} - 處理結果，如果不需處理則返回 null
 */
function handleEvent(event) {
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
  return UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      // 使用 channel access token 進行身份驗證
      'Authorization': `Bearer ${SECRET_CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    payload: JSON.stringify(payload)  // 將資料轉換為 JSON 字串
  });
} 