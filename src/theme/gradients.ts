// src/theme/gradients.ts
export type Account = "Daily" | "Savings" | "Social";
export type ScreenGrad = "dashboard" | "financial" | "social" | "premium";

/** Tuplas de stops (obligan a 2 o 3 colores) */
export type Grad2 = readonly [string, string];
export type Grad3 = readonly [string, string, string];
export type Grad = Grad2 | Grad3;

export const MENU_GRAD_H = 220;
export const TOP_CAP = 60;

/** Overlay del MENÚ por cuenta (2 stops) */
export const ACCOUNT_GRADS: Record<Account, Grad2> = {
  Daily:   ["rgba(0,194,255,0.45)",  "rgba(54,224,255,0.00)"],
  Savings: ["rgba(84,242,165,0.35)", "rgba(84,242,165,0.00)"],
  Social:  ["rgba(111,91,255,0.40)", "rgba(255,115,179,0.00)"],
} as const;

/** Primario por cuenta */
export const ACCOUNT_PRIMARY = {
  Daily:   "#00C2FF",
  Savings: "#54F2A5",
  Social:  "#6F5BFF",
} as const;

/** Gradiente de la TARJETA (2 stops) */
export const CARD_GRADS: Record<Account, Grad2> = {
  Daily:   ["#00C2FF", "#36E0FF"],
  Savings: ["#54F2A5", "#36D98E"],
  Social:  ["#6F5BFF", "#FF73B3"],
} as const;

/** Screens: dashboard/financial/social mismo gradient (3 stops) */
export const SCREEN_GRADS: Record<ScreenGrad, Grad3 | Grad2> = {
  dashboard: ["#F7D3AD", "#FB8500", "#FFB703"],
  financial: ["#F7D3AD", "#FB8500", "#FFB703"],
  social:    ["#F7D3AD", "#FB8500", "#FFB703"],
  premium:   ["#F7D3AD", "#023047", "#219EBC"],
} as const;