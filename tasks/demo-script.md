# KIZUNA Fan Passport — Demo Script

- **Duration**: ~4 minutes (≈ 560 words, 140 wpm)
- **Language**: British English
- **Format**: `[ACTION]` = on-screen action, `>>` = narration

---

## 00:00–00:30 — Hook & Pain Point

`[Camera on landing page, hero countdown ticking]`

> "Imagine you've supported a club for ten years. You've travelled to away games, stayed up for derbies, defended them on every timeline. Now — prove it.
>
> You can't. Your loyalty lives in a dozen siloed apps that don't talk to each other, owned by organisations that can revoke your status overnight. Bots flood the fan clubs. Real fans get nothing back. **Fandom has no portable, verifiable memory.**"

`[Click into landing — show "Honor Ledger / Fight Card / Honor Roll" tiles]`

> "KIZUNA Fan Passport fixes that. One soulbound pass. One on-chain record."

---

## 00:30–01:00 — Solution Overview

`[Hover the 5-step Tier Ladder: Rookie → Samurai → Veteran → Elite → Legend]`

> "Predict matches on the Fight Card, win XP, and climb from Rookie to Legend. Your record is permanent and yours. Sponsors can finally tell a Day-One supporter from a drive-by follower."

`[Show two CTAs: Connect Wallet / Sign in with Google]`

> "To onboard the ninety-five percent of fans without a crypto wallet, we use zkLogin. Sign in with Google. No seed phrases, no extensions."

---

## 01:00–02:00 — Path A: Google zkLogin (the non-crypto fan)

`[Click "Sign in with Google" → Enoki popup → return]`

> "Here's Ramon. He clicks Google, picks his account — and he's on-chain. Behind the scenes, Enoki derives his Sui address from his OAuth token. His email never touches the chain."

`[Click "Mint Passport" → tx confirms → identity card appears on Passport page]`

> "He mints his passport. Notice the parchment card — his Honor Ledger."

`[Click the card — it flips over revealing the holder's avatar portrait]`

> "Tap it — the passport flips. Front shows the tier artwork; back carries his full on-chain identity. Soon, we'll integrate an AI generator storing portraits directly on **Walrus**, Sui's decentralised blob storage, entirely removing reliance on centralised CDNs."

`[Navigate to Pick'em / Fight Card → open match → vote Team A]`

> "He picks tonight's match. One tap, one signature — invisible, because zkLogin handles it. His vote is now an immutable event on Sui."

`[Switch to admin tab briefly → settle match → back to Ramon]`

> "Match settles. He got it right."

`[Click "Claim XP" → tx → XP bar jumps +100 → toast "Tier up: Samurai"]`

> "He claims his hundred XP. He's just promoted himself to **Samurai** — and every future sponsor, ticketing platform or community gate can read that on-chain, in milliseconds."

---

## 02:00–03:00 — Path B: Wallet User & Leaderboard

`[Disconnect → Connect Sui Wallet as different account "Cindy"]`

> "Now Cindy — a power user, prefers her own wallet. Same flow, same contract. The passport doesn't care how you authenticated."

`[Open Fight Card → filter "Open" → vote on a second live match]`

> "Cindy's already Veteran tier. She's been picking for weeks. Watch the timer — picks lock at kickoff, no late entries, enforced in Move."

`[Settle the match as admin → Cindy claims]`

> "Settled. Claimed."

`[Navigate to /leaderboard]`

> "Here's the **Honor Roll** — top ten by XP and hit rate. **Every figure here is aggregated directly from on-chain events.** No backend database required. If our servers vanished tonight, the leaderboard remains."

`[Hover Cindy's row — rank 3, 87% hit rate]`

> "That eighty-seven percent hit rate is verifiable proof Cindy knows the sport. That's the credential clubs have been missing."

---

## 03:00–03:30 — Tech & Defence

`[Cut to architecture diagram or just code overview]`

> "Under the hood: two Move modules. Passport is soulbound — `key` ability, no `store`, cannot be transferred, period. XP only flows through a package-private function, gated by a MintCap. Pick'em uses shared objects with a settle guard so a winner can never be overwritten. We've shipped twenty-four unit tests, eight red-team adversarial tests — access-control bypass, integer overflow, double-claim, all green."

`[Briefly highlight the MintCap line on screen]`

> "And one deliberate design call: minting is **operator-gated**, not self-serve. Soulbound stops transfers — it doesn't stop one person spinning up a hundred zkLogin addresses to farm XP and poison the leaderboard. The MintCap puts the KYC gate — ticket scan at the venue, U-NEXT account binding, Google issuer check — off-chain where it belongs, while the on-chain authority stays a single capability object we can later upgrade to a zk-proof-gated `mint_with_proof`. One pass per real fan. That's the credential clubs actually want."

---

## 03:30–04:00 — Vision & Close

`[Back to landing, slow zoom on hero]`

> "Today it's Pick'em. Tomorrow it's check-ins at the stadium, merch drops gated by tier, voting rights in fan DAOs, cross-club reputation — all reading the same passport.
>
> Fandom built the modern entertainment economy and got nothing portable to show for it. **KIZUNA gives fans their receipts.**
>
> One passport. One ledger. One samurai. Thank you."

`[Logo card, package ID on screen]`

---

## Recording Tips

- **錄兩段再剪**：Path A 用 Chrome incognito（Google 登入乾淨）；Path B 用裝了 Sui Wallet 的正常 profile。剪接點在 02:00 disconnect。
- **Admin settle 預錄**：另開 terminal 或第二個 tab 先把 match 建好，demo 時只切過去按 settle，避免冷場。
- **倒數計時器**：landing 的 countdown 會動，當作節奏錨點。
- **字幕**：英式拼字（`favourite`, `colour`, `organisation`, `centralised`, `realise`），Grammarly 設 British English 校一次。
- **語速**：140 wpm 偏慢、清楚。566 字實測約 4:02。

---

## Pain Points 對應表（pitch 檢查用）

| Pain Point | Script 段落 | Solution |
|---|---|---|
| Loyalty 無法攜帶 / 不可驗證 | 00:00–00:30 | Soulbound on-chain passport |
| Web2 fan club 可被單方撤銷 | 00:00–00:30 | Owned by user, permanent |
| Bot / 假粉稀釋社群 | 00:00–00:30, 02:00+ | XP earned by verifiable predictions + hit rate |
| Crypto onboarding 門檻 | 00:30–01:00, 01:00–02:00 | zkLogin (Google sign-in, no seed phrase) |
| 忠誠粉絲零回饋 | 00:30–01:00, 03:30+ | Tier ladder + future utility (merch / DAO / gating) |
| 缺乏可信粉絲 credential | 02:00–03:00 | Public hit rate + tier, verifiable on-chain |
| Sybil / 假帳號灌水 leaderboard | 03:00–03:30 | MintCap-gated mint — operator binds passport to KYC/ticket off-chain; one pass per real fan |
