const CONFIG = {
  // 非敏感的設定
  SHEET_NAME: '發票記錄',
  DRIVE_FOLDER_NAME: '發票圖片',
  
  // 從 SecretConfig.gs 取得敏感設定
  ...SECRET_CONFIG
}; 