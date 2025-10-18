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
  const ConfirmComp = Confirm as React.ComponentType<any>;
  return <ConfirmComp {...props} />;
}