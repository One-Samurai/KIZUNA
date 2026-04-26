import { NextRequest, NextResponse } from 'next/server';
import { loadPending, savePending } from '@/lib/applications';

export const runtime = 'nodejs';

export async function GET() {
  const pending = await loadPending();
  return NextResponse.json({ applications: pending.filter((p) => p.status === 'pending') });
}

// Mark an application as minted (admin calls after on-chain mint succeeds)
export async function PATCH(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const address = String(body.address ?? '').trim().toLowerCase();
  const txDigest = body.txDigest ? String(body.txDigest) : undefined;
  const status = (body.status === 'rejected' ? 'rejected' : 'minted') as 'minted' | 'rejected';

  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  const pending = await loadPending();
  const idx = pending.findIndex((p) => p.address.toLowerCase() === address);
  if (idx === -1) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  pending[idx] = { ...pending[idx], status, txDigest };
  await savePending(pending);
  return NextResponse.json({ ok: true });
}
