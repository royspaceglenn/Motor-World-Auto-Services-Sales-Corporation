/**
 * Login accounts: display names, roles, and demo credentials.
 * For production, replace validateCredentials with an API call and do not store passwords in code.
 */

export const ROLES = {
  OVERSEER: 'OVERSEER',
  CLERK: 'CLERK',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ACCOUNTS = {
  PROVINCIAL: 'PROVINCIAL',
  ISULAN: 'ISULAN',
  TACURONG: 'TACURONG',
} as const;

export type AccountId = (typeof ACCOUNTS)[keyof typeof ACCOUNTS];

export interface AccountConfig {
  id: AccountId;
  displayName: string;
  role: Role;
  description: string;
}

export const ACCOUNT_CONFIG: Record<AccountId, AccountConfig> = {
  [ACCOUNTS.PROVINCIAL]: {
    id: ACCOUNTS.PROVINCIAL,
    displayName: 'Provincial Logistics Monitoring System',
    role: ROLES.OVERSEER,
    description: 'View and monitor only. No editing.',
  },
  [ACCOUNTS.ISULAN]: {
    id: ACCOUNTS.ISULAN,
    displayName: 'Isulan Logistics Monitoring System',
    role: ROLES.CLERK,
    description: 'Full access. Add, edit, release, and manage inventory.',
  },
  [ACCOUNTS.TACURONG]: {
    id: ACCOUNTS.TACURONG,
    displayName: 'Tacurong Logistics Monitoring System',
    role: ROLES.CLERK,
    description: 'Full access. Add, edit, release, and manage inventory.',
  },
};

export const ACCOUNT_LIST: AccountConfig[] = Object.values(ACCOUNT_CONFIG);

/** Demo password used for all demo accounts. Replace with API auth in production. */
const DEMO_PASSWORD = 'demo';

const DEMO_PASSWORDS: Record<AccountId, string> = {
  [ACCOUNTS.PROVINCIAL]: DEMO_PASSWORD,
  [ACCOUNTS.ISULAN]: DEMO_PASSWORD,
  [ACCOUNTS.TACURONG]: DEMO_PASSWORD,
};

/** Demo credentials for display on the login screen. */
export const DEMO_ACCOUNTS: { account: string; password: string; role: string }[] = [
  { account: 'Provincial Logistics Monitoring System', password: DEMO_PASSWORD, role: 'View only (EFCP Motor Parts and Trading)' },
  { account: 'Isulan Logistics Monitoring System', password: DEMO_PASSWORD, role: 'Full access (Clerk)' },
  { account: 'Tacurong Logistics Monitoring System', password: DEMO_PASSWORD, role: 'Full access (Clerk)' },
];

export function validateCredentials(accountId: AccountId, password: string): boolean {
  const expected = DEMO_PASSWORDS[accountId];
  return typeof expected === 'string' && password.trim().toLowerCase() === expected;
}
