#[test_only]
module kizuna::passport_tests;

use std::string;
use sui::test_scenario as ts;
use sui::clock;
use kizuna::passport::{Self, Passport, MintCap};

const ADMIN: address = @0xA11CE;
const USER:  address = @0xB0B;

// === Tier boundary ===

#[test]
fun tier_boundaries() {
    assert!(passport::compute_tier(0) == 0, 0);
    assert!(passport::compute_tier(49) == 0, 1);
    assert!(passport::compute_tier(50) == 1, 2);
    assert!(passport::compute_tier(199) == 1, 3);
    assert!(passport::compute_tier(200) == 2, 4);
    assert!(passport::compute_tier(599) == 2, 5);
    assert!(passport::compute_tier(600) == 3, 6);
    assert!(passport::compute_tier(1499) == 3, 7);
    assert!(passport::compute_tier(1500) == 4, 8);
    assert!(passport::compute_tier(1_000_000) == 4, 9);
}

// === Mint flow ===

#[test]
fun mint_transfers_to_recipient_and_initial_state_is_rookie() {
    let mut sc = ts::begin(ADMIN);

    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let cap = sc.take_from_sender<MintCap>();
    let clk = clock::create_for_testing(sc.ctx());
    passport::mint(&cap, string::utf8(b"Fan#1"), USER, &clk, sc.ctx());
    clock::destroy_for_testing(clk);
    sc.return_to_sender(cap);

    sc.next_tx(USER);
    let p = sc.take_from_sender<Passport>();
    assert!(passport::tier(&p) == 0, 0);
    assert!(passport::honor_xp(&p) == 0, 1);
    assert!(passport::total_predictions(&p) == 0, 2);
    assert!(passport::current_streak(&p) == 0, 3);
    sc.return_to_sender(p);

    sc.end();
}

// === add_xp ===

#[test]
fun add_xp_correct_updates_streak_and_tier() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());

    passport::add_xp(&mut p, 50, 0, true);
    assert!(passport::honor_xp(&p) == 50, 0);
    assert!(passport::tier(&p) == 1, 1);
    assert!(passport::current_streak(&p) == 1, 2);
    assert!(passport::best_streak(&p) == 1, 3);
    assert!(passport::correct_predictions(&p) == 1, 4);
    assert!(passport::total_predictions(&p) == 1, 5);

    passport::destroy_for_testing(p);
    sc.end();
}

#[test]
fun add_xp_wrong_resets_streak_but_increments_total() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());

    passport::add_xp(&mut p, 10, 0, true);
    passport::add_xp(&mut p, 10, 0, true);
    assert!(passport::current_streak(&p) == 2, 0);
    assert!(passport::best_streak(&p) == 2, 1);

    passport::add_xp(&mut p, 0, 0, false);
    assert!(passport::current_streak(&p) == 0, 2);
    assert!(passport::best_streak(&p) == 2, 3);
    assert!(passport::total_predictions(&p) == 3, 4);
    assert!(passport::correct_predictions(&p) == 2, 5);
    assert!(passport::honor_xp(&p) == 20, 6);
    assert!(passport::tier(&p) == 0, 7);

    passport::destroy_for_testing(p);
    sc.end();
}

#[test]
fun add_xp_crosses_multiple_tiers() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());
    passport::add_xp(&mut p, 1500, 0, true);
    assert!(passport::tier(&p) == 4, 0);
    passport::destroy_for_testing(p);
    sc.end();
}

#[test]
#[expected_failure(abort_code = 1, location = kizuna::passport)]
fun add_xp_base_over_cap_aborts() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());
    passport::add_xp(&mut p, 10_001, 0, true);
    passport::destroy_for_testing(p);
    sc.end();
}

#[test]
#[expected_failure(abort_code = 1, location = kizuna::passport)]
fun add_xp_bonus_over_cap_aborts() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());
    passport::add_xp(&mut p, 0, 10_001, true);
    passport::destroy_for_testing(p);
    sc.end();
}
