export enum Tier {
  Rookie = 0,
  Samurai = 1,
  Ronin = 2,
  Shogun = 3,
  Legend = 4,
}

export const TIER_NAMES: Record<Tier, string> = {
  [Tier.Rookie]: 'Rookie',
  [Tier.Samurai]: 'Samurai',
  [Tier.Ronin]: 'Ronin',
  [Tier.Shogun]: 'Shogun',
  [Tier.Legend]: 'Legend',
};

export const TIER_THRESHOLDS = {
  [Tier.Samurai]: 50n,
  [Tier.Ronin]: 200n,
  [Tier.Shogun]: 600n,
  [Tier.Legend]: 1500n,
} as const;

export enum Choice {
  FighterA = 0,
  FighterB = 1,
}

// On-chain struct mirrors (post-parse; u64 → bigint).
export interface Passport {
  id: string;
  displayName: string;
  honorXp: bigint;
  correctPredictions: bigint;
  totalPredictions: bigint;
  currentStreak: bigint;
  bestStreak: bigint;
  tier: Tier;
  mintedAtMs: bigint;
}

export interface Match {
  id: string;
  fighterA: string;
  fighterB: string;
  lockedAtMs: bigint;
  winner: Choice | null;
  baseXp: bigint;
  // votes / claimed live in Tables — query via has_voted / has_claimed devInspect.
}

// === Events ===

export interface PassportMintedEvent {
  passport_id: string;
  recipient: string;
  display_name: string;
  minted_at_ms: string; // JSON RPC returns u64 as string
}

export interface TierUpEvent {
  passport_id: string;
  old_tier: number;
  new_tier: number;
  honor_xp: string;
}

export interface MatchCreatedEvent {
  match_id: string;
  fighter_a: string;
  fighter_b: string;
  locked_at_ms: string;
  base_xp: string;
}

export interface VoteCastEvent {
  match_id: string;
  voter: string;
  choice: number;
}

export interface MatchSettledEvent {
  match_id: string;
  winner: number;
}

export interface XpClaimedEvent {
  match_id: string;
  voter: string;
  correct: boolean;
  xp_awarded: string;
}
