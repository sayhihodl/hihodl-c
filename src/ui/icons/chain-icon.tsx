import React from "react";
import IconImage from "./icon-image";
import { getChainIcon } from "./registry";

type Props = { chain?: string; size?: number; rounded?: number };

export const ChainIcon = ({ chain, size = 18, rounded }: Props) => {
  return <IconImage source={getChainIcon(chain)} size={size} rounded={rounded ?? size / 2} />;
};