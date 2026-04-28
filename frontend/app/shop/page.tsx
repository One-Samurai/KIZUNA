'use client';

import { useMemo, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { TIER_NAMES, Tier } from '@kizuna/contracts';
import { useMyPassport } from '@/lib/hooks';
import { REWARDS, Reward, RewardCategory } from '@/data/rewards';

type Status = 'available' | 'locked-tier' | 'locked-xp' | 'redeemed';

const CATEGORIES: { id: RewardCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'merch', label: 'Merch' },
  { id: 'experience', label: 'Experiences' },
  { id: 'digital', label: 'Digital' },
];

export default function ShopPage() {
  const account = useCurrentAccount();
  const { data: passport, isLoading } = useMyPassport();
  const [filter, setFilter] = useState<RewardCategory | 'all'>('all');
  const [redeemed, setRedeemed] = useState<Record<string, bigint>>({});
  const [confirming, setConfirming] = useState<Reward | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tier = (passport?.tier ?? Tier.Rookie) as Tier;
  const spent = useMemo(
    () => Object.values(redeemed).reduce((acc, v) => acc + v, 0n),
    [redeemed],
  );
  const balance = passport ? passport.honorXp - spent : 0n;

  const items = useMemo(() => {
    const list = filter === 'all' ? REWARDS : REWARDS.filter((r) => r.category === filter);
    return list.slice().sort((a, b) => Number(a.xpCost - b.xpCost));
  }, [filter]);

  function statusOf(r: Reward): Status {
    if (redeemed[r.id]) return 'redeemed';
    if (!passport) return 'locked-tier';
    if (tier < r.tierRequired) return 'locked-tier';
    if (balance < r.xpCost) return 'locked-xp';
    return 'available';
  }

  function confirmRedeem(r: Reward) {
    setRedeemed((m) => ({ ...m, [r.id]: r.xpCost }));
    setConfirming(null);
    setToast(`Reserved ${r.name}. Mock receipt #${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    setTimeout(() => setToast(null), 3500);
  }

  if (!account) {
    return (
      <section className="space-y-6">
        <Header />
        <div className="card p-10 text-muted">Connect a wallet to browse the shop.</div>
      </section>
    );
  }

  if (isLoading) return <p className="text-muted">Loading shop…</p>;

  return (
    <section className="space-y-10">
      <Header />

      {/* Wallet ribbon */}
      <div className="card flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="eyebrow-muted">Tier</p>
            <p className="font-display text-2xl text-ink">
              {passport ? TIER_NAMES[tier] : '—'}
            </p>
          </div>
          <div className="h-10 w-px bg-line" />
          <div>
            <p className="eyebrow-muted">Spendable XP</p>
            <p className="font-display text-2xl text-sui">{balance.toString()}</p>
          </div>
          {spent > 0n && (
            <>
              <div className="h-10 w-px bg-line" />
              <div>
                <p className="eyebrow-muted">Reserved</p>
                <p className="font-display text-2xl text-vermillion">−{spent.toString()}</p>
              </div>
            </>
          )}
        </div>
        <span className="pill-ghost">Mock — no on-chain redeem yet</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`rounded-sm px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition ${
                active
                  ? 'border border-sui/60 bg-sui/10 text-sui'
                  : 'border border-line text-muted hover:text-ink'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <RewardCard
            key={r.id}
            reward={r}
            status={statusOf(r)}
            onRedeem={() => setConfirming(r)}
          />
        ))}
      </div>

      {/* Confirm modal */}
      {confirming && (
        <ConfirmModal
          reward={confirming}
          balanceAfter={balance - confirming.xpCost}
          onCancel={() => setConfirming(null)}
          onConfirm={() => confirmRedeem(confirming)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-sm border border-sui/60 bg-paper2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-sui shadow-card">
          {toast}
        </div>
      )}
    </section>
  );
}

function Header() {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-kin/60" />
        <p className="eyebrow">Holder Shop</p>
      </div>
      <h1 className="h-display text-6xl sm:text-7xl">Spend your honor.</h1>
      <p className="max-w-xl text-muted">
        Tier-gated drops, signed memorabilia, and meet-the-roster experiences. Pay in earned XP.
      </p>
    </header>
  );
}

function RewardCard({
  reward,
  status,
  onRedeem,
}: {
  reward: Reward;
  status: Status;
  onRedeem: () => void;
}) {
  const locked = status === 'locked-tier' || status === 'locked-xp';
  const tierLabel = TIER_NAMES[reward.tierRequired];

  return (
    <div
      className={`card group relative flex flex-col overflow-hidden transition ${
        locked ? 'opacity-70 grayscale' : 'hover:border-sui/60'
      }`}
    >
      {/* Image block */}
      <div className="relative aspect-[5/3] overflow-hidden border-b border-line bg-paper2">
        <span className="absolute inset-0 flex items-center justify-center font-display text-7xl text-ink/40">
          {reward.emblem}
        </span>
        <img
          src={reward.image}
          alt={reward.name}
          loading="lazy"
          className="relative z-[1] h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-paper/80 via-paper/0 to-paper/30" />
        <span className="absolute left-3 top-3 z-[3] pill-ghost backdrop-blur">{reward.category}</span>
        <span
          className={`absolute right-3 top-3 z-[3] backdrop-blur ${
            reward.tierRequired >= Tier.Shogun ? 'pill-red' : 'pill-kin'
          }`}
        >
          {tierLabel}+
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight text-ink">{reward.name}</h3>
          <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-sui">
            {reward.xpCost.toString()} XP
          </p>
        </div>
        <p className="text-sm text-muted">{reward.blurb}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {reward.stock === 'unlimited' ? 'Open stock' : `${reward.stock} left`}
          </span>
          {status === 'redeemed' ? (
            <span className="pill-sage">Reserved</span>
          ) : status === 'locked-tier' ? (
            <span className="pill-ghost">Reach {tierLabel}</span>
          ) : status === 'locked-xp' ? (
            <span className="pill-ghost">Need more XP</span>
          ) : (
            <button onClick={onRedeem} className="btn-primary !px-4 !py-2">
              Redeem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  reward,
  balanceAfter,
  onCancel,
  onConfirm,
}: {
  reward: Reward;
  balanceAfter: bigint;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">Confirm redemption</p>
        <h2 className="mt-2 font-display text-2xl text-ink">{reward.name}</h2>
        <p className="mt-2 text-sm text-muted">{reward.blurb}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-sm border border-line bg-paper2 p-4">
          <Stat label="Cost" value={`${reward.xpCost} XP`} tone="vermillion" />
          <Stat label="Balance after" value={`${balanceAfter} XP`} tone="sui" />
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          Mock flow — XP is reserved client-side until on-chain redeem ships.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-ghost !px-4 !py-2">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary !px-4 !py-2">
            Spend XP
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'sui' | 'vermillion';
}) {
  return (
    <div>
      <p className="eyebrow-muted">{label}</p>
      <p
        className={`font-display text-xl ${
          tone === 'sui' ? 'text-sui' : 'text-vermillion'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
