import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Ticket = { email: string; ticketId: string; seat: string; eventId: string };
export type PendingApp = {
  address: string;
  email: string;
  displayName: string;
  ticketId: string;
  seat: string;
  eventId: string;
  ts: number;
  status: 'pending' | 'minted' | 'rejected';
  txDigest?: string;
};

const TICKETS_PATH = path.join(process.cwd(), 'data', 'tickets.json');
const PENDING_PATH = path.join(process.cwd(), 'data', 'pending.json');

const norm = (e: string) => e.trim().toLowerCase();

export async function loadTickets(): Promise<Ticket[]> {
  const raw = await fs.readFile(TICKETS_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function loadPending(): Promise<PendingApp[]> {
  try {
    const raw = await fs.readFile(PENDING_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function savePending(list: PendingApp[]): Promise<void> {
  await fs.writeFile(PENDING_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

export async function findTicket(email: string): Promise<Ticket | null> {
  const tickets = await loadTickets();
  const target = norm(email);
  return tickets.find((t) => norm(t.email) === target) ?? null;
}
