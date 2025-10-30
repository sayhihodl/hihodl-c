// app/(drawer)/(internal)/payments/QuickRequestScreen.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, Platform,
  Keyboard, KeyboardAvoidingView, Alert, Image,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import { legacy } from "@/theme/colors";

import { SendFlowProvider, useSendFlow } from "@/send/SendFlowProvider";
import StepToken from "@/send/steps/StepToken";
import { BlurView } from "expo-blur";
import { useUserPrefs } from "@/store/userPrefs";
import { resolveQuickSend } from "@/send/quick/resolveQuickSend";
import type { TextInput as RNTextInput } from "react-native";
import { coercePair, bestChainForToken, type ChainKey } from "@/config/sendMatrix";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId, iconKeyForTokenId } from "@/config/iconRegistry";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import { AccountPickerContent } from "@/send/sheets/AccountPickerSheet";

// store & api
import { usePaymentsStore } from "@/store/payments";
import { createPaymentRequest } from "@/send/api/createPaymentRequest";

/* ============================== helpers ============================== */
type AccountId = "daily" | "savings" | "social";
type BalItem = { tokenId: string; chain: ChainKey; amount: number; account: AccountId };

function useBalancesSafe(): BalItem[] {
  try {
    const { useBalancesStore } = require("@/store/balances");
    return (useBalancesStore((s: any) => s.flat) ?? []) as BalItem[];
  } catch {
    return [];
  }
}

const { TEXT, SUB } = legacy;
const MAX_PER_TX = 99_999_999;
const fmt = (n: number, dps = 2) =>
  (isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: dps }) : "0");

/** Layout */
const UI = {
  HEADER_H: 50,
  TOP_GAP: 84,
  AMOUNT_BLOCK_H: 120,
  BETWEEN_GAP: 74,
};

// QuickSendInner (arriba del todo, junto a otros const)
const IS_MOCK =
  process.env.EXPO_PUBLIC_MOCK_PAYMENTS === "1" ||
  !process.env.EXPO_PUBLIC_RELAY_URL;

/* ============ token icon + mini-badge, sin aro blanco ============ */
function TokenWithMini({ tokenId, chain, iconUrl }: { tokenId?: string; chain?: ChainKey; iconUrl?: string }) {
  if (!tokenId) return <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" }} />;
  const iconKey = iconKeyForTokenId(tokenId) || tokenId;
  const isSvg = typeof iconUrl === "string" && iconUrl.trim().toLowerCase().endsWith(".svg");
  return (
    <View style={{ width: 36, height: 36, position: "relative" }}>
      {iconUrl ? (
        isSvg ? (
          <SvgUri width={36} height={36} uri={iconUrl} />
        ) : (
          <Image
            source={{ uri: iconUrl }}
            style={{ width: 36, height: 36, borderRadius: 8 }}
            resizeMode="cover"
          />
        )
      ) : (
        renderTokenIcon(String(iconKey), { size: 36, inner: 32, withCircle: false })
      )}
      <View style={styles.chainMini}>
        <View style={styles.chainMiniBg}>
          {renderChainBadge(mapChainKeyToChainId(chain), { size: 14, chip: false })}
        </View>
      </View>
    </View>
  );
}


/* ============ Keypad con presets ============ */
function QuickAmountPad({
  onPressKey, onPreset, onBackspace, disabled,
}: {
  onPressKey: (k: string) => void;
  onPreset: (n: number) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const row = (keys: Array<string | "back">) => (
    <View style={styles.kbRow}>
      {keys.map((k) =>
        k === "back" ? (
          <Pressable key="back" style={[styles.kbKey, disabled && styles.kbKeyDisabled]} onPress={disabled ? undefined : onBackspace}>
            <Ionicons name="backspace-outline" size={18} color="#CFE3EC" />
          </Pressable>
        ) : (
          <Pressable key={k} style={[styles.kbKey, disabled && styles.kbKeyDisabled]} onPress={() => (!disabled ? onPressKey(k) : undefined)}>
            <Text style={styles.kbKeyTxt}>{k}</Text>
          </Pressable>
        )
      )}
    </View>
  );

  return (
    <View style={styles.kbWrap}>
      <View style={styles.presetsRow}>
        {[10, 20, 50, 100].map((v) => (
          <Pressable key={v} style={styles.presetChip} onPress={() => onPreset(v)}>
            <Text style={styles.presetTxt}>+{v}</Text>
          </Pressable>
        ))}
        {/* En request no hay MAX, no tiene sentido semántico */}
        <View style={[styles.presetChip, { flex: 1.2, opacity: 0.4, alignItems: "center", justifyContent: "center" }]}>
          <Text style={styles.presetTxt}>MAX</Text>
        </View>
      </View>
      {row(["1", "2", "3"])}
      {row(["4", "5", "6"])}
      {row(["7", "8", "9"])}
      {row([".", "0", "back"])}
    </View>
  );
}

/* ============================== contenido ============================== */
function QuickRequestInner({ title }: { title: string }) {
  const { returnPathname, returnAlias, to, avatar } =
  useLocalSearchParams<{ returnPathname?: string; returnAlias?: string; to?: string; avatar?: string }>();
  const insets = useSafeAreaInsets();
  const { state, patch } = useSendFlow();
  const [kbH, setKbH] = useState(0);
  const tokenDragGateRef = useRef<boolean>(true);
  const acctDragGateRef = useRef<boolean>(true);
  const balances = useBalancesSafe();
  const prefToken = (useUserPrefs((s) => s.defaultTokenId) || "").toLowerCase() || undefined;
  const prefAcct  = (useUserPrefs((s) => s.defaultAccount) || "Daily") as "Daily" | "Savings" | "Social";
  // Buscador del sheet
  const [tokenSearch, setTokenSearch] = useState("");
  const tokenSearchRef = useRef<RNTextInput>(null);

  const [tokenId, setTokenId] = useState<string | undefined>(() => state.tokenId?.toLowerCase());
  const [chain,   setChain]   = useState<ChainKey | undefined>(() => (state.chain as ChainKey | undefined));
  const [account, setAccount] = useState<AccountId>(() => ((state as any)?.account ?? prefAcct.toLowerCase()) as AccountId);
  const [openToken, setOpenToken]     = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  const [amountStr, setAmountStr] = useState<string>(String(state.amount ?? ""));

  // Autofocus, pero sin abrir teclado del sistema
  const amountRef = useRef<TextInput>(null);
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  // Preset inicial de token/network válido (idéntico a send)
  const didPreset = useRef(false);
  useEffect(() => {
    if (didPreset.current) return;
    if (tokenId && chain) { didPreset.current = true; return; }

    const byToken: Record<string, Partial<Record<ChainKey, number>>> = {};
    for (const b of balances) {
      const id = b.tokenId.toLowerCase();
      byToken[id] = byToken[id] || {};
      byToken[id][b.chain] = (byToken[id][b.chain] ?? 0) + (b.amount || 0);
    }

    const pick = resolveQuickSend({ prefTokenId: prefToken, balances: byToken });
    if (pick) {
      const chosen = pick.tokenId.toLowerCase();
      const fixed  = coercePair(chosen, pick.chain);
      setTokenId(chosen); setChain(fixed);
      patch({ tokenId: chosen, chain: fixed });
      didPreset.current = true;
      return;
    }
    const fallbackToken = "usdc";
    const fallbackChain = coercePair(fallbackToken, bestChainForToken(fallbackToken) as ChainKey);
    setTokenId(fallbackToken); setChain(fallbackChain);
    patch({ tokenId: fallbackToken, chain: fallbackChain });
    didPreset.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances]);

  // amount
  const amount = useMemo(
    () => Number((amountStr || "0").replace(",", ".")) || 0,
    [amountStr]
  );

  // flags CTA (no check de balance en request)
const hasAmount = amount > 0;
const CTA_ACTIVE = "#FFB703";
const CTA_DISABLED = "#C8D2D9";
const canRequest = !!tokenId && !!chain && hasAmount && amount <= MAX_PER_TX;
const btnColor = canRequest ? CTA_ACTIVE : CTA_DISABLED;

  const appendKey = (k: string) => {
    setAmountStr((prev) => {
      let s = String(prev || "");
      if (k === ".") {
        if (!s.includes(".")) s = s ? `${s}.` : "0.";
      } else {
        s = (s === "0" ? "" : s) + k;
      }
      const [i, d] = s.split(".");
      return d ? `${i}.${d.slice(0, 6)}` : i;
    });
  };

  // Presets: fijan valor (MAX deshabilitado)
  const addPreset = (n: number) => {
    if (n === Number.POSITIVE_INFINITY) return;
    setAmountStr(String(n));
  };

  const backspace = () => setAmountStr((prev) => (prev ? prev.slice(0, -1) : ""));

  // Crear request
  const creatingRef = useRef(false);
  const goRequest = useCallback(async () => {
    if (!tokenId || !chain || !amountStr || Number(amountStr) <= 0) return;
    if (creatingRef.current) return;
    creatingRef.current = true;

    try {
      const toHandle = state.toRaw || state.toDisplay || "";
      const threadId = `peer:${toHandle.replace(/^@/, "")}`;
      const tempId = `tmp_${Date.now()}`;

      // 1) Optimista (tipo "request")
      const amtNumber = Number((amountStr || "0").replace(",", "."));
      const tokenNorm = String(tokenId || "usdc").toLowerCase();
      const chainSafe = (chain ?? selectedForSheet) as ChainKey;
      usePaymentsStore.getState().addMsg({
        id: tempId,
        threadId,
        kind: "request",
        amount: amtNumber,
        tokenId: tokenNorm,
        chain: chainSafe,
        status: "pending",
        ts: Date.now(),
        toDisplay: state.toDisplay ?? undefined,
      });

      // 2) Backend
      const res = await createPaymentRequest({
        from: toHandle.replace(/^@/, ""),   // a quién se lo pides
        tokenId: tokenNorm,
        chain: chainSafe,
        amount: String(amountStr),
        account,
      });

      // 3) Actualiza optimista (guarda el id)
      usePaymentsStore.getState().updateMsg(tempId, {
        status: "pending",
        ts: res.ts || Date.now(),
        meta: { intent: "request", requestId: res.requestId },
      });

      // 4) Navega al thread
      const { returnPathname, returnAlias, to, avatar } = useLocalSearchParams();
      router.replace({
      pathname: String(returnPathname ?? "/(drawer)/(internal)/payments/thread"),
      params: { alias: String(returnAlias ?? to ?? ""), avatar },
    });
    } catch (e: any) {
      const toHandle = state.toRaw || state.toDisplay || "";
      const threadId = `peer:${toHandle.replace(/^@/, "")}`;
      const items = usePaymentsStore.getState().selectByThread(threadId);
      const lastTmp = [...items].reverse().find((m) => m.id.startsWith("tmp_"));
      if (lastTmp) usePaymentsStore.getState().updateMsg(lastTmp.id, { status: "failed" });
      Alert.alert("Request failed", String(e?.message ?? "Unknown error"));
    } finally {
      creatingRef.current = false;
    }
  }, [account, amountStr, chain, state.toDisplay, state.toRaw, tokenId]);

  const TOP = (Platform.OS === "ios" ? insets.top : 0) + UI.HEADER_H + UI.TOP_GAP;

  // UI symbol
  const uiSymbol = useMemo(
    () => state.token?.displaySymbol ?? tokenId?.toUpperCase() ?? "",
    [state.token, tokenId]
  );

  // ChainKey para sheet
  const selectedForSheet = useMemo<ChainKey>(() => {
    if (chain) return chain;
    return bestChainForToken((tokenId ?? "usdc") as any) as ChainKey;
  }, [chain, tokenId]);

  // Items para account picker
  const accountItems = useMemo(
    () => ([
      { id: "daily",   label: "Daily" },
      { id: "savings", label: "Savings" },
      { id: "social",  label: "Social"  },
    ] as any),
    []
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={UI.HEADER_H}
    >
      <ScreenBg
        account={account === "daily" ? "Daily" : account === "savings" ? "Savings" : "Social"}
        height={160}
        showTopSeam
      />

      <GlassHeader
        scrolly={new (require("react-native").Animated.Value)(0)}
        height={UI.HEADER_H}
        innerTopPad={6}
        solidColor="transparent"
        leftSlot={<Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={22} color={TEXT} /></Pressable>}
        centerSlot={<Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>}
        rightSlot={<View style={{ width: 36 }} />}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* ===== CANTIDAD ===== */}
      <View style={[styles.amountBlock, { marginTop: TOP }]}>
        <TextInput
          ref={amountRef}
          value={amountStr}
          onChangeText={(t) => {
            const clean = t.replace(/[^\d.,]/g, "").replace(",", ".");
            const [int, dec] = clean.split(".");
            setAmountStr(dec ? `${int}.${dec.slice(0, 6)}` : int);
          }}
          keyboardType={Platform.select({ ios: "decimal-pad", android: "decimal-pad" }) as any}
          style={styles.hiddenInput}
          showSoftInputOnFocus={false}
          caretHidden
        />
        <Pressable style={styles.amountLine} onPress={() => amountRef.current?.focus()}>
          <Text style={styles.amountBig}>{fmt(amount, 6)}</Text>
          <Text style={styles.amountUnit}> {uiSymbol}</Text>
        </Pressable>
        <Text style={styles.subtle}>
          {tokenId ? `Requesting from ${state.toDisplay || "@user"}` : "Choose a token to continue"}
        </Text>
      </View>

      {/* Tap suave */}
      <Pressable onPress={Keyboard.dismiss} style={{ height: 12 }} />
      <View style={{ height: UI.BETWEEN_GAP }} />

      {/* ===== Selector compacto ===== */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={styles.selectorRow}>
          <Pressable style={styles.leftSelector} onPress={() => { Keyboard.dismiss(); setOpenToken(true); }}>
            <TokenWithMini tokenId={tokenId} chain={chain} iconUrl={(state.token as any)?.iconUrl} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.tokenTitle}>
                {uiSymbol || "Choose token"} <Ionicons name="chevron-down" size={14} color="#AFC9D6" />
              </Text>
            </View>
          </Pressable>

          <Pressable style={styles.accountPill} onPress={() => { Keyboard.dismiss(); setOpenAccount(true); }}>
            <Ionicons name="wallet-outline" size={16} color="#CFE3EC" />
            <Text style={[styles.accountTxt, { marginLeft: 8 }]}>{account === "daily" ? "Daily" : account === "savings" ? "Savings" : "Social"}</Text>
            <Ionicons name="chevron-down" size={14} color="#AFC9D6" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
      </View>

      {/* ----- CTA flotante ----- */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: (kbH || 292) + insets.bottom - 22,
        }}
      >
        <CTAButton
          title="Request"
          onPress={goRequest}
          variant="primary"
          backdrop="solid"
          color={btnColor}
          labelColor="#0A1A24"
          disabled={!canRequest}
          fullWidth
          size="lg"
        />
      </View>

      {/* ----- Keypad ----- */}
      <View
        style={[styles.accessoryAndroid, { paddingBottom: insets.bottom + 10 }]}
        onLayout={(e) => setKbH(e.nativeEvent.layout.height)}
      >
        <QuickAmountPad
          onPressKey={appendKey}
          onPreset={addPreset}
          onBackspace={backspace}
          disabled={!tokenId}
        />
      </View>

      {/* ===== Sheet Token ===== */}
      <BottomKeyboardModal
        visible={openToken}
        onClose={() => setOpenToken(false)}
        minHeightPct={0.88}
        maxHeightPct={0.94}
        scrimOpacity={0.85}
        sheetTintRGBA="rgba(2,48,71,0.28)"
        blurTopOnly={false}
        blurTopHeight={48}
        dismissOnScrimPress
        ignoreKeyboard
        dragAnywhere={false}
        dragGateRef={tokenDragGateRef}
        header={{
          height: 98,
          innerTopPad: -32,
          sideWidth: 45,
          centerWidthPct: 92,
          blurTint: "dark",
          showHandleTop: true,
          centerHeaderContent: true,
          center: (
            <View style={{ width: "100%", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 }}>
                Select currency
              </Text>

              {/* search bar */}
              <View style={{
                position: "relative", borderRadius: 14, overflow: "hidden",
                height: 44, width: "100%",
                borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)"
              }}>
                <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
                <Pressable
                  style={{ flex: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 }}
                  onPress={() => tokenSearchRef.current?.focus()}
                  hitSlop={8}
                >
                  <Ionicons name="search" size={18} color="#9CB4C1" />
                  <TextInput
                    ref={tokenSearchRef}
                    value={tokenSearch}
                    onChangeText={setTokenSearch}
                    placeholder="Search currency…"
                    placeholderTextColor="#9CB4C1"
                    style={{ flex: 1, color: "#fff", fontSize: 15 }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {!!tokenSearch && (
                    <Pressable onPress={() => setTokenSearch("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="#9CB4C1" />
                    </Pressable>
                  )}
                </Pressable>
              </View>
            </View>
          ),
        }}
      >
        <StepToken
          title=""
          useExternalHeader
          searchValue={tokenSearch}
          onChangeSearch={setTokenSearch}
          searchInputRef={tokenSearchRef}
          selectedChain={selectedForSheet}
          onBack={() => setOpenToken(false)}
          onTopChange={(atTop) => { tokenDragGateRef.current = atTop; }} // gate: solo cierra si lista arriba
          onPick={({ tokenId: id, bestNet }) => {
            const norm  = id.toLowerCase();
            const fixed = coercePair(norm, bestNet as ChainKey);
            setTokenId(norm);
            setChain(fixed);
            patch({ tokenId: norm, chain: fixed, amount: "" });
            setOpenToken(false);
          }}
        />
      </BottomKeyboardModal>

      {/* ===== Sheet Account (mismo estilo) ===== */}
      <BottomKeyboardModal
        visible={openAccount}
        onClose={() => setOpenAccount(false)}
        minHeightPct={0.68}
        maxHeightPct={0.94}
        scrimOpacity={0.85}
        sheetTintRGBA="rgba(2,48,71,0.28)"
        blurTopOnly={false}
        blurTopHeight={48}
        dismissOnScrimPress
        ignoreKeyboard
        dragAnywhere={true}                // drag en cualquier parte (tienes el fix de PanResponder)
        dragGateRef={acctDragGateRef}
        header={{
          height: 98,
          innerTopPad: -32,
          sideWidth: 45,
          centerWidthPct: 92,
          blurTint: "dark",
          showHandleTop: true,
          centerHeaderContent: true,
          center: (
            <View style={{ width: "100%", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                Select account
              </Text>
            </View>
          ),
        }}
      >
        <AccountPickerContent
          selected={account}
          accounts={accountItems}
          onPick={(id: AccountId) => {
            setAccount(id);
            patch({ account: id });
            setOpenAccount(false);
          }}
          onClose={undefined as any}
          {...({ hideHeader: true } as any)}
        />
      </BottomKeyboardModal>
    </KeyboardAvoidingView>
  );
}

/* ============================== wrapper ============================== */
export default function QuickRequestScreen() {
  const { to = "", alias, name, avatar } =
    useLocalSearchParams<{ to?: string; alias?: string; name?: string; avatar?: string }>();
  const title = useMemo(() => String(alias || name || to || "@user"), [alias, name, to]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0D1820" }}>
      <SendFlowProvider
        initialStep="amount"
        allowedSteps={["token", "amount", "confirm"]}
        initialState={{ toRaw: title.replace(/^@/, ""), toDisplay: title, avatarUrl: avatar }}
      >
        <QuickRequestInner title={title} />
      </SendFlowProvider>
    </View>
  );
}

/* ============================== styles ============================== */
const styles = StyleSheet.create({
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  amountBlock: { alignItems: "center" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  amountLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  amountBig: { color: "#fff", fontWeight: "900", fontSize: 54, letterSpacing: 0.5 },
  amountUnit: { color: "#fff", fontWeight: "900", fontSize: 30 },
  subtle: { color: SUB, fontSize: 13, marginTop: 8 },

  selectorRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 38 },
  leftSelector: { flexDirection: "row", alignItems: "center", flexShrink: 1, maxWidth: "70%" },
  tokenTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },

  accountPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  accountTxt: { color: "#fff", fontSize: 14, fontWeight: "800", marginLeft: 8 },

  chainMini: { position: "absolute", right: -3, bottom: -4 },
  chainMiniBg: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.15)",
  },

  accessoryAndroid: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    gap: 10,
    backgroundColor: "rgba(12,16,20,0.94)",
  },

  kbWrap: { gap: 8 },
  presetsRow: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  presetChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)" },
  presetTxt: { color: "#fff", fontWeight: "800" },
  kbRow: { flexDirection: "row", gap: 8 },
  kbKey: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  kbKeyDisabled: { opacity: 0.5 },
  kbKeyTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});