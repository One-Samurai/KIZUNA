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

> "KIZUNA Fan Passport fixes that. One soulbound pass. One on-chain record. Earn it by being right, not by being loud."

---

## 00:30–01:00 — Solution Overview

`[Hover the 5-step Tier Ladder: Rookie → Samurai → Veteran → Elite → Legend]`

> "Every fan mints a non-transferable passport. Predict matches on the Fight Card, win XP, climb tiers — Rookie through Legend. Your record is permanent, public, and yours. Sponsors, clubs, and communities can finally tell a real Day-One supporter from a drive-by follower."

`[Show two CTAs: Connect Wallet / Sign in with Google]`

> "And to onboard the ninety-five percent of fans who've never touched a wallet — we use zkLogin. Sign in with Google. That's it. No seed phrase, no extension, no excuses."

---

## 01:00–02:00 — Path A: Google zkLogin (the non-crypto fan)

`[Click "Sign in with Google" → Enoki popup → return]`

> "Here's Alice. She's a casual fan. She clicks Google, picks her account — and she's on-chain. No keys, no jargon. Behind the scenes, Enoki derives her Sui address from a zero-knowledge proof of her OAuth token. Her email never touches the chain."

`[Click "Mint Passport" → tx confirms → identity card flips on Passport page]`

> "She mints her passport. Notice the parchment card — that's her Honor Ledger. Rookie tier, zero XP, holder address right there."

`[Navigate to Pick'em / Fight Card → open match → vote Team A]`

> "She picks tonight's match. One tap, one signature — invisible, because zkLogin handles it. Her vote is now an immutable event on Sui."

`[Switch to admin tab briefly → settle match → back to Alice]`

> "Match settles. She got it right."

`[Click "Claim XP" → tx → XP bar jumps +100 → toast "Tier up: Samurai"]`

> "She claims her hundred XP. She's just promoted herself to **Samurai** — and every future sponsor, ticketing platform or community gate can read that on-chain, in milliseconds."

---

## 02:00–03:00 — Path B: Wallet User & Leaderboard

`[Disconnect → Connect Sui Wallet as different account "Bob"]`

> "Now Bob — a power user, prefers his own wallet. Same flow, same contract. The passport doesn't care how you authenticated."

`[Open Fight Card → filter "Open" → vote on a second live match]`

> "Bob's already Veteran tier. He's been picking for weeks. Watch the timer — picks lock at kickoff, no late entries, enforced in Move."

`[Settle the match as admin → Bob claims]`

> "Settled. Claimed."

`[Navigate to /leaderboard]`

> "Here's the **Honor Roll** — top ten by XP, tier mix across all holders, total picks, hit rate. **Every figure here is aggregated from on-chain events.** No backend, no database, no trust required. If our servers vanished tonight, the leaderboard would still exist."

`[Hover Bob's row — rank 3, 87% hit rate]`

> "That number — eighty-seven percent — is verifiable proof Bob actually knows the sport. That's the credential clubs and sponsors have been missing."

---

## 03:00–03:30 — Tech & Defence

`[Cut to architecture diagram or just code overview]`

> "Under the hood: two Move modules. Passport is soulbound — `key` ability, no `store`, cannot be transferred, period. XP only flows through a package-private function, gated by a MintCap. Pick'em uses shared objects with a settle guard so a winner can never be overwritten. We've shipped twenty-four unit tests, eight red-team adversarial tests — access-control bypass, integer overflow, double-claim, all green."

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
