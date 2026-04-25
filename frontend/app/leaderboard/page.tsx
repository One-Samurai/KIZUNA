'use client';

import { useGlobalStats, useLeaderboard } from '@/lib/stats';
import { TIER_NAMES, Tier } from '@kizuna/contracts';

export default function LeaderboardPage() {
  const { data: stats } = useGlobalStats();
  const { data: lb } = useLeaderboard();

  return (
    <section className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Honor Roll</p>
        </div>
        <h1 className="h-display text-6xl sm:text-7xl">Ranks.</h1>
        <p className="max-w-xl text-muted">
          Live aggregation of every settled prediction on Sui testnet. No indexer — pure event reads.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Holders" value={lb?.totalPassports ?? '—'} accent />
        <Stat label="XP Minted" value={stats ? Number(stats.xpDistributed).toLocaleString() : '—'} />
        <Stat label="Avg Hit %" value={stats ? `${stats.accuracy}%` : '—'} />
        <Stat label="Claims" value={stats?.claims ?? '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Top XP */}
        <div className="card p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">▸ Top ranked</p>
              <h2 className="h-display mt-2 text-3xl">XP rank</h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Top 10</span>
          </div>

          <div className="mt-5 divide-y divide-line">
            <div className="grid grid-cols-[40px_1fr_70px_80px] gap-3 pb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              <span>#</span>
              <span>Holder</span>
              <span className="text-right">Hit</span>
              <span className="text-right">XP</span>
            </div>
            {(lb?.top ?? []).length === 0 && (
              <p className="py-6 text-sm text-muted">No claims recorded yet.</p>
            )}
            {(lb?.top ?? []).map((row, i) => {
              const acc = row.total > 0 ? Math.round((row.correct * 100) / row.total) : 0;
              const top3 = i < 3;
              return (
                <div key={row.address} className="grid grid-cols-[40px_1fr_70px_80px] items-center gap-3 py-3">
                  <span className={`font-display text-2xl ${top3 ? 'text-kin' : 'text-muted'}`} style={{ fontWeight: 800 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base leading-tight text-ink" style={{ fontWeight: 800 }}>
                      {row.name ?? 'Anonymous'}
                    </p>
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                      {row.address.slice(0, 10)}…{row.address.slice(-4)}
                    </p>
                  </div>
                  <span className="text-right font-mono text-xs text-muted">{acc}%</span>
                  <span className="text-right font-display text-xl text-ink" style={{ fontWeight: 800 }}>
                    {row.xp.toString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier distribution */}
        <div className="card p-6">
          <p className="eyebrow">▸ Tier mix</p>
          <h2 className="h-display mt-2 text-3xl">Distribution</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Total holders · {lb?.totalPassports ?? 0}
          </p>

          <div className="mt-6 space-y-4">
            {([4, 3, 2, 1, 0] as Tier[]).map((t) => {
              const count = lb?.tierDist[t] ?? 0;
              const total = lb?.totalPassports ?? 0;
              const pct = total > 0 ? Math.round((count * 100) / total) : 0;
              return (
                <div key={t}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="font-display text-base text-ink" style={{ fontWeight: 800 }}>
                      {TIER_NAMES[t]}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper2">
                    <div
                      className={`h-full rounded-full ${
                        t === 4 ? 'bg-vermillion' :
                        t === 3 ? 'bg-kin' :
                        t === 2 ? 'bg-kin/70' :
                        t === 1 ? 'bg-ai/70' : 'bg-muted/50'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`card-flat p-5 ${accent ? 'ring-1 ring-kin/30' : ''}`}>
      <p className="eyebrow-muted">{label}</p>
      <p className={`mt-3 font-display text-3xl leading-none ${accent ? 'text-kin' : 'text-ink'}`}>{value}</p>
    </div>
  );
}
