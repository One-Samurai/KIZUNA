/// KIZUNA Pick'em — no-money fight prediction.
/// Clock-based voting lock, pull-based XP claim.
/// XP mutation is routed through `kizuna::passport::add_xp` (public(package)),
/// so `pickem` is the only legitimate source of Honor XP.
module kizuna::pickem;

use std::string::String;
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};
use kizuna::passport::{Self, Passport};

// === Errors ===

const E_VOTING_LOCKED:     u64 = 100;
const E_ALREADY_VOTED:     u64 = 101;
const E_NOT_SETTLED:       u64 = 102;
const E_ALREADY_CLAIMED:   u64 = 103;
const E_DID_NOT_VOTE:      u64 = 104;
const E_INVALID_CHOICE:    u64 = 105;
const E_ALREADY_SETTLED:   u64 = 106;
const E_LOCK_IN_PAST:      u64 = 107;
const E_BASE_XP_TOO_LARGE: u64 = 108;

// Must stay <= passport::MAX_XP_PER_AWARD.
const MAX_BASE_XP: u64 = 1_000;

// === Structs ===

public struct AdminCap has key, store {
    id: UID,
}

public struct Match has key {
    id: UID,
    fighter_a: String,
    fighter_b: String,
    locked_at_ms: u64,
    winner: Option<u8>,
    votes: Table<address, u8>,
    claimed: Table<address, bool>,
    base_xp: u64,
}

// === Events ===

public struct MatchCreated has copy, drop {
    match_id: ID,
    fighter_a: String,
    fighter_b: String,
    locked_at_ms: u64,
    base_xp: u64,
}

public struct VoteCast has copy, drop {
    match_id: ID,
    voter: address,
    choice: u8,
}

public struct MatchSettled has copy, drop {
    match_id: ID,
    winner: u8,
}

public struct XpClaimed has copy, drop {
    match_id: ID,
    voter: address,
    correct: bool,
    xp_awarded: u64,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    transfer::public_transfer(
        AdminCap { id: object::new(ctx) },
        ctx.sender(),
    );
}

// === Admin ===

public fun create_match(
    _: &AdminCap,
    fighter_a: String,
    fighter_b: String,
    locked_at_ms: u64,
    base_xp: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(base_xp <= MAX_BASE_XP, E_BASE_XP_TOO_LARGE);
    assert!(locked_at_ms > clock.timestamp_ms(), E_LOCK_IN_PAST);

    let m = Match {
        id: object::new(ctx),
        fighter_a,
        fighter_b,
        locked_at_ms,
        winner: option::none(),
        votes: table::new(ctx),
        claimed: table::new(ctx),
        base_xp,
    };
    event::emit(MatchCreated {
        match_id: object::id(&m),
        fighter_a: m.fighter_a,
        fighter_b: m.fighter_b,
        locked_at_ms,
        base_xp,
    });
    transfer::share_object(m);
}

/// Settle a match. Guards against re-settlement (spec §6.3 gap fix).
public fun settle(_: &AdminCap, m: &mut Match, winner: u8) {
    assert!(winner == 0 || winner == 1, E_INVALID_CHOICE);
    assert!(m.winner.is_none(), E_ALREADY_SETTLED);
    m.winner = option::some(winner);
    event::emit(MatchSettled { match_id: object::id(m), winner });
}

// === User actions ===

public fun vote(
    m: &mut Match,
    choice: u8,
    _passport: &Passport,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(choice == 0 || choice == 1, E_INVALID_CHOICE);
    assert!(clock.timestamp_ms() < m.locked_at_ms, E_VOTING_LOCKED);
    let voter = ctx.sender();
    assert!(!m.votes.contains(voter), E_ALREADY_VOTED);
    m.votes.add(voter, choice);
    event::emit(VoteCast { match_id: object::id(m), voter, choice });
}

/// Pull-based XP claim. Requires `&mut Passport`, so only the owner can sign.
public fun claim_xp(
    m: &mut Match,
    passport: &mut Passport,
    ctx: &mut TxContext,
) {
    assert!(m.winner.is_some(), E_NOT_SETTLED);
    let voter = ctx.sender();
    assert!(m.votes.contains(voter), E_DID_NOT_VOTE);
    assert!(!m.claimed.contains(voter), E_ALREADY_CLAIMED);

    let choice = *m.votes.borrow(voter);
    let winner = *m.winner.borrow();
    let correct = choice == winner;

    // Streak bonus uses the streak BEFORE add_xp updates it.
    let streak_bonus = compute_streak_bonus(
        passport::current_streak(passport),
        correct,
    );
    let base_award = if (correct) m.base_xp else 0;
    let awarded = base_award + streak_bonus;

    passport::add_xp(passport, base_award, streak_bonus, correct);
    m.claimed.add(voter, true);

    event::emit(XpClaimed {
        match_id: object::id(m),
        voter,
        correct,
        xp_awarded: awarded,
    });
}

// === Read-only accessors ===

public fun fighter_a(m: &Match): &String { &m.fighter_a }
public fun fighter_b(m: &Match): &String { &m.fighter_b }
public fun locked_at_ms(m: &Match): u64 { m.locked_at_ms }
public fun base_xp(m: &Match): u64 { m.base_xp }
public fun is_settled(m: &Match): bool { m.winner.is_some() }
public fun winner(m: &Match): Option<u8> { m.winner }
public fun has_voted(m: &Match, voter: address): bool { m.votes.contains(voter) }
public fun has_claimed(m: &Match, voter: address): bool { m.claimed.contains(voter) }

// === Pure helpers ===

/// Bonus awarded on a correct pick based on streak BEFORE this claim.
/// current_streak = 2 → next correct is the 3rd in a row → +20
/// current_streak >= 4 → next correct is the 5th+ in a row → +50
public fun compute_streak_bonus(current_streak: u64, correct: bool): u64 {
    if (!correct) 0
    else if (current_streak >= 4) 50
    else if (current_streak >= 2) 20
    else 0
}

// === Test-only ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx)
}
