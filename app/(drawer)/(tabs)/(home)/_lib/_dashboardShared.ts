// app/(drawer)/(tabs)/(home)/dashboardShared.ts
// Exports compartidos para evitar ciclos de require entre index.tsx y components

import { StyleSheet } from "react-native";
import type { ChainId, CurrencyId } from "@/store/portfolio.store";

// Styles compartidos
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#081217" },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7CC2D1",
  },
  handle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  balanceWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  balance: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  eqRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  eqBadge: {
    backgroundColor: "#FFB703", // Primary color (YELLOW) para el badge
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eqText: {
    color: "#0A1A24", // Texto oscuro para la cantidad
    fontWeight: "700",
    fontSize: 12,
  },
  gain: {
    color: "#4ADE80", // Verde para positivos
    fontWeight: "700",
    fontSize: 14,
  },
  gainNegative: {
    color: "#FFFFFF", // Blanco para negativos
    fontWeight: "700",
    fontSize: 14,
  },
  fiatToggle: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fiatToggleTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  actionsSwipeArea: {
    marginTop: 20,
    alignItems: "center",
  },
  actionsRowFixed: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  miniAction: {
    alignItems: "center",
    minWidth: 70,
  },
  miniIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFB703", // Primary color (YELLOW)
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  miniLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tokenIconWrap: {
    width: 36,
    height: 36,
    position: "relative",
  },
  tokenIconImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chainBadges: {
    position: "absolute",
    bottom: -8,
    left: 0,
    right: 0,
    height: 18,
  },
  chainBadgeItem: {
    position: "absolute",
  },
  tokenName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  tokenSub: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  tokenVal: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "right",
  },
  tokenValSecondary: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  tokenDelta: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
    fontWeight: "600",
  },
  deltaUp: {
    color: "#4ADE80", // Verde para positivos
  },
  deltaDown: {
    color: "#FFFFFF", // Blanco para negativos
  },
  sep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 52,
  },
  addTokenBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  viewAll: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 13,
  },
  addTokenTxt: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 13,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  paymentsAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
  },
  paymentsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  paymentsAvatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#081217",
    textAlign: "center",
    lineHeight: 40,
  },
  paymentsBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#081217",
  },
  activityTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  activityWhen: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  activityAmt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

// Tipos compartidos
export type PaymentKind = "in" | "out" | "refund";
export type PaymentItem = {
  id: string;
  title: string;
  date: string | Date;
  amount: string;
  type: PaymentKind;
};

// Utilidades compartidas
export type TokenParams = {
  id: CurrencyId;
  chainId?: ChainId;
  accountId: string;
};

export const buildTokenTargetKey = (p: TokenParams): string => {
  const parts = [p.id];
  if (p.chainId) parts.push(p.chainId);
  parts.push(p.accountId);
  return parts.join("::");
};

// Mock de payments
export const PAYMENTS_MOCK = {
  Daily: [
    { id: "a1", title: "@satoshi", date: new Date(Date.now() - 1000 * 60 * 60 * 11), amount: "+ USDT 19.00", type: "in" as PaymentKind },
    { id: "a2", title: "Apple inc.", date: "2025-05-27T09:05:00Z", amount: "- USDC 124.24", type: "out" as PaymentKind },
    { id: "a3", title: "@helloalex", date: new Date(Date.now() - 1000 * 60 * 60 * 13), amount: "- USDT 15.00", type: "out" as PaymentKind },
    { id: "a4", title: "@gerard", date: new Date(Date.now() - 1000 * 60 * 60 * 14), amount: "- USDT 49.00", type: "refund" as PaymentKind },
  ],
  Savings: [
    { id: "b1", title: "@satoshi", date: new Date(Date.now() - 1000 * 60 * 60 * 20), amount: "+ ETH 0.05", type: "in" as PaymentKind },
    { id: "b2", title: "Coinbase", date: new Date(Date.now() - 1000 * 60 * 60 * 24), amount: "+ SOL 12.5", type: "in" as PaymentKind },
  ],
  Social: [
    { id: "c1", title: "@pengu", date: new Date(Date.now() - 1000 * 60 * 60 * 2), amount: "+ PENGU 1000", type: "in" as PaymentKind },
    { id: "c2", title: "@meme_fan", date: new Date(Date.now() - 1000 * 60 * 60 * 5), amount: "- PENGU 250", type: "out" as PaymentKind },
  ],
};

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

