// src/payments/PaymentsThread.tsx
import React, { useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
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
import { useNavigation } from "expo-router";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import {
  renderTokenIcon,
  renderChainBadge,
  mapChainKeyToChainId,
} from "@/config/iconRegistry";

// Store
import { usePaymentsStore } from "@/store/payments";
import { useThreads } from "@/store/threads";
import { pollSolanaStatus } from "@/services/solanaTx";
import { SkeletonBubble } from "@/ui/Skeleton";
import { pollEvmStatus } from "@/services/evmTx";
import { sendPayment } from "@/send/api/sendPayment";
import { notifyPaymentSent } from "@/lib/notifications";
import { useUserPrefs } from "@/store/userPrefs";

/* =========================================================================
   Types
   ======================================================================== */
type ChainKeyUi = "Solana" | "Base" | "Ethereum" | "Polygon" | string;

type MsgBase = {
  id: string;
  threadId: string;
  ts: number;
  status: "pending" | "confirmed" | "failed" | "canceled"; // US spelling
  toDisplay?: string;
};

type TxMsg = MsgBase & {
  kind: "tx";
  direction: "out" | "in";
  tokenId: string; // "USDC.circle"
  chain: string; // "solana" | "base" | ...
  amount: number;
  txHash?: string;
};

type RequestMsg = MsgBase & {
  kind: "request";
  tokenId: string;
  chain: string;
  amount: number;
  meta?: {
    requestId?: string;
    fromUid?: string;
    toUid?: string;
    isIncoming?: boolean; // <-- clave para decidir UI
  };
};

type AnyMsg = TxMsg | RequestMsg;

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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<any>);

// Fallback estable para el selector de Zustand
const EMPTY_LIST: AnyMsg[] = [];
const EMPTY_LEGACY_ITEMS: any[] = [];

/* =========================================================================
   Safe helpers (lowercase + locale)
   ======================================================================== */
const lc = (s?: string) => (typeof s === "string" ? s.toLowerCase() : "");
const safeLocale = () => {
  try {
    // Usa el locale real si hay Intl disponible, si no, fallback estable
    // (algunos entornos RN/Android tienen polyfill parcial y fallan con undefined)
    const l =
      (typeof Intl !== "undefined" &&
        typeof Intl.DateTimeFormat === "function" &&
        new Intl.DateTimeFormat().resolvedOptions().locale) ||
      undefined;
    return l || "en-US";
  } catch {
    return "en-US";
  }
};


const fmtAmount = (n?: number, max = 6) => {
  const v = Number(n);
  return Number.isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: max })
    : "0";
};

/* =========================================================================
   Helpers
   ======================================================================== */
function dayLabelFromEpoch(ms: number | undefined) {
  if (!ms) return "Hoy";
  const d = new Date(ms);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return d.toLocaleDateString(safeLocale(), { day: "2-digit", month: "short" });
}
function isFirstOfDay(list: AnyMsg[], idx: number) {
  if (idx === 0) return true;
  return dayLabelFromEpoch(list[idx].ts) !== dayLabelFromEpoch(list[idx - 1].ts);
}
function chainIdFromStr(chain?: string) {
  // 🔒 evitar `.toLowerCase()` sobre undefined y dar un default estable
  const key = lc(chain) || "sol"; // cámbialo si tu red base es otra
  return mapChainKeyToChainId(key as any);
}
function tokenTickerFromId(tokenId?: string) {
  const base = (tokenId || "usdc").split(".")[0] || "usdc";
  return base.toUpperCase();
}
function avatarNode(avatar?: string, fallbackEmoji: string = "👤") {
  if (avatar?.startsWith?.("emoji:")) {
    const e = avatar.split(":")[1] || fallbackEmoji;
    return (
      <View style={[styles.avatar, styles.avatarCircle]}>
        <Text style={{ fontSize: 16 }}>{e}</Text>
      </View>
    );
  }
  if (avatar) return <Image source={{ uri: String(avatar) }} style={styles.avatar} />;
  return (
    <View style={[styles.avatar, styles.avatarCircle]}>
      <Text style={{ fontSize: 16 }}>{fallbackEmoji}</Text>
    </View>
  );
}
function fmtTime(ms?: number) {
  if (!ms) return "";
  const d = new Date(ms);
  // 🔒 mismo motivo que arriba: evitar locale undefined
  return d.toLocaleTimeString(safeLocale(), { hour: "2-digit", minute: "2-digit" });
}
function timeAgo(ms?: number) {
  if (!ms) return "";
  const now = Date.now();
  const diff = Math.max(0, now - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}
function statusBadgeText(s: AnyMsg["status"] | "cancelled") {
  // tolerante a UK spelling por compat visual
  switch (s) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "failed":
      return "Failed";
    case "canceled":
    case "cancelled":
      return "Cancelled";
    default:
      return String(s);
  }
}

function explorerUrl(chain?: string, txHash?: string) {
  const h = String(txHash || "").trim();
  if (!h) return undefined;
  const c = (chain || "").toLowerCase();
  if (c.includes("sol")) return `https://solscan.io/tx/${h}`;
  if (c.includes("base")) return `https://basescan.org/tx/${h}`;
  if (c.includes("eth")) return `https://etherscan.io/tx/${h}`;
  if (c.includes("poly") || c.includes("matic")) return `https://polygonscan.com/tx/${h}`;
  return undefined;
}

/* =========================================================================
   Component
   ======================================================================== */
export default function PaymentsThread() {
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { t } = useTranslation(["payments"]);
  const [syncing, setSyncing] = React.useState(false);
  const compact = useUserPrefs((s: any) => s.threadCompact) as boolean;
  const setCompact = useUserPrefs((s: any) => s.setThreadCompact) as (v: boolean) => void;
  const notifiedRef = React.useRef<Set<string>>(new Set());
  const retryCountRef = React.useRef<Map<string, number>>(new Map());
  const lastAttemptRef = React.useRef<Map<string, number>>(new Map());
  const [filter, setFilter] = React.useState<"all" | "payments" | "requests">("all");
  const [query, setQuery] = React.useState("");
  const PAGE_SIZE = 30;
  const [pages, setPages] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [showSearchBar, setShowSearchBar] = React.useState(false); // <- NUEVO
  const [querySearchBar, setQuerySearchBar] = React.useState(""); // <- NUEVO
  const inputSearchBarRef = React.useRef<TextInput | null>(null); // fix tipo ref

  React.useEffect(() => {
    // Avoid native back button context menu (iOS long-press) which can bypass JS
    try {
      navigation.setOptions?.({ headerBackButtonMenuEnabled: false });
    } catch {}
  }, [navigation]);

  const { id, name = "@user", alias = "@user", avatar, emoji, isGroup } =
    useLocalSearchParams<{ id?: string; name?: string; alias?: string; avatar?: string; emoji?: string; isGroup?: string }>();

  // thread id
  const threadId = useMemo(() => {
    if (id) return String(id);
    const handle = String(alias || name).replace(/^@/, "");
    return `peer:${handle}`;
  }, [id, alias, name]);

  const HEADER_H = insets.top + 6 + 54;
  const lineTop = FOOTER_H - CTA_H - (insets.bottom + 14) - LINE_GAP;

// Clave legacy para threads (store antiguo)
const legacyPeerKey = useMemo(() => {
  const handle = String(alias || name).replace(/^@/, "");
  return `@${handle}`;
}, [alias, name]);

// 1) Datos desde ambos stores usando suscripciones (evita getSnapshot loops)
const [paymentsItems, setPaymentsItems] = React.useState<AnyMsg[]>(EMPTY_LIST);
const [legacyItemsRaw, setLegacyItemsRaw] = React.useState<any[]>(EMPTY_LEGACY_ITEMS);

// payments store
React.useEffect(() => {
  const pick = () => {
    const s = usePaymentsStore.getState() as any;
    const arr: AnyMsg[] =
      (typeof s.selectByThread === "function"
        ? (s.selectByThread(threadId) as AnyMsg[] | undefined)
        : (s.byThread?.[threadId] as AnyMsg[] | undefined)) || EMPTY_LIST;
    setPaymentsItems(arr);
  };
  pick();
  const unsub = usePaymentsStore.subscribe(pick);
  return unsub;
}, [threadId]);

// legacy threads store
React.useEffect(() => {
  const pick = () => {
    try {
      const s = (useThreads as any).getState?.();
      const arr = (s?.threads?.[legacyPeerKey]?.items as any[]) || EMPTY_LEGACY_ITEMS;
      setLegacyItemsRaw(arr);
    } catch {
      setLegacyItemsRaw(EMPTY_LEGACY_ITEMS);
    }
  };
  pick();
  const unsub = (useThreads as any).subscribe?.(pick);
  return unsub;
}, [legacyPeerKey]);

// 2) Map legacy → AnyMsg, merge, dedupe por id y sort asc por ts
const items = useMemo(() => {
  const legacyMapped: AnyMsg[] = (legacyItemsRaw || []).flatMap((it: any) => {
    if (!it) return [];
    if (it.kind === "tx") {
      const status = it.status === "processed" ? "pending" : it.status; // normaliza
      const direction =
        it.direction === "out" || it.direction === "in" ? it.direction : "out";
      return [
        {
          id: String(it.id ?? ""),
          threadId,
          kind: "tx",
          direction,
          tokenId: String(it.token ?? "usdc"),
          chain: String(it.chain ?? "solana"),
          amount: Number(it.amount ?? 0),
          status: status as AnyMsg["status"],
          ts: Number(it.createdAt ?? Date.now()),
          txHash: String(it.signature ?? it.hash ?? it.txHash ?? ""),
        } as AnyMsg,
      ];
    }
    // ignoramos notes por ahora
    return [];
  });

  const merged: AnyMsg[] = [
    // map payments store to include txHash for polling
    ...paymentsItems.map((m: any) => ({ ...m, kind: m.kind ?? "tx", txHash: m.txId })),
    ...legacyMapped,
  ];

  const mapById = new Map<string, AnyMsg>();
  for (const it of merged) {
    const k = String(it?.id ?? "");
    if (!k) continue;
    mapById.set(k, it); // el último pisa
  }

  const uniq = Array.from(mapById.values());
  return uniq.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
}, [paymentsItems, legacyItemsRaw, threadId]);

// Filtered + searched items
const realQuery = showSearchBar ? querySearchBar : "";
const filteredItems = React.useMemo(() => {
  const q = realQuery.trim().toLowerCase();
  return items.filter((it) => {
    // filter by kind
    if (filter === "payments" && it.kind === "request") return false;
    if (filter === "requests" && it.kind !== "request") return false;

    if (!q) return true;
    // match by amount, token ticker, status, peer display
    const amountStr = String((it as any).amount ?? "");
    const token = tokenTickerFromId((it as any).tokenId ?? "").toLowerCase();
    const status = String((it as any).status ?? "").toLowerCase();
    const peer = String((it as any).toDisplay ?? alias ?? name).toLowerCase();
    return (
      amountStr.includes(q) || token.includes(q) || status.includes(q) || peer.includes(q)
    );
  });
}, [items, filter, query, alias, name]);

// Visible items window (paginate from end)
const visibleItems = React.useMemo(() => {
  const total = filteredItems.length;
  const keep = Math.max(PAGE_SIZE, Math.min(total, PAGE_SIZE * pages));
  return filteredItems.slice(Math.max(0, total - keep));
}, [filteredItems, pages]);

React.useEffect(() => {
  setPages(1);
}, [filter, query, threadId]);

// === Auto-poll statuses with backoff and retry limits ===
React.useEffect(() => {
  let cancelled = false;
  const MAX_ATTEMPTS = 30; // ~ capped attempts per tx
  const baseDelay = 1000; // ms
  const backoffFor = (attempt: number) => Math.min(15000, Math.round(baseDelay * Math.pow(1.6, attempt)));

  const pending = items.filter(
    (it) => (it as any).kind === "tx" && it.status === "pending" && ((it as any).txHash || (it as any).txId)
  );

  // Prime retry maps with new ids
  const now = Date.now();
  for (const it of pending) {
    if (!retryCountRef.current.has(it.id)) retryCountRef.current.set(it.id, 0);
    if (!lastAttemptRef.current.has(it.id)) lastAttemptRef.current.set(it.id, 0);
  }
  // Drop maps for non-pending ids
  for (const key of Array.from(retryCountRef.current.keys())) {
    if (!pending.find((p) => p.id === key)) {
      retryCountRef.current.delete(key);
      lastAttemptRef.current.delete(key);
    }
  }
  if (pending.length === 0) {
    setSyncing(false);
    return;
  }
  let timer: any;

  // Limpieza al navegar atrás (back o swipe back)
  const removeListener = navigation?.addListener?.("beforeRemove", (e: any) => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  });

  const loop = async () => {
    if (cancelled) return;
    setSyncing(true);
    let hadAnyError = false;
    for (const it of pending) {
      if (cancelled) return;
      const attempts = retryCountRef.current.get(it.id) ?? 0;
      if (attempts >= MAX_ATTEMPTS) continue; // stop trying this tx
      const last = lastAttemptRef.current.get(it.id) ?? 0;
      const waitMs = backoffFor(attempts);
      if (now - last < waitMs) continue; // not yet time for this id
      const chain = String((it as any).chain || "").toLowerCase();
      const txHash = (it as any).txHash || (it as any).txId;
      let next: "pending" | "confirmed" | "failed" | undefined;
      try {
        if (chain.includes("sol")) {
          const st = await pollSolanaStatus(txHash);
          if (st === "failed") next = "failed";
          else if (st === "confirmed" || st === "finalized" || st === "processed") next = "confirmed";
        } else {
          const st = await pollEvmStatus(chain, txHash);
          if (st === "failed") next = "failed";
          else if (st === "confirmed") next = "confirmed";
        }
      } catch {
        hadAnyError = true;
      } finally {
        lastAttemptRef.current.set(it.id, Date.now());
        retryCountRef.current.set(it.id, attempts + 1);
      }
      if (next && !cancelled) {
        usePaymentsStore.getState().updateMsg(it.id, { status: next });
        try {
          const peerKey = legacyPeerKey;
          (useThreads as any).getState?.().patchStatus?.(peerKey, it.id, next);
        } catch {}
        if (next === "confirmed" && !notifiedRef.current.has(it.id)) {
          notifiedRef.current.add(it.id);
          try {
            await notifyPaymentSent({
              amount: (it as any).amount,
              token: tokenTickerFromId((it as any).tokenId),
              to: (it as any).toDisplay ?? alias ?? name,
            });
          } catch {}
        }
        // clear tracking for this id
        retryCountRef.current.delete(it.id);
        lastAttemptRef.current.delete(it.id);
      }
    }
    setSyncing(hadAnyError);
    // schedule next sweep
    if (!cancelled) timer = setTimeout(loop, 1000);
  };

  loop();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    if (removeListener) removeListener();
  };
}, [items, legacyPeerKey]);


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
          <View style={styles.contactInfo}>
            {avatarNode(emoji ? `emoji:${emoji}` : avatar)}
            <Text style={styles.name} numberOfLines={1}>
              {alias || name}
            </Text>
          </View>
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
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
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
    return base ? `${base}:${extra}` : `idx:${idx}`; }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_H + 8 + 36,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + FOOTER_H + FOOTER_TOP_GAP + 12,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          {
            useNativeDriver: true,
            // RN types can be strict; accept any to safely access contentOffset
            listener: (e: any) => {
              const y: number = (e?.nativeEvent?.contentOffset?.y as number) ?? 0;
              if (y < 80 && !loadingMore) {
                const total = filteredItems.length;
                const showing = visibleItems.length;
                if (showing < total) {
                  setLoadingMore(true);
                  setTimeout(() => {
                    setPages((p) => p + 1);
                    setLoadingMore(false);
                  }, 200);
                }
              }
            },
          }
        )}
        renderItem={({ item, index }) => {
          const isTx =
          item.kind === "tx" || item.kind === "out" || item.kind === "in";
          const isOut =
            item.kind === "tx"
              ? (item as any).direction === "out"
              : item.kind === "out";

          const showAsTx = isTx; // para legibilidad
          const chainId = chainIdFromStr(item.chain);
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
              amount: String(amountNum),
              tokenId: item.tokenId,
              chain: item.chain,
              intent: "pay_request",
              requestId: (item as RequestMsg).meta?.requestId ?? "",
              // ↓↓↓ NUEVO: para que QuickSend vuelva con replace al mismo thread
              returnPathname: "/(drawer)/(internal)/payments/thread",
              returnAlias: String(alias || name),
            },
          });
          };

          const onDeclineRequest = () => {
            if (item.kind !== "request") return;
            usePaymentsStore.getState().updateMsg(item.id, { status: "canceled" });
          };

          const onRemindRequest = () => {
          if (item.kind !== "request") return;
          const s: any = usePaymentsStore.getState();
          if (typeof s.remindRequest === "function") {
            s.remindRequest(item.id);
          } else if (typeof s.resendRequest === "function") {
            s.resendRequest(item.id);
          } else if (typeof s.updateMsg === "function") {
            // Fallback: pequeño tickle para refrescar UI
            s.updateMsg(item.id, { ts: Date.now() });
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
                      dir: item.direction === "out" ? "out" : "in",
                      token: tokenTicker,
                      amount: String(amountNum),
                      status: item.status === "confirmed" ? "Succeeded" : item.status === "failed" ? "Failed" : "Pending",
                      dateISO: new Date(item.ts).toISOString(),
                      chain: item.chain,           // por si no tienes CAIP directo
                      network: "eip155:8453",      // si ya lo sabes, mejor
                      hash: item.txHash,
                      peer: item.toDisplay ?? alias ?? name,
                      fee: "0.0005 ETH",
                    },
                  });
                  } catch { /* noop si aún no existe la sheet */ }
                }}
                  onLongPress={() => {
                    const hash = (item as any).txHash || (item as any).txId;
                    const url = explorerUrl(item.chain, hash);
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
                        const amtNumber = Number((item as any).amount ?? 0);
                        const tempId = `tmp_${Date.now()}`;
                        const threadKey = threadId;
                        // optimistic add
                        usePaymentsStore.getState().addMsg({
                          id: tempId,
                          threadId: threadKey,
                          kind: "out" as any,
                          amount: amtNumber,
                          tokenId: (item as any).tokenId,
                          chain: (item as any).chain as any,
                          status: "pending" as any,
                          ts: Date.now(),
                          toDisplay: (item as any).toDisplay ?? (alias || name),
                        } as any);
                        // mirror legacy
                        try {
                          (useThreads as any).getState?.().upsert?.(legacyPeerKey, {
                            id: tempId,
                            kind: "tx",
                            direction: "out",
                            amount: String(amtNumber),
                            token: (item as any).tokenId,
                            chain: (item as any).chain,
                            status: "pending",
                            createdAt: Date.now(),
                          });
                        } catch {}
                        // send
                        const res = await sendPayment({
                          to: String((alias || name) as string).replace(/^@/, ""),
                          tokenId: (item as any).tokenId,
                          chain: (item as any).chain as any,
                          amount: String(amtNumber),
                          account: "daily" as any,
                        });
                        usePaymentsStore.getState().updateMsg(tempId, {
                          txId: res.txId,
                          status: res.status,
                          ts: res.ts || Date.now(),
                        } as any);
                      } catch {
                        // mark last optimistic as failed
                        const itemsForThread = usePaymentsStore.getState().selectByThread(threadId);
                        const lastTmp = [...itemsForThread].reverse().find((m: any) => String(m.id).startsWith("tmp_"));
                        if (lastTmp) usePaymentsStore.getState().updateMsg(lastTmp.id, { status: "failed" } as any);
                      }
                    };
                    const cancelAction = async () => {
                      // purely client-side cancel: set status to canceled
                      usePaymentsStore.getState().updateMsg(item.id, { status: "canceled" } as any);
                      try {
                        (useThreads as any).getState?.().patchStatus?.(legacyPeerKey, item.id, "failed");
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
                        (i) => { const fn = actions[i] as any; if (typeof fn === "function") fn(); }
                      );
                    } else {
                      const buttons: any[] = [{ text: "Close", style: "cancel" }];
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
                                      ...item,
                                      id: tempId,
                                      status: "pending",
                                      ts: Date.now(),
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

        <View style={{ flex: 1 }}>
          <CTAButton
            title="Request"
            onPress={() =>
              router.push({
              pathname: "/(drawer)/(internal)/payments/QuickRequestScreen",
              params: {
                to: alias || name,
                avatar,
                returnPathname: "/(drawer)/(internal)/payments/thread",
                returnAlias: String(alias || name),
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
              const pathname = String(isGroup) === "1"
                ? "/(drawer)/(internal)/payments/QuickSendGroupScreen"
                : "/(drawer)/(internal)/payments/QuickSendScreen";
              router.push({
                pathname,
                params: {
                  id: id as string,
                  name: String(alias || name),
                  to: alias || name,
                  avatar,
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
      </View>
    </View>
  );
}

/* =========================================================================
   UI auxiliares
   ======================================================================== */
function StatusPill({ status }: { status: AnyMsg["status"] | "cancelled" }) {
  const label = statusBadgeText(status);
  const bg =
    status === "pending"
      ? "rgba(255,255,255,0.08)"
      : status === "confirmed"
      ? "rgba(46, 204, 113, 0.18)"
      : status === "failed"
      ? "rgba(231, 76, 60, 0.18)"
      : "rgba(149, 165, 166, 0.18)";
  const color =
    status === "pending"
      ? "#CFE3EC"
      : status === "confirmed"
      ? "#2ECC71"
      : status === "failed"
      ? "#E74C3C"
      : "#C8D2D9";
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bg }}>
      <Text style={{ color, fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/* =========================================================================
   Styles
   ======================================================================== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

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