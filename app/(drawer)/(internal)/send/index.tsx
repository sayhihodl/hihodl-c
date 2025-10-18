// app/(drawer)/(internal)/send/index.tsx
import React from "react";
import { SendFlowProvider } from "@/send/SendFlowProvider";
import SendScreenBody from "@/send/SendScreenBody"; // ajusta si tu archivo se llama distinto

export default function SendRoute() {
  return (
    <SendFlowProvider>
      <SendScreenBody />
    </SendFlowProvider>
  );
}