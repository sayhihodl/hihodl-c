// src/send/steps/StepSearch.tsx
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable, Share, Animated, Keyboard, Platform,
} from "react-native";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import GlassHeader from "@/ui/GlassHeader";
import Row from "@/ui/Row";
import SearchField from "@/ui/SearchField";
import { legacy, glass } from "@/theme/colors";
import { parseRecipient } from "@/send/parseRecipient";
import { ChainBadge } from "@/lib/chainBadges";
import { getLabel, setLabel } from "@/send/addressBook";
import type { ChainKey, Account } from "@/send/types";
import { toAccount } from "@/send/types";
import { useSendFlow } from "@/send/SendFlowProvider";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";

const { TEXT, SUB } = legacy;

const GLASS_BG = glass.cardOnSheet;
const GLASS_BORDER = glass.cardBorder;

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

let loadRecentsSafe = () => {
  try { const mod = require("@/send/recents"); return mod.loadRecents?.() ?? []; }
  catch { return []; }
};

type EmphAddrProps = { addr: string; head?: number; tail?: number; align?: "left" | "center" | "right" };
function EmphAddr({ addr, head = 5, tail = 6, align = "left" }: EmphAddrProps) {
  const a = String(addr);
  if (a.length <= head + tail + 1) {
    return <Text style={[styles.addr, { textAlign: align }]}>{a}</Text>;
  }
  const pre = a.slice(0, head);
  const suf = a.slice(-tail);
  return (
    <Text style={[styles.addr, { textAlign: align }]}>
      <Text style={styles.addrStrong}>{pre}</Text>
      {"……"}
      <Text style={styles.addrStrong}>{suf}</Text>
    </Text>
  );
}

/* ---------- Gate para drag ---------- */
type StepSearchProps = {
  dragGateRef?: React.MutableRefObject<boolean | undefined>;
};

export default function StepSearch({ dragGateRef }: StepSearchProps) {
  const insets = useSafeAreaInsets();
  const { state: flow, patch, goTo } = useSendFlow();

  // Account de fondo normalizado y tipado
  const bgAccount: Account = useMemo(() => toAccount(flow.account), [flow.account]);

  // Header metrics (= Receive)
  const TITLE_H = 44, ROW_SEARCH_GAP = 14, SEARCH_H = 50, AFTER_SEARCH_GAP = 10, HEADER_INNER_TOP = 6;
  const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H + AFTER_SEARCH_GAP;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // ===== State principal =====
  const [q, setQ] = useState("");
  const parsed = useMemo(() => parseRecipient(q), [q]);

  const [recents, setRecents] = useState<any[]>([]);
  useEffect(() => { setRecents(loadRecentsSafe()); }, []);

  // Label detectada
  const [detectedLabel, setDetectedLabel] = useState<string | undefined>();
  useEffect(() => {
    let alive = true;
    const addr = parsed?.resolved?.address ?? parsed?.display ?? parsed?.toRaw;
    if (!addr) { setDetectedLabel(undefined); return; }
    getLabel(addr).then(v => { if (alive) setDetectedLabel(v); }).catch(() => {});
    return () => { alive = false; };
  }, [parsed]);

  // Refs
  const searchRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);

  // ====== Gate y scroll list ======
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<any>(null);

  const setGateFromY = useCallback((y: number) => {
    if (dragGateRef) dragGateRef.current = y <= 0;
    if (y < 0 && listRef.current?.scrollToOffset) {
      listRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [dragGateRef]);

  // Modal “Edit label”
  const [editOpen, setEditOpen] = useState(false);
  const [editAddr, setEditAddr] = useState("");
  const [editText, setEditText] = useState("");

  const openEdit = useCallback((addr: string, current?: string) => {
    searchRef.current?.blur();
    Keyboard.dismiss();
    setEditAddr(addr);
    setEditText(current ?? "");
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(async () => {
    await Haptics.selectionAsync();
    const v = editText.trim();
    await setLabel(editAddr, v || undefined);
    const cur = parsed?.resolved?.address ?? parsed?.display ?? parsed?.toRaw;
    if (cur && cur.toLowerCase() === editAddr.toLowerCase()) setDetectedLabel(v || undefined);
    setEditOpen(false);
  }, [editAddr, editText, parsed]);

  // Secciones
  const sections = useMemo(() => {
    const s: Array<{ title: string; key: string; data: any[] }> = [];
    if (parsed) s.push({ title: "Detected", key: "detected", data: [parsed] });
    if (!q && recents.length) s.push({ title: "Recents", key: "recents", data: recents.slice(0, 8) });

    const needle = q.trim().toLowerCase();
    const list = !needle
      ? CONTACTS
      : CONTACTS.filter((c) => {
          const fields = [c.alias, c.hhAlias, c.name, c.phone, c.email].filter(Boolean).map(String);
          return fields.some((v) => v.toLowerCase().includes(needle));
        });

    const onHH = list.filter((c) => !!c.onHH);
    const invite = list.filter((c) => !c.onHH);
    if (onHH.length) s.push({ title: `On HiHODL (${onHH.length})`, key: "onhh", data: onHH });
    if (invite.length) s.push({ title: `Invite (${invite.length})`, key: "invite", data: invite });
    return s;
  }, [q, recents, parsed]);

  // Avanzar a StepToken
  const goTokenSelect = useCallback((payload: {
    toType?: string; toRaw: string; display?: string; chain?: ChainKey; resolvedAddress?: string; label?: string;
  }) => {
    Keyboard.dismiss();
    patch({
      toType: payload.toType,
      toRaw: payload.toRaw,
      toDisplay: payload.display ?? payload.label ?? payload.toRaw,
      chain: payload.chain,
      resolved: payload.resolvedAddress,
      label: payload.label,
      account: toAccount(flow.account),
    });
    goTo("token");
  }, [patch, goTo, flow.account]);

  const useParsed = useCallback(() => {
    if (!parsed) return;
    const addr = parsed.resolved?.address ?? parsed.display ?? parsed.toRaw;
    const alias = detectedLabel || undefined;
    goTokenSelect({
      toType: parsed.kind,
      toRaw: parsed.toRaw,
      display: addr,
      chain: parsed.toChain as ChainKey | undefined,
      resolvedAddress: parsed.resolved?.address,
      label: alias,
    });
  }, [parsed, detectedLabel, goTokenSelect]);

  const pasteFromClipboard = useCallback(async () => {
    const clip = (await Clipboard.getStringAsync())?.trim();
    if (clip) setQ(clip);
  }, []);

  const shareInvite = useCallback(async () => { try {
    await Share.share({ message: "Hey! Te envío cripto fácil con HiHODL 👽\nDescárgala aquí: https://hihodl.app/invite?ref=me" });
  } catch {} }, []);

  const networkTag =
    (parsed?.toChain && String(parsed.toChain).toUpperCase().replace(/^HIHODL$/, "HH")) || undefined;

  return (
    <View style={{ flex: 1 }}>
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 20 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <>
            <View style={styles.topRow}>
              <View style={{ width: 36 }} />
              <Text style={styles.title} numberOfLines={1}>Send</Text>
              <View style={styles.rightBtns}>
                <Pressable hitSlop={10} style={styles.headerIconBtn} accessibilityLabel="Open scanner">
                  <Ionicons name="qr-code-outline" size={22} color={TEXT} />
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 14, marginBottom: 10 }}>
              <SearchField
                ref={searchRef}
                value={q}
                onChangeText={setQ}
                placeholder="Name, @alias, phone, email, ENS, address, IBAN…"
                height={50}
                onPaste={pasteFromClipboard}
                onClear={() => setQ("")}
                inputProps={{
                  autoCapitalize: "none",
                  autoCorrect: false,
                  returnKeyType: "search",
                  selectTextOnFocus: true,
                  onSubmitEditing: useParsed,
                }}
              />
            </View>
          </>
        }
      />

      <Animated.SectionList
        ref={listRef}
        style={{ flex: 1 }}
        sections={sections as any}
        keyExtractor={(it, idx) => String(it?.id ?? it?.raw ?? idx)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 22,
          paddingTop: HEADER_TOTAL - 38,
        }}
        bounces={Platform.OS === "ios"}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}

        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}

        renderItem={({ item, section }) => {
          if (section.key === "detected") {
            const p = item as any;
            const addr = p.resolved?.address ?? p.display ?? p.toRaw;
            const title = detectedLabel || (networkTag ? `Address • ${networkTag}` : "Address");
            return (
              <Row
                containerStyle={styles.rowGlass}
                leftSlot={<ChainBadge chain={(p.toChain as ChainKey) ?? ("hihodl" as ChainKey)} />}
                labelNode={
                  <View style={styles.labelWrap}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.alias} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                      <Pressable onPress={() => openEdit(addr, detectedLabel)} hitSlop={8} accessibilityLabel="Edit label">
                        <Text style={styles.edit}>Edit</Text>
                      </Pressable>
                    </View>
                    <EmphAddr addr={addr} />
                  </View>
                }
                rightIcon="chevron-forward"
                onPress={useParsed}
                onLongPress={() => openEdit(addr, detectedLabel)}
              />
            );
          }

          if (section.key === "recents") {
            const r = item as any;
            const sub =
              r.type === "iban" ? r.raw.replace(/(.{4})/g, "$1 ").trim()
              : r.raw.length > 24 ? `${r.raw.slice(0, 12)}…${r.raw.slice(-10)}`
              : r.raw;

            return (
              <Row
                containerStyle={styles.rowGlass}
                leftSlot={<Ionicons name="time-outline" size={24} color="#9CC6D1" />}
                labelNode={
                  <View style={styles.labelWrap}>
                    <Text style={styles.alias} numberOfLines={1} ellipsizeMode="tail">{r.displayName}</Text>
                    <Text style={styles.phone} numberOfLines={1} ellipsizeMode="tail">{sub}</Text>
                  </View>
                }
                rightSlot={r.lastNetwork ? <ChainBadge chain={r.lastNetwork as ChainKey} /> : null}
                rightIcon="chevron-forward"
                onPress={() => goTokenSelect({
                  toType: r.type,
                  toRaw: r.raw,
                  display: r.displayName,
                  chain: r.lastNetwork as ChainKey | undefined,
                  label: r.displayName,
                })}
                onLongPress={() => openEdit(r.raw, r.displayName)}
              />
            );
          }

          const c = item as Contact;
          const name = c.hhAlias || c.alias || c.name || "Contact";
          const sub = c.phone || c.email || (c.alias ?? "");
          const avatar = (
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={28} color="#9CC6D1" />
            </View>
          );
          const onHHBadge = <ChainBadge chain={"hihodl" as ChainKey} />;
          const inviteBtn = <View style={styles.inviteBtn}><Text style={styles.inviteTxt}>Invite</Text></View>;

          return (
            <Row
              containerStyle={styles.rowGlass}
              leftSlot={avatar}
              labelNode={
                <View style={styles.labelWrap}>
                  <Text style={styles.alias} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                  <Text style={styles.phone} numberOfLines={1} ellipsizeMode="tail">{sub}</Text>
                </View>
              }
              rightSlot={c.onHH ? onHHBadge : inviteBtn}
              rightIcon="chevron-forward"
              onPress={() => {
                if (c.onHH) {
                  const raw = c.hhAlias || c.alias || c.phone || c.email || "";
                  goTokenSelect({ toType: "hihodl", toRaw: raw, display: name, label: name });
                } else {
                  shareInvite();
                }
              }}
              onLongPress={() => { if (c.onHH) openEdit(c.hhAlias || c.alias || c.phone || c.email || "", name); }}
            />
          );
        }}

        ListFooterComponent={<View style={{ height: 8 }} />}

        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (e) => {
              const y = (e as NativeSyntheticEvent<NativeScrollEvent>).nativeEvent.contentOffset.y;
              if (y < 0 && listRef.current?.scrollToOffset) {
                listRef.current.scrollToOffset({ offset: 0, animated: false });
              }
              setGateFromY(y);
            },
          }
        )}
        onScrollBeginDrag={(e) => setGateFromY((e as NativeSyntheticEvent<NativeScrollEvent>).nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(e) => setGateFromY((e as NativeSyntheticEvent<NativeScrollEvent>).nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      />

      {/* Modal Edit label */}
      <BottomKeyboardModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        scrimOpacity={0.4}
        blurIntensity={60}
        autoFocusRef={editInputRef}
        dragAnywhere
        dragCloseThreshold={100}
        minHeightPct={0.38}
        maxHeightPct={0.62}
        tapToDismissKeyboard
      >
        <View>
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>Edit label</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>Only visible to you</Text>
          </View>
          <View style={{ marginBottom: 10, alignItems: "center" }}>
            <EmphAddr addr={editAddr} head={6} tail={6} align="center" />
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <TextInput
              ref={editInputRef}
              maxLength={60}
              value={editText}
              onChangeText={(t) => setEditText(t.replace(/\s+/g, " "))}
              placeholder="Address 1, Claudia Wallet, Payroll…"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={{ color: "#fff", fontSize: 15, minHeight: 40 }}
              returnKeyType="done"
              onSubmitEditing={saveEdit}
              accessibilityLabel="Edit label input"
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
            <Pressable onPress={() => setEditOpen(false)} style={{ paddingVertical: 10, paddingHorizontal: 16 }} hitSlop={8}>
              <Text style={{ color: "#9eb4bd", fontWeight: "700" }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={saveEdit}
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#fff" }}
              hitSlop={8}
            >
              <Text style={{ color: "#0A1A24", fontWeight: "800" }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </BottomKeyboardModal>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  rightBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  title: { color: legacy.TEXT, fontSize: 18, fontWeight: "800", textAlign: "center" },


  sectionTitle: { color: SUB, fontSize: 12, letterSpacing: 0.3, marginTop: 10, marginBottom: 6 },

  rowGlass: { backgroundColor: GLASS_BG, borderRadius: 18, padding: 14 },

  labelWrap: { flex: 1, minWidth: 0 },

  avatar: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center"
  },

  alias: { color: "#fff", fontWeight: "500", fontSize: 15 },
  phone: { color: SUB, fontSize: 12, marginTop: 2 },
  inviteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(255,183,3,0.25)" },
  inviteTxt: { color: "#FFB703", fontSize: 11, fontWeight: "700" },

  addr: { color: SUB, fontSize: 12, fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) as any },
  addrStrong:{ color: "#fff", fontWeight: "800", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) as any },
  edit: { color: "#9CC6D1", fontSize: 11, fontWeight: "700" },
});