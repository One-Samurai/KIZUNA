'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { EVENT, Tier, TIER_NAMES, TIER_THRESHOLDS } from '@kizuna/contracts';
import type {
  PassportMintedEvent,
  VoteCastEvent,
  XpClaimedEvent,
  TierUpEvent,
  MatchSettledEvent,
  MatchCreatedEvent,
} from '@kizuna/contracts';
import { REWARDS } from '@/data/rewards';

async function queryAll<T>(
  client: ReturnType<typeof useSuiClient>,
  type: string,
): Promise<{ json: T; sender: string; timestampMs: string | null }[]> {
  const out: { json: T; sender: string; timestampMs: string | null }[] = [];
  let cursor: any = null;
  for (let i = 0; i < 20; i++) {
    const res = await client.queryEvents({
      query: { MoveEventType: type },
      cursor,
      limit: 50,
      order: 'descending',
    });
    for (const e of res.data) {
      out.push({
        json: e.parsedJson as T,
        sender: e.sender,
        timestampMs: e.timestampMs ?? null,
      });
    }
    if (!res.hasNextPage || !res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return out;
}

export type FunnelApi = {
  applied: number;
  pending: number;
  minted: number;
  rejected: number;
  lastApplyTs: number | null;
};

export type TierKey = 0 | 1 | 2 | 3 | 4;

export type RankSegment = {
  tier: TierKey;
  name: string;
  fans: number;
  totalXp: bigint;
  votes: number;
  correct: number;
  hitRate: number; // 0..100
  votesPerFan: number;
};

export type Insights = {
  funnel: {
    applied: number;
    minted: number;
    firstVote: number;     // distinct voters
    firstClaim: number;    // distinct settlers
    tieredUp: number;      // passports past Rookie
    rejected: number;
    pending: number;
    lastApplyTs: number | null;
  };
  segments: RankSegment[];
  engagement: {
    days: { date: string; votes: number; claims: number }[]; // last 14d
    dau14: number;       // distinct voters last 14d
    matchesOpen: number;
    matchesSettled: number;
  };
  economy: {
    totalXpIssued: bigint;
    avgXpPerFan: number;
    totalPassports: number;
    redeemableByReward: { id: string; name: string; tier: TierKey; eligibleFans: number }[];
    xpHeldByTier: Record<TierKey, bigint>;
  };
};

function tierForXp(xp: bigint): TierKey {
  if (xp >= TIER_THRESHOLDS[Tier.Legend]) return 4;
  if (xp >= TIER_THRESHOLDS[Tier.Shogun]) return 3;
  if (xp >= TIER_THRESHOLDS[Tier.Ronin]) return 2;
  if (xp >= TIER_THRESHOLDS[Tier.Samurai]) return 1;
  return 0;
}

const DAY_MS = 86_400_000;

function ymd(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

export function useInsights() {
  const client = useSuiClient();
  return useQuery<Insights>({
    queryKey: ['insights'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [minted, votes, claims, tierUps, matchesCreated, matchesSettled, funnelRes] =
        await Promise.all([
          queryAll<PassportMintedEvent>(client, EVENT.PassportMinted),
          queryAll<VoteCastEvent>(client, EVENT.VoteCast),
          queryAll<XpClaimedEvent>(client, EVENT.XpClaimed),
          queryAll<TierUpEvent>(client, EVENT.TierUp),
          queryAll<MatchCreatedEvent>(client, EVENT.MatchCreated),
          queryAll<MatchSettledEvent>(client, EVENT.MatchSettled),
          fetch('/api/insights/funnel').then((r) =>
            r.ok ? (r.json() as Promise<FunnelApi>) : null,
          ).catch(() => null),
        ]);

      // Per-fan aggregations keyed by passport-holder address.
      // We use the union of addresses seen in PassportMinted (recipient) so
      // unminted senders (e.g. relayer) aren't counted as fans.
      const fans = new Set<string>();
      for (const m of minted) fans.add(m.json.recipient);

      const xpByAddr = new Map<string, bigint>();
      const correctByAddr = new Map<string, number>();
      const totalByAddr = new Map<string, number>();
      const voteCountByAddr = new Map<string, number>();

      for (const c of claims) {
        const a = c.json.voter;
        xpByAddr.set(a, (xpByAddr.get(a) ?? 0n) + BigInt(c.json.xp_awarded || '0'));
        totalByAddr.set(a, (totalByAddr.get(a) ?? 0) + 1);
        if (c.json.correct) correctByAddr.set(a, (correctByAddr.get(a) ?? 0) + 1);
      }
      for (const v of votes) {
        const a = v.json.voter;
        voteCountByAddr.set(a, (voteCountByAddr.get(a) ?? 0) + 1);
      }

      const distinctVoters = new Set(votes.map((v) => v.json.voter)).size;
      const distinctClaimers = new Set(claims.map((c) => c.json.voter)).size;

      // Tier per fan from latest TierUp; fans without TierUp = Rookie
      const latestTierByPassport = new Map<string, number>();
      for (const t of tierUps) {
        const pid = t.json.passport_id;
        const cur = latestTierByPassport.get(pid) ?? 0;
        if (t.json.new_tier > cur) latestTierByPassport.set(pid, t.json.new_tier);
      }
      const tierByAddr = new Map<string, TierKey>();
      for (const m of minted) {
        const t = latestTierByPassport.get(m.json.passport_id) ?? 0;
        tierByAddr.set(m.json.recipient, t as TierKey);
      }

      // Build per-tier segments
      const empty = (): RankSegment => ({
        tier: 0, name: '', fans: 0, totalXp: 0n, votes: 0, correct: 0, hitRate: 0, votesPerFan: 0,
      });
      const segByTier: Record<TierKey, RankSegment> = {
        0: { ...empty(), tier: 0, name: TIER_NAMES[0] },
        1: { ...empty(), tier: 1, name: TIER_NAMES[1] },
        2: { ...empty(), tier: 2, name: TIER_NAMES[2] },
        3: { ...empty(), tier: 3, name: TIER_NAMES[3] },
        4: { ...empty(), tier: 4, name: TIER_NAMES[4] },
      };
      const xpHeldByTier: Record<TierKey, bigint> = { 0: 0n, 1: 0n, 2: 0n, 3: 0n, 4: 0n };

      for (const addr of fans) {
        const t = (tierByAddr.get(addr) ?? 0) as TierKey;
        const seg = segByTier[t];
        seg.fans++;
        const xp = xpByAddr.get(addr) ?? 0n;
        seg.totalXp += xp;
        seg.votes += voteCountByAddr.get(addr) ?? 0;
        seg.correct += correctByAddr.get(addr) ?? 0;
        xpHeldByTier[t] += xp;
      }
      const segments: RankSegment[] = (Object.values(segByTier) as RankSegment[]).map((s) => {
        const totalClaims = (() => {
          let n = 0;
          for (const addr of fans) {
            if ((tierByAddr.get(addr) ?? 0) !== s.tier) continue;
            n += totalByAddr.get(addr) ?? 0;
          }
          return n;
        })();
        return {
          ...s,
          hitRate: totalClaims > 0 ? Math.round((s.correct * 100) / totalClaims) : 0,
          votesPerFan: s.fans > 0 ? Math.round((s.votes * 10) / s.fans) / 10 : 0,
        };
      });

      // 14-day engagement
      const now = Date.now();
      const dayBuckets = new Map<string, { votes: number; claims: number }>();
      for (let i = 13; i >= 0; i--) {
        dayBuckets.set(ymd(now - i * DAY_MS), { votes: 0, claims: 0 });
      }
      const cutoff = now - 14 * DAY_MS;
      const dau = new Set<string>();
      for (const v of votes) {
        const ts = Number(v.timestampMs ?? 0);
        if (ts < cutoff) continue;
        dau.add(v.json.voter);
        const k = ymd(ts);
        const b = dayBuckets.get(k);
        if (b) b.votes++;
      }
      for (const c of claims) {
        const ts = Number(c.timestampMs ?? 0);
        if (ts < cutoff) continue;
        const k = ymd(ts);
        const b = dayBuckets.get(k);
        if (b) b.claims++;
      }
      const days = Array.from(dayBuckets.entries()).map(([date, v]) => ({ date, ...v }));

      // Economy: redemption capacity per reward
      const totalXpIssued = claims.reduce(
        (acc, c) => acc + BigInt(c.json.xp_awarded || '0'),
        0n,
      );
      const totalPassports = minted.length;
      const avgXpPerFan = totalPassports > 0
        ? Number(totalXpIssued / BigInt(totalPassports))
        : 0;

      const redeemableByReward = REWARDS.map((r) => {
        let n = 0;
        for (const addr of fans) {
          const xp = xpByAddr.get(addr) ?? 0n;
          const t = tierForXp(xp);
          if (t >= r.tierRequired && xp >= r.xpCost) n++;
        }
        return { id: r.id, name: r.name, tier: r.tierRequired as TierKey, eligibleFans: n };
      });

      // Funnel
      const settledMatchIds = new Set(matchesSettled.map((m) => m.json.match_id));
      const matchesOpen = matchesCreated.filter((m) => !settledMatchIds.has(m.json.match_id)).length;

      const tieredUp = new Set(tierUps.map((t) => t.json.passport_id)).size;

      const funnel = {
        applied: funnelRes?.applied ?? totalPassports,
        minted: totalPassports,
        firstVote: distinctVoters,
        firstClaim: distinctClaimers,
        tieredUp,
        rejected: funnelRes?.rejected ?? 0,
        pending: funnelRes?.pending ?? 0,
        lastApplyTs: funnelRes?.lastApplyTs ?? null,
      };

      return {
        funnel,
        segments,
        engagement: {
          days,
          dau14: dau.size,
          matchesOpen,
          matchesSettled: matchesSettled.length,
        },
        economy: {
          totalXpIssued,
          avgXpPerFan,
          totalPassports,
          redeemableByReward,
          xpHeldByTier,
        },
      };
    },
  });
}
