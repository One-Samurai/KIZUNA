# Design Notes: KIZUNA Fan Passport Logo

## 本次任務紀錄 (Date: 2026-04-25)

### 做了什麼
- 建立 KIZUNA Fan Passport 的核心 Logo，涵蓋 SVG 向量檔與 PNG 點陣圖檔。
- SVG 採用代碼純手工繪製，確保極致的高清與 Web3 科技感。
- 利用 macOS 內建 `sips` 工具將 `.svg` 轉換出高解析度的 `.png`。

### 更動了哪些檔案
- `[NEW]` `/KIZUNA_Fan_Passport/kizuna_logo.svg`
- `[NEW]` `/KIZUNA_Fan_Passport/kizuna_logo.png`
- `[NEW]` `/KIZUNA_Fan_Passport/docs/design-notes.md`

### 決策原因
- **幾何元素**：外層六角形象徵 Sui Network 與 Web3 的區塊鏈節點結構。
- **文化元素**：內層紅色破折圓環象徵日本文化中的「圓（Enso）」，以及 ONE Championship 代表性的熱血競技場（紅色調）。
- **中心字體**：選用充滿魄力的「絆」字作為視覺焦點，強調粉絲與選手間不滅的羈絆。
- **色彩計畫**：
  - Sui Blue (`#4ca2ff` ~ `#2a75d3`) 帶出科技感、去中心化身份。
  - Samurai Red (`#ff3b3b` ~ `#b90000`) 呼應 ONE Samurai 的武士精神與熱情。
  - 深邃黑底營造 Premium（高質感）的主視覺基調。

### 尚未完成的 TODO
- 建立 Light Theme 版本的 Logo 變體。
- 根據未來需求產生不同尺寸的 apple-touch-icon。

## 本次任務紀錄 (Date: 2026-04-25, Frontend Integration)

### 做了什麼
- 將新產生的 Logo 整合進前端網頁。
- 將 `Nav.tsx` 與 `passport/page.tsx` 中的純文字「絆」替換為新設計的 Logo SVG。
- 利用 Next.js App Router 慣例，將 `icon.svg` 放置於 `app` 目錄以自動生成網站 Favicon。

### 更動了哪些檔案
- `[NEW]` `/KIZUNA_Fan_Passport/frontend/public/logo.svg`
- `[NEW]` `/KIZUNA_Fan_Passport/frontend/app/icon.svg`
- `[MODIFY]` `/KIZUNA_Fan_Passport/frontend/components/Nav.tsx`
- `[MODIFY]` `/KIZUNA_Fan_Passport/frontend/app/passport/page.tsx`

### 決策原因
- **SVG 原生支援**：Next.js 直接支援 `<img src="/logo.svg">`，保證跨裝置顯示無損且不會增加打包體積。
- **Favicon 自動處理**：藉由 Next.js `app/icon.svg` 檔案命名約定，自動產生各平台的 `<link rel="icon">`，不需手動修改 `layout.tsx`。
