'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useInsights, type Insights, type RankSegment, type TierKey } from '@/lib/insights';

const TIER_ACCENT: Record<TierKey, string> = {
  0: 'text-muted',
  1: 'text-sui',
  2: 'text-kin',
  3: 'text-kin',
  4: 'text-vermillion',
};

export default function InsightsPage() {
  const account = useCurrentAccount();
  const { data, isLoading, isError } = useInsights();

  if (!account) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Restricted</p>
        </div>
        <h1 className="h-display text-5xl">Connect a wallet.</h1>
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-sui/60" />
          <p className="eyebrow">CRM Console</p>
        </div>
        <h1 className="h-display text-6xl">Insights.</h1>
        <p className="max-w-2xl text-muted">
          On-chain truth, aggregated. Funnel, rank cohorts, engagement and reward economy —
          read directly from passport, vote, claim and tier-up events.
        </p>
      </header>

      {isLoading && <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">▸ Crunching events…</p>}
      {isError && <p className="text-sm text-vermillion">Failed to load insights.</p>}

      {data && (
        <>
          <FunnelSection data={data} />
          <SegmentsSection data={data} />
          <EngagementSection data={data} />
          <EconomySection data={data} />
        </>
      )}
    </section>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <header className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="h-display text-2xl">▸ {title}</h2>
        {hint && <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{hint}</span>}
      </header>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-sm border border-line bg-paper2 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 font-mono text-[10px] text-muted">{sub}</p>}
    </div>
  );
}

function FunnelSection({ data }: { data: Insights }) {
  const f = data.funnel;
  const stages: { label: string; value: number; tone: string }[] = [
    { label: 'Applied', value: f.applied, tone: 'bg-muted/40' },
    { label: 'Minted', value: f.minted, tone: 'bg-sui/60' },
    { label: 'First pick', value: f.firstVote, tone: 'bg-sui/80' },
    { label: 'First claim', value: f.firstClaim, tone: 'bg-kin/70' },
    { label: 'Tiered up', value: f.tieredUp, tone: 'bg-vermillion/70' },
  ];
  const top = Math.max(1, ...stages.map((s) => s.value));

  return (
    <Card title="Acquisition funnel" hint={`${f.pending} pending · ${f.rejected} rejected`}>
      <div className="space-y-3">
        {stages.map((s, i) => {
          const pct = Math.min(100, Math.round((s.value * 100) / top));
          const prev = i === 0 ? 0 : stages[i - 1].value;
          const conv = i === 0
            ? null
            : prev > 0
              ? Math.min(999, Math.round((s.value * 100) / prev))
              : null;
          return (
            <div key={s.label} className="space-y-1">
              <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-muted">
                  {s.label}
                  {conv !== null && (
                    <span className="ml-2 text-ink/70">→ {conv > 100 ? '—' : `${conv}%`}</span>
                  )}
                </span>
                <span className="text-ink">{s.value}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-paper2">
                <div className={`h-2 rounded-full ${s.tone}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SegmentsSection({ data }: { data: Insights }) {
  const totalFans = data.segments.reduce((acc, s) => acc + s.fans, 0);
  return (
    <Card title="Rank segments" hint={`${totalFans} fans`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-line">
              {['Tier', 'Fans', 'Share', 'XP held', 'Votes', 'Hit rate', 'Votes/fan'].map((h) => (
                <th key={h} className="py-2 pr-4 text-[10px] uppercase tracking-[0.22em] text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.segments.map((s) => (
              <SegRow key={s.tier} s={s} totalFans={totalFans} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SegRow({ s, totalFans }: { s: RankSegment; totalFans: number }) {
  const share = totalFans > 0 ? Math.round((s.fans * 100) / totalFans) : 0;
  return (
    <tr className="border-b border-line/40">
      <td className={`py-3 pr-4 font-display text-base ${TIER_ACCENT[s.tier]}`} style={{ fontWeight: 800 }}>
        {s.name}
      </td>
      <td className="py-3 pr-4 text-ink">{s.fans}</td>
      <td className="py-3 pr-4 text-muted">
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 rounded-full bg-paper2">
            <div className="h-1 rounded-full bg-sui/60" style={{ width: `${share}%` }} />
          </div>
          <span>{share}%</span>
        </div>
      </td>
      <td className="py-3 pr-4 text-ink">{s.totalXp.toString()}</td>
      <td className="py-3 pr-4 text-ink">{s.votes}</td>
      <td className="py-3 pr-4 text-ink">{s.hitRate}%</td>
      <td className="py-3 pr-4 text-ink">{s.votesPerFan}</td>
    </tr>
  );
}

function EngagementSection({ data }: { data: Insights }) {
  const days = data.engagement.days;
  const max = Math.max(1, ...days.map((d) => Math.max(d.votes, d.claims)));
  return (
    <Card title="Engagement · 14d" hint={`${data.engagement.dau14} active fans`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex h-32 items-stretch gap-1 border-b border-line/40">
            {days.map((d) => {
              const vh = (d.votes * 100) / max;
              const ch = (d.claims * 100) / max;
              const empty = d.votes === 0 && d.claims === 0;
              return (
                <div
                  key={d.date}
                  className="relative flex h-full flex-1 flex-col-reverse gap-0.5 rounded-sm bg-paper2/50"
                  title={`${d.date} · ${d.votes} votes / ${d.claims} claims`}
                >
                  {empty ? (
                    <div className="absolute inset-x-0 bottom-0 h-px bg-line/60" />
                  ) : (
                    <>
                      <div className="w-full rounded-sm bg-sui/70" style={{ height: `${vh}%` }} />
                      <div className="w-full rounded-sm bg-kin/70" style={{ height: `${ch}%` }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-sui/70" />Votes</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-kin/70" />Claims</span>
            <span className="ml-auto">{days[0]?.date} → {days[days.length - 1]?.date}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <Stat label="DAU · 14d" value={String(data.engagement.dau14)} />
          <Stat label="Bouts open" value={String(data.engagement.matchesOpen)} />
          <Stat label="Bouts settled" value={String(data.engagement.matchesSettled)} />
        </div>
      </div>
    </Card>
  );
}

function EconomySection({ data }: { data: Insights }) {
  const e = data.economy;
  const top = e.redeemableByReward.slice().sort((a, b) => b.eligibleFans - a.eligibleFans).slice(0, 6);
  return (
    <Card title="Reward economy" hint={`${e.totalPassports} passports`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total XP issued" value={e.totalXpIssued.toString()} />
        <Stat label="Avg XP / fan" value={String(e.avgXpPerFan)} />
        <Stat label="Top-tier holders" value={String(data.segments[3].fans + data.segments[4].fans)} sub="Shogun + Legend" />
        <Stat label="Whales' XP" value={(e.xpHeldByTier[3] + e.xpHeldByTier[4]).toString()} sub="held by S+L" />
      </div>

      <div className="mt-6">
        <p className="eyebrow-muted mb-3">Redemption capacity</p>
        <ul className="space-y-2">
          {top.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-sm border border-line bg-paper2 px-3 py-2 font-mono text-[12px]">
              <span className="truncate text-ink">{r.name}</span>
              <span className="shrink-0 text-muted">
                <span className={`mr-3 text-[10px] uppercase tracking-[0.22em] ${TIER_ACCENT[r.tier]}`}>
                  {['Rookie', 'Samurai', 'Ronin', 'Shogun', 'Legend'][r.tier]}
                </span>
                <span className="text-ink">{r.eligibleFans}</span> eligible
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
