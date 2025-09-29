import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

type Variant =
  | "title"
  | "subtitle"
  | "default"
  | "defaultSemiBold";

export type ThemedTextProps = TextProps & { type?: Variant };

export function ThemedText({ type = "default", style, children, ...rest }: ThemedTextProps) {
  return (
    <Text {...rest} style={[styles.base, variant[type], style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: "#fff",
  },
});

const variant = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 16, fontWeight: "700", opacity: 0.9 },
  default: { fontSize: 14 },
  defaultSemiBold: { fontSize: 14, fontWeight: "600" },
});