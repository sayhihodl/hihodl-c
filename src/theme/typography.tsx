// src/theme/typography.ts
import { StyleSheet, TextStyle } from "react-native";
import colors from "@/theme/colors";

/** Mantener la fuente del sistema tal cual (sin fontFamily). */
export const sizes = {
  display: 40,  // para precios grandes
  h1: 28,
  h2: 22,
  h3: 18,       // igual que heroName del menú
  title: 16,
  body: 14,
  sub: 13,
  caption: 12,  // rowSub / tileSub / footer
  micro: 11,
} as const;

export const leading: Record<keyof typeof sizes, number> = {
  display: 44,
  h1: 34,
  h2: 28,
  h3: 24,
  title: 22,
  body: 20,
  sub: 18,
  caption: 16,
  micro: 14,
};

export const t = StyleSheet.create({
  /* Grandes / headers */
  display:  { fontSize: sizes.display, lineHeight: leading.display, color: colors.text, fontWeight: "600" } as TextStyle, // semibold
  h1:       { fontSize: sizes.h1,      lineHeight: leading.h1,      color: colors.text, fontWeight: "700" } as TextStyle,
  h2:       { fontSize: sizes.h2,      lineHeight: leading.h2,      color: colors.text, fontWeight: "700" } as TextStyle,
  h3:       { fontSize: sizes.h3,      lineHeight: leading.h3,      color: colors.text, fontWeight: "800" } as TextStyle, // como heroName
  header:   { fontSize: sizes.h3,      lineHeight: leading.h3,      color: colors.text, fontWeight: "800" } as TextStyle, // títulos de GlassHeader

  /* Secciones / overlines (menus) */
  section:  { fontSize: sizes.title,   lineHeight: leading.title,   color: colors.text, fontWeight: "800" } as TextStyle, // como títulos de bloque
  overline: { fontSize: sizes.micro,   lineHeight: leading.micro,   color: colors.textSubtle, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: "700" } as TextStyle,

  /* Contenido */
  title:    { fontSize: sizes.title,   lineHeight: leading.title,   color: colors.text,       fontWeight: "700" } as TextStyle,
  body:     { fontSize: sizes.body,    lineHeight: leading.body,    color: colors.text,       fontWeight: "400" } as TextStyle,
  bodyDim:  { fontSize: sizes.body,    lineHeight: leading.body,    color: colors.textSubtle, fontWeight: "400" } as TextStyle,
  sub:      { fontSize: sizes.sub,     lineHeight: leading.sub,     color: colors.textSubtle, fontWeight: "400" } as TextStyle,
  caption:  { fontSize: sizes.caption, lineHeight: leading.caption, color: colors.textSubtle, fontWeight: "400" } as TextStyle,
  micro:    { fontSize: sizes.micro,   lineHeight: leading.micro,   color: colors.textSubtle, fontWeight: "400" } as TextStyle,

  /* Énfasis (para filas y chips) */
  strong:      { fontWeight: "700" } as TextStyle,
  bold:        { fontWeight: "800" } as TextStyle,
  bodyStrong:  { fontSize: sizes.body,    lineHeight: leading.body,    color: colors.text, fontWeight: "700" } as TextStyle, // rowTitle 14/600~700
  labelStrong: { fontSize: 12,            lineHeight: 16,              color: colors.text, fontWeight: "800" } as TextStyle, // labels de botones/chips
});

/** Atajos de color (opcional) */
export const tc = {
  default:  { color: colors.text } as TextStyle,
  muted:    { color: colors.textMuted } as TextStyle,
  subtle:   { color: colors.textSubtle } as TextStyle,
  positive: { color: "#20d690" } as TextStyle,
  negative: { color: "#FFFF" } as TextStyle,
};