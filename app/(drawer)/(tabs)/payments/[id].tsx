// app/(tabs)/token/[id].tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  ToastAndroid,
  Share,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";

import colors, { alpha } from "@/theme/colors";
import BottomSheet from "@/components/BottomSheet/BottomSheet";
import Popover, { type AnchorRect } from "@/components/Popover";
import { DEFAULT_TOKEN_ICON, TOKEN_ICONS } from "@/config/iconRegistry";
import {
  usePortfolioStore,
  type Position,
  type ChainId,
  type CurrencyId,
} from "@/store/portfolio.store";

import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import ExtraBadge from "@assets/chains/extra-chain.svg";

/* ================= helpers ================= */
const BG = colors.navBg;
const TEXT_DIM = "#9FB7C2";
const YELLOW = colors.primary;
const CTA_NEUTRAL = "#CFE3EC";
const HIT = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const href = <P extends Record<string, string>>(pathname: `/${string}`, params?: P) =>
  ({ pathname: pathname as any, params } as unknown as Href);

const CHAIN_BADGE: Record<ChainId, { Icon: React.ComponentType<any> }> = {
  "eip155:1": { Icon: EthBadge },
  "solana:mainnet": { Icon: SolBadge },
  "eip155:8453": { Icon: BaseBadge },
  "eip155:137": { Icon: PolyBadge },
};
const CHAIN_LABEL: Record<ChainId, string> = {
  "eip155:1": "Ethereum",
  "solana:mainnet": "Solana",
  "eip155:8453": "Base",
  "eip155:137": "Polygon",
};
const SCAN_BY_CHAIN: Record<ChainId, string> = {
  "eip155:1": "https://etherscan.io",
  "eip155:8453": "https://basescan.org",
  "eip155:137": "https://polygonscan.com",
  "solana:mainnet": "https://solscan.io",
};
const EXPLORER_LABEL: Record<ChainId, string> = {
  "eip155:1": "Etherscan",
  "eip155:8453": "BaseScan",
  "eip155:137": "PolygonScan",
  "solana:mainnet": "Solscan",
};

const RECOMMENDED_ORDER: ChainId[] = ["solana:mainnet", "eip155:8453", "eip155:137", "eip155:1"];
const pickRecommendedChain = (chains: ChainId[]) =>
  (RECOMMENDED_ORDER.find((c) => chains.includes(c)) ?? chains[0] ?? "eip155:1") as ChainId;

const normalizeChainId = (raw?: string | string[]): ChainId | undefined => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return;
  if (v === "base:mainnet") return "eip155:8453";
  if (/^eip155:\d+$/.test(v) || v === "solana:mainnet") return v as ChainId;
  return undefined;
};

const CURRENCY_LABEL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USD Coin",
  "USDT.tether": "Tether",
  "ETH.native": "Ethereum",
  "SOL.native": "Solana",
  "POL.native": "Polygon",
  "BTC.native": "Bitcoin",
  "DAI.maker": "DAI",
};
const CURRENCY_SYMBOL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "USDT.tether": "USDT",
  "ETH.native": "ETH",
  "SOL.native": "SOL",
  "POL.native": "POL",
  "BTC.native": "BTC",
  "DAI.maker": "DAI",
};

// nativo por chain
const CHAIN_NATIVE: Record<ChainId, CurrencyId> = {
  "eip155:1": "ETH.native",
  "eip155:8453": "ETH.native",
  "eip155:137": "POL.native",
  "solana:mainnet": "SOL.native",
};
const NATIVE_IDS = new Set<CurrencyId>(["ETH.native", "SOL.native", "POL.native"] as CurrencyId[]);
const isNative = (cid: CurrencyId) => NATIVE_IDS.has(cid);

/* ======= Token metadata (local mock) ======= */
type TokenMeta = {
  about?: string;
  explorerByChain?: Partial<Record<ChainId, string>>;
};
const TOKEN_META_REGISTRY: Partial<Record<CurrencyId, TokenMeta>> = {
  "ETH.native": { about: "Ethereum…", explorerByChain: { "eip155:1": SCAN_BY_CHAIN["eip155:1"] } },
  "USDC.circle": {
    about: "USDC…",
    explorerByChain: {
      "eip155:1": SCAN_BY_CHAIN["eip155:1"],
      "eip155:8453": SCAN_BY_CHAIN["eip155:8453"],
      "eip155:137": SCAN_BY_CHAIN["eip155:137"],
      "solana:mainnet": SCAN_BY_CHAIN["solana:mainnet"],
    },
  },
};
const useTokenMeta = (id: CurrencyId): TokenMeta => TOKEN_META_REGISTRY[id] ?? {};

/* ======= minis de chain ======= */
const MINI = 18;
const ChainMini = ({ chainId, size = MINI }: { chainId: ChainId; size?: number }) => {
  const meta = CHAIN_BADGE[chainId];
  if (!meta) return null;
  const { Icon } = meta;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 6,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon width={Math.max(8, size - 4)} height={Math.max(8, size - 4)} />
    </View>
  );
};
const ChainCountMini = ({ count, size = MINI }: { count: number; size?: number }) => (
  <View
    style={{
      width: 14,
      height: 12,
      borderRadius: size / 2,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    <ExtraBadge width={size} height={size} />
    <Text style={{ position: "absolute", color: "#000", fontSize: size * 0.55, fontWeight: "800" }}>
      {count}
    </Text>
  </View>
);

type IconDef =
  | { kind: "svg"; Comp: React.ComponentType<{ width: number; height: number }> }
  | { kind: "img"; src: any };

function TokenIcon({ currencyId, chains = [] as ChainId[] }: { currencyId: CurrencyId; chains?: ChainId[] }) {
  const def = (TOKEN_ICONS[currencyId] ?? DEFAULT_TOKEN_ICON) as IconDef;
  const primary = chains[0];
  const extra = Math.max(0, chains.length - (primary ? 1 : 0));
  const showMini = !!primary && !isNative(currencyId);

  return (
    <View style={{ width: 36, height: 36, position: "relative" }}>
      {def.kind === "svg" ? (
        <def.Comp width={36} height={36} />
      ) : (
        <Image source={def.src} style={{ width: 36, height: 36 }} resizeMode="contain" />
      )}
      {showMini && (
        <View style={{ position: "absolute", right: -2, bottom: -6 }}>
          <ChainMini chainId={primary!} size={18} />
        </View>
      )}
      {showMini && extra > 0 && (
        <View style={{ position: "absolute", left: 6, bottom: -6 }}>
          <ChainCountMini count={extra} size={18} />
        </View>
      )}
    </View>
  );
}

/* ===================== Screen ===================== */
export default function TokenDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { id, chainId: rawChainParam, accountId: accountIdParam } = useLocalSearchParams<{
    id: CurrencyId | string;
    chainId?: ChainId | string | string[];
    accountId?: string;
  }>();
  const cid = id as CurrencyId;
  const chainIdParam = normalizeChainId(rawChainParam);

  // store
  const positions = usePortfolioStore((s) => s.positions);

  // posiciones
  const positionsForToken = useMemo(
    () => positions.filter((p) => p?.currencyId === cid),
    [positions, cid]
  );

  const positionsForAccount = useMemo(() => {
    if (!accountIdParam) return positionsForToken;
    const target = String(accountIdParam).toLowerCase();
    return positionsForToken.filter((p: any) => String(p?.accountId ?? "").toLowerCase() === target);
  }, [positionsForToken, accountIdParam]);

  // redes con balance
  const chainsWithBalance = useMemo(() => {
    const set = new Set<ChainId>();
    for (const p of positionsForAccount) {
      const v = (p?.fiatValue ?? 0) > 0 || (p?.balance ?? 0) > 0;
      if (v && p?.chainId) set.add(p.chainId);
    }
    return Array.from(set);
  }, [positionsForAccount]);

  // permitidas
  const allowedChains: ChainId[] = useMemo(() => {
    const set = new Set<ChainId>();
    for (const p of positionsForToken) if (p?.chainId) set.add(p.chainId);
    const arr = Array.from(set);
    return arr.length ? arr : (["eip155:1"] as ChainId[]);
  }, [positionsForToken]);

  // activa
  const activeChain: ChainId | undefined = useMemo(() => {
    if (chainIdParam && allowedChains.includes(chainIdParam)) return chainIdParam;
    const balAndValid = chainsWithBalance.filter((c) => allowedChains.includes(c));
    if (balAndValid.length > 0) return pickRecommendedChain(balAndValid);
    if (allowedChains.length > 0) return pickRecommendedChain(allowedChains);
    return undefined;
  }, [chainIdParam, chainsWithBalance, allowedChains]);

  // posición activa
  const activePos: Position | undefined = useMemo(() => {
    if (!activeChain) return undefined;
    const pool = positionsForAccount.length ? positionsForAccount : positionsForToken;
    return pool.find((p) => p?.chainId === activeChain);
  }, [activeChain, positionsForAccount, positionsForToken]);

  // UI
  const name = CURRENCY_LABEL[cid] ?? String(cid);
  const sym = CURRENCY_SYMBOL[cid] ?? String(cid);
  const priceUsd = (activePos as any)?.priceUSD ?? 1;
  const activeUsd = activePos?.fiatValue ?? 0;
  const activeAmt = activePos?.balance ?? 0;
  const deltaUsd = (activePos as any)?.change24hUSD ?? 0;
  const deltaPct = (activePos as any)?.pctChange24h ?? 0;
  const up = (deltaUsd ?? 0) >= 0;

  // meta
  const tokenMeta = useTokenMeta(cid);

  /* ---- Follow ---- */
  const [follow, setFollow] = useState(false);
  const toggleFollow = useCallback(() => {
    void Haptics.selectionAsync();
    setFollow((v) => !v);
    if (Platform.OS === "android") {
      ToastAndroid.show(!follow ? "Following" : "Unfollowed", ToastAndroid.SHORT);
    }
  }, [follow]);

  /* ================== Popover More ================== */
  const moreRef = useRef<View>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);

  const captureAnchor = useCallback(() => {
    moreRef.current?.measureInWindow((x, y, w, h) => setAnchorRect({ x, y, w, h }));
  }, []);

  const openMore = useCallback(() => {
    void Haptics.selectionAsync();
    if (!anchorRect) {
      moreRef.current?.measureInWindow((x, y, w, h) => {
        setAnchorRect({ x, y, w, h });
        setMoreOpen(true);
      });
    } else {
      setMoreOpen(true);
    }
  }, [anchorRect]);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  // Explorer utils
  const explorerUrlForToken = useCallback(
    (chain?: ChainId) => {
      const base =
        tokenMeta.explorerByChain?.[chain ?? activeChain!] ?? SCAN_BY_CHAIN[chain ?? activeChain!];
      return base ?? undefined;
    },
    [tokenMeta.explorerByChain, activeChain]
  );

  const explorerLabel = useMemo(
    () => (activeChain ? EXPLORER_LABEL[activeChain] ?? "Explorer" : "Explorer"),
    [activeChain]
  );

  const onViewExplorer = useCallback(() => {
    const url = explorerUrlForToken(activeChain);
    if (url) Linking.openURL(url).catch(() => {});
    else if (Platform.OS === "android") ToastAndroid.show("Explorer not available", ToastAndroid.SHORT);
    closeMore();
  }, [activeChain, explorerUrlForToken, closeMore]);

  const onShare = useCallback(async () => {
    try {
      const url = explorerUrlForToken(activeChain) ?? "";
      const chainLabel = CHAIN_LABEL[activeChain ?? "eip155:1"] ?? "Network";
      await Share.share({ message: `${name} (${sym}) on ${chainLabel}\n${url}`, url });
      if (Platform.OS === "android") ToastAndroid.show("Shared", ToastAndroid.SHORT);
    } catch {}
    closeMore();
  }, [activeChain, name, sym, explorerUrlForToken, closeMore]);

  const onReport = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === "android") ToastAndroid.show("Reported. Thanks!", ToastAndroid.SHORT);
    closeMore();
  }, [closeMore]);

  const shouldShowNetworkChips = useMemo(
    () => !isNative(cid) && allowedChains.length > 1,
    [cid, allowedChains.length]
  );
  const isNativeOnActive = useMemo(
    () => !!activeChain && CHAIN_NATIVE[activeChain] === cid,
    [activeChain, cid]
  );

  /* ---- Activity (mock) ---- */
  type TxItem = {
    id: string;
    dir: "in" | "out";
    when: string;
    peer: string;
    hash: string;
    fee?: string;
    status: "Succeeded" | "Failed" | "Pending";
    amtToken: number;
    fiat: number;
  };
  const allActivity = useMemo<TxItem[]>(() => {
    const rate = priceUsd;
    return [
      { id: "a1", dir: "in",  when: "Yesterday, 21:17", peer: "@helloalex", hash: "0x18c...abcd1234", status: "Succeeded", amtToken: 249.99544, fiat: 249.99544 * rate },
      { id: "a2", dir: "out", when: "Yesterday, 19:05", peer: "@maria",     hash: "0x42d...beef9911", status: "Succeeded", amtToken: 15.0,       fiat: -15.0 * rate, fee: "0.0005 ETH" },
      { id: "a3", dir: "in",  when: "Tue, 10:12",       peer: "@dan",       hash: "0x77a...cafe1111", status: "Succeeded", amtToken: 19.0,       fiat: 19.0 * rate },
      { id: "a4", dir: "out", when: "Mon, 08:44",       peer: "@shop",      hash: "0x99f...b00b2222", status: "Succeeded", amtToken: 3.22,       fiat: -3.22 * rate, fee: "0.0001 ETH" },
    ];
  }, [priceUsd]);

  const listActivity = allActivity.slice(0, 4);
  const hasMore = allActivity.length > 4;

  const [sheetTx, setSheetTx] = useState<TxItem | null>(null);
  const openActivity = useCallback((it: TxItem) => {
    void Haptics.selectionAsync();
    setSheetTx(it);
  }, []);
  const closeActivity = useCallback(() => setSheetTx(null), []);

  /* ---- Nav helpers ---- */
  const goSwap = useCallback(() => {
    router.navigate(
      href("/(tabs)/swap", accountIdParam ? { account: String(accountIdParam) } : (undefined as any))
    );
  }, [router, accountIdParam]);

  const goReceive = useCallback(() => {
    router.navigate(
      href("/(tabs)/receive", accountIdParam ? { account: String(accountIdParam) } : (undefined as any))
    );
  }, [router, accountIdParam]);

  const goSend = useCallback(() => {
    router.navigate(
      href("/(tabs)/send", accountIdParam ? { account: String(accountIdParam) } : (undefined as any))
    );
  }, [router, accountIdParam]);

  const seeMorePayments = useCallback(() => {
    router.navigate(
      href("/(tabs)/payments", { account: String(accountIdParam ?? ""), token: String(cid) })
    );
  }, [router, accountIdParam, cid]);

  const switchToChain = useCallback((c: ChainId) => {
    closeMore();
    // replace para no apilar múltiples detalles del mismo token
    router.replace(
      href("/(tabs)/token/[id]", {
        id: String(cid),
        chainId: c as any,
        accountId: String(accountIdParam ?? ""),
      })
    );
  }, [router, cid, accountIdParam, closeMore]);

  /* ---- Scroll reset ---- */
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const fmtUSD = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const truncMid = (s: string, keep = 4) =>
    !s || s.length <= keep * 2 + 3 ? s : `${s.slice(0, keep)}…${s.slice(-keep)}`;

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
      <LinearGradient
        colors={["rgba(255,255,255,0.03)", "rgba(0,0,0,0.18)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
      >
        {/* ===== Header ===== */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={HIT} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>

          <View style={styles.headerCenter}>
            <TokenIcon currencyId={cid} chains={allowedChains} />
            <View style={{ marginLeft: 10, flexShrink: 1 }}>
              <Text style={styles.h1} numberOfLines={1}>{name}</Text>
              <Text style={styles.subtle}>{sym}</Text>
            </View>
          </View>

          <Pressable onPress={toggleFollow} hitSlop={HIT} style={[styles.pill, follow && styles.pillOn]}>
            <Text style={[styles.pillTxt, follow && styles.pillTxtOn]}>{follow ? "Following" : "Follow"}</Text>
          </Pressable>
        </View>

        {/* ===== Price / Sparkline ===== */}
        <View style={styles.heroCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={styles.big}>
              {typeof priceUsd === "number" ? `$${priceUsd.toFixed(2)}` : `$${activeUsd.toFixed(2)}`}
            </Text>
            <View style={[styles.deltaPill, up ? styles.deltaUp : styles.deltaDown]}>
              <Text style={styles.deltaTxt}>
                {(up ? "+" : "") + (deltaUsd ?? 0).toFixed(2)}$ {(up ? "+" : "") + (deltaPct ?? 0).toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.sparkline} />

          <View style={styles.tfRow}>
            {["1H", "1D", "1W", "1M", "YTD", "ALL"].map((t, i) => (
              <View key={t} style={[styles.tfPill, i === 5 && styles.tfPillOn]}>
                <Text style={[styles.tfTxt, i === 5 && styles.tfTxtOn]}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <Action icon="qr-code-outline" label="Receive" onPress={goReceive} />
            <Action icon="paper-plane-outline" label="Send" onPress={goSend} />
            <Action icon="swap-horizontal" label="Swap" onPress={goSwap} />

            {/* Botón More: ancla del Popover */}
            <Pressable
              ref={moreRef}
              collapsable={false}
              onLayout={captureAnchor}
              onPress={openMore}
              hitSlop={HIT}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.actionIcon}><Ionicons name="ellipsis-horizontal" size={20} color="#0A1A24" /></View>
              <Text style={styles.actionTxt}>More</Text>
            </Pressable>
          </View>
        </View>

        {/* ===== Your position ===== */}
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={styles.cardTitle}>Your position</Text>
            <Text style={styles.cardTitle}>Value</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={styles.subtle}>Balance</Text>
              <Text style={styles.kvValue}>
                {activeAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} {sym}
              </Text>
              <Text style={[styles.deltaSmall, up ? styles.deltaUpTxt : styles.deltaDownTxt]}>
                {(up ? "+" : "") + (deltaUsd ?? 0).toFixed(2)}$
              </Text>
            </View>
            <Text style={styles.kvValue}>{fmtUSD(activeUsd)}</Text>
          </View>
        </Card>

        {/* ===== Token stats ===== */}
        <Card>
          <Text style={styles.cardTitle}>Token stats</Text>
          <View style={styles.grid2}>
            <StatBox label="Market Cap" value="$72.67B" />
            <StatBox label="Volume (24h)" value="$32.15M" />
            <StatBox label="Holders" value="2.32M" />
            <StatBox label="Supply" value="533.95M" />
          </View>
        </Card>

        {/* ===== Activity ===== */}
        <Card>
          <Text style={styles.cardTitle}>Activity</Text>
          {listActivity.map((it, idx) => {
            const sign = it.dir === "in" ? "+" : "-";
            const peerTitle = it.peer?.replace("@", "");
            return (
              <View key={it.id}>
                <ActivityRow
                  type={it.dir}
                  title={peerTitle || (it.dir === "in" ? "Received" : "Sent")}
                  subtitle={it.when}
                  amount={`${sign}${Math.abs(it.amtToken).toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
                  sym={sym}
                  fiat={fmtUSD(it.fiat)}
                  avatarText={(peerTitle?.[0] ?? "?").toUpperCase()}
                  onPress={() => openActivity(it)}
                />
                {idx < listActivity.length - 1 && <View style={styles.sep} />}
              </View>
            );
          })}
          {hasMore && (
            <Pressable onPress={seeMorePayments} style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreTxt}>See more</Text>
            </Pressable>
          )}
        </Card>
      </ScrollView>

      {/* ========= POPOVER: More ========= */}
      <Popover visible={moreOpen} anchorRect={anchorRect} onClose={closeMore}>
        <View style={{ padding: 10, minWidth: 240 }}>
          {shouldShowNetworkChips && !isNativeOnActive && (
            <>
              <Text style={styles.menuSection}>Network</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {allowedChains.map((c) => {
                  const selected = c === activeChain;
                  return (
                    <Pressable key={c} onPress={() => switchToChain(c)} style={[styles.netChip, selected && styles.netChipOn]}>
                      <ChainMini chainId={c} size={14} />
                      <Text style={styles.netChipTxt}>{CHAIN_LABEL[c] ?? c}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Pressable onPress={onViewExplorer} style={styles.menuItem}>
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={styles.menuItemTxt}>View on {explorerLabel}</Text>
          </Pressable>

          <Pressable onPress={onShare} style={styles.menuItem}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.menuItemTxt}>Share</Text>
          </Pressable>

          <Pressable onPress={onReport} style={styles.menuItem}>
            <Ionicons name="flag-outline" size={18} color="#ff6b6b" />
            <Text style={[styles.menuItemTxt, { color: "#ff6b6b" }]}>Report as spam</Text>
          </Pressable>

          <View style={{ height: 10 }} />
          <Text style={styles.menuSection}>Buy (coming soon)</Text>
          <View style={{ gap: 10 }}>
            <MenuDisabled icon="logo-apple" text="Apple Pay" />
            <MenuDisabled icon="card-outline" text="Debit/Credit Card" />
          </View>
        </View>
      </Popover>

      {/* ===== BottomSheet: Detalle actividad ===== */}
      <BottomSheet
        visible={!!sheetTx}
        onClose={closeActivity}
        maxHeightPct={0.9}
        backgroundColor={colors.sheetBgSolid}
        showHandle
        backdropOpacity={0.5}
      >
        {sheetTx && (
          <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(10, insets.bottom + 6) }}>
            <Text style={{ color: colors.sheetText, fontWeight: "800", fontSize: 20, marginBottom: 10 }}>
              {sheetTx.dir === "in" ? "Received" : "Sent"}
            </Text>

            <View style={styles.block}>
              <KV label="Date" value={sheetTx.when} />
              <KV label="Status" value={sheetTx.status} valueColor={sheetTx.status === "Succeeded" ? "#20d690" : "#ff6b6b"} />
              {sheetTx.dir === "in" ? <KV label="From" value={sheetTx.peer} /> : <KV label="To" value={sheetTx.peer} />}
              <KV label="Network" value={CHAIN_LABEL[activeChain ?? "eip155:1"]} />
              <KV label="Transaction" value={truncMid(sheetTx.hash, 6)} />
              {!!sheetTx.fee && <KV label="Network fee" value={sheetTx.fee} />}
            </View>

            <View style={styles.block}>
              <KV label="Amount" value={`${sheetTx.amtToken >= 0 ? "+" : ""}${Math.abs(sheetTx.amtToken).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${sym}`} />
              <KV label="Fiat" value={fmtUSD(sheetTx.fiat)} />
              <KV label="Exchange rate" value={`1 ${sym} = ${fmtUSD(priceUsd)}`} />
            </View>

            <Pressable style={styles.explorerBtn} onPress={onViewExplorer}>
              <Text style={styles.explorerBtnTxt}>View on {explorerLabel}</Text>
            </Pressable>

            <View style={{ height: 14 }} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Action icon="qr-code-outline" label="Receive" onPress={() => { closeActivity(); goReceive(); }} />
              <Action icon="paper-plane-outline" label="Send" onPress={() => { closeActivity(); goSend(); }} />
              <Action icon="swap-horizontal" label="Swap" onPress={() => { closeActivity(); goSwap(); }} />
            </View>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

/* ================= subcomponents ================= */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 14,
        backgroundColor: "rgba(2, 48, 71, 0.78)",
        borderRadius: 14,
        padding: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.subtle}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={HIT} style={({ pressed }) => [styles.action, pressed && { opacity: 0.9 }]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color="#0A1A24" />
      </View>
      <Text style={styles.actionTxt}>{label}</Text>
    </Pressable>
  );
}

type ActivityKind = "in" | "out";
function ActivityRow({
  type,
  title,
  subtitle,
  amount,
  sym,
  fiat,
  avatarText,
  onPress,
}: {
  type: ActivityKind;
  title: string;
  subtitle: string;
  amount: string;
  sym: string;
  fiat: string;
  avatarText: string;
  onPress?: () => void;
}) {
  const isIn = type === "in";
  return (
    <Pressable onPress={onPress} style={styles.activityRow}>
      <View style={styles.activityLeft}>
        <View style={styles.activityAvatar}>
          <Text style={{ color: "#081217", fontWeight: "900" }}>{avatarText}</Text>
          <View style={styles.activityMini}>
            <Ionicons name={isIn ? "arrow-back" : "arrow-forward"} size={10} color="#081217" />
          </View>
        </View>
        <View>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activityWhen}>{subtitle}</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.activityAmt, amount.startsWith("+") ? styles.deltaUpTxt : styles.deltaDownTxt]}>
          {amount} {sym}
        </Text>
        <Text style={styles.activityFiat}>{fiat}</Text>
      </View>
    </Pressable>
  );
}

function MenuDisabled({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={[styles.menuItem, { opacity: 0.5 }]}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.menuItemTxt}>{text}</Text>
    </View>
  );
}

function KV({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvVal, !!valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

/* ================= styles ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "flex-start", marginHorizontal: 6 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  h1: { color: "#fff", fontWeight: "800", fontSize: 18 },
  subtle: { color: TEXT_DIM, fontSize: 12, marginTop: 2 },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)" },
  pillOn: { backgroundColor: "#fff" },
  pillTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  pillTxtOn: { color: "#0A1A24" },

  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "rgba(2, 48, 71, 0.78)",
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  big: { color: "#fff", fontSize: 40, fontWeight: "600", letterSpacing: -0.5 },

  deltaPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  deltaUp: { backgroundColor: alpha("#20d690", 0.15) },
  deltaDown: { backgroundColor: alpha("#ff6b6b", 0.15) },
  deltaTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },

  sparkline: { height: 80, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 10, marginBottom: 6 },

  tfRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  tfPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)" },
  tfPillOn: { backgroundColor: "#fff" },
  tfTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  tfTxtOn: { color: "#0A1A24" },

  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  action: { flex: 1, alignItems: "center" },
  actionIcon: {
    width: 50, height: 50, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: YELLOW,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  actionTxt: { color: "#fff", fontSize: 12, marginTop: 6, fontWeight: "600" },

  cardTitle: { color: "#fff", fontWeight: "800", marginBottom: 8 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flexBasis: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  kvValue: { color: "#fff", fontWeight: "700", fontSize: 16, marginTop: 2 },

  seeMoreBtn: { paddingVertical: 10, alignItems: "center", marginTop: 6 },
  seeMoreTxt: { color: "#CFE3EC", fontWeight: "700" },

  activityRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  activityWhen: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  activityAmt: { fontSize: 14, fontWeight: "800" },
  activityFiat: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  deltaUpTxt: { color: "#20d690" },
  deltaDownTxt: { color: "#ff6b6b" },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.06)", marginLeft: 40 },

  activityAvatar: {
    width: 30, height: 30, borderRadius: 6, backgroundColor: "#FFB703",
    alignItems: "center", justifyContent: "center",
  },
  activityMini: {
    position: "absolute",
    right: -6, bottom: -6, width: 14, height: 14, borderRadius: 3,
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },

  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  menuItemTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
  menuSection: { color: "#CFE3EC", fontWeight: "800", marginBottom: 8 },

  netChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)",
  },
  netChipOn: { backgroundColor: "rgba(255,255,255,0.12)" },
  netChipTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },

  block: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 12,
  },
  kvRow: { paddingVertical: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kvLabel: { color: colors.sheetText, opacity: 0.85 },
  kvVal: { color: colors.sheetText },

  explorerBtn: { backgroundColor: CTA_NEUTRAL, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  explorerBtnTxt: { color: "#0A1A24", fontWeight: "800" },

  deltaSmall: { marginTop: 2, fontSize: 12, fontWeight: "700" },
});