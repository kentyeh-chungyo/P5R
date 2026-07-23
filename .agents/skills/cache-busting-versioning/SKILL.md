---
name: cache-busting-versioning
description: Automatically bump and update asset version numbers (e.g. ?v=1.0.2) in HTML/reference files whenever assets (CSS, JS, images, data) are modified to prevent browser caching. Use when asked to "更新版本號", "避免網頁緩存", "調整版本號", "cache busting", "bump version", or before committing code updates.
metadata:
  author: Antigravity
  version: "1.0.0"
---

# Cache-Busting & Asset Versioning Guidelines (防緩存版本號管理規範)

## 目標 (Goal)
確保每次在修改或新增前端靜態資源檔案（如 `.js`, `.css`, `.json`, 數據檔, 圖片等）時，自動或同步更新引用檔案（如 `index.html` 或模板檔）中的版本號參數（如 `?v=1.0.2`），避免瀏覽器快取 (Browser Cache) 或 CDN 快取導致使用者無法即時取得最新版本的內容。

---

## 執行流程 (Execution Workflow)

在完成程式碼修修復/功能開發後、並於**提交 commit 前**，執行以下步驟：

### 步驟 1：識別有異動的靜態資源檔案 (Identify Modified Assets)
1. 檢視本次異動檔案列表（如透過 `git status` 或任務編輯紀錄）。
2. 找出被瀏覽器直接引用的靜態資源：
   - 腳本檔 (如 `app.js`, `data.js`, `*.js`)
   - 樣式檔 (如 `styles.css`, `*.css`)
   - 圖片或圖示 (如 `favicon.png`, `logo.svg`)

### 步驟 2：搜尋引用處 (Locate Referencing Files)
搜尋這些異動檔案在專案中被引用的位置（通常在 `index.html` 或進入點 HTML/模板檔中）：
- 例如 `<link rel="stylesheet" href="styles.css?v=1.0.1">`
- 例如 `<script src="app.js?v=1.0.1"></script>`

### 步驟 3：調整與遞增版本號 (Bump Version Numbers)
針對有異動的檔案，更新其引用處的 `?v=` 參數：

1. **已有版本號時 (Increment Version)**:
   - 若為修復或小更動，遞增 Patch 版本號（例如 `?v=1.0.1` -> `?v=1.0.2`）。
   - 若為重大功能更新，適度調整 Minor 版本號（例如 `?v=1.0.1` -> `?v=1.1.0`）。

2. **尚無版本號時 (Add Version Parameter)**:
   - 為該引用的副檔名補上初始版本號（例如 `href="styles.css"` -> `href="styles.css?v=1.0.0"`）。

3. **專案若使用時間戳記 (Timestamp/Date)**:
   - 若專案慣用日期或時間戳記，更新為當前日期/時間（例如 `?v=20260723`）。

### 步驟 4：驗證與檢查 (Verify Changes)
- 確保 HTML/模板檔案的標籤語法完整無誤。
- 確認所有異動到的靜態檔案皆已正確在 `index.html` 中同步更新版本號。

### 步驟 5：併入 Commit 提交 (Include in Commit)
- 在 Git commit 時，將更新過 `?v=...` 的 HTML 檔案與異動的資源檔案一起 stage 並提交。

---

## 最佳實踐與注意事項 (Best Practices)

1. **切勿遺漏 HTML 檔**：只修改 `.js` 或 `.css` 而未更新 `index.html` 中的 `?v=` 參數，極易引發使用者端快取新舊代碼不相容問題。
2. **多檔同時更新**：若一次任務修改了多個靜態檔（例如 `app.js` 與 `styles.css`），需同步遞增這兩個檔案對應的版本號。
3. **保持版本號格式一致**：全專案統一使用 `?v=X.Y.Z` 語法，便於團隊協作與版號追蹤。
