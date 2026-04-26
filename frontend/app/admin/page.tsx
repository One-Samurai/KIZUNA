'use client';

import { useEffect, useState } from 'react';
import { useMatches, useAdminCap, useMintCap } from '@/lib/hooks';
import {
  buildCreateMatch,
  buildSettleMatch,
  buildMintPassport,
  parseMoveAbort,
} from '@kizuna/contracts';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';

export default function AdminPage() {
  const { data: adminCap } = useAdminCap();
  const { data: mintCap } = useMintCap();
  const account = useCurrentAccount();

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
          <span className="h-px w-10 bg-kin/60" />
          <p className="eyebrow">Operator Console</p>
        </div>
        <h1 className="h-display text-6xl">Ops.</h1>
        <p className="max-w-xl text-muted">
          Mint passes, publish bouts, declare winners. Sections enable based on the caps in your wallet.
        </p>
      </header>

      <Section
        title="Pending applications"
        enabled={!!mintCap}
        hint={mintCap ? 'KYC verified by ticket email match' : 'MintCap required'}
      >
        <PendingApplications mintCapId={mintCap ?? undefined} />
      </Section>

      <Section title="Mint pass (manual)" enabled={!!mintCap} hint={mintCap ? `MintCap · ${mintCap.slice(0, 12)}…` : 'No MintCap in this wallet'}>
        <MintPassportForm mintCapId={mintCap ?? undefined} />
      </Section>

      <Section title="Publish bout" enabled={!!adminCap} hint={adminCap ? `AdminCap · ${adminCap.slice(0, 12)}…` : 'No AdminCap in this wallet'}>
        <CreateMatchForm adminCapId={adminCap ?? undefined} />
      </Section>

      <Section title="Declare winner" enabled={!!adminCap} hint="">
        <SettleForm adminCapId={adminCap ?? undefined} />
      </Section>
    </section>
  );
}

function Section({
  title, enabled, hint, children,
}: { title: string; enabled: boolean; hint: string; children: React.ReactNode }) {
  return (
    <div className={`card p-6 ${enabled ? '' : 'opacity-60'}`}>
      <header className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="h-display text-2xl">▸ {title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{hint}</span>
      </header>
      {children}
    </div>
  );
}

function useSubmit() {
  const { mutate, isPending } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = (tx: any) => {
    setErr(null); setOk(null);
    mutate({ transaction: tx }, {
      onSuccess: async ({ digest }) => {
        await client.waitForTransaction({ digest });
        setOk(digest);
      },
      onError: (e) => setErr(parseMoveAbort(e as Error)),
    });
  };
  return { submit, isPending, err, ok };
}

function MintPassportForm({ mintCapId }: { mintCapId?: string }) {
  const [name, setName] = useState('');
  const [recipient, setRecipient] = useState('');
  const { submit, isPending, err, ok } = useSubmit();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(buildMintPassport({ displayName: name, recipient, mintCapId }));
      }}
    >
      <Input label="Holder name" value={name} onChange={setName} />
      <Input label="Recipient address" value={recipient} onChange={setRecipient} placeholder="0x…" />
      <Submit disabled={!mintCapId || isPending} label={isPending ? 'Signing…' : '▸ Mint pass'} />
      <Feedback err={err} ok={ok} />
    </form>
  );
}

function CreateMatchForm({ adminCapId }: { adminCapId?: string }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [lockMinutes, setLockMinutes] = useState(60);
  const [baseXp, setBaseXp] = useState(100);
  const { submit, isPending, err, ok } = useSubmit();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const lockedAtMs = BigInt(Date.now() + lockMinutes * 60_000);
        submit(buildCreateMatch({
          fighterA: a, fighterB: b, lockedAtMs, baseXp: BigInt(baseXp), adminCapId,
        }));
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="Fighter A" value={a} onChange={setA} />
        <Input label="Fighter B" value={b} onChange={setB} />
        <Input label="Lock in (minutes)" value={String(lockMinutes)} onChange={(v) => setLockMinutes(Number(v) || 0)} />
        <Input label="Base XP bounty" value={String(baseXp)} onChange={(v) => setBaseXp(Number(v) || 0)} />
      </div>
      <Submit disabled={!adminCapId || isPending} label={isPending ? 'Signing…' : '▸ Publish bout'} />
      <Feedback err={err} ok={ok} />
    </form>
  );
}

function SettleForm({ adminCapId }: { adminCapId?: string }) {
  const { data: matches } = useMatches();
  const [matchId, setMatchId] = useState('');
  const [winner, setWinner] = useState<0 | 1>(0);
  const { submit, isPending, err, ok } = useSubmit();
  const pending = matches?.filter((m) => m.winner === null) ?? [];
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(buildSettleMatch({ matchId, winner, adminCapId }));
      }}
    >
      <label className="block">
        <span className="eyebrow-muted mb-1.5 block">Bout</span>
        <select
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          className="input"
        >
          <option value="">— select —</option>
          {pending.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fighterA} vs {m.fighterB} ({m.id.slice(0, 10)}…)
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="eyebrow-muted mb-1.5 block">Winner</span>
        <select
          value={winner}
          onChange={(e) => setWinner(Number(e.target.value) as 0 | 1)}
          className="input"
        >
          <option value={0}>0 · Fighter A</option>
          <option value={1}>1 · Fighter B</option>
        </select>
      </label>
      <Submit disabled={!adminCapId || !matchId || isPending} label={isPending ? 'Signing…' : '▸ Declare'} />
      <Feedback err={err} ok={ok} />
    </form>
  );
}

function Input({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="eyebrow-muted mb-1.5 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}

function Submit({ disabled, label }: { disabled: boolean; label: string }) {
  return (
    <button type="submit" disabled={disabled} className="btn-primary">
      {label}
    </button>
  );
}

type PendingApp = {
  address: string;
  email: string;
  displayName: string;
  ticketId: string;
  seat: string;
  eventId: string;
  ts: number;
  status: 'pending' | 'minted' | 'rejected';
};

function PendingApplications({ mintCapId }: { mintCapId?: string }) {
  const [apps, setApps] = useState<PendingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // address currently being processed
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const { mutate, isPending } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/pending');
      const j = await r.json();
      setApps(j.applications ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function markStatus(address: string, status: 'minted' | 'rejected', txDigest?: string) {
    await fetch('/api/pending', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, status, txDigest }),
    });
  }

  function approve(app: PendingApp) {
    if (!mintCapId) return;
    setErr(null); setOk(null); setBusy(app.address);
    const tx = buildMintPassport({ displayName: app.displayName, recipient: app.address, mintCapId });
    mutate(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          await client.waitForTransaction({ digest });
          await markStatus(app.address, 'minted', digest);
          setOk(`Minted to ${app.displayName} · ${digest.slice(0, 10)}…`);
          await refresh();
          setBusy(null);
        },
        onError: (e) => {
          setErr(parseMoveAbort(e as Error));
          setBusy(null);
        },
      },
    );
  }

  async function reject(app: PendingApp) {
    setBusy(app.address);
    await markStatus(app.address, 'rejected');
    await refresh();
    setBusy(null);
  }

  if (loading) return <p className="text-sm text-muted">Loading queue…</p>;
  if (apps.length === 0) return <p className="text-sm text-muted">No pending applications.</p>;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line">
        {apps.map((app) => {
          const isBusy = busy === app.address;
          return (
            <li key={app.address} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm" style={{ fontWeight: 800 }}>{app.displayName}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {app.email} · {app.ticketId} · seat {app.seat}
                </p>
                <p className="font-mono text-[10px] text-muted">{app.address.slice(0, 12)}…{app.address.slice(-8)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => approve(app)}
                  disabled={!mintCapId || isBusy || isPending}
                  className="btn-primary"
                >
                  {isBusy && isPending ? 'Minting…' : '▸ Approve & mint'}
                </button>
                <button
                  onClick={() => reject(app)}
                  disabled={isBusy}
                  className="rounded-sm border border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted hover:border-vermillion/60 hover:text-vermillion"
                >
                  Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <Feedback err={err} ok={ok} />
    </div>
  );
}

function Feedback({ err, ok }: { err: string | null; ok: string | null }) {
  if (err) return <p className="text-sm text-vermillion">{err}</p>;
  if (ok) return <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sui">✓ ok · {ok.slice(0, 14)}…</p>;
  return null;
}
