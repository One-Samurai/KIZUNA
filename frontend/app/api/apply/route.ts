import { NextRequest, NextResponse } from 'next/server';
import { findTicket, loadPending, savePending, PendingApp } from '@/lib/applications';

export const runtime = 'nodejs';

function isAddress(s: string) {
  return /^0x[0-9a-fA-F]{1,64}$/.test(s);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const address = String(body.address ?? '').trim();
  const email = String(body.email ?? '').trim();
  const displayName = String(body.displayName ?? '').trim();

  if (!isAddress(address)) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  if (!email.includes('@')) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  if (displayName.length < 2 || displayName.length > 32)
    return NextResponse.json({ error: 'Display name must be 2–32 chars' }, { status: 400 });

  const ticket = await findTicket(email);
  if (!ticket)
    return NextResponse.json(
      { error: 'No ticket found for this email. Buy a match ticket first.' },
      { status: 403 },
    );

  const all = await loadPending();
  // Drop prior rejected entries for same address/email so user can re-apply.
  const pending = all.filter(
    (p) =>
      !(
        p.status === 'rejected' &&
        (p.address.toLowerCase() === address.toLowerCase() ||
          p.email.toLowerCase() === email.toLowerCase())
      ),
  );

  if (pending.find((p) => p.address.toLowerCase() === address.toLowerCase()))
    return NextResponse.json({ error: 'Application already exists for this wallet' }, { status: 409 });

  if (pending.find((p) => p.email.toLowerCase() === email.toLowerCase()))
    return NextResponse.json({ error: 'This ticket has already been claimed' }, { status: 409 });

  const entry: PendingApp = {
    address,
    email: email.toLowerCase(),
    displayName,
    ticketId: ticket.ticketId,
    seat: ticket.seat,
    eventId: ticket.eventId,
    ts: Date.now(),
    status: 'pending',
  };
  pending.push(entry);
  await savePending(pending);

  return NextResponse.json({ ok: true, application: entry });
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  const pending = await loadPending();
  if (address) {
    const found = pending.find((p) => p.address.toLowerCase() === address.toLowerCase());
    return NextResponse.json({ application: found ?? null });
  }
  return NextResponse.json({ applications: pending });
}
