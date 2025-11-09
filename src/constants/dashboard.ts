// src/constants/dashboard.ts
// Constantes centralizadas para el Dashboard

export const DASHBOARD_LAYOUT = {
  /** Extra padding below notch for gradient overlay */
  TOP_CAP: 23,
  /** Height of menu gradient backdrop */
  MENU_GRADIENT_HEIGHT: 260,
  /** Height of hero section */
  HERO_HEIGHT: 330,
  /** Top offset for scroll content */
  CONTENT_TOP_OFFSET: 68,
  /** Maximum tokens shown in preview */
  MAX_TOKENS_PREVIEW: 4,
  /** Height of each token row */
  TOKEN_ROW_HEIGHT: 70,
  /** Header height */
  HEADER_HEIGHT: 44,
  /** Header padding */
  HEADER_PAD: 8,
  /** Horizontal padding for hero */
  HERO_HPAD: 16,
  /** Seam gradient height */
  SEAM_HEIGHT: 38,
  /** Page gaps for horizontal pager */
  PAGE_GAP_LEFT: 18,
  PAGE_GAP_RIGHT: 18,
} as const;

export const DASHBOARD_DUST_THRESHOLDS = {
  /** Minimum USD value to show token */
  DUST_USD: 1,
  /** Minimum native amount to show token */
  DUST_NATIVE: 0,
} as const;

export const DASHBOARD_COLORS = {
  closeButton: "#365A66",
  bannerPeek: 12,
  bannerGap: 12,
  bodyPad: 14,
} as const;

/** Hit slop for touch targets */
export const HIT_SLOP = { 
  top: 8, 
  bottom: 8, 
  left: 8, 
  right: 8 
} as const;

/** Navigation guard timeout in ms */
export const NAV_GUARD_TIMEOUT = 500;

/** Scroll animation thresholds */
export const SCROLL_THRESHOLDS = {
  blurStart: 0,
  blurMid: 12,
  blurEnd: 60,
  solidStart: 0,
  solidMid: 80,
  solidEnd: 140,
  blurOpacity: { start: 0, mid: 0.6, end: 1 },
  solidOpacity: { start: 0, mid: 0, end: 0.45 },
} as const;

