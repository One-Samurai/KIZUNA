/// KIZUNA Fan Passport — soulbound dynamic NFT.
/// Soulbound is enforced at the type system: `has key` without `store` means
/// the object cannot be wrapped, transferred via `public_transfer`, or placed
/// in a Kiosk. Any attempt to do so fails to compile.
module kizuna::passport;

use std::string::String;
use sui::clock::Clock;
use sui::event;

// === Errors ===

const E_XP_AWARD_TOO_LARGE: u64 = 1;

// === Tier constants ===

const TIER_ROOKIE:  u8 = 0;
const TIER_SAMURAI: u8 = 1;
const TIER_RONIN:   u8 = 2;
const TIER_SHOGUN:  u8 = 3;
const TIER_LEGEND:  u8 = 4;

const XP_SAMURAI: u64 = 50;
const XP_RONIN:   u64 = 200;
const XP_SHOGUN:  u64 = 600;
const XP_LEGEND:  u64 = 1500;

/// Hard cap on a single XP award to prevent admin-set `base_xp` from minting
/// absurd values. Well above any realistic match reward + streak bonus.
const MAX_XP_PER_AWARD: u64 = 10_000;

// === Structs ===

/// Soulbound Passport. `key` only — no `store`, no transfer.
public struct Passport has key {
    id: UID,
    display_name: String,
    honor_xp: u64,
    correct_predictions: u64,
    total_predictions: u64,
    current_streak: u64,
    best_streak: u64,
    tier: u8,
    minted_at_ms: u64,
}

/// Admin capability for minting Passports. Held by deployer.
public struct MintCap has key, store {
    id: UID,
}

// === Events ===

public struct PassportMinted has copy, drop {
    passport_id: ID,
    recipient: address,
    display_name: String,
    minted_at_ms: u64,
}

public struct TierUp has copy, drop {
    passport_id: ID,
    old_tier: u8,
    new_tier: u8,
    honor_xp: u64,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    transfer::public_transfer(
        MintCap { id: object::new(ctx) },
        ctx.sender(),
    );
}

// === Public entry ===

/// Mint a Passport for `recipient`. Admin-gated via `MintCap`.
/// Uses `transfer::transfer` (not `public_transfer`) because Passport has no `store`.
public fun mint(
    _: &MintCap,
    display_name: String,
    recipient: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let now = clock.timestamp_ms();
    let p = Passport {
        id: object::new(ctx),
        display_name,
        honor_xp: 0,
        correct_predictions: 0,
        total_predictions: 0,
        current_streak: 0,
        best_streak: 0,
        tier: TIER_ROOKIE,
        minted_at_ms: now,
    };
    event::emit(PassportMinted {
        passport_id: object::id(&p),
        recipient,
        display_name: p.display_name,
        minted_at_ms: now,
    });
    transfer::transfer(p, recipient);
}

// === Package-internal mutation ===

/// Award XP and update derived fields. Only `kizuna::pickem` can call this.
/// `base` is 0 on a wrong pick; `streak_bonus` is applied on top.
public(package) fun add_xp(
    p: &mut Passport,
    base: u64,
    streak_bonus: u64,
    correct: bool,
) {
    assert!(base <= MAX_XP_PER_AWARD, E_XP_AWARD_TOO_LARGE);
    assert!(streak_bonus <= MAX_XP_PER_AWARD, E_XP_AWARD_TOO_LARGE);

    let old_tier = p.tier;
    p.honor_xp = p.honor_xp + base + streak_bonus;
    p.total_predictions = p.total_predictions + 1;
    if (correct) {
        p.correct_predictions = p.correct_predictions + 1;
        p.current_streak = p.current_streak + 1;
        if (p.current_streak > p.best_streak) {
            p.best_streak = p.current_streak;
        };
    } else {
        p.current_streak = 0;
    };
    let new_tier = compute_tier(p.honor_xp);
    p.tier = new_tier;

    if (new_tier > old_tier) {
        event::emit(TierUp {
            passport_id: object::id(p),
            old_tier,
            new_tier,
            honor_xp: p.honor_xp,
        });
    }
}

// === Read-only accessors ===

public fun honor_xp(p: &Passport): u64 { p.honor_xp }
public fun tier(p: &Passport): u8 { p.tier }
public fun current_streak(p: &Passport): u64 { p.current_streak }
public fun best_streak(p: &Passport): u64 { p.best_streak }
public fun correct_predictions(p: &Passport): u64 { p.correct_predictions }
public fun total_predictions(p: &Passport): u64 { p.total_predictions }
public fun display_name(p: &Passport): &String { &p.display_name }
public fun minted_at_ms(p: &Passport): u64 { p.minted_at_ms }

// === Pure helpers ===

public fun compute_tier(xp: u64): u8 {
    if (xp >= XP_LEGEND) TIER_LEGEND
    else if (xp >= XP_SHOGUN) TIER_SHOGUN
    else if (xp >= XP_RONIN) TIER_RONIN
    else if (xp >= XP_SAMURAI) TIER_SAMURAI
    else TIER_ROOKIE
}

// === Test-only helpers ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx)
}

#[test_only]
public fun mint_for_testing(
    display_name: String,
    minted_at_ms: u64,
    ctx: &mut TxContext,
): Passport {
    Passport {
        id: object::new(ctx),
        display_name,
        honor_xp: 0,
        correct_predictions: 0,
        total_predictions: 0,
        current_streak: 0,
        best_streak: 0,
        tier: TIER_ROOKIE,
        minted_at_ms,
    }
}

#[test_only]
public fun destroy_for_testing(p: Passport) {
    let Passport {
        id,
        display_name: _,
        honor_xp: _,
        correct_predictions: _,
        total_predictions: _,
        current_streak: _,
        best_streak: _,
        tier: _,
        minted_at_ms: _,
    } = p;
    object::delete(id);
}
