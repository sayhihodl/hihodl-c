// src/payments/PaymentsThread.tsx
import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  FlatList,
  useWindowDimensions,
  TextInput,
  Keyboard,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Linking, ActionSheetIOS, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import {
  renderTokenIcon,
  renderChainBadge,
  mapChainKeyToChainId,
} from "@/config/iconRegistry";
import type { ChainKey } from "@/config/sendMatrix";
import { smartTokenPreselect } from "@/send/quick/smartTokenPreselect";
import { parseRecipient } from "@/send/parseRecipient";

// Store
import { usePaymentsStore } from "@/store/payments";
import { useThreads } from "@/store/threads";
import { SkeletonBubble } from "@/ui/Skeleton";
import { sendPayment } from "@/send/api/sendPayment";
import { useUserPrefs } from "@/store/userPrefs";
import type { RecipientKind } from "@/send/types";

// Refactored modules
import type { AnyMsg, PaymentsThreadParams, RequestMsg, TxMsg } from "./PaymentsThread.types";
import {
  fmtAmount,
  dayLabelFromEpoch,
  isFirstOfDay,
  chainIdFromStr,
  tokenTickerFromId,
  timeAgo,
  explorerUrl,
  formatThreadDisplayName,
} from "./PaymentsThread.utils";
import { AvatarContent, StatusPill } from "./PaymentsThread.components";
import {
  useThreadMessages,
  useFilteredMessages,
  usePaginatedItems,
  useTransactionPolling,
} from "./PaymentsThread.hooks";

/* =========================================================================
   Const / UI tuning
   ======================================================================== */
const BG = "#0D1820";
const BUBBLE_MAX_PCT = 0.72;
const BUBBLE_MIN_W = 220;

const FOOTER_H = 64;
const FOOTER_TOP_GAP = 8;
const SEPARATOR_ALPHA = 0.1;
const CTA_H = 44;
const LINE_GAP = 8;
const SEARCH_BUTTON_MARGIN_RIGHT = -12;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<AnyMsg>);

/* =========================================================================
   Component
   ======================================================================== */
export default function PaymentsThread() {
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const { t } = useTranslation(["payments"]);
  const compact = useUserPrefs((s) => s.threadCompact ?? false);
  const setCompact = useUserPrefs((s) => s.setThreadCompact);
  const [filter, setFilter] = React.useState<"all" | "payments" | "requests">("all");
  const PAGE_SIZE = 30;
  const [showSearchBar, setShowSearchBar] = React.useState(false);
  const [querySearchBar, setQuerySearchBar] = React.useState("");
  const inputSearchBarRef = React.useRef<TextInput | null>(null);
  
  // Token selector state - ELIMINADO: token se preselecciona automáticamente


  const params = useLocalSearchParams<PaymentsThreadParams>();
  const {
    id,
    name = "@user",
    alias = "@user",
    avatar,
    emoji,
    isGroup,
    recipientKind,
    recipientAddress,
  } = params;

  // thread id
  const threadId = useMemo(() => {
    if (id) return String(id);
    const handle = String(alias || name).replace(/^@/, "");
    return `peer:${handle}`;
  }, [id, alias, name]);

  // Clave legacy para threads (store antiguo)
  const legacyPeerKey = useMemo(() => {
    const handle = String(alias || name).replace(/^@/, "");
    return `@${handle}`;
  }, [alias, name]);

  const HEADER_H = insets.top + 6 + 54;
  const lineTop = FOOTER_H - CTA_H - (insets.bottom + 14) - LINE_GAP;

  // Formatear nombre de display según tipo de destinatario
  const displayName = useMemo(
    () =>
      formatThreadDisplayName(
        name,
        alias,
        recipientKind as RecipientKind | "group" | "card" | undefined,
        recipientAddress
      ),
    [name, alias, recipientKind, recipientAddress]
  );

  // Use custom hooks
  const items = useThreadMessages(threadId, legacyPeerKey);
  const realQuery = showSearchBar ? querySearchBar : "";
  const filteredItems = useFilteredMessages(items, filter, realQuery, displayName);
  const { visibleItems, loadingMore, loadMore, resetPages, pages, setPages } = usePaginatedItems(filteredItems, PAGE_SIZE);
  
  // Reset pages when filter/query/thread changes
  React.useEffect(() => {
    resetPages();
  }, [filter, realQuery, threadId, resetPages]);

  // Use polling hook
  const syncing = useTransactionPolling(items, legacyPeerKey, alias, name);


  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />

      {/* Header */}
      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={54}
        innerTopPad={6}
        sideWidth={60}
        centerWidthPct={60}
        leftSlot={
          <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to Payments"
          hitSlop={8}
          onPress={() => {
            router.back();
          }}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        }
        centerSlot={
          String(isGroup) === "1" ? (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/(drawer)/(internal)/payments/group-participants",
                  params: {
                    id: id as string,
                    name: displayName,
                    alias: String(alias || name),
                    avatar,
                    emoji,
                  },
                });
              }}
              style={styles.contactInfo}
            >
              <AvatarContent
                avatar={avatar}
                emoji={emoji}
                recipientKind={recipientKind as RecipientKind | "group" | "card" | undefined}
                alias={alias}
                name={name}
              />
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
            </Pressable>
          ) : (
            <View style={styles.contactInfo}>
              <AvatarContent
                avatar={avatar}
                emoji={emoji}
                recipientKind={recipientKind as RecipientKind | "group" | "card" | undefined}
                alias={alias}
                name={name}
              />
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          )
        }
        rightSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search"
            hitSlop={8}
            onPress={() => {
              setShowSearchBar(true);
              setTimeout(() => {
                if (inputSearchBarRef.current) inputSearchBarRef.current.focus();
              }, 100);
            }}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              marginRight: SEARCH_BUTTON_MARGIN_RIGHT,
            }}
          >
            <Ionicons name="search" size={20} color="#CFE3EC" />
          </Pressable>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* Barra de búsqueda estilo WhatsApp: */}
      {showSearchBar && (
        <View style={{
          position: "absolute", top: HEADER_H, left: 0, right: 0, zIndex: 10, backgroundColor: "#162631",
          flexDirection: "row", alignItems: "center", paddingHorizontal: 18, height: 48
        }}>
          <Ionicons name="search" size={18} color="#CFE3EC" style={{ marginRight: 6 }} />
          <TextInput
            ref={inputSearchBarRef}
            style={{ flex: 1, color: "#fff", fontSize: 15, paddingVertical: 0 }}
            placeholder="Search..."
            placeholderTextColor="#9CB4C1"
            value={querySearchBar}
            autoFocus
            onChangeText={setQuerySearchBar}
            returnKeyType="search"
            onBlur={() => setShowSearchBar(false)}
          />
          {querySearchBar.length > 0 && (
            <Pressable onPress={() => setQuerySearchBar("")} hitSlop={10} style={{ marginLeft: 4 }}>
              <Ionicons name="close-circle" size={20} color="#CFE3EC" />
            </Pressable>
          )}
          <Pressable onPress={() => {
            setShowSearchBar(false);
            setQuerySearchBar("");
            Keyboard.dismiss();
          }} hitSlop={10} style={{ marginLeft: 6 }}>
            <Ionicons name="close" size={22} color="#CFE3EC" />
          </Pressable>
        </View>
      )}

      {/* ==== FILTRO Y BÚSQUEDA ELIMINADOS ==== */}
      {/* Se ha eliminado el siguiente bloque por petición del usuario:
      <View style={{ position: "absolute", left: 16, right: 16, top: HEADER_H, zIndex: 1 }}>...</View>
      */}

      {/* LISTA */}
      <AnimatedFlatList
        data={visibleItems}
        keyExtractor={(i, idx) => {
          // clave estable y única incluso si hay colisiones puntuales
          const base = String(i?.id ?? "");
          const extra = i?.ts ?? idx;
          return base ? `${base}:${extra}` : `idx:${idx}`;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_H + 8 + 36,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + FOOTER_H + FOOTER_TOP_GAP + 12,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          {
            useNativeDriver: true,
            listener: (e: { nativeEvent?: { contentOffset?: { y?: number } } }) => {
              try {
                const y = e?.nativeEvent?.contentOffset?.y ?? 0;
                if (y < 80 && !loadingMore) {
                  const total = filteredItems.length;
                  const showing = visibleItems.length;
                  if (showing < total) {
                    loadMore();
                  }
                }
              } catch (err) {
                // Silenciar errores del listener en Android
                console.warn("[PaymentsThread] Scroll listener error:", err);
              }
            },
          }
        )}
        renderItem={({ item, index }) => {
          const isTx = item.kind === "tx";
          const isOut = isTx && (item as TxMsg).direction === "out";

          const showAsTx = isTx; // para legibilidad
          const chainId = chainIdFromStr(item.chain, mapChainKeyToChainId);
          const tokenTicker = tokenTickerFromId(item.tokenId);
          const showDay = isFirstOfDay(items, index);
          const maxW = Math.max(BUBBLE_MIN_W, width * BUBBLE_MAX_PCT);
          const amountNum = Number(item.amount ?? 0);
          const isIncomingReq =
          item.kind === "request" &&
          Boolean((item as RequestMsg)?.meta?.isIncoming ?? false);

          const onPayRequest = () => {
            if (item.kind !== "request") return;
            router.push({
            pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
            params: {
              to: alias || name,
              avatar,
              emoji,
              amount: String(amountNum),
              tokenId: item.tokenId,
              chain: item.chain,
              intent: "pay_request",
              requestId: (item as RequestMsg).meta?.requestId ?? "",
              returnPathname: "/(drawer)/(internal)/payments/thread",
              returnAlias: String(alias || name),
              ...(recipientKind && { recipientKind }),
              ...(recipientAddress && { recipientAddress }),
            },
          });
          };

          const onDeclineRequest = () => {
            if (item.kind !== "request") return;
            usePaymentsStore.getState().updateMsg(item.id, { status: "canceled" });
          };

          const onRemindRequest = () => {
            if (item.kind !== "request") return;
            const store = usePaymentsStore.getState();
            if (store.remindRequest) {
              store.remindRequest(item.id);
            } else {
              // Fallback: refrescar timestamp
              store.updateMsg(item.id, { ts: Date.now() });
            }
          };

          return (
            <View>
              {showDay && (
                <View style={{ alignItems: "center", marginBottom: 10 }}>
                  <Text style={styles.dayLabel}>{dayLabelFromEpoch(item.ts)}</Text>
                </View>
              )}

              <View style={[styles.bubbleWrap, isOut ? styles.alignRight : styles.alignLeft]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open transaction details"
                  onPress={() => {
                  try {
                    router.push({
                    pathname: "/(drawer)/(internal)/payments/tx-details", // misma pila -> modal overlay
                    params: {
                      id: item.id,
                      dir: isTx && isOut ? "out" : "in",
                      token: tokenTicker,
                      amount: String(amountNum),
                      status: item.status === "confirmed" ? "Succeeded" : item.status === "failed" ? "Failed" : "Pending",
                      dateISO: new Date(item.ts).toISOString(),
                      chain: item.chain,           // por si no tienes CAIP directo
                      network: "eip155:8453",      // si ya lo sabes, mejor
                      hash: isTx ? (item as TxMsg).txHash : undefined,
                      peer: item.toDisplay ?? displayName,
                      fee: "0.0005 ETH",
                    },
                  });
                  } catch { /* noop si aún no existe la sheet */ }
                }}
                  onLongPress={() => {
                    const hash = isTx ? ((item as TxMsg).txHash || (item as TxMsg).txHash) : undefined;
                    const url = hash ? explorerUrl(item.chain, hash) : undefined;
                    const canRetry = item.kind === "tx" && item.status === "failed";
                    const canCancel = item.kind === "tx" && item.status === "pending";
                    const copyAction = async () => {
                      if (hash) await Clipboard.setStringAsync(String(hash));
                    };
                    const openExplorer = async () => {
                      if (url) await Linking.openURL(url);
                    };
                    const retryAction = async () => {
                      try {
                        const txItem = item as TxMsg;
                        const amtNumber = Number(txItem.amount ?? 0);
                        const tempId = `tmp_${Date.now()}`;
                        const threadKey = threadId;
                        
                        // Optimistic add
                        usePaymentsStore.getState().addMsg({
                          id: tempId,
                          threadId: threadKey,
                          kind: "out",
                          amount: amtNumber,
                          tokenId: txItem.tokenId,
                          chain: txItem.chain as ChainKey,
                          status: "pending",
                          ts: Date.now(),
                          toDisplay: txItem.toDisplay ?? (alias || name),
                        });
                        
                        // Mirror legacy store
                        try {
                          const threadsState = useThreads.getState();
                          threadsState.upsert(legacyPeerKey, {
                            id: tempId,
                            kind: "tx",
                            direction: "out",
                            amount: String(amtNumber),
                            token: txItem.tokenId,
                            chain: "solana",
                            status: "pending",
                            createdAt: Date.now(),
                          });
                        } catch {}
                        
                        // Send payment
                        const res = await sendPayment({
                          to: String((alias || name) as string).replace(/^@/, ""),
                          tokenId: txItem.tokenId,
                          chain: txItem.chain as ChainKey,
                          amount: String(amtNumber),
                          account: "daily",
                        });
                        
                        usePaymentsStore.getState().updateMsg(tempId, {
                          txId: res.txId,
                          status: res.status,
                          ts: res.ts || Date.now(),
                        });
                      } catch {
                        // Mark last optimistic as failed
                        const itemsForThread = usePaymentsStore.getState().selectByThread(threadId);
                        const lastTmp = itemsForThread.findLast((m) => String(m.id).startsWith("tmp_"));
                        if (lastTmp) {
                          usePaymentsStore.getState().updateMsg(lastTmp.id, { status: "failed" });
                        }
                      }
                    };
                    const cancelAction = async () => {
                      // Purely client-side cancel
                      usePaymentsStore.getState().updateMsg(item.id, { status: "canceled" });
                      try {
                        const threadsState = useThreads.getState();
                        threadsState.patchStatus(legacyPeerKey, item.id, "failed");
                      } catch {}
                    };
                    if (Platform.OS === "ios") {
                      const options: string[] = ["Cancel"];
                      const actions: Array<() => void> = [() => {}];
                      if (canRetry) { options.push("Retry send"); actions.push(retryAction); }
                      if (canCancel) { options.push("Cancel payment"); actions.push(cancelAction); }
                      options.push(hash ? "Copy hash" : "Copy hash (unavailable)"); actions.push(copyAction);
                      options.push(url ? "View on Explorer" : "View on Explorer (unavailable)"); actions.push(openExplorer);
                      ActionSheetIOS.showActionSheetWithOptions(
                        {
                          options,
                          cancelButtonIndex: 0,
                          userInterfaceStyle: "dark",
                        },
                        (i) => {
                          const fn = actions[i];
                          if (typeof fn === "function") fn();
                        }
                      );
                    } else {
                      const buttons: Array<{ text: string; onPress?: () => void; style?: "cancel" | "default" | "destructive" }> = [
                        { text: "Close", style: "cancel" }
                      ];
                      if (canRetry) buttons.push({ text: "Retry send", onPress: retryAction });
                      if (canCancel) buttons.push({ text: "Cancel payment", onPress: cancelAction });
                      buttons.push({ text: "Copy hash", onPress: copyAction });
                      buttons.push({ text: "View on Explorer", onPress: openExplorer });
                      Alert.alert("Transaction", "", buttons);
                    }
                  }}
                  style={[
                    styles.bubble,
                    compact && styles.bubbleCompact,
                    showAsTx
                      ? (isOut ? styles.bubbleOut : styles.bubbleIn)
                      : styles.bubbleRequest,
                    { maxWidth: maxW },
                  ]}
                >
                  {showAsTx ? (
                    <View style={styles.rowBubble}>
                      <View style={styles.leftInline}>
                        <Text style={styles.amountSign}>{isOut ? "–" : "+"}</Text>
                        <Text style={styles.amountNum}>{fmtAmount(amountNum, 6)}</Text>
                        <Text style={styles.amountTicker}>{tokenTicker}</Text>
                      </View>

                      {!compact && (
                        <View style={styles.tokenIconSlot}>
                          {renderTokenIcon(item.tokenId, { size: 32, inner: 24, withCircle: true })}
                          <View style={styles.chainMiniOnToken}>
                            {renderChainBadge(chainId, { size: 16, chip: true, chipPadding: 3 })}
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    /* request layout unchanged */
                    <View style={{ gap: 10 }}>
                      <View style={[styles.rowBubble, { justifyContent: "flex-start" }]}>
                        <View style={styles.tokenIconSlot}>
                          {renderTokenIcon(item.tokenId, { size: 32, inner: 24, withCircle: true })}
                          <View style={styles.chainMiniOnToken}>
                            {renderChainBadge(chainId, { size: 16, chip: true, chipPadding: 3 })}
                          </View>
                        </View>
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.reqTitle}>
                          {isIncomingReq ? "Payment request" : "Request sent"}
                          </Text>
                          <Text style={styles.reqAmount}>
                            {fmtAmount(amountNum, 6)} {tokenTicker}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.reqActionsRow}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {isIncomingReq ? (
                            // Para requests entrantes -- botones Decline & Pay
                            <>
                              <Pressable
                                onPress={() => {
                                  // Cancelar elimina el mensaje del store
                                  usePaymentsStore.getState().deleteMsg?.(item.id);
                                }}
                                disabled={item.status !== "pending"}
                                style={[
                                  styles.reqBtn,
                                  { backgroundColor: "rgba(255,255,255,0.06)" },
                                  item.status !== "pending" && { opacity: 0.5 },
                                ]}
                              >
                                <Text style={[styles.reqBtnTxt, { color: "#D8E5EC" }]}>Decline</Text>
                              </Pressable>
                              <Pressable
                                onPress={onPayRequest}
                                disabled={item.status !== "pending"}
                                style={[
                                  styles.reqBtn,
                                  { backgroundColor: "#FFB703" },
                                  item.status !== "pending" && { opacity: 0.5 },
                                ]}
                              >
                                <Text style={[styles.reqBtnTxt, { color: "#0A1A24" }]}>Pay</Text>
                              </Pressable>
                            </>
                          ) : (
                            // Para requests salientes -- el botón depende del status
                            <>
                              <Pressable
                                onPress={() => {
                                  // Cancelar elimina el mensaje del store
                                  usePaymentsStore.getState().deleteMsg?.(item.id);
                                }}
                                style={[
                                  styles.reqBtn,
                                  { backgroundColor: "rgba(255,255,255,0.06)" },
                                  item.status !== "pending" && { opacity: 0.5 },
                                ]}
                              >
                                <Text style={[styles.reqBtnTxt, { color: "#D8E5EC" }]}>Cancel</Text>
                              </Pressable>
                              {item.status === "failed" ? (
                                <Pressable
                                  onPress={() => {
                                    // RESEND: crea un nuevo request igual al anterior, con id distinto
                                    const tempId = `tmp_${Date.now()}`;
                                    usePaymentsStore.getState().addMsg({
                                      id: tempId,
                                      threadId: item.threadId,
                                      kind: item.kind === "request" ? "request" : "out",
                                      amount: item.amount,
                                      tokenId: item.tokenId,
                                      chain: item.chain as ChainKey,
                                      status: "pending",
                                      ts: Date.now(),
                                      toDisplay: item.toDisplay,
                                      meta: { ...item.meta, revivedFrom: item.id }
                                    });
                                  }}
                                  style={[
                                    styles.reqBtn,
                                    { backgroundColor: "#FFB703" }
                                  ]}
                                >
                                  <Text style={[styles.reqBtnTxt, { color: "#0A1A24" }]}>Resend</Text>
                                </Pressable>
                              ) : (
                                <Pressable
                                  onPress={onRemindRequest}
                                  disabled={item.status !== "pending"}
                                  style={[
                                    styles.reqBtn,
                                    { backgroundColor: "#FFB703" },
                                    item.status !== "pending" && { opacity: 0.5 },
                                  ]}
                                >
                                  <Text style={[styles.reqBtnTxt, { color: "#0A1A24" }]}>Remind</Text>
                                </Pressable>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>

              <View
                style={[
                  styles.metaWrap,
                  {
                    alignSelf: isOut ? "flex-end" : "flex-start",
                    maxWidth: Math.max(BUBBLE_MIN_W, width * BUBBLE_MAX_PCT),
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.metaTime}>{timeAgo(item.ts)}</Text>
                  <StatusPill status={item.status} />
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          // Si la lista está vacía, mostrar mensaje centrado
          <View style={{ marginTop: 100, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#CFE3EC", fontSize: 16, fontWeight: "800", opacity: 0.62 }}>No messages yet</Text>
          </View>
        }
        ListHeaderComponent={loadingMore ? (
          <View style={{ paddingTop: 8, paddingHorizontal: 16 }}>
            <SkeletonBubble />
          </View>
        ) : null}
      />

      {syncing && (
        <View style={{ position: "absolute", top: insets.top + 54 + 6, left: 16, right: 16, alignItems: "center" }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" }}>
            <Text style={{ color: "#CFE3EC", fontWeight: "800", fontSize: 12 }}>Syncing… retrying</Text>
          </View>
        </View>
      )}

      {/* Token Selector Sheet - Ya no se usa, token se preselecciona automáticamente en el botón Send */}

      {/* FOOTER / CTAs */}
      <View
        style={[
          styles.footer,
          {
            height: FOOTER_H,
            paddingBottom: insets.bottom + 14,
            borderTopWidth: 0,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: Math.max(0, lineTop),
            height: StyleSheet.hairlineWidth,
            backgroundColor: `rgba(255,255,255,${SEPARATOR_ALPHA})`,
          }}
        />

        {String(isGroup) === "1" ? (
          // Para grupos: solo mostrar "Send Bill"
          <View style={{ flex: 1 }}>
            <CTAButton
              title="Send Bill"
              onPress={() => {
                router.push({
                  pathname: "/(drawer)/(internal)/payments/QuickSendGroupScreen",
                  params: {
                    id: id as string,
                    name: displayName,
                    alias: String(alias || name),
                    to: alias || name,
                    avatar,
                    emoji,
                    ...(recipientKind && { recipientKind }),
                    ...(recipientAddress && { recipientAddress }),
                    returnPathname: "/(drawer)/(internal)/payments/thread",
                    returnAlias: String(alias || name),
                  },
                });
              }}
              variant="primary"
              backdrop="solid"
              color="#C8D2D9"
              labelColor="#0A1A24"
              size="md"
              fullWidth
            />
          </View>
        ) : (
          // Para usuarios individuales: Request y Send
          <>
            <View style={{ flex: 1 }}>
              <CTAButton
                title="Request"
                onPress={() =>
                  router.push({
                  pathname: "/(drawer)/(internal)/payments/QuickRequestScreen",
                  params: {
                    to: alias || name,
                    avatar,
                    emoji,
                    returnPathname: "/(drawer)/(internal)/payments/thread",
                    returnAlias: String(alias || name),
                    ...(recipientKind && { recipientKind }),
                    ...(recipientAddress && { recipientAddress }),
                  },
                })
                }
                variant="secondary"
                tone="dark"
                backdrop="solid"
                size="md"
                fullWidth
              />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <CTAButton
                title="Send"
                onPress={() => {
                  // Preseleccionar token automáticamente usando smartTokenPreselect
                  // e ir directamente a QuickSendScreen sin mostrar selector
                  try {
                    const { useBalancesStore } = require("@/store/balances");
                    const userPrefs = useUserPrefs.getState();
                    const balancesFlat = useBalancesStore.getState().flat || [];
                    
                    // Formatear balances para smartTokenPreselect
                    const byToken: Record<string, Partial<Record<ChainKey, number>>> = {};
                    for (const b of balancesFlat) {
                      const id = (b.tokenId || "").toLowerCase();
                      if (!byToken[id]) byToken[id] = {};
                      byToken[id][b.chain as ChainKey] = (byToken[id][b.chain as ChainKey] || 0) + (b.amount || 0);
                    }
                    
                    // Detectar tipo de destinatario
                    const recipientStr = alias || name || "";
                    const parsed = parseRecipient(recipientStr);
                    const recipientKind = parsed?.kind === "hihodl" ? "hihodl" : parsed?.kind === "sol" ? "sol" : parsed?.kind === "evm" ? "evm" : undefined;
                    const recipientChain = (parsed?.toChain || parsed?.resolved?.chain) as ChainKey | undefined;
                    
                    // Preseleccionar token usando todas las reglas inteligentes
                    const smartPick = smartTokenPreselect({
                      prefTokenId: userPrefs.defaultTokenId,
                      favoriteChainByToken: userPrefs.favoriteChainByToken,
                      recentTokenIds: [], // TODO: obtener de cache si está disponible
                      recipientChain,
                      balances: byToken,
                      recipientKind: recipientKind,
                      lastUsedWithRecipient: undefined, // TODO: obtener del historial
                    });
                    
                    // Navegar directamente a QuickSendScreen con token preseleccionado
                    router.push({
                      pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
                      params: {
                        id: id as string,
                        name: displayName,
                        alias: String(alias || name),
                        to: alias || name,
                        avatar,
                        emoji,
                        ...(smartPick?.tokenId && { tokenId: smartPick.tokenId }),
                        ...(smartPick?.chain && { chain: smartPick.chain }),
                        ...(recipientKind && { recipientKind }),
                        ...(recipientAddress && { recipientAddress }),
                        returnPathname: "/(drawer)/(internal)/payments/thread",
                        returnAlias: String(alias || name),
                      },
                    });
                  } catch (e) {
                    // Fallback: si falla la preselección, usar valores por defecto
                    router.push({
                      pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
                      params: {
                        id: id as string,
                        name: displayName,
                        alias: String(alias || name),
                        to: alias || name,
                        avatar,
                        emoji,
                        tokenId: "usdc",
                        chain: "solana",
                        ...(recipientKind && { recipientKind }),
                        ...(recipientAddress && { recipientAddress }),
                        returnPathname: "/(drawer)/(internal)/payments/thread",
                        returnAlias: String(alias || name),
                      },
                    });
                  }
                }}
                variant="primary"
                backdrop="solid"
                color="#C8D2D9"
                labelColor="#0A1A24"
                size="md"
                fullWidth
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}


/* =========================================================================
   Styles
   ======================================================================== */
const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: BG,
    ...(Platform.OS === "android" && {
      // Asegurar que el fondo se renderice en Android
      minHeight: "100%",
    }),
  },

  contactInfo: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 220 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarCircle: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  name: { color: "#fff", fontWeight: "700", fontSize: 15 },

  dayLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "600" },

  bubbleWrap: { width: "100%", marginVertical: 6 },
  alignLeft: { alignItems: "flex-start" },
  alignRight: { alignItems: "flex-end" },

  bubble: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  bubbleCompact: { paddingVertical: 8, paddingHorizontal: 12 },
  bubbleIn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleOut: {
    backgroundColor: "rgba(255, 183, 3, 0.15)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleRequest: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },

  rowBubble: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },

  leftInline: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  amountSign: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  amountNum: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  amountTicker: { color: "#fff", fontWeight: "800", fontSize: 13, opacity: 0.9, paddingTop: 1 },

  tokenIconSlot: { width: 36, height: 36, alignItems: "center", justifyContent: "center", position: "relative" },
  chainMiniOnToken: { position: "absolute", right: -4, bottom: -6 },

  reqTitle: { color: "#CFE3EC", fontWeight: "800", fontSize: 12, opacity: 0.9 },
  reqAmount: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
  reqActionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
  reqBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  reqBtnTxt: { fontWeight: "900", fontSize: 13 },

  metaWrap: { marginTop: 6, alignItems: "flex-end" },
  metaTime: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "600" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "rgba(6,14,20,0.02)",
    flexDirection: "row",
    alignItems: "center",
  },

  // Filter/Search
  seg: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  segActive: {
    backgroundColor: "#FFB703",
  },
  segTxt: { color: "#CFE3EC", fontWeight: "800", fontSize: 12 },
  segTxtActive: { color: "#0A1A24" },
  searchWrap: {
    flexShrink: 1,
    minWidth: 120,
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: { color: "#fff", fontSize: 12, fontWeight: "700", padding: 0 },
});