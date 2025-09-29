// app/(drawer)/(tabs)/send/search.tsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable, Share, Animated
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import Row from "@/ui/Row";
import { legacy } from "@/theme/colors";

type Account = "Daily" | "Savings" | "Social";
const { BG, TEXT, SUB } = legacy;

type Contact = {
  id: string; name?: string; alias?: string; phone?: string; email?: string;
  avatar?: any; onHH?: boolean; hhAlias?: string;
};

const CONTACTS: Contact[] = [
  { id: "1", alias: "@claudia", name: "Claudia", phone: "+31643558874", onHH: true },
  { id: "2", alias: "@sophia",  name: "Sophia A.", phone: "+31643555874", onHH: false, email: "sophia@mail.com" },
  { id: "3", alias: "@olivia",  name: "Olivia", phone: "+31643558833", onHH: true },
  { id: "4", name: "Gerard", phone: "+31643558811", onHH: false },
  { id: "5", name: "Sandra", phone: "+31643500874", onHH: false },
  { id: "6", name: "Silvia", phone: "+31644455874", onHH: true, hhAlias: "@silvia" },
];

const TOKEN_LABEL: Record<string, string> = {
  "USDC.circle": "USDC", "USDT.tether": "USDT", "SOL.native": "SOL", "ETH.native": "ETH",
};

export default function SendSearch() {
  const insets = useSafeAreaInsets();
  const { tokenId, amount, to, account } = useLocalSearchParams<{
    tokenId?: string; amount?: string; to?: string; account?: Account;
  }>();

  const token = tokenId ?? "USDC.circle";
  const acc: Account = (account as Account) ?? "Daily";

  // ===== Header layout dials =====
  const TITLE_H = 44;
  const ROW_SEARCH_GAP = 12;
  const SEARCH_H = 44;            // ↓ más bajito
  const AFTER_SEARCH_GAP = 20;    // ↑ más espacio debajo del buscador
  const HEADER_INNER_TOP = 6;

  const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H + AFTER_SEARCH_GAP;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  const [q, setQ] = useState((to as string) ?? "");

  const sections = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = !s
      ? CONTACTS
      : CONTACTS.filter(c => {
          const fields = [c.alias, c.hhAlias, c.name, c.phone, c.email].filter(Boolean).map(String);
          return fields.some(v => v.toLowerCase().includes(s));
        });
    const onHH = list.filter(c => !!c.onHH);
    const invite = list.filter(c => !c.onHH);
    return [
      { title: `On HiHODL (${onHH.length})`, data: onHH, key: "onhh" },
      { title: `Invite (${invite.length})`, data: invite, key: "invite" },
    ].filter(sec => sec.data.length > 0);
  }, [q]);

  const goAmount = useCallback((toField: string) => {
    router.replace({
      pathname: "/(drawer)/(tabs)/send/amount",
      params: { tokenId: token, amount: amount ?? "", to: toField, account: acc } as any,
    });
  }, [token, amount, acc]);

  const closeBack = useCallback(() => {
    router.replace({
      pathname: "/(drawer)/(tabs)/send/amount",
      params: { tokenId: token, amount: amount ?? "", to: q ?? "", account: acc } as any,
    });
  }, [token, amount, q, acc]);

  const invite = useCallback(async () => {
    const msg = `Hey! Te envío cripto fácil con HiHODL 👽
Descárgala aquí y te mando ${TOKEN_LABEL[token] ?? "tokens"}: https://hihodl.app/invite?ref=me`;
    try { await Share.share({ message: msg }); } catch {}
  }, [token]);

  const pasteFromClipboard = useCallback(async () => {
    const clip = (await Clipboard.getStringAsync())?.trim();
    if (!clip) return;
    setQ(clip);
    goAmount(clip);
  }, [goAmount]);

  // Header blur
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: BG }}>
      <ScreenBg account={acc} height={HEADER_TOTAL + 220} />

      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        // fila superior (left/center/right) + buscador debajo (usamos column)
        contentStyle={{ flexDirection: "column", paddingHorizontal: 20 }}
        // LEFT: LightKicks (tap = cerrar)
        leftSlot={null}
        centerSlot={
          <>
            <View style={styles.topRow}>
              <Pressable onPress={closeBack} hitSlop={10} style={styles.brandBtn}>
                <Text style={styles.brand}>LightKicks</Text>
              </Pressable>

              <Text style={styles.title} numberOfLines={1}>Choose a friend</Text>

              <View style={styles.rightBtns}>
                <Pressable onPress={() => { /* abrir escáner QR */ }} hitSlop={10} style={styles.roundBtn}>
                  <Ionicons name="scan-outline" size={18} color="#fff" />
                </Pressable>
                <Pressable onPress={pasteFromClipboard} hitSlop={10} style={styles.roundBtn}>
                  <Ionicons name="clipboard-outline" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Search dentro del header (sin autoFocus) */}
            <View
              style={[
                styles.searchInHeader,
                { marginTop: ROW_SEARCH_GAP, height: SEARCH_H, marginBottom: AFTER_SEARCH_GAP },
              ]}
            >
              <Ionicons name="search" size={18} color={SUB} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search your contacts"
                placeholderTextColor={SUB}
                style={styles.input as any}
                autoFocus={false}     // <- NO abrir teclado al entrar
                returnKeyType="search"
              />
            </View>
          </>
        }
        rightSlot={null}
      />

      <Animated.SectionList<Contact>
        sections={sections as any}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 22,
          paddingTop: HEADER_TOTAL - 38, // deja el header “más largo” y el margen visible
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const name = item.hhAlias || item.alias || item.name || "Contact";
          const sub  = item.phone || item.email || (item.alias ?? "");
          const avatar = (
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={28} color="#9CC6D1" />
            </View>
          );
          const onHHBadge = (
            <View style={styles.badge}><Text style={styles.badgeTxt}>On HiHODL</Text></View>
          );
          const inviteBtn = (
            <View style={styles.inviteBtn}><Text style={styles.inviteTxt}>Invite</Text></View>
          );

          return (
            <Row
              leftSlot={avatar}
              labelNode={
                <>
                  <Text style={styles.alias} numberOfLines={1}>{name}</Text>
                  <Text style={styles.phone} numberOfLines={1}>{sub}</Text>
                </>
              }
              rightSlot={item.onHH ? onHHBadge : inviteBtn}
              rightIcon="chevron-forward"
              onPress={() => item.onHH ? goAmount(item.hhAlias || item.alias || item.phone || item.email || "") : invite()}
            />
          );
        }}
        ListFooterComponent={<View style={{ height: 8 }} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  brandBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  brand: { color: "#B9E6F2", fontWeight: "800", fontSize: 14, letterSpacing: 0.2 },
  title: { color: TEXT, fontSize: 18, fontWeight: "800" },
  rightBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  roundBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
  },

  searchInHeader: {
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: TEXT, fontSize: 15 },

  sectionTitle: { color: SUB, fontSize: 12, marginTop: 10, marginBottom: 6 },

  avatar: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  alias: { color: "#fff", fontWeight: "700", fontSize: 15 },
  phone: { color: SUB, fontSize: 12, marginTop: 2 },

  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(0,194,255,0.20)",
  },
  badgeTxt: { color: "#9CC6D1", fontSize: 11, fontWeight: "700" },

  inviteBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "rgba(255,183,3,0.25)",
  },
  inviteTxt: { color: "#FFB703", fontSize: 11, fontWeight: "700" },
});