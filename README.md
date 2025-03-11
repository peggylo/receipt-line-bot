# 發票管理 LINE Bot 開發文件

## 專案概述
本專案為發票管理 LINE Bot，用於處理用戶上傳的發票/收據圖片，自動辨識關鍵資訊並儲存至 Google Sheets。

## 系統架構

### 檔案結構
```plaintext
project/
├── Main.gs                  # 主程式入口點
├── LineHandler.gs           # LINE訊息處理
├── ImageProcess.gs          # 圖片分析處理
├── DataManager.gs           # Google Sheets/Drive 操作
├── UserDialog.gs            # 使用者互動流程
├── Config.gs                # 設定檔
├── Logger.gs                # 日誌記錄管理
├── appsscript.json         # GAS 專案設定檔
├── .gitignore              # git 忽略檔案設定
├── SecretConfig.gs          # 敏感資訊設定檔（不納入版控）
└── SecretConfig.example.gs  # 敏感資訊設定範例
```

### 各檔案職責

#### 1. Main.gs
- 作為 Web App 入口點
- 處理所有外部請求的路由
- 基本錯誤處理和日誌記錄

#### 2. LineHandler.gs
- 處理 LINE 平台的訊息接收與發送
- 根據訊息類型分發至適當處理函數
- 管理 LINE API 呼叫

#### 3. ImageProcess.gs
- 圖片下載與基本處理
- 整合圖片分析服務（LLM/OCR）
- 標準化分析結果

#### 4. DataManager.gs
- Google Sheets 資料讀寫
- Google Drive 檔案管理
- 資料格式轉換

#### 5. UserDialog.gs
- 管理使用者對話狀態
- 處理確認流程
- 生成回應訊息

#### 6. Config.gs
- 集中管理所有設定值（設定總管理處）
- 整合一般設定（如表格名稱）和敏感設定（如 API 金鑰）
- 提供統一的設定存取介面
- 範例：
  ```javascript
  const CONFIG = {
    // 一般設定
    SHEET_NAME: '發票記錄',
    DRIVE_FOLDER_NAME: '發票圖片',
    
    // 敏感設定（從 SecretConfig.gs 導入）
    ...SECRET_CONFIG
  };
  ```

#### 7. SecretConfig.gs 和 SecretConfig.example.gs
- SecretConfig.gs：儲存實際的敏感設定值（不納入版控）
- SecretConfig.example.gs：提供設定範例和說明
- 包含 LINE Bot 相關的 API 金鑰和使用者 ID

#### 8. Logger.gs
- 提供完整的日誌記錄功能
- 管理 Google Sheets 日誌儲存
- 記錄 API 呼叫和 Webhook 事件
- 自動建立所需的日誌工作表
- 提供錯誤追蹤和系統監控功能
- 範例：
  ```javascript
  const logger = new LogManager();
  logger.logApiCall(requestId, method, endpoint, statusCode, response);
  logger.logWebhook(eventType, eventContent, result, statusCode);
  ```

#### 9. appsscript.json
- Google Apps Script 專案的核心設定檔
- 定義專案的基本配置：
  - 時區設定（Asia/Taipei）
  - 專案相依性
  - 例外記錄方式
  - 執行環境版本（V8）
  - Web 應用程式設定
    - 執行身分
    - 存取權限
  - OAuth 範圍設定
    - Google Sheets API
    - Google Drive API
    - 外部請求權限
    - 使用者郵件權限
- 範例：
  ```json
  {
    "timeZone": "Asia/Taipei",
    "dependencies": {},
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "webapp": {
      "executeAs": "USER_DEPLOYING",
      "access": "ANYONE_ANONYMOUS"
    }
  }
  ```

#### 10. .gitignore
- 設定 git 版本控制的忽略規則
- 防止敏感資訊被意外提交
- 忽略系統自動生成的檔案

## 標準化格式

### 圖片分析結果格式
```javascript
const resultFormat = {
  date: "YYYY-MM-DD",
  amount: Number,
  items: Array<String>,
  confidence: Number  // 0-1 之間的數值
}
```

### 使用者狀態格式
```javascript
const userContext = {
  step: String,        // 當前步驟
  imageUrl: String,    // 圖片網址
  analysisResult: {    // 分析結果
    date: String,
    amount: Number,
    items: Array
  },
  confirmed: Boolean   // 是否已確認
}
```

## 開發原則

1. **模組化設計**
   - 各模組職責明確
   - 降低模組間耦合度
   - 便於未來功能擴充

2. **錯誤處理**
   - 統一的錯誤處理機制
   - 詳細的錯誤日誌
   - 友善的使用者錯誤提示

3. **資料流向**
   ```plaintext
   LINE Bot → 圖片分析 → 使用者確認 → 資料儲存
   ```

4. **擴展性考量**
   - 圖片分析服務可替換
   - 使用者互動流程可調整
   - 資料儲存格式標準化

## 開發順序

1. **基礎建設**
   - LINE Bot 設定
   - Google Apps Script 專案設定
   - 基本檔案結構建立

2. **核心功能**
   - LINE 訊息接收與回覆
   - 圖片分析整合
   - Google Sheets/Drive 整合

3. **使用者互動**
   - 基本確認流程
   - 錯誤處理機制
   - 使用者提示訊息

4. **優化與測試**
   - 功能測試
   - 使用者體驗優化
   - 效能優化

## 注意事項

1. **安全性**
   - API 金鑰妥善保管
   - 使用者資料安全處理
   - 適當的權限控制
   - 使用者驗證機制：
     ```javascript
     // 在 Config.gs 中設定允許的使用者
     const CONFIG = {
       ALLOWED_USERS: ['您的LINE_USER_ID'],  // 只允許這些使用者使用服務
     }
     ```
   - LINE Official Account 設定：
     - 設為「不公開」模式
     - 關閉自動加入好友功能
     - 停用主動推播訊息功能

2. **效能**
   - 圖片處理最佳化
   - 避免不必要的 API 呼叫
   - 適當的快取機制

3. **維護性**
   - 清晰的程式碼註解
   - 統一的程式碼風格
   - 完整的錯誤處理

## 敏感資訊處理

本專案使用獨立的設定檔來管理敏感資訊（如 API 金鑰、使用者 ID 等）。

### 設定步驟

1. 複製範例檔案：
   ```bash
   cp SecretConfig.example.gs SecretConfig.gs
   ```

2. 在 `SecretConfig.gs` 中填入實際的設定值：
   ```javascript
   const SECRET_CONFIG = {
     LINE_USER_ID: '您的LINE ID',
     LINE_CHANNEL_SECRET: '您的Channel Secret',
     LINE_CHANNEL_ACCESS_TOKEN: '您的Access Token'
   };
   ```

3. 確認 `.gitignore` 已包含：
   ```plaintext
   # 忽略包含敏感資訊的檔案
   SecretConfig.gs
   ```

### 注意事項

- `SecretConfig.gs` 不會被提交到版本控制系統
- 新開發者需要根據 `SecretConfig.example.gs` 建立自己的 `SecretConfig.gs`
- 更新設定範例時，記得同時更新 `SecretConfig.example.gs`
- 設定值的使用方式：
  ```javascript
  // 在其他檔案中使用設定
  function someFunction() {
    const sheetName = CONFIG.SHEET_NAME;        // 使用一般設定
    const apiKey = CONFIG.LINE_CHANNEL_SECRET;  // 使用敏感設定
  }
  ```

## 未來可能的擴充

1. 支援批次處理多張圖片
2. 自定義分類與標籤
3. 統計報表功能
4. 匯出功能增強

## 技術限制

1. Google Apps Script 執行時間限制（6分鐘）
2. LINE Bot API 限制
3. 圖片大小與格式限制

---

本文件將隨專案發展持續更新。如有任何問題或建議，請提出討論。