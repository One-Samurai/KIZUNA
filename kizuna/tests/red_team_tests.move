/// Red-team tests — adversarial vectors per docs/security/threat-model.md §6.3.
///
/// Some vectors are compile-time guarantees, not runtime checks. For those we
/// document the attack that *would* be tried and explain why it cannot even be
/// written — then Move's type system is the proof, not a runtime assertion.
#[test_only]
module kizuna::red_team_tests;

use std::string;
use sui::test_scenario as ts;
use sui::clock;
use kizuna::passport::{Self, Passport};
use kizuna::pickem::{Self, Match, AdminCap};

const ADMIN: address = @0xA11CE;
const ALICE: address = @0xA;
const EVE:   address = @0xE;

// =====================================================================
// VECTOR 1 — Construct Passport outside `mint`
// =====================================================================
// ATTACK: `let p = Passport { id, display_name, ... };` in an attacker module.
// DEFENSE: struct fields are module-private. Only `kizuna::passport` can pack
// a `Passport`. Attempting this outside the module fails to compile with
// "invalid struct construction". No runtime test possible — Move blocks the
// attacker's code at build.

// =====================================================================
// VECTOR 2 — Call `add_xp` from another package
// =====================================================================
// ATTACK: import `kizuna::passport` in another package and call `add_xp`.
// DEFENSE: `public(package)` visibility. Another package's compile fails with
// "function not visible". Compile-time, cannot be runtime-tested.
//
// Note: `kizuna::red_team_tests` is in the SAME package, so we *can* call
// `add_xp` here — that's expected and not an exploit. This is also why we
// keep the XP award cap in `passport::add_xp` itself: even a buggy pickem
// (same package) cannot overflow a Passport.

// =====================================================================
// VECTOR 3 — Bypass XP award cap via huge base_xp at match creation
// =====================================================================

#[test]
#[expected_failure(abort_code = 108, location = kizuna::pickem)]
fun vec3_admin_inflates_base_xp_at_create_match() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let acap = sc.take_from_sender<AdminCap>();
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(1_000);

    // MAX_BASE_XP = 1000; attacker admin sets 1_000_000 to mint mega-XP.
    pickem::create_match(
        &acap,
        string::utf8(b"A"),
        string::utf8(b"B"),
        10_000,
        1_000_000,
        &clk,
        sc.ctx(),
    );

    sc.return_to_sender(acap);
    clock::destroy_for_testing(clk);
    sc.end();
}

// =====================================================================
// VECTOR 4 — Second-layer: passport::add_xp itself caps awards
// Even if pickem is compromised (same-package bug bypasses MAX_BASE_XP),
// passport::add_xp has its own MAX_XP_PER_AWARD = 10_000 check.
// =====================================================================

#[test]
#[expected_failure(abort_code = 1, location = kizuna::passport)]
fun vec4_defense_in_depth_passport_caps_base() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());
    passport::add_xp(&mut p, 10_001, 0, true);
    passport::destroy_for_testing(p);
    sc.end();
}

#[test]
#[expected_failure(abort_code = 1, location = kizuna::passport)]
fun vec4_defense_in_depth_passport_caps_bonus() {
    let mut sc = ts::begin(ADMIN);
    let mut p = passport::mint_for_testing(string::utf8(b"t"), 0, sc.ctx());
    passport::add_xp(&mut p, 0, 10_001, true);
    passport::destroy_for_testing(p);
    sc.end();
}

// =====================================================================
// VECTOR 5 — Invalid choice fuzz (choice = 2)
// =====================================================================

#[test]
#[expected_failure(abort_code = 105, location = kizuna::pickem)]
fun vec5_invalid_vote_choice() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), 10_000, 10, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let p = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 2, &p, &clk, sc.ctx()); // 2 is neither A nor B
    sc.return_to_sender(p);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

#[test]
#[expected_failure(abort_code = 105, location = kizuna::pickem)]
fun vec5_invalid_settle_winner() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(1_000);
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), 10_000, 10, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 99);
    sc.return_to_sender(acap);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

// =====================================================================
// VECTOR 6 — Admin forging XP on user's Passport
// =====================================================================
// ATTACK: admin key signs a tx calling `claim_xp(match, &mut alice_passport)`.
// DEFENSE: Passport is an OWNED object at `ALICE`. A tx signed by ADMIN
// cannot reference ALICE's owned object as `&mut` — the Sui transaction
// manager rejects it at PTB input resolution, long before Move runs.
//
// In test_scenario we prove this by showing `take_from_sender<Passport>`
// aborts when executed under the wrong sender. The test_scenario aborts
// with a non-kizuna error (EEmptyInventory from test_scenario), so we rely
// on `expected_failure` without pinning a specific abort_code.

#[test]
#[expected_failure]
fun vec6_admin_cannot_access_alice_passport() {
    let mut sc = ts::begin(ADMIN);
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);
    clock::destroy_for_testing(clk);

    // Admin tries to pick up Alice's Passport from their own inventory.
    sc.next_tx(ADMIN);
    let stolen = sc.take_from_sender<Passport>(); // aborts — not in admin's inventory
    sc.return_to_sender(stolen);
    sc.end();
}

// =====================================================================
// VECTOR 7 — Non-voter (EVE) attempts to claim someone else's win
// =====================================================================

#[test]
#[expected_failure(abort_code = 104, location = kizuna::pickem)]
fun vec7_non_voter_claim_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    // Mint passports for both ALICE and EVE
    let mcap = sc.take_from_sender<passport::MintCap>();
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    passport::mint(&mcap, string::utf8(b"E"), EVE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), 10_000, 10, &clk, sc.ctx());
    sc.return_to_sender(acap);

    // Only ALICE votes
    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let pa = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &pa, &clk, sc.ctx());
    sc.return_to_sender(pa);
    ts::return_shared(m);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 0);
    sc.return_to_sender(acap);
    ts::return_shared(m);

    // EVE tries to claim — never voted
    sc.next_tx(EVE);
    let mut m = sc.take_shared<Match>();
    let mut pe = sc.take_from_sender<Passport>();
    pickem::claim_xp(&mut m, &mut pe, sc.ctx());
    sc.return_to_sender(pe);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}

// =====================================================================
// VECTOR 8 — Settle re-abuse with DIFFERENT winners
// (already in pickem_tests; re-affirmed here against a vote-then-reflip flow)
// =====================================================================

#[test]
#[expected_failure(abort_code = 106, location = kizuna::pickem)]
fun vec8_settle_reflip_after_claim_still_aborts() {
    let mut sc = ts::begin(ADMIN);
    pickem::init_for_testing(sc.ctx());
    passport::init_for_testing(sc.ctx());
    sc.next_tx(ADMIN);

    let mcap = sc.take_from_sender<passport::MintCap>();
    let mut clk = clock::create_for_testing(sc.ctx());
    clk.set_for_testing(1_000);
    passport::mint(&mcap, string::utf8(b"A"), ALICE, &clk, sc.ctx());
    sc.return_to_sender(mcap);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    pickem::create_match(&acap, string::utf8(b"A"), string::utf8(b"B"), 10_000, 10, &clk, sc.ctx());
    sc.return_to_sender(acap);

    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let pa = sc.take_from_sender<Passport>();
    pickem::vote(&mut m, 0, &pa, &clk, sc.ctx());
    sc.return_to_sender(pa);
    ts::return_shared(m);

    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 0);
    sc.return_to_sender(acap);
    ts::return_shared(m);

    // Alice claims with winner=0 → correct
    sc.next_tx(ALICE);
    let mut m = sc.take_shared<Match>();
    let mut pa = sc.take_from_sender<Passport>();
    pickem::claim_xp(&mut m, &mut pa, sc.ctx());
    sc.return_to_sender(pa);
    ts::return_shared(m);

    // Admin tries to flip winner to 1 after the fact
    sc.next_tx(ADMIN);
    let acap = sc.take_from_sender<AdminCap>();
    let mut m = sc.take_shared<Match>();
    pickem::settle(&acap, &mut m, 1); // aborts E_ALREADY_SETTLED (106)
    sc.return_to_sender(acap);
    ts::return_shared(m);
    clock::destroy_for_testing(clk);
    sc.end();
}
