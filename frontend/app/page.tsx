'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMatches } from '@/lib/hooks';
import { useGlobalStats } from '@/lib/stats';
import type { Match } from '@kizuna/contracts';

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1000) % 60),
    locked: diff === 0,
  };
}

export default function Home() {
  const { data: matches } = useMatches();
  const { data: stats } = useGlobalStats();

  const upcoming = matches?.filter((m) => m.winner === null && Date.now() < Number(m.lockedAtMs)) ?? [];
  const featured = upcoming[0];

  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
        <div className="min-w-0 space-y-7">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-kin/60" />
            <p className="eyebrow">絆 · Honor Ledger · ONE Samurai</p>
          </div>
          <h1 className="h-display text-[48px] leading-[0.94] sm:text-[60px] xl:text-[72px]">
            Soulbound<br />
            <span className="text-kin">proof of fandom.</span>
          </h1>
          <p className="max-w-xl text-base text-muted">
            KIZUNA mints a non-transferable on-chain pass for ONE Samurai supporters.
            Predict every fight, bank honor XP, ascend five ranks — Rookie, Samurai, Ronin, Shogun, Legend.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/pickem" className="btn-primary">▸ Cast picks</Link>
            <Link href="/passport" className="btn-ghost">View pass</Link>
          </div>
        </div>

        {featured ? (
          <FeaturedMatch match={featured} />
        ) : (
          <div className="card flex h-[340px] flex-col items-center justify-center text-center">
            <p className="eyebrow">Main event</p>
            <p className="mt-4 font-display text-3xl text-ink">No fight scheduled</p>
            <p className="mt-2 text-sm text-muted">Operators publish the next card soon.</p>
          </div>
        )}
      </section>

      {/* STATS STRIP */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-kin/60" />
            <p className="eyebrow">Live on-chain telemetry</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">∇ refresh 30s</span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <BigStat label="Holders" value={stats?.passports ?? '—'} accent />
          <BigStat label="Votes Cast" value={stats?.votes ?? '—'} />
          <BigStat label="XP Minted" value={stats ? Number(stats.xpDistributed).toLocaleString() : '—'} />
          <BigStat label="Bouts Settled" value={stats?.matchesSettled ?? '—'} />
        </div>
      </section>

      {/* FIGHT CARD */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-kin/60" />
              <p className="eyebrow">Fight Card</p>
            </div>
            <h2 className="h-display mt-3 text-4xl">Open bouts</h2>
          </div>
          <Link href="/pickem" className="font-mono text-[11px] uppercase tracking-[0.22em] text-sui hover:text-ink">
            All picks →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">No open bouts. Operators must publish the next match.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 6).map((m) => <MatchCardMini key={m.id} match={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`card-flat p-5 ${accent ? 'ring-1 ring-kin/30' : ''}`}>
      <p className="eyebrow-muted">{label}</p>
      <p className={`mt-3 font-display text-4xl leading-none ${accent ? 'text-kin' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

function FeaturedMatch({ match }: { match: Match }) {
  const c = useCountdown(Number(match.lockedAtMs));
  return (
    <div className="card relative overflow-hidden p-7" style={{ boxShadow: '0 0 0 1px rgba(201,169,97,0.25), 0 24px 64px rgba(0,0,0,0.45)' }}>
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-kin/10 blur-2xl" />
      <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-vermillion/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="eyebrow">▸ Main event</p>
          <span className="pill-red">● Live soon</span>
        </div>
        <div className="relative mt-5">
          <h3 className="h-display text-2xl leading-[1.05] break-words text-left">
            {match.fighterA}
          </h3>
          <span className="my-1.5 block font-mono text-xs uppercase tracking-[0.35em] text-vermillion/80 text-center">
            — vs —
          </span>
          <h3 className="h-display text-2xl leading-[1.05] break-words text-right">
            {match.fighterB}
          </h3>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2">
          <Tick label="Days" v={c.d} />
          <Tick label="Hrs" v={c.h} />
          <Tick label="Min" v={c.m} />
          <Tick label="Sec" v={c.s} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Bounty · +{match.baseXp.toString()} XP
          </span>
          <Link href="/pickem" className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion hover:text-ink">
            Pick winner →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Tick({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-sm border border-line bg-paper/60 py-3 text-center">
      <p className="font-display text-3xl leading-none tabular-nums text-ink">{String(v).padStart(2, '0')}</p>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-muted">{label}</p>
    </div>
  );
}

function MatchCardMini({ match }: { match: Match }) {
  const lockMs = Number(match.lockedAtMs);
  const locked = Date.now() >= lockMs;
  return (
    <Link
      href="/pickem"
      className="card group relative block p-5 transition hover:border-sui/40 hover:shadow-cardLg"
    >
      <div className="flex items-center justify-between">
        <span className={locked ? 'pill-red' : 'pill-kin'}>
          {locked ? '● Locked' : '● Open'}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
          +{match.baseXp.toString()} XP
        </span>
      </div>
      <h3 className="h-display mt-5 text-2xl leading-[1.05]">
        {match.fighterA}<br />
        <span className="text-muted">vs</span> {match.fighterB}
      </h3>
      <p className="mt-4 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
        Locks {new Date(lockMs).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </Link>
  );
}
