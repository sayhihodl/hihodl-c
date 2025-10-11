// src/ui/TokenBadge.tsx
import React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import type { SvgProps } from "react-native-svg";

type PngSrc = ReturnType<typeof require>;
type SvgComp = React.FC<SvgProps>;

type Props =
  | { png: PngSrc; svg?: never; size?: number; bg?: string; }
  | { svg: SvgComp; png?: never; size?: number; bg?: string; }
  | { label: string; size?: number; bg?: string }; // fallback

export default function TokenBadge(props: Props) {
  const size = props.size ?? 40;
  const bg = props.bg ?? "#fff";

  if ("png" in props && props.png) {
    return <Image source={props.png} style={[styles.img, { width: size, height: size, borderRadius: size/2, backgroundColor: bg }]} resizeMode="contain" />;
  }
  if ("svg" in props && props.svg) {
    const Svg = props.svg;
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size/2, backgroundColor: bg }]}>
        <Svg width={Math.round(size*0.7)} height={Math.round(size*0.7)} />
      </View>
    );
  }
  // fallback
  const label = "label" in props ? props.label : "?";
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size/2, backgroundColor: bg }]}>
      <Text style={styles.fallbackTxt}>{String(label).slice(0,1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { },
  wrap: { alignItems: "center", justifyContent: "center" },
  fallbackTxt: { color: "#0A1A24", fontWeight: "900", fontSize: 16 },
});