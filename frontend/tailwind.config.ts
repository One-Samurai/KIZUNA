import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // dark arena palette
        paper: '#08090f',         // page bg (deeper black, logo base)
        paper2: '#12131c',        // raised surface
        surface: '#181a26',       // card bg
        line: 'rgba(200,220,255,0.10)',
        // text
        ink: '#f5f1e6',           // primary text on dark
        muted: '#aab3c5',         // cool-tinted muted to match blue base
        // brand accents — aligned with KIZUNA logo
        vermillion: '#ff3b3b',    // Samurai Red (ONE Samurai primary CTA)
        vermillion2: '#b90000',   // Samurai Red deep (hover/shadow)
        sui: '#4ca2ff',           // Sui Blue (Web3 / tech accent)
        sui2: '#2a75d3',          // Sui Blue deep
        kin: '#c9a961',           // warm gold (premium highlight)
        kin2: '#3a3320',          // gold tint bg
        ai: '#2a75d3',            // legacy alias → Sui Blue deep
        sage: '#7fb069',          // success green
        // light card (inverted Identity Pass)
        parchment: '#ede4cf',
        sumi: '#161118',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.35)',
        cardLg: '0 2px 4px rgba(0,0,0,0.45), 0 32px 64px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px rgba(201,169,97,0.3), 0 8px 32px rgba(201,169,97,0.12)',
      },
      borderRadius: {
        card: '4px',
      },
    },
  },
  plugins: [],
} satisfies Config;
