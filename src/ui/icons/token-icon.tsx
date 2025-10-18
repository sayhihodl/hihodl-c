// src/ui/icons/token-icon.tsx
import React, { memo } from "react";
import { Image, StyleSheet, type StyleProp, type ImageStyle } from "react-native";
import { TOKEN_ICONS, DEFAULT_TOKEN_ICON, type IconDef } from "@/config/iconRegistry";
import RemoteTokenIcon from "./RemoteTokenIcon";

type Props = {
  currencyId: string;
  size?: number;
  rounded?: number;
  style?: StyleProp<ImageStyle>;
};

export const TokenIcon = memo(function TokenIcon({
  currencyId,
  size = 36,
  rounded,
  style,
}: Props) {
  const def: IconDef | undefined = TOKEN_ICONS[currencyId];

  // 1) Si NO hay icono estático → intenta remoto
  if (!def) return <RemoteTokenIcon currencyId={currencyId} size={size} rounded={rounded} style={style} />;

  // 2) Icono estático (svg o img)
  if (def.kind === "svg") {
    const SvgComp = def.Comp;
    return <SvgComp width={size} height={size} />;
  }

  return (
    <Image
      source={def.src}
      style={[styles.img, { width: size, height: size, borderRadius: rounded ?? size / 2 }, style]}
      resizeMode="contain"
    />
  );
});

const styles = StyleSheet.create({
  img: { overflow: "hidden" },
});

export default TokenIcon;