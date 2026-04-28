'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { EVENT } from '@kizuna/contracts';
import type {
  PassportMintedEvent,
  VoteCastEvent,
  XpClaimedEvent,
  TierUpEvent,
  MatchSettledEvent,
} from '@kizuna/contracts';

async function queryAll<T>(
  client: ReturnType<typeof useSuiClient>,
  type: string,
): Promise<{ json: T; sender: string; timestampMs: string | null; txDigest: string }[]> {
  const out: { json: T; sender: string; timestampMs: string | null; txDigest: string }[] = [];
  let cursor: any = null;
  for (let i = 0; i < 10; i++) {
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
        txDigest: e.id.txDigest,
      });
    }
    if (!res.hasNextPage || !res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return out;
}

export function useGlobalStats() {
  const client = useSuiClient();
  return useQuery({
    queryKey: ['globalStats'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [minted, votes, claims, settled] = await Promise.all([
        queryAll<PassportMintedEvent>(client, EVENT.PassportMinted),
        queryAll<VoteCastEvent>(client, EVENT.VoteCast),
        queryAll<XpClaimedEvent>(client, EVENT.XpClaimed),
        queryAll<MatchSettledEvent>(client, EVENT.MatchSettled),
      ]);
      const totalXp = claims.reduce((acc, c) => acc + BigInt(c.json.xp_awarded || '0'), 0n);
      const correctClaims = claims.filter((c) => c.json.correct).length;
      return {
        passports: minted.length,
        votes: votes.length,
        xpDistributed: totalXp,
        matchesSettled: settled.length,
        claims: claims.length,
        correctClaims,
        accuracy: claims.length > 0 ? Math.round((correctClaims * 100) / claims.length) : 0,
      };
    },
  });
}

export function useLeaderboard() {
  const client = useSuiClient();
  return useQuery({
    queryKey: ['leaderboard'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [claims, tierUps, minted] = await Promise.all([
        queryAll<XpClaimedEvent>(client, EVENT.XpClaimed),
        queryAll<TierUpEvent>(client, EVENT.TierUp),
        queryAll<PassportMintedEvent>(client, EVENT.PassportMinted),
      ]);
      const xpByAddr = new Map<string, bigint>();
      const correctByAddr = new Map<string, number>();
      const totalByAddr = new Map<string, number>();
      for (const c of claims) {
        const a = c.json.voter;
        xpByAddr.set(a, (xpByAddr.get(a) ?? 0n) + BigInt(c.json.xp_awarded || '0'));
        totalByAddr.set(a, (totalByAddr.get(a) ?? 0) + 1);
        if (c.json.correct) correctByAddr.set(a, (correctByAddr.get(a) ?? 0) + 1);
      }
      const tierByAddr = new Map<string, number>();
      for (const t of tierUps) {
        const cur = tierByAddr.get((t as any).sender ?? '') ?? 0;
        if (t.json.new_tier > cur) tierByAddr.set((t as any).sender ?? '', t.json.new_tier);
      }
      const nameByAddr = new Map<string, string>();
      for (const m of minted) nameByAddr.set(m.json.recipient, m.json.display_name);

      const tierDist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const m of minted) tierDist[0]++;
      for (const t of tierUps) {
        // a TierUp moves passport to new tier; we approximate by counting last tierUp per passport
      }
      // approximate distribution from latest TierUp per passport_id
      const latestTierByPassport = new Map<string, number>();
      for (const t of tierUps) {
        const pid = t.json.passport_id;
        const cur = latestTierByPassport.get(pid) ?? 0;
        if (t.json.new_tier > cur) latestTierByPassport.set(pid, t.json.new_tier);
      }
      const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      const totalPassports = minted.length;
      let upgradedCount = 0;
      for (const tier of latestTierByPassport.values()) {
        dist[tier] = (dist[tier] ?? 0) + 1;
        upgradedCount++;
      }
      dist[0] = Math.max(0, totalPassports - upgradedCount);

      const top = Array.from(xpByAddr.entries())
        .map(([address, xp]) => ({
          address,
          xp,
          name: nameByAddr.get(address) ?? null,
          correct: correctByAddr.get(address) ?? 0,
          total: totalByAddr.get(address) ?? 0,
        }))
        .sort((a, b) => (b.xp > a.xp ? 1 : b.xp < a.xp ? -1 : 0))
        .slice(0, 10);

      return { top, tierDist: dist, totalPassports };
    },
  });
}

export function useMyTimeline() {
  const client = useSuiClient();
  return useQuery({
    queryKey: ['myTimeline'],
    enabled: true,
    refetchInterval: 30_000,
    queryFn: async () => {
      // Query several event types and tag them
      const [minted, votes, claims, tierUps] = await Promise.all([
        queryAll<PassportMintedEvent>(client, EVENT.PassportMinted),
        queryAll<VoteCastEvent>(client, EVENT.VoteCast),
        queryAll<XpClaimedEvent>(client, EVENT.XpClaimed),
        queryAll<TierUpEvent>(client, EVENT.TierUp),
      ]);
      type Item = {
        kind: 'mint' | 'vote' | 'claim' | 'tierup';
        ts: number;
        title: string;
        sub: string;
        addr: string;
        txDigest: string;
      };
      const items: Item[] = [];
      for (const m of minted) {
        items.push({
          kind: 'mint',
          ts: Number(m.json.minted_at_ms),
          title: 'PASSPORT MINTED',
          sub: `${m.json.display_name} · joined archive`,
          addr: m.json.recipient,
          txDigest: m.txDigest,
        });
      }
      for (const v of votes) {
        items.push({
          kind: 'vote',
          ts: Number(v.timestampMs ?? 0),
          title: 'VOTE CAST',
          sub: `Choice ${v.json.choice === 0 ? 'A' : 'B'} · ${v.json.match_id.slice(0, 10)}…`,
          addr: v.json.voter,
          txDigest: v.txDigest,
        });
      }
      for (const c of claims) {
        items.push({
          kind: 'claim',
          ts: Number(c.timestampMs ?? 0),
          title: c.json.correct ? 'XP CLAIMED — CORRECT' : 'XP CLAIMED — MISSED',
          sub: `+${c.json.xp_awarded} honor XP`,
          addr: c.json.voter,
          txDigest: c.txDigest,
        });
      }
      for (const t of tierUps) {
        items.push({
          kind: 'tierup',
          ts: Number(t.timestampMs ?? 0),
          title: 'TIER UP',
          sub: `Reached tier ${t.json.new_tier}`,
          addr: '',
          txDigest: t.txDigest,
        });
      }
      items.sort((a, b) => b.ts - a.ts);
      return items;
    },
  });
}
