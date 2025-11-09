// app/(drawer)/(internal)/payments/QuickSendScreen.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, Platform,
  Keyboard, KeyboardAvoidingView, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import { legacy } from "@/theme/colors";

import { SendFlowProvider, useSendFlow } from "@/send/SendFlowProvider";
import { useUserPrefs } from "@/store/userPrefs";
import { bestChainForToken, type ChainKey } from "@/config/sendMatrix";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import { AccountPickerContent } from "@/send/sheets/AccountPickerSheet";
import SuperTokenSearchSheet from "@/components/SuperTokenSearchSheet";
import PaymentDiagnostics from "@/components/PaymentDiagnostics";

// Refactored modules
import type { AccountId, QuickSendInnerProps } from "./_lib/_QuickSendScreen.types";
import { IS_MOCK, MAX_PER_TX, UI, CTA_ACTIVE, CTA_DISABLED } from "./_lib/_QuickSendScreen.constants";
import { fmt } from "./_lib/_QuickSendScreen.utils";
import { TokenWithMini, QuickAmountPad } from "./_lib/_QuickSendScreen.components";
import {
  useBalancesSafe,
  useTokenPreset,
  useBalances,
  usePaymentValidation,
  useAmountInput,
  useIsHihodlUser,
} from "./_lib/_QuickSendScreen.hooks";
import { sendQuickPayment } from "./_lib/_QuickSendScreen.send";

const { TEXT, SUB } = legacy;

function QuickSendInner({
  title,
  navReturn,
  paymentType = "crypto",
  pixData,
  mercadoPagoData,
}: QuickSendInnerProps) {
  const insets = useSafeAreaInsets();
  const { state, patch } = useSendFlow();
  const [kbH, setKbH] = useState(0);
  const tokenDragGateRef = useRef<boolean>(true);
  const acctDragGateRef = useRef<boolean>(true);
  const balances = useBalancesSafe();
  const prefAcct = (useUserPrefs((s) => s.defaultAccount) || "Daily") as "Daily" | "Savings" | "Social";
  const [tokenId, setTokenId] = useState<string | undefined>(() => state.tokenId?.toLowerCase());
  const [chain, setChain] = useState<ChainKey | undefined>(() => (state.chain as ChainKey | undefined));
  const [account, setAccount] = useState<AccountId>(() => ((state as any)?.account ?? prefAcct.toLowerCase()) as AccountId);
  const [openToken, setOpenToken] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  // Use custom hooks
  const { amountStr, setAmountStr, amount, appendKey, addPreset, backspace } = useAmountInput(String(state.amount ?? ""));
  const { balanceForSel, balanceByChain, balancesForDiagnostics } = useBalances(balances, tokenId, chain, account);
  const { sendCheck, diagnostic, hasAutoBridge } = usePaymentValidation(
    paymentType,
    tokenId,
    chain,
    amount,
    balanceByChain,
    balanceForSel,
    balancesForDiagnostics,
    state,
    title
  );
  const isHihodlUser = useIsHihodlUser(state);

  // Token preset
  useTokenPreset(paymentType, tokenId, chain, balances, state, patch, setTokenId, setChain);

  // Autofocus
  const amountRef = useRef<TextInput>(null);
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  // Handler para acciones de soluciones
  const handleDiagnosticSolution = useCallback((action: any, metadata?: any) => {
    if (action === "change_chain" && metadata?.alternatives?.[0]) {
      const suggested = metadata.alternatives[0].chain;
      setChain(suggested);
      patch({ chain: suggested });
      setOpenToken(true);
    } else if (action === "auto_bridge") {
      // Auto-bridge handled automatically
    }
  }, [patch, setChain]);

  // CTA flags
  const hasAmount = amount > 0;
  const hasBalance = sendCheck.canSend || hasAutoBridge || (IS_MOCK && amount > 0);
  const canSendPIX = paymentType === "pix" && !!tokenId && !!pixData?.pixKey && hasAmount && amount <= MAX_PER_TX;
  const canSendMP = paymentType === "mercado_pago" && !!tokenId && !!mercadoPagoData?.mercadoPagoId && hasAmount && amount <= MAX_PER_TX;
  const canSendCrypto = !!tokenId && !!chain && hasAmount && hasBalance && amount <= MAX_PER_TX;
  const canSendReal = canSendPIX || canSendMP || canSendCrypto;
  const canSend = IS_MOCK
    ? (paymentType === "pix" || paymentType === "mercado_pago"
        ? (!!tokenId && hasAmount && amount <= MAX_PER_TX)
        : (!!tokenId && !!chain && hasAmount && amount <= MAX_PER_TX))
    : canSendReal;
  const btnColor = canSend ? CTA_ACTIVE : CTA_DISABLED;


  // Send payment handler
  const sendingRef = useRef(false);
  const doSend = useCallback(async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    try {
      await sendQuickPayment({
        paymentType,
        tokenId,
        chain,
        amountStr,
        account,
        state,
        pixData,
        mercadoPagoData,
        hasAutoBridge,
        autoBridgePlan: diagnostic.metadata?.autoBridgePlan,
      });
    } catch {
      // Error already handled in sendQuickPayment
    } finally {
      sendingRef.current = false;
    }
  }, [paymentType, tokenId, chain, amountStr, account, state, pixData, mercadoPagoData, hasAutoBridge, diagnostic.metadata]);

  // Handler para el botón Send - diferente comportamiento según tipo de destinatario
  const goSend = useCallback(() => {
    // PIX y Mercado Pago: no requieren chain, solo tokenId
    if (paymentType === "pix" || paymentType === "mercado_pago") {
      if (!tokenId || !amountStr || Number(amountStr) <= 0) return;
      doSend();
      return;
    }
    
    // Crypto: requiere tokenId y chain
    if (!tokenId || !chain || !amountStr || Number(amountStr) <= 0) return;
    
    // Usuario HiHODL: enviar directamente (flujo rápido sin confirmación)
    // Ventajas: más rápido, confianza en la plataforma, reversible si es necesario
    if (isHihodlUser) {
      doSend();
      return;
    }
    
    // Wallet externa: navegar a pantalla completa de confirmación
    const autoBridgeStr = hasAutoBridge && diagnostic.metadata?.autoBridgePlan
      ? JSON.stringify(diagnostic.metadata.autoBridgePlan)
      : undefined;
    
    router.push({
      pathname: "/(drawer)/(internal)/payments/ConfirmPaymentScreen",
      params: {
        to: state.toRaw || state.toDisplay || "",
        tokenId: tokenId,
        chain: chain,
        amount: amountStr,
        account: account,
        ...(autoBridgeStr ? { autoBridge: autoBridgeStr } : {}),
      },
    });
  }, [isHihodlUser, doSend, tokenId, chain, amountStr, paymentType, state.toRaw, state.toDisplay, account, hasAutoBridge, diagnostic.metadata]);


  const TOP = (Platform.OS === "ios" ? insets.top : 0) + UI.HEADER_H + UI.TOP_GAP;

  // Símbolo amigable para UI
  const uiSymbol = useMemo(
    () => state.token?.displaySymbol ?? tokenId?.toUpperCase() ?? "",
    [state.token, tokenId]
  );

  // ChainKey seguro para el sheet (evita error de tipos)
  const selectedForSheet = useMemo<ChainKey>(() => {
    if (chain) return chain;
    return bestChainForToken((tokenId ?? "usdc") as any) as ChainKey;
  }, [chain, tokenId]);

  // Items for AccountPickerContent
  const accountItems = useMemo(
    () => (
      [
        { id: "daily",   label: "Daily" },
        { id: "savings", label: "Savings" },
        { id: "social",  label: "Social" },
      ] as any
    ),
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
          {paymentType === "pix" && pixData ? (
            `PIX to ${pixData.merchantName || pixData.pixKey.slice(0, 20)} • ${pixData.currency}`
          ) : paymentType === "mercado_pago" && mercadoPagoData ? (
            `Mercado Pago to ${mercadoPagoData.merchantName || mercadoPagoData.mercadoPagoId} • ${mercadoPagoData.currency}`
          ) : tokenId ? (
            hasAutoBridge ? (
              `Total available: ${fmt(
                Object.values(balancesForDiagnostics[tokenId.toLowerCase()] || {}).reduce((s, b) => s + (b ?? 0), 0),
                6
              )} ${uiSymbol} (auto-bridge enabled)`
            ) : (
              `Available: ${fmt(balanceForSel, 6)} ${uiSymbol}`
            )
          ) : (
            "Choose a token to continue"
          )}
        </Text>

        {/* Información adicional para PIX/Mercado Pago */}
        {paymentType === "pix" && pixData && (
          <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
            {pixData.description && (
              <Text style={[styles.subtle, { fontSize: 12, opacity: 0.7 }]}>
                {pixData.description}
        </Text>
            )}
          </View>
        )}
        {paymentType === "mercado_pago" && mercadoPagoData && (
          <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
            {mercadoPagoData.description && (
              <Text style={[styles.subtle, { fontSize: 12, opacity: 0.7 }]}>
                {mercadoPagoData.description}
              </Text>
            )}
          </View>
        )}

        {/* Sistema completo de diagnóstico y soluciones (solo para crypto) */}
        {diagnostic.problem && !IS_MOCK && paymentType === "crypto" && (
          <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
            <PaymentDiagnostics 
              diagnostic={diagnostic} 
              onSolutionPress={handleDiagnosticSolution}
              compact={diagnostic.severity === "info" || hasAutoBridge} // Compact si tiene auto-bridge disponible
            />
          </View>
      )}
      </View>

      {/* Tap suave para cerrar teclado */}
      <Pressable onPress={Keyboard.dismiss} style={{ height: 12 }} />

      {/* espacio antes del selector (alineado con Request) */}
      <View style={{ height: UI.BETWEEN_GAP }} />

      {/* ===== Selector compacto ===== */}
      {/* Para PIX y Mercado Pago: solo mostrar selector de token (no chain) */}
      {paymentType === "pix" || paymentType === "mercado_pago" ? (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.selectorRow}>
            <Pressable style={styles.leftSelector} onPress={() => { Keyboard.dismiss(); setOpenToken(true); }}>
              <TokenWithMini tokenId={tokenId} chain={undefined} iconUrl={(state.token as any)?.iconUrl} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.tokenTitle}>
                  {uiSymbol || "Choose token"} <Ionicons name="chevron-down" size={14} color="#AFC9D6" />
                </Text>
                <Text style={[styles.subtle, { fontSize: 11, marginTop: 2 }]}>
                  {paymentType === "pix" ? "Will convert to BRL" : `Will convert to ${mercadoPagoData?.currency || "local currency"}`}
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
      ) : (
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
      )}

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
          title={isHihodlUser ? "Send" : "Confirm"}
          onPress={goSend}
          variant="primary"
          backdrop="solid"
          color={btnColor}
          labelColor="#0A1A24"
          disabled={!canSend}
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
          onPreset={(n) => addPreset(n, balanceForSel)}
          onBackspace={backspace}
          disabled={!tokenId}
        />
      </View>

      {/* ===== Sheet Token (ahora usando componente reutilizable) ===== */}
      <SuperTokenSearchSheet
  visible={openToken}
  onClose={() => setOpenToken(false)}
        onPick={({ tokenId: id, chain: fixed }) => {
          const norm = id.toLowerCase();
      setTokenId(norm);
          setChain(fixed as ChainKey);
      patch({ tokenId: norm, chain: fixed, amount: "" });
    }}
        selectedChain={selectedForSheet}
        recipient={state.toRaw || state.toDisplay || title}
        dragGateRef={tokenDragGateRef}
        onTopChange={(atTop) => { tokenDragGateRef.current = atTop; }}
  />

      {/* ===== Sheet Account (same style as Token) ===== */}
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
  dragAnywhere={true}
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
export default function QuickSendScreen() {
  const {
    to = "",
    alias,
    name,
    avatar,
    kind, // "pix" | "mercado_pago" | undefined
    pixKey,
    mercadoPagoId,
    amount: presetAmount,
    merchantName,
    description,
    currency,
    reference,
  } = useLocalSearchParams<{
    to?: string;
    alias?: string;
    name?: string;
    avatar?: string;
    kind?: "pix" | "mercado_pago";
    pixKey?: string;
    mercadoPagoId?: string;
    amount?: string;
    merchantName?: string;
    description?: string;
    currency?: string;
    reference?: string;
  }>();

  const title = useMemo(() => {
    if (kind === "pix") {
      return merchantName || pixKey?.slice(0, 20) || "PIX Payment";
    }
    if (kind === "mercado_pago") {
      return merchantName || mercadoPagoId || "Mercado Pago";
    }
    return String(alias || name || to || "@user");
  }, [kind, merchantName, pixKey, mercadoPagoId, alias, name, to]);

  const { returnPathname, returnAlias, avatar: navAvatar } =
    useLocalSearchParams<{ returnPathname?: string; returnAlias?: string; avatar?: string }>();
  const navReturn = {
    pathname: String(returnPathname ?? "/(drawer)/(internal)/payments/thread"),
    alias: String(returnAlias ?? title),
    avatar: navAvatar as string | undefined,
  };

  // Detectar si es un pago PIX o Mercado Pago
  const isPIXPayment = kind === "pix";
  const isMercadoPagoPayment = kind === "mercado_pago";

  return (
    <View style={{ flex: 1, backgroundColor: "#0D1820" }}>
      <SendFlowProvider
        initialStep="amount"
        allowedSteps={["token", "amount", "confirm"]}
        initialState={{
          toRaw: isPIXPayment ? pixKey || "" : isMercadoPagoPayment ? mercadoPagoId || "" : title.replace(/^@/, ""),
          toDisplay: title,
          avatarUrl: avatar,
          amount: presetAmount || "",
        }}
      >
        <QuickSendInner
          title={title}
          navReturn={navReturn}
          paymentType={isPIXPayment ? "pix" : isMercadoPagoPayment ? "mercado_pago" : "crypto"}
          pixData={
            isPIXPayment
              ? {
                  pixKey: pixKey || "",
                  merchantName: merchantName || "",
                  description: description || "",
                  currency: currency || "BRL",
                }
              : undefined
          }
          mercadoPagoData={
            isMercadoPagoPayment
              ? {
                  mercadoPagoId: mercadoPagoId || "",
                  merchantName: merchantName || "",
                  description: description || "",
                  currency: currency || "ARS",
                  reference: reference || "",
                }
              : undefined
          }
        />
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

  chainMini: { position: "absolute", right: -3, bottom: -6 }, // Alineado con chainCountBadge (era -4)
  chainMiniBg: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.15)",
  },
  
  // Badge de número de chains (estilo imagen: pequeño badge con rayas horizontales)
  // POSICIONADO EN EL CENTRO ABAJO del token icon
  // MEJORA UX: Posicionado más abajo para no tapar el logo del token
  chainCountBadgeContainer: {
    position: "absolute",
    left: "50%", // Centrado horizontalmente
    marginLeft: -7, // Mitad del ancho del badge (14/2) para centrar perfectamente
    bottom: -6, // Más abajo para minimizar solapamiento con el logo (era -4)
    zIndex: 10,
  },
  chainCountBadge: {
    width: 14,
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chainCountBadgeBg: {
    ...StyleSheet.absoluteFillObject,
  },
  chainCountStripe: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  chainCountText: {
    position: "absolute",
    color: "#000",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
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