import deployed from '../../../kizuna/scripts/deployed.json' with { type: 'json' };

export const PACKAGE_ID = deployed.packageId;
export const NETWORK = deployed.network as 'testnet' | 'mainnet' | 'devnet' | 'localnet';
export const MINT_CAP_ID = deployed.capabilities.mintCap;
export const ADMIN_CAP_ID = deployed.capabilities.adminCap;
export const UPGRADE_CAP_ID = deployed.capabilities.upgradeCap;

export const MODULE = {
  passport: 'passport',
  pickem: 'pickem',
} as const;

export const STRUCT = {
  Passport: `${PACKAGE_ID}::passport::Passport`,
  MintCap: `${PACKAGE_ID}::passport::MintCap`,
  AdminCap: `${PACKAGE_ID}::pickem::AdminCap`,
  Match: `${PACKAGE_ID}::pickem::Match`,
} as const;

export const EVENT = {
  PassportMinted: `${PACKAGE_ID}::passport::PassportMinted`,
  TierUp: `${PACKAGE_ID}::passport::TierUp`,
  MatchCreated: `${PACKAGE_ID}::pickem::MatchCreated`,
  VoteCast: `${PACKAGE_ID}::pickem::VoteCast`,
  MatchSettled: `${PACKAGE_ID}::pickem::MatchSettled`,
  XpClaimed: `${PACKAGE_ID}::pickem::XpClaimed`,
} as const;

export const CLOCK_ID = '0x6';
