import { NextResponse } from 'next/server';
import { loadPending } from '@/lib/applications';

export const runtime = 'nodejs';

export async function GET() {
  const apps = await loadPending();
  let pending = 0, minted = 0, rejected = 0;
  for (const a of apps) {
    if (a.status === 'minted') minted++;
    else if (a.status === 'rejected') rejected++;
    else pending++;
  }
  const applied = apps.length;
  const tsList = apps.map((a) => a.ts).sort((x, y) => y - x);
  const lastApplyTs = tsList[0] ?? null;
  return NextResponse.json({ applied, pending, minted, rejected, lastApplyTs });
}
