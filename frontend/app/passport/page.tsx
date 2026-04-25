'use client';

import { useMyPassport } from '@/lib/hooks';
import { useMyTimeline } from '@/lib/stats';
import { TIER_NAMES, TIER_THRESHOLDS, Tier } from '@kizuna/contracts';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo, useState } from 'react';

function nextThreshold(tier: Tier): bigint | null {
  if (tier >= Tier.Legend) return null;
  const next = (tier + 1) as Tier;
  return TIER_THRESHOLDS[next as keyof typeof TIER_THRESHOLDS] ?? null;
}

export default function PassportPage() {
  const { data: passport, isLoading } = useMyPassport();
  const { data: timeline } = useMyTimeline();
  const account = useCurrentAccount();

  const [previewTier, setPreviewTier] = useState<Tier | null>(null);
  const [flipped, setFlipped] = useState(false);

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
          <a href="/admin" className="text-sui underline-offset-4 hover:underline">/admin</a> if
          you hold the MintCap yourself.
        </p>
      </section>
    );
  }

  const displayTier = (previewTier ?? passport.tier) as Tier;
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

      <div className="grid gap-8 lg:grid-cols-5">
        {/* PARCHMENT IDENTITY CARD — flips on click */}
        <div className="lg:col-span-2">
          <div
            className="flip-wrap cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            aria-label={`Flip passport card, currently showing ${flipped ? 'back' : 'front'}`}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
          >
            <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
              {/* FRONT — parchment + tier portrait */}
              <div className="flip-face relative overflow-hidden rounded-card bg-parchment text-sumi shadow-cardLg ring-1 ring-kin/40">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={`/portraits/p${displayTier}.svg`}
                    alt={`${TIER_NAMES[displayTier]} portrait`}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink/80">KIZUNA · ONE SAMURAI</p>
                    <img src="/logo.svg" alt="" className="h-9 w-9 rounded-sm shadow" />
                  </div>
                  <span className="absolute right-3 bottom-3 pill border border-ink/30 bg-paper/40 text-ink/90 backdrop-blur-sm">
                    ● Active
                  </span>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-3xl leading-none" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                      {TIER_NAMES[displayTier].toUpperCase()}
                    </p>
                    <p className="font-display text-sm text-sumi/60">FAN PASS</p>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between border-t border-sumi/15 pt-3">
                    <p className="font-display text-lg" style={{ fontWeight: 800 }}>
                      {passport.displayName.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px] text-sumi/55">#{passport.id.slice(2, 8).toUpperCase()}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-sumi/55">
                    <span>{passport.honorXp.toString()} Honor XP · Soulbound</span>
                    <span className="text-sumi/40">Tap to flip ↻</span>
                  </div>
                </div>
              </div>

              {/* BACK — personal avatar + on-chain identity */}
              <div className="flip-face flip-back overflow-hidden rounded-card bg-sumi text-ink shadow-cardLg ring-1 ring-sui/30">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src="/avatar-sample.png"
                    alt="Holder avatar"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sumi via-sumi/30 to-transparent" />
                  <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-sui">HOLDER AVATAR</p>
                    <span className="pill border border-sui/60 bg-sui/15 text-sui backdrop-blur-sm">On-chain</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-display text-3xl leading-none" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                      {passport.displayName.toUpperCase()}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                      {TIER_NAMES[displayTier]} · {passport.honorXp.toString()} HONOR XP
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em]">
                  <Row label="Serial" value={`#${passport.id.slice(2, 12).toUpperCase()}`} />
                  <Row label="Owner" value={`${account?.address.slice(0, 6)}…${account?.address.slice(-4)}`} />
                  <Row label="Type" value="Soulbound · Non-transferable" />
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-muted">Tap to flip back</span>
                    <span className="text-sui">↻</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo switcher — compact single row */}
          <div className="mt-3 flex items-center gap-2">
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">Preview</span>
            <div className="flex flex-1 gap-1">
              {([0, 1, 2, 3, 4] as Tier[]).map((t) => {
                const active = displayTier === t;
                return (
                  <button
                    key={t}
                    onClick={() => setPreviewTier(t)}
                    className={`flex-1 rounded-sm border px-1 py-1 font-mono text-[9px] uppercase tracking-[0.16em] transition ${
                      active
                        ? 'border-sui bg-sui/15 text-sui'
                        : 'border-line bg-paper2 text-muted hover:border-sui/40 hover:text-ink'
                    }`}
                  >
                    {TIER_NAMES[t]}
                  </button>
                );
              })}
            </div>
            {previewTier !== null && (
              <button
                onClick={() => setPreviewTier(null)}
                className="shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-sui hover:text-ink"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 lg:col-span-3">
          {/* Rank ladder */}
          <div className="card p-6">
            <p className="eyebrow">▸ Rank ladder</p>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {([0, 1, 2, 3, 4] as Tier[]).map((t) => {
                const reached = passport.tier >= t;
                const isCurrent = passport.tier === t;
                return (
                  <div
                    key={t}
                    className={`rounded-sm border px-2 py-3 text-center transition ${
                      isCurrent
                        ? 'border-sui bg-sui/15 text-sui'
                        : reached
                        ? 'border-line bg-paper2 text-ink/80'
                        : 'border-line bg-paper/40 text-ink/30'
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
                    className="h-full rounded-full bg-gradient-to-r from-sui to-kin"
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
            <div className="flex items-baseline justify-between">
              <h3 className="h-display text-2xl">Recent on-chain moves</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {myItems.length} entries
              </span>
            </div>
            <ul className="mt-5 divide-y divide-line">
              {myItems.length === 0 && (
                <li className="py-6 text-sm text-muted">No moves yet — go cast picks.</li>
              )}
              {myItems.map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sui" />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="truncate text-ink">{value}</span>
    </div>
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
