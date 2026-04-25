# KIZUNA — Threat Model (MVP)

Scope: `kizuna::passport` + `kizuna::pickem` on Sui Testnet. Excludes frontend, zkLogin prover, and admin key storage.

## STRIDE Summary

| Category        | Threat                                           | Severity | Mitigation                                                          |
| --------------- | ------------------------------------------------ | -------- | ------------------------------------------------------------------- |
| Spoofing        | Fake Passport minted outside `mint`              | Critical | `Passport` has no public constructor; `mint` requires `MintCap`     |
| Spoofing        | Voting without owning a Passport                 | High     | `vote` takes `&Passport` — must be owner-signed tx                  |
| Tampering       | Admin rewrites another user's Passport           | Critical | Passport is owned object; admin cannot include it in their own tx   |
| Tampering       | External module calls `add_xp`                   | Critical | `public(package)` visibility restricts to same package              |
| Repudiation     | User denies voting                               | Low      | All votes emit `VoteCast` event with tx digest                      |
| Info disclosure | Vote choice leaked before lock                   | Med      | ACCEPTED — votes are public on-chain. Document in FAQ.              |
| DoS             | Match with millions of voters exhausts gas       | Med      | Doc'd limit ~10k/match for MVP; event-based tally for v2            |
| Elevation       | Admin key compromise                             | High     | Flagged for production (multisig 2-of-3)                            |

## Attack Vectors for `sui-red-team`

1. **Access control bypass**: attempt to call `add_xp` from a sibling test module
2. **Double-claim**: run `claim_xp` twice in same PTB, different PTBs
3. **Vote after lock**: craft tx with `Clock` at `locked_at_ms - 1` but network clock advances before execution
4. **Settle twice**: admin calls `settle` with winner=0, then winner=1 — **known gap in MVP, fix before mainnet**
5. **Non-voter claims**: craft `claim_xp` with a Passport that never voted on that Match

## Out of Scope

- zkLogin JWT replay (handled by Mysten prover)
- Google OAuth account takeover
- Gas sponsor wallet drain (operational concern)
- MEV on settle (no economic value, not exploitable)
