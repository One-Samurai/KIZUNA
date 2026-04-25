# KIZUNA: Fan Identity Passport (絆：全渠道粉絲通行證)

## 專案概述 (Overview)
**KIZUNA (絆)** 象徵著粉絲與選手間不可磨滅的羈絆。它是建立於 Sui Network 上的 Fan Passport 2.0，是一個跨平台、可成長的 Web3 動態身份憑證。KIZUNA 將粉絲的參與熱情轉化為專屬的鏈上資產，徹底解決 ONE Championship 在日本市場缺乏直接掌握粉絲數據的痛點。

## 核心痛點解決
目前 ONE 在日本的轉播依賴 U-NEXT，導致官方無法直接觸及粉絲並建立長期忠誠度。KIZUNA 透過無金流的預測任務與實地打卡，讓粉絲累積「名譽經驗值」(Honor XP)，不僅合乎日本法規，更強化了本土粉絲的認同感。

## 為何選擇 Sui Network
*   **數據主權歸還粉絲 (Data Ownership)**：所有互動紀錄、經驗值皆跟著粉絲的鏈上錢包（或 zkLogin 帳號）走，所有權真正屬於粉絲。即便單一平台停止營運，資產與紀錄也永不消失，徹底解決長期經營的困境與平台綁架風險。
*   **跨平台資產自主權**：KIZUNA 能無縫打通 U-NEXT、ONE 官方 App 及線下道館，打破 Web2 時代的會員數據孤島。
*   **無摩擦登入體驗 (zkLogin)**：透過 Sui zkLogin，日本粉絲只需使用 Google 或 LINE 等社交帳號即可無痕註冊，完全免除學習錢包私鑰的巨大門檻。
*   **動態進化能力 (Dynamic NFT)**：粉絲的打卡、預測戰績能即時更新於 KIZUNA 通行證的屬性上，讓資產隨著粉絲的參與度「進化」，解鎖更多專屬權益。

## 未來規劃 (Roadmap)
*   **AI 生成拳手肖像**：目前 Passport 卡正面採用 tier-based 預設肖像（Rookie / Samurai / Ronin / Shogun / Legend），背面可翻卡展示粉絲個人 avatar。下一階段將接上生成式圖像管線（FAL flux-schnell / Replicate SDXL），依粉絲 tier、連勝紀錄與支持選手動態生成專屬拳手肖像；圖像透過 Sui 原生去中心化儲存 **Walrus** 持久化，並將 `blob_id` 寫回 Passport 物件，讓每位粉絲擁有完全上鏈、零依賴中心化 CDN 的個人肖像。
*   **動態 Tier 藝術**：每次升階觸發重新生成，Passport 會隨著粉絲從 Rookie 進化到 Legend。
*   **場館打卡與周邊門檻**：實體賽事打卡、tier-gated 周邊商品販售，全部以同一張 Passport 驗證。

## 目標對象與 GTM 策略
*   **對象**：ONE Championship 日本廣大粉絲群體。
*   **策略**：於 U-NEXT 轉播頁面或實體賽事現場發放免費 QR Code 供粉絲領取，結合「無金流 Pick'em 預測」模組，作為本屆 Hackathon 最具商業衝擊力的 MVP 主打方案。
