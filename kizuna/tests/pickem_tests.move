#[test_only]
module kizuna::pickem_tests;

use std::string;
use sui::test_scenario as ts;
use sui::clock::{Self, Clock};
use kizuna::passport::{Self, Passport};
use kizuna::pickem::{Self, Match, AdminCap};

const ADMIN: address = @0xA11CE;
const ALICE: address = @0xA;

const LOCK_AT: u64 = 10_000;
const BASE_XP: u64 = 10;

// Helpers ---------------------------------------------------------------

fun setup_clock(sc: &mut ts::Scenario, ms: u64): Clock {
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(ms);
    clk
}

fun boot(sc: &mut ts::Scenario) {
    pickem::init_for_testing(sc.ctx());
}

// === Full lifecycle ===

#[test]
fun full_lifecycle_correct_pick_awards_base_xp() {
    let mut sc = ts::begin(ADMIN);
    boot(&mut sc);
    sc.next_tx(ADMIN);

    // Mint passport for ALICE
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);
    let mcap = sc.take_from_sender<passport::MintCap>();
    let clk_init = clock::create_for_testing(sc.ctx());
    passport::mint(&mcap, string::utf8(b"Alice"), ALICE, &clk_init, sc.ctx());
    clock::destroy_for_testing(clk_init);
    sc.return_to_sender(mcap);

    // Admin creates a match
    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let clk = setup_clock(&mut sc, 1_000);
    pickem::create_match(
        &acap,
        string::utf8(b"A"),
        string::utf8(b"B"),
        LOCK_AT,
        BASE_XP,
        &clk,
        sc.ctx(),
    );
    sc.return_to_sender(acap);

    // Alice votes for A (choice 0)
    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let p = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &p, &clk, sc.ctx());
    assert!(pickem::has_voted(&m, ALICE), 0);
    sc.return_to_sender(p);
    ts::return_shared(m);

    // Admin settles: winner = 0
    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 0);
    sc.return_to_sender(acap);
    ts::return_shared(m);

    // Alice claims
    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let mut p = sc.take_from_sender<Passport>();
    pickem::claim_xp(&mut m, &mut p, sc.ctx());
    assert!(passport::honor_xp(&p) == BASE_XP, 1);
    assert!(passport::current_streak(&p) == 1, 2);
    assert!(pickem::has_claimed(&m, ALICE), 3);
    sc.return_to_sender(p);
    ts::return_shared(m);

    clock::destroy_for_testing(clk);
    sc.end();
}

// === Wrong pick ===

#[test]
fun wrong_pick_awards_zero_and_resets_streak() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let clk = setup_clock(&mut sc, 1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), LOCK_AT, BASE_XP, &clk, sc.ctx());
    sc.return_to_sender(acap);

    // Alice votes for 0
    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let p = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &p, &clk, sc.ctx());
    sc.return_to_sender(p);
    ts::return_shared(m);

    // Settle winner = 1
    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 1);
    sc.return_to_sender(acap);
    ts::return_shared(m);

    // Claim: awarded = 0
    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let mut p = sc.take_from_sender<Passport>();
    pickem::claim_xp(&mut m, &mut p, sc.ctx());
    assert!(passport::honor_xp(&p) == 0, 0);
    assert!(passport::total_predictions(&p) == 1, 1);
    assert!(passport::correct_predictions(&p) == 0, 2);
    sc.return_to_sender(p);
    ts::return_shared(m);

    clock::destroy_for_testing(clk);
    sc.end();
}

// === vote after lock ===

#[test]
#[expected_failure(abort_code = 100, location = kizuna::pickem)]
fun vote_after_lock_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let clk_pre = setup_clock(&mut sc, 1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk_pre, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), LOCK_AT, BASE_XP, &clk_pre, sc.ctx());
    sc.return_to_sender(acap);
    clock::destroy_for_testing(clk_pre);

    // Advance clock past lock
    sc.next_tx(ALICE);
    let clk_late = setup_clock(&mut sc, LOCK_AT + 1);
    let mut m = sc.take_shared<Match>();
    let p = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &p, &clk_late, sc.ctx());
    // unreachable
    sc.return_to_sender(p);
    ts::return_shared(m);
    clock::destroy_for_testing(clk_late);
    sc.end();
}

// === double vote ===

#[test]
#[expected_failure(abort_code = 101, location = kizuna::pickem)]
fun double_vote_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let clk = setup_clock(&mut sc, 1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), LOCK_AT, BASE_XP, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let p = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &p, &clk, sc.ctx());
    pickem::vote(&mut m, 1, &p, &clk, sc.ctx());
    sc.return_to_sender(p);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

// === settle twice ===

#[test]
#[expected_failure(abort_code = 106, location = kizuna::pickem)]
fun settle_twice_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let acap = sc.take_from_sender<AdminCap>();
    let clk = setup_clock(&mut sc, 1_000);
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), LOCK_AT, BASE_XP, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 0);
    pickem::settle(&acap, &mut m, 1);
    sc.return_to_sender(acap);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

// === claim without vote ===

#[test]
#[expected_failure(abort_code = 104, location = kizuna::pickem)]
fun claim_without_vote_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let clk = setup_clock(&mut sc, 1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), LOCK_AT, BASE_XP, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 0);
    sc.return_to_sender(acap);
    ts::return_shared(m);

    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let mut p = sc.take_from_sender<Passport>();
    pickem::claim_xp(&mut m, &mut p, sc.ctx());
    sc.return_to_sender(p);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

// === double claim ===

#[test]
#[expected_failure(abort_code = 103, location = kizuna::pickem)]
fun double_claim_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let clk = setup_clock(&mut sc, 1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), LOCK_AT, BASE_XP, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let p = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &p, &clk, sc.ctx());
    sc.return_to_sender(p);
    ts::return_shared(m);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 0);
    sc.return_to_sender(acap);
    ts::return_shared(m);

    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let mut p = sc.take_from_sender<Passport>();
    pickem::claim_xp(&mut m, &mut p, sc.ctx());
    pickem::claim_xp(&mut m, &mut p, sc.ctx());
    sc.return_to_sender(p);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

// === streak bonus ===

#[test]
fun streak_bonus_thresholds() {
    assert!(pickem::compute_streak_bonus(0, true) == 0, 0);
    assert!(pickem::compute_streak_bonus(1, true) == 0, 1);
    assert!(pickem::compute_streak_bonus(2, true) == 20, 2);
    assert!(pickem::compute_streak_bonus(3, true) == 20, 3);
    assert!(pickem::compute_streak_bonus(4, true) == 50, 4);
    assert!(pickem::compute_streak_bonus(10, true) == 50, 5);
    assert!(pickem::compute_streak_bonus(10, false) == 0, 6);
}

// === lock in past ===

#[test]
#[expected_failure(abort_code = 107, location = kizuna::pickem)]
fun create_match_with_past_lock_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let clk = setup_clock(&mut sc, 5_000);
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), 1_000, BASE_XP, &clk, sc.ctx());
    sc.return_to_sender(acap);
    clock::destroy_for_testing(clk);
    sc.end();
}
