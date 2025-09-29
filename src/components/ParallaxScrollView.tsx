// src/components/ParallaxScrollView.tsx
import React, { type ReactNode } from "react";
import { ScrollView, View, StyleSheet } from "react-native";

type HeaderBg =
  | string
  | { light: string; dark: string };

type Props = {
  headerBackgroundColor?: HeaderBg;
  headerImage?: ReactNode;
  children?: ReactNode;
  style?: any;
};

export default function ParallaxScrollView({
  headerBackgroundColor,
  headerImage,
  children,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.header, bgFrom(headerBackgroundColor)]}>
        {headerImage}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function bgFrom(bg?: HeaderBg) {
  if (typeof bg === "string") return { backgroundColor: bg };
  if (bg && bg.light) return { backgroundColor: bg.light };
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 180, justifyContent: "flex-end" },
  content: { padding: 16 },
});