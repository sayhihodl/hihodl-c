// src/ui/T.tsx
import React from "react";
import { Text, TextProps } from "react-native";
import { t } from "@/theme/typography";

type TKinds = keyof typeof t;

export default function T({
  kind = "body",
  style,
  children,
  ...rest
}: TextProps & { kind?: TKinds }) {
  // fallback por si alguien pasa un kind incorrecto en runtime
  const base = t[kind] ?? t.body;
  return (
    <Text {...rest} style={[base, style]}>
      {children}
    </Text>
  );
}