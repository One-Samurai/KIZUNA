'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isEnokiWallet } from '@mysten/enoki';
import { useWallets, useConnectWallet, useCurrentAccount } from '@mysten/dapp-kit';

export default function AuthCallback() {
  const router = useRouter();
  const wallets = useWallets();
  const account = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const [msg, setMsg] = useState('Completing Google sign-in…');

  // If autoConnect already restored the session, jump straight in.
  useEffect(() => {
    if (account) {
      setMsg('Signed in. Redirecting…');
      router.replace('/passport');
    }
  }, [account, router]);

  useEffect(() => {
    if (account) return;
    const enokiWallet = wallets.find((w) => isEnokiWallet(w));
    if (!enokiWallet) return;
    connect(
      { wallet: enokiWallet },
      {
        onSuccess: () => {
          setMsg('Signed in. Redirecting…');
          router.replace('/passport');
        },
        onError: (e) => setMsg(`Sign-in failed: ${e.message}`),
      },
    );
  }, [wallets, connect, router, account]);

  // Hard fallback — if neither path fires, force redirect after 3s.
  useEffect(() => {
    const t = setTimeout(() => router.replace('/passport'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <p className="text-white/80">{msg}</p>
    </main>
  );
}
