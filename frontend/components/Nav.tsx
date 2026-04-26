'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

// Boot window: account appearances within this many ms of mount are treated
// as autoConnect session restore, not a fresh login.
const BOOT_WINDOW_MS = 2000;

function usePostLoginRedirect() {
  const account = useCurrentAccount();
  const router = useRouter();
  const prev = useRef<string | undefined>(undefined);
  const bootedAt = useRef<number>(0);

  useEffect(() => {
    bootedAt.current = Date.now();
  }, []);

  useEffect(() => {
    const addr = account?.address;
    const wasEmpty = !prev.current;
    prev.current = addr;

    if (!addr || !wasEmpty) return;
    if (Date.now() - bootedAt.current < BOOT_WINDOW_MS) return;

    router.replace('/passport');
  }, [account, router]);
}

const NAV = [
  { href: '/passport', label: 'Pass' },
  { href: '/pickem', label: 'Picks' },
  { href: '/leaderboard', label: 'Ranks' },
  { href: '/admin', label: 'Ops' },
];

function CopyAddressButton() {
  const acct = useCurrentAccount();
  const [copied, setCopied] = useState(false);
  if (!acct) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(acct.address); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = acct.address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={copy}
      title={`Copy ${acct.address}`}
      aria-label="Copy wallet address"
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-paper2 text-muted hover:border-sui hover:text-sui"
    >
      {copied ? (
        <span className="text-[11px] text-sui">✓</span>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export function Nav() {
  const path = usePathname();
  usePostLoginRedirect();
  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="KIZUNA Logo" className="h-9 w-9 rounded-sm shadow-sm" />
          <div>
            <p className="font-display text-base leading-none text-ink" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>KIZUNA</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted">Fan Passport</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-sm px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition ${
                  active ? 'border border-sui/60 bg-sui/10 text-sui' : 'text-muted hover:text-ink'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <CopyAddressButton />
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
