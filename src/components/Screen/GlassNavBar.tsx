import React from "react";
import { Platform } from "react-native";
import GlassNavBarIOS, { GlassNavBarIOSProps } from "./GlassNavBarIOS";
import GlassNavBarStatic, { GlassNavBarProps as StaticProps } from "./GlassNavBarStatic";

export type GlassNavBarProps = StaticProps & GlassNavBarIOSProps;

export default function GlassNavBar(props: GlassNavBarProps) {
  if (Platform.OS === "ios") {
    const { intensityIOS, ...rest } = props as any; // iOS nativo no usa intensity
    return <GlassNavBarIOS {...(rest as GlassNavBarIOSProps)} />;
  }
  return <GlassNavBarStatic {...props} />;
}