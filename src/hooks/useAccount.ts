// src/hooks/useAccount.ts
// Hook para manejar Account type de forma segura

type Account = "Daily" | "Savings" | "Social";
export type { Account };

const ACCOUNT_IDS: Record<Account, string> = {
  Daily: "daily",
  Savings: "savings",
  Social: "social",
};

const ID_TO_ACCOUNT: Record<string, Account> = {
  daily: "Daily",
  savings: "Savings",
  social: "Social",
};

export const ACCOUNTS_ORDER: readonly Account[] = ["Daily", "Savings", "Social"] as const;

/**
 * Hook para obtener Account desde un parámetro de URL
 * @param accountParam - Parámetro de URL (puede ser undefined)
 * @returns Account válido, por defecto "Daily"
 */
export function useAccount(accountParam?: string): Account {
  const key = String(accountParam ?? "").toLowerCase();
  return (ID_TO_ACCOUNT[key] ?? "Daily") as Account;
}

/**
 * Convierte Account a ID de URL
 */
export function accountToId(account: Account): string {
  return ACCOUNT_IDS[account];
}

/**
 * Convierte ID de URL a Account
 */
export function idToAccount(id: string): Account {
  const key = id.toLowerCase();
  return (ID_TO_ACCOUNT[key] ?? "Daily") as Account;
}

/**
 * Obtiene el índice de un Account en el orden
 */
export function getAccountIndex(account: Account): number {
  return ACCOUNTS_ORDER.indexOf(account);
}

export { ACCOUNT_IDS, ID_TO_ACCOUNT };

