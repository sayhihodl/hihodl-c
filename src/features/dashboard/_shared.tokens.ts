// app/dashboard/_shared.tokens.ts
import { StyleSheet } from "react-native";

export type Position = { id: string }; // ajusta a tu shape real
export type Row = { id: string };      // idem

export function buildAggregatedRows(positions: Position[]) {
  // TODO: reemplaza por tu lógica real
  const rows: Row[] = positions.map((p) => ({ id: String(p.id) }));
  return { rows };
}

export function buildSplitRows(positions: Position[]) {
  // TODO: reemplaza por tu lógica real
  const rows: Row[] = positions.map((p) => ({ id: String(p.id) }));
  return { rows };
}

export const homeStyles = StyleSheet.create({
  sep: { height: 1, opacity: 0.06 },
});