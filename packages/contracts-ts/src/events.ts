import type { SuiJsonRpcClient, SuiEventFilter } from '@mysten/sui/jsonRpc';

type SuiClient = SuiJsonRpcClient;
import { EVENT } from './config';
import type {
  PassportMintedEvent,
  TierUpEvent,
  MatchCreatedEvent,
  VoteCastEvent,
  MatchSettledEvent,
  XpClaimedEvent,
} from './types';

export const eventFilters = {
  passportMinted: { MoveEventType: EVENT.PassportMinted } as SuiEventFilter,
  tierUp: { MoveEventType: EVENT.TierUp } as SuiEventFilter,
  matchCreated: { MoveEventType: EVENT.MatchCreated } as SuiEventFilter,
  voteCast: { MoveEventType: EVENT.VoteCast } as SuiEventFilter,
  matchSettled: { MoveEventType: EVENT.MatchSettled } as SuiEventFilter,
  xpClaimed: { MoveEventType: EVENT.XpClaimed } as SuiEventFilter,
};

type EventMap = {
  PassportMinted: PassportMintedEvent;
  TierUp: TierUpEvent;
  MatchCreated: MatchCreatedEvent;
  VoteCast: VoteCastEvent;
  MatchSettled: MatchSettledEvent;
  XpClaimed: XpClaimedEvent;
};

/**
 * Query recent events of a given kind. For realtime, poll this on an interval
 * (SUI WebSocket subscribeEvent is deprecated; gRPC streaming is the replacement
 * but not all testnet fullnodes expose it — poll is the pragmatic choice).
 */
export async function queryEvents<K extends keyof EventMap>(
  client: SuiClient,
  kind: K,
  opts: { cursor?: any; limit?: number; descending?: boolean } = {},
) {
  const filterKey = (kind.charAt(0).toLowerCase() + kind.slice(1)) as keyof typeof eventFilters;
  const res = await client.queryEvents({
    query: eventFilters[filterKey],
    cursor: opts.cursor ?? null,
    limit: opts.limit ?? 50,
    order: opts.descending === false ? 'ascending' : 'descending',
  });
  return {
    events: res.data.map((e) => ({
      ...e,
      parsedJson: e.parsedJson as EventMap[K],
    })),
    nextCursor: res.nextCursor,
    hasNextPage: res.hasNextPage,
  };
}
