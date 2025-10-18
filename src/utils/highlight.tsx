// src/utils/highlight.tsx
import React from "react";
import { Text, StyleProp, TextStyle, TextProps } from "react-native";

export function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
  ...rest
}: {
  text: string;
  query: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
} & Omit<TextProps, "style">) {
  const q = (query || "").trim();
  const hay = String(text ?? "");
  if (!q) return <Text style={style} {...rest}>{hay}</Text>;

  const idx = hay.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <Text style={style} {...rest}>{hay}</Text>;

  const before = hay.slice(0, idx);
  const mid    = hay.slice(idx, idx + q.length);
  const after  = hay.slice(idx + q.length);

  return (
    <Text style={style} {...rest}>
      {before}
      <Text style={highlightStyle ?? { color: "#FFD86A", fontWeight: "700" }}>{mid}</Text>
      {after}
    </Text>
  );
}