# KIZUNA Fan Passport — Gas Report

_Generated: 2026-04-25 · Network: testnet · Package: `0x050064da…fee04`_

Real on-chain transactions (not dry-run). SUI testnet reference gas price = 1000 MIST/unit, so `computationCost = 1_000_000 MIST ≈ 1000 gas units` for every call below (all paths are well under the minimum compute bucket).

## Summary

| # | Operation | Comp (MIST) | Storage (MIST) | Rebate (MIST) | **NET (MIST)** | ≈ SUI | Tx digest / notes |
|---|-----------|------------:|---------------:|--------------:|---------------:|------:|-------------------|
| 1 | `passport::mint`      | 1,000,000 | 4,043,200 | 2,272,248 | **2,770,952** | 0.002771 | MintCap + creates Passport |
| 2 | `pickem::create_match`| 1,000,000 | 4,392,800 | 2,264,724 | **3,128,076** | 0.003128 | AdminCap + creates Match (shared) + 2 Tables |
| 3 | `pickem::vote`        | 1,000,000 | 6,437,200 | 4,792,788 | **2,644,412** | 0.002644 | Writes `votes[voter]=choice` dyn field |
| 4 | `pickem::settle`      | 1,000,000 | 4,400,400 | 4,348,872 | **1,051,528** | 0.001052 | Mutates `Match.winner` only |
| 5 | `pickem::claim_xp`    | 1,000,000 | 6,444,800 | 4,800,312 | **2,644,488** | 0.002644 | Writes `claimed[voter]=true` + mutates Passport |

**Total happy-path cost per fan (mint → vote → claim): ~8.06M MIST ≈ 0.0081 SUI** (mint is one-time; per-match fan cost = vote + claim ≈ 0.0053 SUI).

Admin cost per match = create_match + settle ≈ 0.0042 SUI.

## Observations

1. **Compute is flat at 1M MIST** for all 5 paths — every function sits in the smallest bucket. Compute will only matter once logic gets >~1000 gas units; current contracts are trivial state mutations.
2. **Storage dominates.** `vote` and `claim_xp` both touch `Table<address, _>` dynamic fields — each new entry adds ~6.4M MIST storage but ~4.8M MIST rebate (net +1.6M). `settle` writes zero new objects, hence the tiny 1M net.
3. **create_match is the costliest single write** (3.1M net) — creating the Match object plus two empty Tables. One-time per match, negligible at scale.
4. **Rebate ratio**: 70–100% of storage cost is rebated on mutations (Sui's storage-fund model). `claim_xp` actually ends up near-free in steady state once rebate math settles.
5. **No surprises vs. Move tests.** Everything matches red-team green results — no hidden O(N) loop, no unexpected emit, no abort-path paying settle gas.

## Raw tx JSON

- `tasks/gas/1_mint.json`
- `tasks/gas/2_create.json`
- `tasks/gas/3_vote.json`
- `tasks/gas/4_settle.json`
- `tasks/gas/5_claim.json`

## Methodology

Ran fresh E2E on testnet with admin wallet `0x1509…bc4c`:
```
passport::mint(MintCap, "GasTest", admin, clock)
pickem::create_match(AdminCap, "Alpha", "Bravo", now+10min, 100, clock)
pickem::vote(match, 0, passport, clock)
pickem::settle(AdminCap, match, 0)
pickem::claim_xp(match, passport)
```
Gas extracted from `effects.gasUsed` in each `sui client call --json` response.

## Objects created during test (cleanup optional)

- Passport: `0xfa907ef1c9b0c19e55c831cf484a0e101ced83b734b59fe2ac2d95d4fc49c174`
- Match: `0xbd62d6b9ae9938e261a02607ce25b5d4f6c9bcde6e5970446c1f57c619d48281`
