'use client';

import { useMyPassport } from '@/lib/hooks';
import { useMyTimeline } from '@/lib/stats';
import { TIER_NAMES, TIER_THRESHOLDS, Tier } from '@kizuna/contracts';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useMemo, useState } from 'react';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.address) { setAvatarUrl(null); return; }
    let cancelled = false;
    fetch(`/api/apply?address=${account.address}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setAvatarUrl(j.application?.avatarDataUrl ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [account?.address]);

  const myItems = useMemo(() => {
    if (!timeline || !account) return [];
    return timeline.filter((t) => t.addr === account.address).slice(0, 8);
  }, [timeline, account]);

  if (isLoading) return <p className="text-muted">Loading pass…</p>;

  if (!passport) {
    return <ApplyPanel address={account?.address} />;
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
                    src={avatarUrl ?? '/avatar-sample.png'}
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
                <li key={i}>
                  <a
                    href={it.txDigest ? `https://suiscan.xyz/testnet/tx/${it.txDigest}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start justify-between gap-6 py-4 transition hover:bg-paper/40 -mx-2 px-2 rounded-sm"
                    title={it.txDigest ? `View tx ${it.txDigest.slice(0, 12)}… on Suiscan` : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sui" />
                      <div>
                        <p className="font-display text-sm tracking-wide text-ink group-hover:text-sui" style={{ fontWeight: 800 }}>
                          {it.title} <span className="font-mono text-[10px] tracking-[0.22em] text-muted opacity-0 group-hover:opacity-100">↗</span>
                        </p>
                        <p className="mt-0.5 text-sm text-muted">{it.sub}</p>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                      {it.ts ? new Date(it.ts).toLocaleString(undefined, { month: '2-digit', day: '2-digit' }) : '—'}
                    </p>
                  </a>
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

type ApplicationStatus = {
  address: string;
  email: string;
  displayName: string;
  ticketId: string;
  seat: string;
  status: 'pending' | 'minted' | 'rejected';
  ts: number;
  avatarDataUrl?: string;
};

const MAX_AVATAR_BYTES = 600 * 1024;

function ApplyPanel({ address }: { address?: string }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [existing, setExisting] = useState<ApplicationStatus | null>(null);
  const [checked, setChecked] = useState(false);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) { setAvatarDataUrl(null); return; }
    if (!file.type.startsWith('image/')) {
      setErr('Avatar must be an image file');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setErr(`Image too large (${(file.size / 1024).toFixed(0)} KB) — max 600 KB`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarDataUrl(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => setErr('Failed to read image');
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!address) { setChecked(true); return; }
    let cancelled = false;
    fetch(`/api/apply?address=${address}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setExisting(j.application ?? null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [address]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setErr(null); setSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, email, displayName: name, avatarDataUrl: avatarDataUrl ?? undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? 'Submission failed');
      setExisting(j.application);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (!address) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Honor Ledger</p>
        </div>
        <h1 className="h-display text-6xl">Connect to apply.</h1>
        <p className="max-w-xl text-muted">
          Sign in with Google or connect a wallet to apply for your soulbound passport.
        </p>
      </section>
    );
  }

  if (existing && existing.status !== 'rejected') {
    const isPending = existing.status === 'pending';
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Honor Ledger</p>
        </div>
        <h1 className="h-display text-6xl">
          {isPending ? 'Application received.' : 'Pass minting…'}
        </h1>
        <div className="card max-w-xl space-y-3 p-6">
          <Row label="Display name" value={existing.displayName} />
          <Row label="Email" value={existing.email} />
          <Row label="Ticket" value={`${existing.ticketId} · seat ${existing.seat}`} />
          <Row label="Status" value={existing.status.toUpperCase()} />
        </div>
        <p className="max-w-xl text-sm text-muted">
          {isPending
            ? 'Operator will mint your soulbound pass shortly. Refresh this page after a minute.'
            : 'If your pass does not appear after 30 seconds, refresh — RPC index can lag.'}
        </p>
      </section>
    );
  }

  if (!checked) return <p className="text-muted">Checking application…</p>;

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Honor Ledger</p>
        </div>
        <h1 className="h-display text-5xl sm:text-6xl">Apply for your pass.</h1>
        <p className="max-w-xl text-muted">
          KIZUNA pairs your Google sign-in with the team&rsquo;s ticketing record.{' '}
          <span className="text-ink/80">One ticket → one soulbound passport.</span> KYC stays
          off-chain, your wallet stays private.
        </p>
      </header>

      {existing?.status === 'rejected' && (
        <div className="max-w-xl rounded-sm border border-vermillion/40 bg-vermillion/10 p-4 text-sm text-ink">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">
            ▸ Previous application rejected
          </p>
          <p className="mt-1 text-muted">
            Submit a new application below — make sure the email matches a valid ticket.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="card max-w-xl space-y-4 p-6">
        <label className="block">
          <span className="eyebrow-muted mb-1.5 block">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your legal name (must match ticket KYC)"
            className="input"
            maxLength={32}
            required
          />
        </label>
        <label className="block">
          <span className="eyebrow-muted mb-1.5 block">Ticket email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="the email you used to buy the ticket"
            type="email"
            className="input"
            required
          />
        </label>
        <label className="block">
          <span className="eyebrow-muted mb-1.5 block">Passport photo</span>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-paper2">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">No photo</span>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line file:bg-paper2 file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.2em] file:text-ink hover:file:border-sui/40"
              />
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                Optional · PNG/JPG/WEBP · max 600 KB · used on pass back
              </p>
            </div>
          </div>
        </label>
        <div className="rounded-sm border border-line bg-paper2 p-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Wallet · {address.slice(0, 8)}…{address.slice(-6)}
        </div>
        {err && <p className="text-sm text-vermillion">{err}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Submitting…' : '▸ Apply for passport'}
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          Demo tickets · YourName@gmail.com · OneSamurai@gmail.com
        </p>
      </form>
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
