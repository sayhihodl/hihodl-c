// src/theme/colors.ts
export type Hex = `#${string}`;

export const alpha = (hex: Hex, a: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
};

// ✅ usa 'as const' para que cada valor sea un literal '#XXXXXX'
export const brand = {
  yellow:  '#FFB703',
  orange:  '#FB8500',
  blueLt:  '#8ECAE6',
  blueMd:  '#219EBC',
  navy:    '#023047',
  white:   '#FFFFFF',
  almostBlack: '#0F0F1A',
  navBg:       '#0D1820',

  sheetBase:   '#1B2D36',   // <- literal
  sheetHex8:   '#1B2D36D9', // <- literal
} as const;

const colors = {
  // Brand palette
  brandYellow: brand.yellow,
  brandOrange: brand.orange,
  white:       brand.white,
  navy:        brand.navy,
  almostBlack: brand.almostBlack,

  // App shells
  bg:        brand.almostBlack,
  navBg:     brand.navBg,
  card: 'rgba(3, 12, 16, 0.35)',  // translúcido (dashboard)
  cardSolid: '#08232E',           // sólido (si lo necesitas en otra parte)

  // Textos
  text:            brand.white,
  textMuted:       '#CFE3EC',
  textSubtle:      '#9FB7C2',

  // Acciones
  primary:       brand.yellow,
  primaryTextOn: brand.almostBlack,
  secondary:     brand.orange,
  cta:           brand.yellow,
  ctaTextOn:     brand.almostBlack,

  // Bordes / líneas
  border:          '#BFD6E2',
  dividerOnDark:   'rgba(255,255,255,0.10)',
  dividerOnLight:  'rgba(6,32,43,0.12)',

  // Overlays
  overlay:   'rgba(0,0,0,0.45)',
  vignette:  'rgba(0,0,0,0.10)',

  // ===== BottomSheet / Banners =====
  sheetBg:       alpha(brand.sheetBase, 0.85), // ✅ ahora compila
  sheetBgHex8:   brand.sheetHex8,
  sheetBgSolid:  brand.navBg,  
  sheetHandle:   'rgba(255,255,255,0.22)',
  sheetText:     brand.white,
  sheetTextDim:  '#9eb4bd',
  sheetDivider:  'rgba(255,255,255,0.12)',

  // Inputs en sheet claro
  inputBgLight:   '#E0F0F4',
  inputTextLight: '#06202B',
  placeholderLt:  'rgba(6,32,43,0.6)',

  // Glass / banners
  bannerBg:        alpha(brand.sheetBase, 0.85), // ✅
  bannerText:      brand.white,
  bannerTextDim:   '#9eb4bd',
  bannerCloseTint: '#365A66',

  // Helpers
  muted: '#9CA3AF',
} as const;

// Aliases legacy en MAYÚSCULAS (compatibilidad con screens viejas)
export const legacy = {
  BG: colors.bg,
  CARD: colors.card,
  TEXT: colors.text,
  SUB: colors.textSubtle ?? colors.textMuted,
  SEPARATOR: colors.dividerOnDark,
  sheetText: colors.sheetText,
  sheetTextDim: colors.sheetTextDim,
  CTA: colors.cta,
  CTA_ON: colors.ctaTextOn,

} as const;

export default colors;