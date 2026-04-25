'use client';

import { SuiClientProvider, WalletProvider, createNetworkConfig, useSuiClient } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { registerEnokiWallets, isEnokiNetwork } from '@mysten/enoki';
import { ReactNode, useEffect, useState } from 'react';
import '@mysten/dapp-kit/dist/index.css';

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' },
});

function RegisterEnoki() {
  const client = useSuiClient();
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const network = 'testnet';
    if (!apiKey || !googleClientId) {
      console.warn('[enoki] NEXT_PUBLIC_ENOKI_API_KEY or NEXT_PUBLIC_GOOGLE_CLIENT_ID missing — zkLogin disabled');
      return;
    }
    if (!isEnokiNetwork(network)) return;
    const { unregister } = registerEnokiWallets({
      apiKey,
      providers: {
        google: {
          clientId: googleClientId,
          redirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      },
      client: client as any,
      network,
    });
    return unregister;
  }, [client]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <RegisterEnoki />
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
