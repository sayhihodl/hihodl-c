// src/send/steps/StepConfirm.tsx
import React from "react";
import Confirm from "../../../app/(drawer)/(internal)/send/confirm";
import type { ChainKey } from "../types";

type Props = {
  to: string;
  tokenId: string;
  network: ChainKey;
  amount: string;
  onChangeNetwork: (n: ChainKey) => void;
  onConfirm: () => void;
};

export default function StepConfirm(props: Props) {
  // El screen Confirm no declara props, así que lo casteamos para poder inyectarlos.
  const ConfirmComp = Confirm as React.ComponentType<any>;
  return <ConfirmComp {...props} />;
}