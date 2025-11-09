// app/(drawer)/(internal)/send/index.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SendFlowProvider } from "@/send/SendFlowProvider";
import SendScreenBody from "@/send/SendScreenBody";

export default function SendRoute() {
  const params = useLocalSearchParams<{ 
    tokenId?: string; 
    network?: string;
    initialStep?: "token" | "amount" | "confirm";
  }>();

  // Preparar estado inicial desde params
  const initialState = React.useMemo(() => {
    const state: any = {};
    if (params.tokenId) {
      state.tokenId = params.tokenId;
    }
    if (params.network) {
      state.chain = params.network;
    }
    return state;
  }, [params.tokenId, params.network]);

  const initialStep = (params.initialStep as "token" | "amount" | "confirm") || "token";

  return (
    <SendFlowProvider initialState={initialState} initialStep={initialStep}>
      <SendScreenBody />
    </SendFlowProvider>
  );
}