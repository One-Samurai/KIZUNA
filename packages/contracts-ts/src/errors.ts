// Move abort code → user-facing message.
// Codes mirror the `const` declarations in passport.move / pickem.move.
// Note: passport (1) and pickem (100-108) don't overlap, so a single flat map is safe.
export const ABORT_MESSAGES: Record<string, Record<number, string>> = {
  passport: {
    1: 'XP award too large (safety cap).',
  },
  pickem: {
    100: 'Voting is locked for this match.',
    101: 'You already voted on this match.',
    102: 'Match is not settled yet.',
    103: 'You already claimed XP for this match.',
    104: 'You did not vote on this match.',
    105: 'Invalid choice (must be 0 or 1).',
    106: 'Match is already settled.',
    107: 'Lock time must be in the future.',
    108: 'Base XP exceeds max allowed.',
  },
};

const FLAT_MESSAGES: Record<number, string> = Object.assign(
  {},
  ...Object.values(ABORT_MESSAGES),
);

/**
 * Parse a Sui tx error message into a user-friendly string.
 * Handles both legacy and current SDK formats:
 *   - legacy: `MoveAbort(MoveLocation { ... name: Identifier("pickem") ... }, 101)`
 *   - current: `MoveAbort in 1st command, abort code: 104, in '0x...' (instruction 28)`
 */
export function parseMoveAbort(error: string | Error): string {
  const msg = typeof error === 'string' ? error : error.message;

  // Legacy format with module name
  const legacy = msg.match(/name:\s*Identifier\("(\w+)"\)[\s\S]*?,\s*(\d+)\)/);
  if (legacy) {
    const [, mod, codeStr] = legacy;
    const code = Number(codeStr);
    return ABORT_MESSAGES[mod]?.[code] ?? `Abort ${code} in ${mod}`;
  }

  // Current format: `abort code: N`
  const current = msg.match(/abort\s+code:\s*(\d+)/i);
  if (current) {
    const code = Number(current[1]);
    return FLAT_MESSAGES[code] ?? `Abort ${code}`;
  }

  return msg;
}
