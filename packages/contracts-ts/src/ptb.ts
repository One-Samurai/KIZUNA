import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { PACKAGE_ID, MODULE, CLOCK_ID, MINT_CAP_ID, ADMIN_CAP_ID } from './config';

// === passport ===

export interface MintPassportArgs {
  displayName: string;
  recipient: string;
  mintCapId?: string; // override (defaults to MINT_CAP_ID from deployed.json)
}

export function buildMintPassport(args: MintPassportArgs): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE.passport}::mint`,
    arguments: [
      tx.object(args.mintCapId ?? MINT_CAP_ID),
      tx.pure(bcs.string().serialize(args.displayName)),
      tx.pure.address(args.recipient),
      tx.object(CLOCK_ID),
    ],
  });
  return tx;
}

// === pickem: admin ===

export interface CreateMatchArgs {
  fighterA: string;
  fighterB: string;
  lockedAtMs: bigint | number;
  baseXp: bigint | number;
  adminCapId?: string;
}

export function buildCreateMatch(args: CreateMatchArgs): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE.pickem}::create_match`,
    arguments: [
      tx.object(args.adminCapId ?? ADMIN_CAP_ID),
      tx.pure(bcs.string().serialize(args.fighterA)),
      tx.pure(bcs.string().serialize(args.fighterB)),
      tx.pure.u64(args.lockedAtMs),
      tx.pure.u64(args.baseXp),
      tx.object(CLOCK_ID),
    ],
  });
  return tx;
}

export interface SettleMatchArgs {
  matchId: string;
  winner: 0 | 1;
  adminCapId?: string;
}

export function buildSettleMatch(args: SettleMatchArgs): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE.pickem}::settle`,
    arguments: [
      tx.object(args.adminCapId ?? ADMIN_CAP_ID),
      tx.object(args.matchId),
      tx.pure.u8(args.winner),
    ],
  });
  return tx;
}

// === pickem: user ===

export interface VoteArgs {
  matchId: string;
  choice: 0 | 1;
  passportId: string;
}

export function buildVote(args: VoteArgs): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE.pickem}::vote`,
    arguments: [
      tx.object(args.matchId),
      tx.pure.u8(args.choice),
      tx.object(args.passportId),
      tx.object(CLOCK_ID),
    ],
  });
  return tx;
}

export interface ClaimXpArgs {
  matchId: string;
  passportId: string;
}

export function buildClaimXp(args: ClaimXpArgs): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE.pickem}::claim_xp`,
    arguments: [
      tx.object(args.matchId),
      tx.object(args.passportId),
    ],
  });
  return tx;
}
