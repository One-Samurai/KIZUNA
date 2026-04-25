'use client';

import { useMyPassport } from '@/lib/hooks';
import { useMyTimeline } from '@/lib/stats';
import { TIER_NAMES, TIER_THRESHOLDS, Tier } from '@kizuna/contracts';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo } from 'react';

function nextThreshold(tier: Tier): bigint | null {
  if (tier >= Tier.Legend) return null;
  const next = (tier + 1) as Tier;
  return TIER_THRESHOLDS[next as keyof typeof TIER_THRESHOLDS] ?? null;
}

export default function PassportPage() {
  const { data: passport, isLoading } = useMyPassport();
  const { data: timeline } = useMyTimeline();
  const account = useCurrentAccount();

  const myItems = useMemo(() => {
    if (!timeline || !account) return [];
    return timeline.filter((t) => t.addr === account.address).slice(0, 8);
  }, [timeline, account]);

  if (isLoading) return <p className="text-muted">Loading pass…</p>;

  if (!passport) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Honor Ledger</p>
        </div>
        <h1 className="h-display text-6xl">No pass minted.</h1>
        <p className="max-w-xl text-muted">
          Request a soulbound pass from an operator, or visit{' '}
          <a href="/admin" className="text-kin underline-offset-4 hover:underline">/admin</a> if
          you hold the MintCap yourself.
        </p>
      </section>
    );
  }

  const next = nextThreshold(passport.tier);
  const progress = next ? Number((passport.honorXp * 100n) / next) : 100;
  const accuracy = passport.totalPredictions > 0n
    ? Number((passport.correctPredictions * 100n) / passport.totalPredictions)
    : 0;

  return (
    <section className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Honor Ledger</p>
        </div>
        <h1 className="h-display text-6xl sm:text-7xl">Your pass.</h1>
        <p className="max-w-xl text-muted">
          A non-transferable on-chain credential. Soulbound to your wallet, updated by every prediction you settle.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* PARCHMENT IDENTITY CARD (inverted) */}
        <div>
          <p className="eyebrow-muted mb-3">▸ Pass face</p>
          <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-parchment p-6 text-sumi shadow-cardLg ring-1 ring-kin/40">
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, #c9a961 0, transparent 40%), radial-gradient(circle at 80% 90%, #e63946 0, transparent 35%)',
            }} />
            <div className="absolute inset-x-6 top-[42%] divider-kin" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-kin">KIZUNA · ONE SAMURAI</p>
                  <p className="mt-3 font-display text-3xl leading-[0.95]" style={{ fontWeight: 900 }}>
                    {TIER_NAMES[passport.tier].toUpperCase()}
                  </p>
                  <p className="font-display text-base text-sumi/70">FAN PASS</p>
                </div>
                <img src="/logo.svg" alt="KIZUNA Logo" className="h-12 w-12 rounded-sm shadow-sm" />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="pill border border-sage/60 bg-sage/10 text-sage">● Active</span>
                <span className="pill border border-kin/60 bg-kin/10 text-kin">On-chain</span>
                <span className="pill border border-sumi/20 text-sumi/60">Soulbound</span>
              </div>

              <div className="mt-12">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-sumi/50">Holder</p>
                <p className="mt-1 font-display text-2xl" style={{ fontWeight: 800 }}>
                  {passport.displayName.toUpperCase()}
                </p>
                <p className="mt-1 font-mono text-[10px] text-sumi/50">SERIAL · #{passport.id.slice(2, 8).toUpperCase()}</p>
              </div>

              <div className="mt-5 rounded-sm border border-sumi/15 bg-paper/[0.04] p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-kin">Form</p>
                <p className="mt-1 text-sm">
                  Streak {passport.currentStreak.toString()} · best {passport.bestStreak.toString()}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-sumi/60">
                  {passport.honorXp.toString()} HONOR XP
                </p>
              </div>

              <div className="mt-auto grid grid-cols-2 border-t border-sumi/15 pt-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-sumi/50">Picks</p>
                  <p className="mt-1 font-display text-2xl" style={{ fontWeight: 800 }}>{passport.totalPredictions.toString()}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-sumi/50">Hit %</p>
                  <p className="mt-1 font-display text-2xl" style={{ fontWeight: 800 }}>{accuracy}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Rank ladder */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">▸ Rank ladder</p>
              <span className="pill-kin">{TIER_NAMES[passport.tier]}</span>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {([0, 1, 2, 3, 4] as Tier[]).map((t) => {
                const reached = passport.tier >= t;
                const isCurrent = passport.tier === t;
                return (
                  <div
                    key={t}
                    className={`rounded-sm border px-2 py-3 text-center transition ${
                      isCurrent
                        ? 'border-kin bg-kin/15 text-kin'
                        : reached
                        ? 'border-line bg-paper2 text-ink'
                        : 'border-line bg-paper/40 text-muted'
                    }`}
                  >
                    <p className="font-display text-base leading-none" style={{ fontWeight: 800 }}>
                      {TIER_NAMES[t]}
                    </p>
                    <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] opacity-80">
                      {(TIER_THRESHOLDS as any)[t]?.toString() ?? '0'} XP
                    </p>
                  </div>
                );
              })}
            </div>
            {next && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  <span>Ascent → {TIER_NAMES[(passport.tier + 1) as Tier]}</span>
                  <span>{passport.honorXp.toString()} / {next.toString()}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-paper2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-kin via-kin to-vermillion"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Honor XP" value={passport.honorXp.toString()} accent />
            <Stat label="Streak" value={passport.currentStreak.toString()} sub={`best ${passport.bestStreak}`} />
            <Stat label="Hit Rate" value={`${accuracy}%`} />
            <Stat label="Record" value={`${passport.correctPredictions}/${passport.totalPredictions}`} />
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">▸ Activity log</p>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {myItems.length} entries
              </span>
            </div>
            <h3 className="h-display mt-2 text-2xl">Recent on-chain moves</h3>
            <ul className="mt-5 divide-y divide-line">
              {myItems.length === 0 && (
                <li className="py-6 text-sm text-muted">No moves yet — go cast picks.</li>
              )}
              {myItems.map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-kin" />
                    <div>
                      <p className="font-display text-sm tracking-wide text-ink" style={{ fontWeight: 800 }}>
                        {it.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{it.sub}</p>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                    {it.ts ? new Date(it.ts).toLocaleString(undefined, { month: '2-digit', day: '2-digit' }) : '—'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? 'ring-1 ring-kin/30' : ''}`}>
      <p className="eyebrow-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl ${accent ? 'text-kin' : 'text-ink'}`}>{value}</p>
      {sub && <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">{sub}</p>}
    </div>
  );
}
