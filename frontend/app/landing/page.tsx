'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ─────────────────────────────────────────────
   Scroll reveal — IntersectionObserver, no deps
   ───────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

/* Section wrapper — full-viewport rhythm, anchor targets */
function Section({
  id,
  eyebrow,
  children,
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`min-h-screen scroll-mt-24 py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-6">
        {eyebrow && (
          <Reveal>
            <div className="mb-10 flex items-center gap-3">
              <span className="h-px w-10 bg-kin/60" />
              <p className="eyebrow">{eyebrow}</p>
            </div>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="-mx-6 -my-10">
      {/* HERO ─────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        {/* radial accents */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-vermillion/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-sui/15 blur-3xl" />

        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-kin/60" />
              <p className="eyebrow">絆 · KIZUNA · Fan Passport 2.0</p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="h-display mt-8 max-w-[18ch] text-[40px] leading-[1.05] sm:text-[56px] lg:text-[64px] xl:text-[72px]">
              Your fandom shouldn’t live on{' '}
              <span className="text-vermillion">someone else’s server.</span>
            </h1>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-8 max-w-2xl text-lg text-muted">
              ONE Championship streams through U-NEXT in Japan — which means the league has zero direct
              access to its own fans. <span className="text-ink">KIZUNA fixes that</span> with a soulbound,
              evolving on-chain passport that turns every prediction and check-in into XP the fan owns
              forever.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/passport" className="btn-primary">▸ Claim passport</Link>
              <a href="#problem" className="btn-ghost">See how it works ↓</a>
            </div>
          </Reveal>

          <Reveal delay={600}>
            <div className="mt-20 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
              <span>● Sui Network</span>
              <span>● zkLogin</span>
              <span>● Soulbound</span>
              <span className="hidden sm:inline">● Walrus storage</span>
            </div>
          </Reveal>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          ↓ scroll
        </div>
      </section>

      {/* PROBLEM ─────────────────────────────── */}
      <Section id="problem" eyebrow="The pain — Japan market">
        <Reveal>
          <h2 className="h-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
            ONE has the fans.<br />
            <span className="text-muted">Someone else has the data.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              tag: '01 · Distribution',
              title: 'U-NEXT owns the funnel',
              body: 'Fans watch through a third-party OTT. ONE never sees email, watch-time, or wallet — engagement is invisible.',
            },
            {
              tag: '02 · Loyalty',
              title: 'No direct fan relationship',
              body: 'No CRM, no retargeting, no lifetime value. Sponsors pay for impressions ONE can\'t measure or attribute.',
            },
            {
              tag: '03 · Trust',
              title: 'Sybil noise breaks economies',
              body: 'Free passes minted by anyone = leaderboards full of bots. Day-one supporters and drive-by clickers look identical.',
            },
          ].map((p, i) => (
            <Reveal key={p.tag} delay={i * 120}>
              <div className="card-flat h-full p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">{p.tag}</p>
                <h3 className="h-display mt-4 text-2xl leading-tight">{p.title}</h3>
                <p className="mt-4 text-sm text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* SOLUTION SLOGAN ──────────────────────── */}
      <Section id="solution" eyebrow="The fix">
        <Reveal>
          <h2 className="h-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
            One passport.{' '}
            <span className="text-kin">One fan.</span>{' '}
            <span className="text-sui">Forever on-chain.</span>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-10 max-w-3xl text-lg text-muted">
            KIZUNA mints a <span className="text-ink">non-transferable</span> Dynamic NFT per verified
            fan. Every Pick&apos;em vote and venue check-in writes Honor XP straight into the
            passport — visible to ONE, portable across U-NEXT, the official app, and physical dojos.
            Platform shuts down? The asset doesn&apos;t.
          </p>
        </Reveal>
      </Section>

      {/* ARCHITECTURE ─────────────────────────── */}
      <Section id="architecture" eyebrow="System architecture">
        <Reveal>
          <h2 className="h-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
            Three layers.<br />
            <span className="text-muted">Zero crypto knowledge required.</span>
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 space-y-4">
            <ArchRow
              tag="Layer 1"
              accent="sui"
              title="Fan Touchpoints"
              subtitle="Where fans meet KIZUNA — broadcast, app, venue, social login."
              items={[
                { label: 'U-NEXT broadcast', hint: 'QR overlay' },
                { label: 'ONE official app', hint: 'deep link' },
                { label: 'Stadium QR', hint: 'on-site claim' },
                { label: 'LINE / Google', hint: 'OAuth' },
              ]}
            />
            <ArrowDown />
            <ArchRow
              tag="Layer 2"
              accent="kin"
              title="Frontend · Next.js + zkLogin"
              subtitle="App Router · React Server Components · Sui TS SDK · Tailwind."
              items={[
                { label: "Pick'em UI", hint: 'votes' },
                { label: 'Passport viewer', hint: 'dynamic NFT' },
                { label: 'Leaderboard', hint: 'on-chain query' },
                { label: 'Admin console', hint: 'MintCap' },
              ]}
            />
            <ArrowDown />
            <ArchRow
              tag="Layer 3"
              accent="red"
              title="Sui Move Smart Contracts"
              subtitle="Object-centric Move modules — soulbound, capability-gated, upgradeable."
              items={[
                { label: 'Passport SBT', hint: 'key-only NFT' },
                { label: 'MintCap', hint: 'KYC gate' },
                { label: "Pick'em settlement", hint: 'XP payout' },
                { label: 'Tier evolution', hint: 'auto-upgrade' },
              ]}
            />
            <ArrowDown />
            <ArchRow
              tag="Storage"
              accent="kin"
              title="Walrus · Decentralised Blob Storage"
              subtitle="Sui-native object storage — no S3, no CDN, no rug-pull risk."
              items={[
                { label: 'Tier portrait blobs', hint: 'blob_id on-chain' },
                { label: 'Evolving artwork', hint: 'regenerated on tier-up' },
                { label: 'AI image pipeline', hint: 'roadmap' },
              ]}
            />
          </div>
        </Reveal>
      </Section>

      {/* FEATURES ─────────────────────────────── */}
      <Section id="features" eyebrow="What fans get">
        <Reveal>
          <h2 className="h-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
            Five reasons<br />
            <span className="text-vermillion">it sticks.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              n: '⚡',
              title: 'Frictionless onboarding',
              body: 'zkLogin with Google or LINE. No seed phrase, no wallet app, no gas confusion.',
              accent: 'sui' as const,
            },
            {
              n: '🔒',
              title: 'Absolute data ownership',
              body: 'XP and history live on Sui. Even if KIZUNA dies, the passport survives.',
              accent: 'kin' as const,
            },
            {
              n: '🎯',
              title: "Cashless Pick'em",
              body: 'Predict every fight. JP-regulation safe — no real-money gambling, just honor.',
              accent: 'red' as const,
            },
            {
              n: '🪪',
              title: 'Soulbound + sybil-gated',
              body: "MintCap-only minting tied to ticket / U-NEXT KYC. One real fan = one passport.",
              accent: 'sui' as const,
            },
            {
              n: '🌸',
              title: 'Dynamic evolution',
              body: 'Rookie → Samurai → Ronin → Shogun → Legend. Artwork upgrades as XP climbs.',
              accent: 'kin' as const,
            },
            {
              n: '🌐',
              title: 'Cross-platform asset',
              body: 'Same passport reads on U-NEXT, ONE app, and physical dojos. No silos.',
              accent: 'red' as const,
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100}>
              <FeatureCard {...f} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* TIER LADDER ──────────────────────────── */}
      <Section id="evolution" eyebrow="The ladder">
        <Reveal>
          <h2 className="h-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
            Five ranks.<br />
            <span className="text-kin">One bond.</span>
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { name: 'Rookie', xp: '0', color: 'text-muted' },
              { name: 'Samurai', xp: '500', color: 'text-sui' },
              { name: 'Ronin', xp: '2K', color: 'text-vermillion' },
              { name: 'Shogun', xp: '5K', color: 'text-kin' },
              { name: 'Legend', xp: '10K+', color: 'text-ink' },
            ].map((t, i) => (
              <div
                key={t.name}
                className="card-flat relative p-5 text-center"
                style={{ background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.02))` }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  Tier · {String(i + 1).padStart(2, '0')}
                </p>
                <p className={`h-display mt-3 text-3xl ${t.color}`}>{t.name}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {t.xp} XP
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ROADMAP ──────────────────────────────── */}
      <Section id="roadmap" eyebrow="What ships next">
        <Reveal>
          <h2 className="h-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">Roadmap</h2>
        </Reveal>

        <div className="mt-14 space-y-4">
          {[
            {
              q: 'Now',
              title: 'MVP — soulbound passport, Pick’em, leaderboard',
              done: true,
            },
            {
              q: 'Next',
              title: 'AI-generated fighter portraits, persisted to Walrus',
              done: false,
            },
            {
              q: 'Soon',
              title: 'On-chain mint_with_proof — burn the operator MintCap',
              done: false,
            },
            {
              q: 'Later',
              title: 'Stadium check-ins & tier-gated merch drops',
              done: false,
            },
          ].map((r, i) => (
            <Reveal key={r.title} delay={i * 100}>
              <div className="card-flat flex items-center gap-6 p-5">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                    r.done ? 'text-sage' : 'text-muted'
                  }`}
                >
                  {r.done ? '● shipped' : '○ planned'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-kin">
                  {r.q}
                </span>
                <span className="text-ink">{r.title}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CTA ──────────────────────────────────── */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-vermillion/5 to-transparent" />
        <div className="mx-auto w-full max-w-6xl px-6 text-center">
          <Reveal>
            <p className="eyebrow inline-block">Ready</p>
          </Reveal>
          <Reveal delay={150}>
            <h2 className="h-display mt-6 text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Stop renting your fandom.{' '}
              <span className="text-vermillion">Mint it.</span>
            </h2>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/passport" className="btn-primary">▸ Claim passport</Link>
              <Link href="/pickem" className="btn-ghost">Browse fights</Link>
              <Link href="/leaderboard" className="btn-ghost">View leaderboard</Link>
            </div>
          </Reveal>
          <Reveal delay={450}>
            <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              絆 — Built on Sui · Tokyo Builders Arena 2026
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Small components
   ───────────────────────────────────────────── */
function FeatureCard({
  n,
  title,
  body,
  accent,
}: {
  n: string;
  title: string;
  body: string;
  accent: 'sui' | 'kin' | 'red';
}) {
  const ring =
    accent === 'sui'
      ? 'hover:shadow-glow hover:border-sui/40'
      : accent === 'red'
      ? 'hover:shadow-glowRed hover:border-vermillion/40'
      : 'hover:border-kin/40';
  return (
    <div className={`card group h-full p-6 transition ${ring}`}>
      <div className="text-3xl">{n}</div>
      <h3 className="h-display mt-4 text-xl leading-tight">{title}</h3>
      <p className="mt-3 text-sm text-muted">{body}</p>
    </div>
  );
}

type ArchAccent = 'sui' | 'kin' | 'red';
function ArchRow({
  tag,
  title,
  subtitle,
  items,
  accent,
}: {
  tag: string;
  title: string;
  subtitle: string;
  items: { label: string; hint: string }[];
  accent: ArchAccent;
}) {
  const map = {
    sui: { text: 'text-sui', border: 'border-sui/40', bg: 'bg-sui/10', dot: 'bg-sui' },
    kin: { text: 'text-kin', border: 'border-kin/40', bg: 'bg-kin/10', dot: 'bg-kin' },
    red: { text: 'text-vermillion', border: 'border-vermillion/40', bg: 'bg-vermillion/10', dot: 'bg-vermillion' },
  }[accent];

  return (
    <div className={`card-flat border ${map.border} p-6`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start">
        {/* Left — layer label + title + subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} />
            <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.25em] ${map.text}`}>
              {tag}
            </p>
          </div>
          <h3 className="h-display mt-3 text-xl leading-tight text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
        </div>

        {/* Right — tech stack chips with hint */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.label}
              className={`rounded-sm border ${map.border} ${map.bg} px-3 py-2.5`}
            >
              <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${map.text}`}>
                {it.label}
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                {it.hint}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArrowDown() {
  return (
    <div className="flex justify-center">
      <span className="font-mono text-xs text-muted">↓</span>
    </div>
  );
}
