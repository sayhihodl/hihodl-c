import React from "react";
import { Platform } from "react-native";
import GlassNavBarStatic, { GlassNavBarProps as StaticProps } from "./GlassNavBarStatic";

export type GlassNavBarProps = StaticProps;

export default function GlassNavBar(props: GlassNavBarProps) {
  // Usar GlassNavBarStatic para todos los platforms ya que el componente nativo no está disponible
  return <GlassNavBarStatic {...props} />;
}