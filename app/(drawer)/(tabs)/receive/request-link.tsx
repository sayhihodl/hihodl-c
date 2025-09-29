import React from "react";
import {
  View, Text, Pressable, StyleSheet, Share, Platform, ScrollView,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { BG, TEXT, SUB } = legacy;

// ===== Brand HiHODL (usa tu color real si lo tienes en theme) =====
const BRAND = "#FFB703";           // botón “Request a specific amount”
const BRAND_TEXT_ON = "#brand.almostblack"; // texto sobre brand

// TODO: alias/avatar reales desde tu user store
const ALIAS = "alex.hih";
const UNIVERSAL_LINK = `https://hi.me/${ALIAS}`;

export default function RequestLinkModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const copy = async () => { await Clipboard.setStringAsync(UNIVERSAL_LINK); };

  const share = async (url?: string) => {
    const u = url ?? UNIVERSAL_LINK;
    try { await Share.share({ message: u }); }
    catch { await Clipboard.setStringAsync(u); }
  };

  // Reemplaza este modal por request-amount (no apilar)
  const goAmount = () => {
    Keyboard.dismiss();
    router.replace("/(tabs)/receive/request-amount");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={TEXT} />
            </Pressable>
            <Text style={s.title}>Request via link</Text>
            <View style={s.headerBtn} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card */}
            <View style={s.card}>
              <View style={s.avatar} />
              <Text style={s.name}>Alex López</Text>
              <Text style={s.sub}>Share your Hi.me link so anyone can pay you</Text>

              {/* Link + Copy centrados */}
              <View style={s.linkRow}>
                <Text style={s.linkTxt} numberOfLines={1}>{UNIVERSAL_LINK}</Text>
                <Pressable onPress={copy} hitSlop={8} style={s.copyBtn}>
                  <Ionicons name="copy-outline" size={16} color="#BFD7EA" />
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* CTAs (subidos un poco) */}
          <View style={[s.bottomBar, { bottom: insets.bottom + 22 }]}>
            <Pressable onPress={() => share()} style={s.primary}>
              <Text style={s.primaryTxt}>Share link</Text>
            </Pressable>
            <Pressable onPress={goAmount} style={[s.secondary, { backgroundColor: BRAND }]}>
              <Text style={[s.secondaryTxt, { color: BRAND_TEXT_ON }]}>
                Request a specific amount
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { color: TEXT, fontSize: 20, fontWeight: "700" },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 8,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "center", marginBottom: 10
  },
  name: { color: TEXT, fontSize: 18, fontWeight: "700", textAlign: "center" },
  sub: { color: SUB, fontSize: 13, textAlign: "center", marginTop: 4 },

  linkRow: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.28)",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    maxWidth: "100%",
    minWidth: 260,
  },
  linkTxt: {
    color: "#89D7FF", fontWeight: "600", textAlign: "center",
    flexShrink: 1, flexGrow: 0, maxWidth: 260
  },
  copyBtn: {
    marginLeft: 8, width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)"
  },

  bottomBar: { position: "absolute", left: 16, right: 16, gap: 10 },
  primary: { backgroundColor: "#fff", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  primaryTxt: { color: "brand.almostblack", fontWeight: "700" },

  secondary: { paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  secondaryTxt: { color: "brand.almostblack",fontWeight: "700" },
});