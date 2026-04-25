'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMatches, useMyPassport, useHasVoted, useHasClaimed } from '@/lib/hooks';
import { buildVote, buildClaimXp, parseMoveAbort, Choice } from '@kizuna/contracts';
import type { Match } from '@kizuna/contracts';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';

type Bucket = 'open' | 'locked' | 'settled';

function bucketOf(m: Match): Bucket {
  if (m.winner !== null) return 'settled';
  if (Date.now() >= Number(m.lockedAtMs)) return 'locked';
  return 'open';
}

export default function PickemPage() {
  const { data: matches, isLoading, refetch } = useMatches();
  const { data: passport } = useMyPassport();
  const [filter, setFilter] = useState<'all' | Bucket>('all');

  const grouped = useMemo(() => {
    const m = matches ?? [];
    return {
      open: m.filter((x) => bucketOf(x) === 'open'),
      locked: m.filter((x) => bucketOf(x) === 'locked'),
      settled: m.filter((x) => bucketOf(x) === 'settled'),
    };
  }, [matches]);

  const list = filter === 'all'
    ? [...grouped.open, ...grouped.locked, ...grouped.settled]
    : grouped[filter];

  return (
    <section className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Fight Card</p>
        </div>
        <h1 className="h-display text-6xl">Picks.</h1>
        <p className="max-w-xl text-muted">
          Cast a binary call before lock. Winners claim base XP — riding a streak earns bonus honor on top.
        </p>
      </header>

      {!passport && (
        <div className="card border-l-2 border-l-vermillion p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">▸ Action required</p>
          <p className="mt-1 text-sm text-ink">
            You need a pass to cast. Visit <a href="/admin" className="underline">/admin</a> to mint one (if you hold MintCap).
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <FilterTab label={`All · ${(matches?.length ?? 0)}`} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterTab label={`Open · ${grouped.open.length}`} active={filter === 'open'} onClick={() => setFilter('open')} />
        <FilterTab label={`Locked · ${grouped.locked.length}`} active={filter === 'locked'} onClick={() => setFilter('locked')} />
        <FilterTab label={`Settled · ${grouped.settled.length}`} active={filter === 'settled'} onClick={() => setFilter('settled')} />
      </div>

      {isLoading && <p className="text-muted">Loading bouts…</p>}
      {!isLoading && list.length === 0 && <p className="text-sm text-muted">No bouts in this view.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((m) => (
          <MatchCard key={m.id} match={m} passportId={passport?.id ?? null} onChange={refetch} />
        ))}
      </div>
    </section>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition ${
        active ? 'border border-sui/60 bg-sui/10 text-sui' : 'border border-line bg-paper2 text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function useTick(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, ms - now);
}

function MatchCard({
  match, passportId, onChange,
}: { match: Match; passportId: string | null; onChange: () => void }) {
  const client = useSuiClient();
  const qc = useQueryClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const { data: hasVoted } = useHasVoted(match.id);
  const { data: hasClaimed } = useHasClaimed(match.id);
  const [err, setErr] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState<Choice | null>(null);
  const [justClaimed, setJustClaimed] = useState(false);
  const claimed = hasClaimed || justClaimed;

  const lockMs = Number(match.lockedAtMs);
  const remaining = useTick(lockMs);
  const bucket = bucketOf(match);
  const settled = bucket === 'settled';
  const locked = bucket === 'locked';
  const voted = hasVoted || justVoted !== null;

  const submit = (tx: any, after?: () => void) => {
    setErr(null);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          await client.waitForTransaction({ digest });
          after?.();
          qc.invalidateQueries({ queryKey: ['hasVoted'] });
          qc.invalidateQueries({ queryKey: ['hasClaimed'] });
          qc.invalidateQueries({ queryKey: ['myPassport'] });
          qc.invalidateQueries({ queryKey: ['globalStats'] });
          onChange();
        },
        onError: (e) => setErr(parseMoveAbort(e as Error)),
      },
    );
  };

  const vote = (c: Choice) => {
    if (!passportId || voted) return;
    submit(buildVote({ matchId: match.id, choice: c as 0 | 1, passportId }), () => setJustVoted(c));
  };
  const claim = () => {
    if (!passportId || justClaimed) return;
    submit(buildClaimXp({ matchId: match.id, passportId }), () => setJustClaimed(true));
  };

  const winnerLabel = settled ? (match.winner === 0 ? match.fighterA : match.fighterB) : null;

  return (
    <article className="card flex flex-col overflow-hidden p-0">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <StatusPill bucket={bucket} />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/70">+{match.baseXp.toString()} XP</span>
      </header>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="h-display text-2xl leading-[1.05] text-ink">
          {match.fighterA}<br /><span className="text-muted">vs</span> {match.fighterB}
        </h2>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/70">
          {settled
            ? `▸ Winner · ${winnerLabel}`
            : locked
            ? '▸ Awaiting result'
            : `▸ Locks in ${formatRemaining(remaining)}`}
        </p>

        <div className="mt-5">
          {!settled && !locked && (
            <div className="grid grid-cols-2 gap-3">
              <PickButton
                disabled={!passportId || isPending || voted}
                onClick={() => vote(Choice.FighterA)}
                label={match.fighterA}
                picked={justVoted === Choice.FighterA}
              />
              <PickButton
                disabled={!passportId || isPending || voted}
                onClick={() => vote(Choice.FighterB)}
                label={match.fighterB}
                picked={justVoted === Choice.FighterB}
              />
            </div>
          )}
          {settled && (
            !voted ? (
              <div className="rounded-sm border border-line bg-paper/40 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                ▸ You did not pick this bout
              </div>
            ) : claimed ? (
              <div className="rounded-sm border border-sage/40 bg-sage/10 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-sage">
                ✓ XP claimed
              </div>
            ) : (
              <button
                disabled={!passportId || isPending}
                onClick={claim}
                className="btn-primary w-full"
              >
                {isPending ? 'Claiming…' : `▸ Claim XP · +${match.baseXp.toString()} if right`}
              </button>
            )
          )}
          {locked && !settled && (
            <div className="rounded-sm border border-line bg-paper/40 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Result pending · awaiting operator
            </div>
          )}
        </div>

        <div className="mt-3 min-h-[18px] space-y-1">
          {isPending && <p className="font-mono text-[10px] text-muted">submitting…</p>}
          {voted && !isPending && !claimed && (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sui">✓ pick recorded on-chain</p>
          )}
          {err && <p className="text-sm text-vermillion">{err}</p>}
        </div>

        <div className="mt-auto" />
      </div>

      <footer className="border-t border-line bg-paper/40 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/60">
        Bout {match.id.slice(0, 12)}…
      </footer>
    </article>
  );
}

function PickButton({
  disabled, onClick, label, picked,
}: { disabled: boolean; onClick: () => void; label: string; picked: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`group rounded-sm border px-4 py-3 text-left transition disabled:opacity-40 ${
        picked
          ? 'border-sui bg-sui/15 text-sui'
          : 'border-line bg-paper2 text-ink hover:border-sui/60 hover:bg-paper/60'
      }`}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-70">▸ Pick</p>
      <p className="mt-1 font-display text-lg leading-none" style={{ fontWeight: 800 }}>{label}</p>
    </button>
  );
}

function StatusPill({ bucket }: { bucket: Bucket }) {
  if (bucket === 'open') return <span className="pill-kin">● Open</span>;
  if (bucket === 'locked') return <span className="pill-red">● Locked</span>;
  return <span className="pill-sage">● Settled</span>;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return 'now';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms / 3_600_000) % 24);
  const m = Math.floor((ms / 60_000) % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
