import type { Metadata } from 'next';
import { Unbounded, Manrope, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import { Nav } from '@/components/Nav';
import './globals.css';

const display = Unbounded({ weight: ['700', '900'], subsets: ['latin'], variable: '--font-display' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'KIZUNA — Fan Passport',
  description: 'Soulbound on-chain proof of fandom for ONE Samurai.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
          <footer className="mx-auto max-w-6xl border-t border-line px-6 py-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            絆 KIZUNA · Fan Passport · Sui Testnet
          </footer>
        </Providers>
      </body>
    </html>
  );
}
