'use client';

import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parsePassport, parseMatch, STRUCT, EVENT } from '@kizuna/contracts';
import type { Passport, Match } from '@kizuna/contracts';

export function useMyPassport() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  return useQuery({
    queryKey: ['myPassport', account?.address],
    enabled: !!account,
    queryFn: async (): Promise<Passport | null> => {
      const res = await client.getOwnedObjects({
        owner: account!.address,
        filter: { StructType: STRUCT.Passport },
        options: { showContent: true },
      });
      const first = res.data[0];
      return first ? parsePassport(first) : null;
    },
  });
}

export function useAdminCap() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  return useQuery({
    queryKey: ['adminCap', account?.address],
    enabled: !!account,
    queryFn: async (): Promise<string | null> => {
      const res = await client.getOwnedObjects({
        owner: account!.address,
        filter: { StructType: STRUCT.AdminCap },
        options: { showContent: false },
      });
      return res.data[0]?.data?.objectId ?? null;
    },
  });
}

export function useMintCap() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  return useQuery({
    queryKey: ['mintCap', account?.address],
    enabled: !!account,
    queryFn: async (): Promise<string | null> => {
      const res = await client.getOwnedObjects({
        owner: account!.address,
        filter: { StructType: STRUCT.MintCap },
        options: { showContent: false },
      });
      return res.data[0]?.data?.objectId ?? null;
    },
  });
}

/**
 * List all Match objects by scanning MatchCreated events then multiGetObjects.
 * For a demo this is fine; production would use an indexer.
 */
export function useMatches() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  return useQuery({
    queryKey: ['matches', account?.address],
    queryFn: async (): Promise<Match[]> => {
      const events = await client.queryEvents({
        query: { MoveEventType: EVENT.MatchCreated },
        limit: 50,
        order: 'descending',
      });
      const ids = events.data.map((e) => (e.parsedJson as any).match_id as string);
      if (ids.length === 0) return [];
      const objs = await client.multiGetObjects({
        ids,
        options: { showContent: true },
      });
      return objs.map((o) => parseMatch(o)).filter((m): m is Match => m !== null);
    },
    refetchInterval: 10_000,
  });
}

export function useHasVoted(matchId: string | undefined) {
  const client = useSuiClient();
  const account = useCurrentAccount();
  return useQuery({
    queryKey: ['hasVoted', matchId, account?.address],
    enabled: !!matchId && !!account,
    queryFn: async (): Promise<boolean> => {
      // Use dynamic field lookup on the votes Table.
      // Match.votes: Table<address, u8>. DF key type is `address`.
      try {
        const obj = await client.getObject({ id: matchId!, options: { showContent: true } });
        const f = (obj.data?.content as any)?.fields;
        const votesTableId = f?.votes?.fields?.id?.id;
        if (!votesTableId) return false;
        const df = await client.getDynamicFieldObject({
          parentId: votesTableId,
          name: { type: 'address', value: account!.address },
        });
        return !df.error && !!df.data;
      } catch {
        return false;
      }
    },
  });
}

export function useHasClaimed(matchId: string | undefined) {
  const client = useSuiClient();
  const account = useCurrentAccount();
  return useQuery({
    queryKey: ['hasClaimed', matchId, account?.address],
    enabled: !!matchId && !!account,
    queryFn: async (): Promise<boolean> => {
      try {
        const obj = await client.getObject({ id: matchId!, options: { showContent: true } });
        const f = (obj.data?.content as any)?.fields;
        const claimedTableId = f?.claimed?.fields?.id?.id;
        if (!claimedTableId) return false;
        const df = await client.getDynamicFieldObject({
          parentId: claimedTableId,
          name: { type: 'address', value: account!.address },
        });
        return !df.error && !!df.data;
      } catch {
        return false;
      }
    },
  });
}
