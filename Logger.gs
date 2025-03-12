/**
 * 處理所有記錄相關的功能
 */
class LogManager {
  constructor() {
    // 使用一個標記來表示 logger 是否可用
    this.isAvailable = false;
    try {
      // 先检查 SPREADSHEET_ID 是否正确设置
      if (!SECRET_CONFIG.SPREADSHEET_ID) {
        throw new Error('SPREADSHEET_ID 未设置');
      }
      console.log('试算表 ID：', SECRET_CONFIG.SPREADSHEET_ID);

      // 尝试先通过 Drive API 检查文件
      try {
        const file = DriveApp.getFileById(SECRET_CONFIG.SPREADSHEET_ID);
        console.log('文件存在，名称：', file.getName());
        console.log('访问权限：', file.getAccess(Session.getEffectiveUser()));
        console.log('分享权限：', file.getSharingAccess());
      } catch (driveError) {
        console.error('Drive API 访问失败：', driveError);
      }

      // 尝试打开试算表
      this.spreadsheet = SpreadsheetApp.openById(SECRET_CONFIG.SPREADSHEET_ID);
      console.log('试算表开启成功');
      
      // 检查工作表
      this.apiLogsSheet = this.spreadsheet.getSheetByName('API_Logs');
      this.webhookLogsSheet = this.spreadsheet.getSheetByName('Webhook_Logs');
      
      if (!this.apiLogsSheet || !this.webhookLogsSheet) {
        // 如果找不到工作表，尝试创建
        if (!this.apiLogsSheet) {
          console.log('创建 API_Logs 工作表');
          this.apiLogsSheet = this.spreadsheet.insertSheet('API_Logs');
          this.apiLogsSheet.appendRow(['时间戳', '请求ID', '方法', '端点', '状态码', '响应']);
        }
        if (!this.webhookLogsSheet) {
          console.log('创建 Webhook_Logs 工作表');
          this.webhookLogsSheet = this.spreadsheet.insertSheet('Webhook_Logs');
          this.webhookLogsSheet.appendRow(['时间戳', '事件类型', '事件内容', '结果', '状态码']);
        }
      }
      console.log('工作表准备完成');
      this.isAvailable = true;
    } catch (error) {
      console.error('Logger 初始化失敗，切換到備用模式：', error);
    }
  }

  /**
   * 記錄 API 請求
   */
  logApiCall(requestId, method, endpoint, statusCode, response) {
    if (!this.isAvailable) {
      // 如果 logger 不可用，只使用 console.log
      console.log(`API Call - ${method} ${endpoint} (${statusCode}): ${JSON.stringify(response)}`);
      return;
    }
    try {
      const timestamp = new Date().toISOString();
      this.apiLogsSheet.appendRow([
        timestamp,
        requestId,
        method,
        endpoint,
        statusCode,
        JSON.stringify(response)
      ]);
      console.log('API 呼叫記錄成功');
    } catch (error) {
      console.error('API 呼叫記錄失敗：', error);
    }
  }

  /**
   * 記錄 Webhook 事件
   */
  logWebhook(eventType, eventContent, result, statusCode) {
    if (!this.isAvailable) {
      // 如果 logger 不可用，只使用 console.log
      console.log(`Webhook - ${eventType}: ${JSON.stringify(eventContent)} (${statusCode})`);
      return;
    }
    try {
      const timestamp = new Date().toISOString();
      this.webhookLogsSheet.appendRow([
        timestamp,
        eventType,
        JSON.stringify(eventContent),
        JSON.stringify(result),
        statusCode
      ]);
      console.log('Webhook 記錄成功');
    } catch (error) {
      console.error('Webhook 記錄失敗：', error);
    }
  }
}

/**
 * 測試試算表基本權限
 * 通過創建和刪除一個測試試算表來確認基本的讀寫權限
 * @returns {string} 測試結果訊息
 */
function testBasicSpreadsheetAccess() {
  try {
    // 先測試基本的試算表功能
    const ss = SpreadsheetApp.create("測試試算表");
    console.log('可以建立試算表');
    
    // 如果可以建立，就刪除它
    DriveApp.getFileById(ss.getId()).setTrashed(true);
    console.log('測試成功');
    
    return '基本功能測試成功';
  } catch (error) {
    console.error('基本功能測試失敗：', error);
    throw error;
  }
}

/**
 * 測試目標試算表的訪問權限
 * 檢查是否可以訪問 SECRET_CONFIG 中設定的試算表
 * @returns {string} 測試結果訊息
 */
function testSpreadsheetAccess() {
  try {
    console.log('試算表 ID：', SECRET_CONFIG.SPREADSHEET_ID);
    
    // 先確認 SECRET_CONFIG 是否正確載入
    console.log('SECRET_CONFIG 內容：', JSON.stringify({
      ...SECRET_CONFIG,
      LINE_CHANNEL_SECRET: '***',
      LINE_CHANNEL_ACCESS_TOKEN: '***'
    }, null, 2));
    
    // 先測試是否可以列出所有試算表
    const allSpreadsheets = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
    console.log('可以存取的試算表：');
    let foundTarget = false;
    
    while (allSpreadsheets.hasNext()) {
      const file = allSpreadsheets.next();
      console.log(`- ${file.getName()} (${file.getId()})`);
      
      // 如果找到目標試算表
      if (file.getId() === SECRET_CONFIG.SPREADSHEET_ID) {
        console.log('\n找到目標試算表！');
        console.log('檔案名稱：', file.getName());
        console.log('擁有者：', file.getOwner().getEmail());
        
        try {
          console.log('目前使用者：', Session.getEffectiveUser().getEmail());
          console.log('存取權限：', file.getAccess(Session.getEffectiveUser()).toString());
        } catch (userError) {
          console.log('無法獲取當前用戶信息，但這不影響基本功能');
        }
        
        console.log('分享權限：', file.getSharingAccess().toString());
        console.log('分享權限設定：', file.getSharingPermission().toString());
        
        // 測試是否可以直接讀取內容
        try {
          const ss = SpreadsheetApp.openById(file.getId());
          console.log('可以開啟試算表');
          
          // 嘗試讀取工作表
          const sheets = ss.getSheets();
          console.log('工作表數量：', sheets.length);
          console.log('工作表列表：');
          sheets.forEach(sheet => {
            console.log(`- ${sheet.getName()}`);
          });
          
        } catch (readError) {
          console.error('無法開啟或讀取試算表：', readError);
        }
        foundTarget = true;
        break;
      }
    }
    
    if (!foundTarget) {
      console.warn('在可存取的試算表中找不到目標試算表！');
    }
    
    return '基本功能測試完成';
  } catch (error) {
    console.error('測試過程發生錯誤：', error);
    throw error;
  }
} 