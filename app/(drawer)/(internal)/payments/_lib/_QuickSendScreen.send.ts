/**
 * Payment sending logic extracted from QuickSendScreen
 */
import { router } from "expo-router";
import { Alert } from "react-native";
import { usePaymentsStore } from "@/store/payments";
import { sendPayment } from "@/send/api/sendPayment";
import { sendPIXPayment, convertToBRL } from "@/send/api/sendPIXPayment";
import { sendMercadoPagoPayment, convertToLocalCurrency } from "@/send/api/sendMercadoPagoPayment";
import type { AccountId, PaymentType, PIXData, MercadoPagoData } from "./_QuickSendScreen.types";
import type { ChainKey } from "@/config/sendMatrix";

export interface SendPaymentParams {
  paymentType: PaymentType;
  tokenId: string | undefined;
  chain: ChainKey | undefined;
  amountStr: string;
  account: AccountId;
  state: { toRaw?: string; toDisplay?: string };
  pixData?: PIXData;
  mercadoPagoData?: MercadoPagoData;
  hasAutoBridge: boolean;
  autoBridgePlan?: any;
}

export async function sendQuickPayment(params: SendPaymentParams): Promise<void> {
  const { paymentType, tokenId, chain, amountStr, account, state, pixData, mercadoPagoData, hasAutoBridge, autoBridgePlan } = params;

  if (paymentType === "pix") {
    if (!tokenId || !amountStr || Number(amountStr) <= 0 || !pixData?.pixKey) return;
  } else if (paymentType === "mercado_pago") {
    if (!tokenId || !amountStr || Number(amountStr) <= 0 || !mercadoPagoData?.mercadoPagoId) return;
  } else {
    if (!tokenId || !chain || !amountStr || Number(amountStr) <= 0) return;
  }

  try {
    const toHandle = state.toRaw || state.toDisplay || "";
    const threadId = paymentType === "pix"
      ? `pix:${pixData?.pixKey || ""}`
      : paymentType === "mercado_pago"
      ? `mp:${mercadoPagoData?.mercadoPagoId || ""}`
      : `peer:${toHandle.replace(/^@/, "")}`;
    const tempId = `tmp_${Date.now()}`;
    const amtNumber = Number((amountStr || "0").replace(",", "."));

    // ===== PIX Payment =====
    if (paymentType === "pix" && pixData) {
      const conversion = await convertToBRL(amountStr, tokenId!);
      const brlAmount = parseFloat(conversion.brlAmount);

      usePaymentsStore.getState().addMsg({
        id: tempId,
        threadId,
        kind: "out",
        amount: brlAmount,
        tokenId: tokenId!,
        chain: "pix" as any,
        status: "pending",
        ts: Date.now(),
        toDisplay: pixData.merchantName || pixData.pixKey.slice(0, 20),
        meta: {
          paymentType: "pix",
          pixKey: pixData.pixKey,
          brlAmount: brlAmount.toString(),
          cryptoAmount: amountStr,
          currency: pixData.currency,
          description: pixData.description,
        },
      });

      const res = await sendPIXPayment({
        pixKey: pixData.pixKey,
        amount: conversion.brlAmount,
        description: pixData.description,
        merchantName: pixData.merchantName,
        account,
      });

      usePaymentsStore.getState().updateMsg(tempId, {
        txId: res.pixId,
        status: res.status,
        ts: res.ts || Date.now(),
      });

      try {
        const { notifyPaymentSent } = require("@/lib/notifications");
        await notifyPaymentSent({
          amount: brlAmount,
          token: "BRL",
          to: pixData.merchantName || pixData.pixKey,
        });
      } catch {}

      router.back();
      return;
    }

    // ===== Mercado Pago Payment =====
    if (paymentType === "mercado_pago" && mercadoPagoData) {
      const conversion = await convertToLocalCurrency(amountStr, tokenId!, mercadoPagoData.currency);
      const localAmount = parseFloat(conversion.localAmount);

      usePaymentsStore.getState().addMsg({
        id: tempId,
        threadId,
        kind: "out",
        amount: localAmount,
        tokenId: tokenId!,
        chain: "mercado_pago" as any,
        status: "pending",
        ts: Date.now(),
        toDisplay: mercadoPagoData.merchantName || mercadoPagoData.mercadoPagoId,
        meta: {
          paymentType: "mercado_pago",
          mercadoPagoId: mercadoPagoData.mercadoPagoId,
          localAmount: localAmount.toString(),
          cryptoAmount: amountStr,
          currency: mercadoPagoData.currency,
          description: mercadoPagoData.description,
          reference: mercadoPagoData.reference,
        },
      });

      const res = await sendMercadoPagoPayment({
        mercadoPagoId: mercadoPagoData.mercadoPagoId,
        amount: conversion.localAmount,
        currency: mercadoPagoData.currency,
        description: mercadoPagoData.description,
        merchantName: mercadoPagoData.merchantName,
        account,
        reference: mercadoPagoData.reference,
      });

      usePaymentsStore.getState().updateMsg(tempId, {
        txId: res.paymentId,
        status: res.status,
        ts: res.ts || Date.now(),
      });

      try {
        const { notifyPaymentSent } = require("@/lib/notifications");
        await notifyPaymentSent({
          amount: localAmount,
          token: mercadoPagoData.currency,
          to: mercadoPagoData.merchantName || mercadoPagoData.mercadoPagoId,
        });
      } catch {}

      router.back();
      return;
    }

    // ===== Crypto Payment =====
    const needsAutoBridge = hasAutoBridge;

    usePaymentsStore.getState().addMsg({
      id: tempId,
      threadId,
      kind: "out",
      amount: amtNumber,
      tokenId: tokenId!,
      chain: chain!,
      status: "pending",
      ts: Date.now(),
      toDisplay: state.toDisplay ?? undefined,
      meta: needsAutoBridge ? {
        autoBridge: true,
        bridgePlan: autoBridgePlan,
        message: `Auto-bridging from multiple chains...`,
      } : undefined,
    });

    try {
      const { useThreads } = require("@/store/threads");
      const peerKey = `@${toHandle.replace(/^@/, "")}`;
      useThreads.getState().upsert(peerKey, {
        id: tempId,
        kind: "tx",
        direction: "out",
        amount: String(amtNumber),
        token: tokenId!,
        chain: "solana",
        status: "pending",
        createdAt: Date.now(),
      } as any);
    } catch {}

    const res = await sendPayment({
      to: toHandle.replace(/^@/, ""),
      tokenId: tokenId!,
      chain: chain!,
      amount: String(amountStr),
      account,
      autoBridge: needsAutoBridge && autoBridgePlan && Array.isArray(autoBridgePlan) ? {
        plan: autoBridgePlan,
        sourceChains: autoBridgePlan.filter((p: any) => p.chain !== chain).map((p: any) => p.chain),
      } : undefined,
    });

    usePaymentsStore.getState().updateMsg(tempId, {
      txId: res.txId,
      status: res.status,
      ts: res.ts || Date.now(),
    });

    try {
      const { analytics } = require("@/utils/analytics");
      analytics.trackPaymentSent({
        amount: amtNumber,
        token: tokenId!,
        to: state.toDisplay || state.toRaw || toHandle,
      });
    } catch {}

    try {
      const { notifyPaymentSent } = require("@/lib/notifications");
      await notifyPaymentSent({ amount: amtNumber, token: tokenId!, to: state.toDisplay || state.toRaw });
    } catch {}

    try {
      const { recordPayment } = require("@/services/paymentBehaviorLearning");
      await recordPayment(tokenId!, chain!, state.toDisplay || state.toRaw || "");
    } catch {}

    router.back();
  } catch (e: any) {
    const toHandle = state.toRaw || state.toDisplay || "";
    const threadId = paymentType === "pix"
      ? `pix:${pixData?.pixKey || ""}`
      : paymentType === "mercado_pago"
      ? `mp:${mercadoPagoData?.mercadoPagoId || ""}`
      : `peer:${toHandle.replace(/^@/, "")}`;
    const items = usePaymentsStore.getState().selectByThread(threadId);
    const lastTmp = [...items].reverse().find((m) => m.id.startsWith("tmp_"));
    if (lastTmp) usePaymentsStore.getState().updateMsg(lastTmp.id, { status: "failed" });

    try {
      const { useThreads } = require("@/store/threads");
      const peerKey = `@${toHandle.replace(/^@/, "")}`;
      if (lastTmp) {
        useThreads.getState().patchStatus(peerKey, lastTmp.id, "failed");
      }
    } catch {}

    Alert.alert("Payment failed", String(e?.message ?? "Unknown error"));
    throw e;
  }
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

