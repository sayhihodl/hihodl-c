// src/ui/icons/icon-image.tsx
import React, { memo } from "react";
import { Image, View, StyleSheet, type ImageStyle } from "react-native";

type Props = {
  source: any;
  size?: number;
  rounded?: number; // opcional
  style?: ImageStyle;
};

const IconImage = memo(function IconImage({
  source,
  size = 20,
  rounded = size / 2,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: rounded }]}>
      <Image source={source} style={[styles.img, { width: size, height: size, borderRadius: rounded }, style]} />
    </View>
  );
});

export default IconImage;

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  img: { resizeMode: "contain" },
});