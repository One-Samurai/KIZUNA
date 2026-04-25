import type { SuiObjectResponse } from '@mysten/sui/jsonRpc';
import { type Passport, type Match, Tier, Choice } from './types';

type Fields = Record<string, any>;

function getFields(obj: SuiObjectResponse): Fields | null {
  const content = obj.data?.content;
  if (!content || content.dataType !== 'moveObject') return null;
  return (content as any).fields as Fields;
}

/** Parse a Sui object response into a typed Passport. */
export function parsePassport(obj: SuiObjectResponse): Passport | null {
  const f = getFields(obj);
  if (!f) return null;
  return {
    id: f.id.id as string,
    displayName: f.display_name as string,
    honorXp: BigInt(f.honor_xp),
    correctPredictions: BigInt(f.correct_predictions),
    totalPredictions: BigInt(f.total_predictions),
    currentStreak: BigInt(f.current_streak),
    bestStreak: BigInt(f.best_streak),
    tier: f.tier as Tier,
    mintedAtMs: BigInt(f.minted_at_ms),
  };
}

/** Parse a Match shared object. Tables are opaque; query via has_voted / has_claimed. */
export function parseMatch(obj: SuiObjectResponse): Match | null {
  const f = getFields(obj);
  if (!f) return null;
  // winner: Option<u8>. JSON-RPC may return one of:
  //   { vec: [] } | { vec: [n] }                 (MoveStruct Option wrapper)
  //   [] | [n]                                   (bare array)
  //   null | undefined                           (None, newer format)
  //   0 | 1 (number) | "0" | "1" (string)        (Some, newer format unwrapped)
  const w = f.winner;
  let winner: Choice | null = null;
  if (w == null) {
    winner = null;
  } else if (typeof w === 'number' || typeof w === 'string') {
    winner = Number(w) as Choice;
  } else if (Array.isArray(w)) {
    winner = w.length > 0 ? (Number(w[0]) as Choice) : null;
  } else if (typeof w === 'object' && 'vec' in w) {
    const vec = (w as any).vec as any[];
    winner = vec.length > 0 ? (Number(vec[0]) as Choice) : null;
  }
  return {
    id: f.id.id as string,
    fighterA: f.fighter_a as string,
    fighterB: f.fighter_b as string,
    lockedAtMs: BigInt(f.locked_at_ms),
    winner,
    baseXp: BigInt(f.base_xp),
  };
}
