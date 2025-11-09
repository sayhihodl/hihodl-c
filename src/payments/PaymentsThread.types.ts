/**
 * Types for PaymentsThread component
 */
import type { RecipientKind } from "@/send/types";

export type ChainKeyUi = "Solana" | "Base" | "Ethereum" | "Polygon" | string;

export type MsgBase = {
  id: string;
  threadId: string;
  ts: number;
  status: "pending" | "confirmed" | "failed" | "canceled";
  toDisplay?: string;
};

export type TxMsg = MsgBase & {
  kind: "tx";
  direction: "out" | "in";
  tokenId: string;
  chain: string;
  amount: number;
  txHash?: string;
};

export type RequestMsg = MsgBase & {
  kind: "request";
  tokenId: string;
  chain: string;
  amount: number;
  meta?: {
    requestId?: string;
    fromUid?: string;
    toUid?: string;
    isIncoming?: boolean;
  };
};

export type AnyMsg = TxMsg | RequestMsg;

export type PaymentsThreadParams = {
  id?: string;
  name?: string;
  alias?: string;
  avatar?: string;
  emoji?: string;
  isGroup?: string;
  recipientKind?: RecipientKind | "group" | "card";
  recipientAddress?: string;
};

