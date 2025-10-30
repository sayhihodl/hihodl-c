// app/(drawer)/(internal)/payments/QuickSendGroupScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Text, TextInput } from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import GroupSplitBuilder from "@/payments/GroupSplitBuilder";
import { usePaymentsStore } from "@/store/payments";
import { useUserPrefs } from "@/store/userPrefs";
import { resolveQuickSend } from "@/send/quick/resolveQuickSend";
import { coercePair, bestChainForToken, type ChainKey } from "@/config/sendMatrix";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId, iconKeyForTokenId } from "@/config/iconRegistry";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import StepToken from "@/send/steps/StepToken";
import { AccountPickerContent } from "@/send/sheets/AccountPickerSheet";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

export default function QuickSendGroupScreen() {
  const insets = useSafeAreaInsets();
  const { id = "", name = "Group", members: membersJson } =
    useLocalSearchParams<{ id?: string; name?: string; members?: string }>();
  let initialMembers: Array<{ id: string; alias: string }> = [];
  try {
    if (membersJson) {
      const parsed = JSON.parse(String(membersJson));
      if (Array.isArray(parsed)) {
        initialMembers = parsed
          .map((m: any, idx: number) => ({ id: String(m.id ?? idx), alias: String(m.alias ?? m.name ?? "@user") }))
          .slice(0, 64);
      }
    }
  } catch {}

  // ====== Copiamos el selector de token/cuenta del QuickSendScreen ======
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
  const balances = useBalancesSafe();
  const prefToken = (useUserPrefs((s) => s.defaultTokenId) || "").toLowerCase() || undefined;
  const prefAcct  = (useUserPrefs((s) => s.defaultAccount) || "Daily") as "Daily" | "Savings" | "Social";

  const [tokenId, setTokenId] = useState<string | undefined>();
  const [chain,   setChain]   = useState<ChainKey | undefined>();
  const [account, setAccount] = useState<AccountId>((prefAcct.toLowerCase() as any) as AccountId);
  const [openToken, setOpenToken]     = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const tokenDragGateRef = useRef<boolean>(true);
  const acctDragGateRef  = useRef<boolean>(true);
  const [tokenSearch, setTokenSearch] = useState("");
  const tokenSearchRef = useRef<RNTextInput>(null);

  // preset inicial
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
      didPreset.current = true;
      return;
    }
    const fallbackToken = "usdc";
    const fallbackChain = coercePair(fallbackToken, bestChainForToken(fallbackToken) as ChainKey);
    setTokenId(fallbackToken); setChain(fallbackChain);
    didPreset.current = true;
  }, [balances, prefToken]);

  const selectedForSheet = useMemo<ChainKey>(() => {
    if (chain) return chain;
    return bestChainForToken((tokenId ?? "usdc") as any) as ChainKey;
  }, [chain, tokenId]);

  const accountItems = useMemo(() => ([
    { id: "daily",   label: "Daily" },
    { id: "savings", label: "Savings" },
    { id: "social",  label: "Social" },
  ] as any), []);

  function TokenWithMini({ tokenId, chain, iconUrl }: { tokenId?: string; chain?: ChainKey; iconUrl?: string }) {
    if (!tokenId) return <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" }} />;
    const iconKey = iconKeyForTokenId(tokenId) || tokenId;
    const isSvg = typeof iconUrl === "string" && iconUrl.trim().toLowerCase().endsWith(".svg");
    return (
      <View style={{ width: 36, height: 36, position: "relative" }}>
        {iconUrl ? (
          isSvg ? (
            <Text /* placeholder for Svg */ style={{ color: "#fff" }}> </Text>
          ) : (
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)" }} />
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

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={140} showTopSeam />
      <GlassHeader
        scrolly={undefined as any}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={45}
        centerWidthPct={70}
        leftSlot={null}
        centerSlot={null}
        rightSlot={null}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* Selector compacto (copiado del QuickSend) */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <View style={styles.selectorRow}>
          <Pressable style={styles.leftSelector} onPress={() => setOpenToken(true)}>
            <TokenWithMini tokenId={tokenId} chain={chain} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.tokenTitle}>
                {(tokenId || "USDC").toUpperCase()} <Ionicons name="chevron-down" size={14} color="#AFC9D6" />
              </Text>
            </View>
          </Pressable>
          <Pressable style={styles.accountPill} onPress={() => setOpenAccount(true)}>
            <Ionicons name="wallet-outline" size={16} color="#CFE3EC" />
            <Text style={[styles.accountTxt, { marginLeft: 8 }]}>{account === "daily" ? "Daily" : account === "savings" ? "Savings" : "Social"}</Text>
            <Ionicons name="chevron-down" size={14} color="#AFC9D6" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
      </View>

      <GroupSplitBuilder
        initialMembers={initialMembers}
        tokenSymbol={(tokenId || "USDC").toUpperCase()}
        chain={chain as any}
        onCancel={() => router.back()}
        onConfirm={({ members }) => {
          const threadId = String(id || `grp:${name}`);
          const now = Date.now();
          const token = (tokenId || "usdc").toLowerCase();
          const net = (chain || "solana") as any;
          members.forEach((m) => {
            const tempId = `tmp_${now}_${Math.random().toString(36).slice(2,6)}`;
            usePaymentsStore.getState().addMsg({
              id: tempId,
              threadId,
              kind: "request",
              amount: Number(m.amount || 0),
              tokenId: token,
              chain: net,
              status: "pending",
              ts: Date.now(),
              toDisplay: m.alias,
              meta: { isIncoming: false },
            } as any);
          });
          router.replace({ pathname: "/(internal)/payments/thread", params: { id, name, alias: name, isGroup: "1" } });
        }}
      />

      {/* Sheet Token */}
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
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 }}>Select currency</Text>
              <View style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: 44, width: "100%", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" }}>
                <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
                <Pressable style={{ flex: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 }} onPress={() => tokenSearchRef.current?.focus()} hitSlop={8}>
                  <Ionicons name="search" size={18} color="#9CB4C1" />
                  <TextInput ref={tokenSearchRef} value={tokenSearch} onChangeText={setTokenSearch} placeholder="Search currency…" placeholderTextColor="#9CB4C1" style={{ flex: 1, color: "#fff", fontSize: 15 }} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
                  {!!tokenSearch && (<Pressable onPress={() => setTokenSearch("")} hitSlop={8}><Ionicons name="close-circle" size={18} color="#9CB4C1" /></Pressable>)}
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
          onTopChange={(atTop: boolean) => { tokenDragGateRef.current = atTop; }}
          onPick={({ tokenId: idPicked, bestNet }: { tokenId: string; bestNet: ChainKey }) => {
            const norm  = idPicked.toLowerCase();
            const fixed = coercePair(norm, bestNet as ChainKey);
            setTokenId(norm);
            setChain(fixed);
            setOpenToken(false);
          }}
        />
      </BottomKeyboardModal>

      {/* Sheet Account */}
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
        dragAnywhere
        dragGateRef={acctDragGateRef}
        header={{
          height: 98,
          innerTopPad: -32,
          sideWidth: 45,
          centerWidthPct: 92,
          blurTint: "dark",
          showHandleTop: true,
          centerHeaderContent: true,
          center: (<View style={{ width: "100%", alignItems: "center" }}><Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Select account</Text></View>),
        }}
      >
        <AccountPickerContent
          selected={account}
          accounts={accountItems}
          onPick={(idPicked: AccountId) => { setAccount(idPicked); setOpenAccount(false); }}
          onClose={undefined as any}
          {...({ hideHeader: true } as any)}
        />
      </BottomKeyboardModal>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D1820" },
});


