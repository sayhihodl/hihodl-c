import React, { useMemo, useState, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Image, Switch } from "react-native";
import { SvgUri } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard, Divider } from "@/ui/Glass";
import Row from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId, iconKeyForTokenId } from "@/config/iconRegistry";
import { coercePair, bestChainForToken, type ChainKey } from "@/config/sendMatrix";
import StepToken from "@/send/steps/StepToken";
import { BlurView } from "expo-blur";
import { useSendFlow } from "@/send/SendFlowProvider";

type Props = {
  onConfirm: (p: { groupName: string; emoji: string; tokenId: string; chain: ChainKey; smartSettle: boolean }) => void;
  onCanConfirmChange?: (canConfirm: boolean) => void;
  onConfirmReady?: (confirmFn: () => void) => void;
  tokenSymbol?: string; // e.g. USDC
  chain?: string;       // e.g. "solana"
};

// Lista expandida de emojis
const EMOJIS = [
  "🚀","🔥","🔒","🔮","🖼️","💯","🔌","⛓️","🌙","👻","👾","🤖","😎","💎","🙌","🧠","📱","🤑","🪙","🧭","🏴‍☠️","🛡️","⚡️","🌐","🦊","🐼","🐳","🦄","🐵","🐉","🐯","🐻","🦁","🕊️","🌈","🌋","🌊","🌪️","🌟","✨","🛰️","🪐","🌌","🗝️",
  "👥","💼","🎉","🎊","🎈","🎁","🍕","🍔","🍟","🌮","🌯","🥗","🍰","🍪","☕️","🍺","🍷","🍸","🍹","🥂","🎮","🎯","🎲","🎸","🎹","🎺","🎻","🎬","🎭","🎨","🎪","🏆","🥇","🥈","🥉","⚽️","🏀","🏈","⚾️","🎾","🏐","🏉","🎱","🏓","🏸","🥊","🚴","🚵","🏊","🏄","🏇","⛷️","🏂","🏌️","🏋️","🤼","🤸","🤺","🏌️‍♂️","🏌️‍♀️",
  "🏖️","⛰️","🏔️","🗻","🌋","🏕️","⛺️","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏯","🏰","🗼","🗽","⛪️","🕌","🕍","⛩️","🕋","⛲️","⛺️","🌁","🌃","🌄","🌅","🌆","🌇","🌉","♨️","🎠","🎡","🎢","💈","🎪","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚟","🚠","🚡","🚢","⛵️","🛶","🚤","🛥️","🛳️","⛴️","🚁","✈️","🛩️","🛫","🛬","🛸","🚀","🛰️","💺","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚟","🚠","🚡","🚢","⛵️","🛶","🚤","🛥️","🛳️","⛴️","🚁","✈️","🛩️","🛫","🛬","🛸",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈️","♉️","♊️","♋️","♌️","♍️","♎️","♏️","♐️","♑️","♒️","♓️","🆔","⚛️","🉑","☢️","☣️"
];

/* ============ token icon + mini-badge ============ */
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
      {chain && (
        <View style={styles.chainMini}>
          <View style={styles.chainMiniBg}>
            {renderChainBadge(mapChainKeyToChainId(chain), { size: 14, chip: false })}
          </View>
        </View>
      )}
    </View>
  );
}

export default function GroupSplitBuilder({ onConfirm, onCanConfirmChange, onConfirmReady, tokenSymbol = "USDC", chain }: Props) {
  const { state: sendFlowState } = useSendFlow();
  
  const [groupName, setGroupName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [showSmartSettleInfo, setShowSmartSettleInfo] = useState(false);
  const [smartSettle, setSmartSettle] = useState(false);
  const [tokenId, setTokenId] = useState<string>("usdc");
  const [selectedChain, setSelectedChain] = useState<ChainKey>(() => (chain as ChainKey) || coercePair("usdc", bestChainForToken("usdc") as ChainKey));
  const [emojiSearch, setEmojiSearch] = useState("");
  
  const tokenDragGateRef = useRef<boolean>(true);
  const emojiDragGateRef = useRef<boolean>(true);
  const tokenSearchRef = useRef<any>(null);
  const [tokenSearch, setTokenSearch] = useState("");

  const uiSymbol = tokenSymbol || tokenId.toUpperCase() || "USDC";
  
  const filteredEmojis = useMemo(() => {
    if (!emojiSearch.trim()) return EMOJIS;
    const map: Record<string, string[]> = {
      rocket:["🚀"], fire:["🔥"], lock:["🔒"], crystal:["🔮"], diamond:["💎"],
      moon:["🌙"], ghost:["👻"], robot:["🤖"], fox:["🦊"], coin:["🪙"],
      brain:["🧠"], phone:["📱"], star:["🌟","✨"], wave:["🌊"],
      group:["👥","👤"], money:["💰","💵","💴","💶","💷"], party:["🎉","🎊","🎈"],
      food:["🍕","🍔","🍟","🌮","🌯","🥗","🍰","🍪"], drink:["☕️","🍺","🍷","🍸"],
      sports:["⚽️","🏀","🏈","⚾️","🎾"], travel:["✈️","🚂","🚢","🚗","🏖️"],
    };
    const key = emojiSearch.toLowerCase();
    return Array.from(new Set([...(map[key] ?? []), ...EMOJIS]));
  }, [emojiSearch]);

  const canConfirm = useMemo(() => {
    return groupName.trim().length > 0;
  }, [groupName]);

  // Notificar cambios en canConfirm al padre
  React.useEffect(() => {
    onCanConfirmChange?.(canConfirm);
  }, [canConfirm, onCanConfirmChange]);

  const confirm = React.useCallback(() => {
    onConfirm({ 
      groupName: groupName.trim(), 
      emoji, 
      tokenId, 
      chain: selectedChain,
      smartSettle 
    });
  }, [groupName, emoji, tokenId, selectedChain, smartSettle, onConfirm]);

  // Exponer confirm al padre
  React.useEffect(() => {
    onConfirmReady?.(confirm);
  }, [confirm, onConfirmReady]);

  const handleTokenPick = ({ tokenId: id, bestNet }: { tokenId: string; bestNet: ChainKey }) => {
    const norm = id.toLowerCase();
    const fixed = coercePair(norm, bestNet);
    setTokenId(norm);
    setSelectedChain(fixed);
    setShowTokenPicker(false);
  };

  return (
    <View style={styles.screen}>
      {/* Group Name Row */}
      <GlassCard style={{ marginBottom: 12 }}>
        <Row
          icon="people"
          labelNode={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Name your group"
                placeholderTextColor="#99BACA"
              />
            </View>
          }
          rightIcon={null}
        />
      </GlassCard>

      {/* Emoji Selection Row */}
      <GlassCard style={{ marginBottom: 12 }}>
        <Row
          icon={null}
          leftSlot={
            <Pressable onPress={() => setShowEmojiPicker(true)} style={styles.emojiButton}>
              <Text style={styles.emojiDisplay}>{emoji}</Text>
            </Pressable>
          }
          label="Group icon"
          value={null}
          rightIcon="chevron-forward"
          onPress={() => setShowEmojiPicker(true)}
        />
      </GlassCard>

      {/* Token Selection Row */}
      <GlassCard style={{ marginBottom: 12 }}>
        <Row
          icon={null}
          leftSlot={<TokenWithMini tokenId={tokenId} chain={selectedChain} />}
          labelNode={
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.tokenLabel}>Currency</Text>
                <Pressable onPress={() => setShowTokenInfo(true)} hitSlop={8}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="information-circle" size={14} color="#9CB4C1" />
                  </View>
                </Pressable>
              </View>
              <Text style={styles.tokenValue}>{uiSymbol} · {selectedChain ? selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1) : "Ethereum"}</Text>
            </View>
          }
          rightSlot={
            <Pressable 
              style={styles.changeBtn}
              onPress={() => setShowTokenPicker(true)}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </Pressable>
          }
          rightIcon={null}
        />
      </GlassCard>

      {/* Smart Settle Row */}
      <GlassCard style={{ marginBottom: 12 }}>
        <Row
          icon="bulb"
          labelNode={
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.tokenLabel}>Smart settle</Text>
                <Pressable onPress={() => setShowSmartSettleInfo(true)} hitSlop={8}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="information-circle" size={14} color="#9CB4C1" />
                  </View>
                </Pressable>
              </View>
              <Text style={styles.tokenValue}>Consolidate debts and reduce number of payments</Text>
            </View>
          }
          value={
            <Switch
              value={smartSettle}
              onValueChange={setSmartSettle}
              trackColor={{ false: "rgba(255,255,255,0.15)", true: "#FFB703" }}
              thumbColor="#fff"
              ios_backgroundColor="rgba(255,255,255,0.15)"
            />
          }
          onPress={() => setSmartSettle(!smartSettle)}
          rightIcon={null}
        />
      </GlassCard>

      {/* Token Info Modal */}
      <BottomKeyboardModal
        visible={showTokenInfo}
        onClose={() => setShowTokenInfo(false)}
        minHeightPct={0.38}
        maxHeightPct={0.42}
        scrimOpacity={0.85}
        sheetTintRGBA="rgba(2,48,71,0.28)"
        blurTopOnly={false}
        dismissOnScrimPress={true}
        ignoreKeyboard
        dragAnywhere={false}
        header={{
          height: 60,
          innerTopPad: 6,
          sideWidth: 45,
          centerWidthPct: 92,
          blurTint: "dark",
          showHandleTop: true,
          centerHeaderContent: true,
          center: (
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Group currency
            </Text>
          ),
        }}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalTextContainer}>
            <Text style={styles.modalText}>
              The currency that the group will use to settle bills. Any bills added to the group will be converted to this currency at the moment they are added.
            </Text>
          </View>
          <CTAButton
            title="Got it"
            onPress={() => setShowTokenInfo(false)}
            variant="primary"
            fullWidth
            size="lg"
            style={{ marginTop: 24 }}
          />
        </View>
      </BottomKeyboardModal>

      {/* Smart Settle Info Modal */}
      <BottomKeyboardModal
        visible={showSmartSettleInfo}
        onClose={() => setShowSmartSettleInfo(false)}
        minHeightPct={0.42}
        maxHeightPct={0.48}
        scrimOpacity={0.85}
        sheetTintRGBA="rgba(2,48,71,0.28)"
        blurTopOnly={false}
        dismissOnScrimPress={true}
        ignoreKeyboard
        dragAnywhere={false}
        header={{
          height: 60,
          innerTopPad: 6,
          sideWidth: 45,
          centerWidthPct: 92,
          blurTint: "dark",
          showHandleTop: true,
          centerHeaderContent: true,
          center: (
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Smart settle
            </Text>
          ),
        }}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalTextContainer}>
            <Text style={styles.modalText}>
              Smart settle automatically combines debts to reduce the total number of payments between group members. Smart settle does not change anyone's total balance. It just reduces the number of payments so everyone gets paid back quicker.
            </Text>
          </View>
          <CTAButton
            title="Got it"
            onPress={() => setShowSmartSettleInfo(false)}
            variant="primary"
            fullWidth
            size="lg"
            style={{ marginTop: 24 }}
          />
        </View>
      </BottomKeyboardModal>

      {/* Token Picker Modal */}
      <BottomKeyboardModal
        visible={showTokenPicker}
        onClose={() => setShowTokenPicker(false)}
        minHeightPct={0.88}
        maxHeightPct={0.94}
        scrimOpacity={0.85}
        sheetTintRGBA="rgba(2,48,71,0.28)"
        blurTopOnly={false}
        blurTopHeight={48}
        dismissOnScrimPress={false}
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
          selectedChain={selectedChain}
          onBack={() => setShowTokenPicker(false)}
          onTopChange={(atTop) => { tokenDragGateRef.current = atTop; }}
          onPick={handleTokenPick}
        />
      </BottomKeyboardModal>

      {/* Emoji Picker Modal */}
      <BottomKeyboardModal
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        minHeightPct={0.7}
        maxHeightPct={0.85}
        scrimOpacity={0.85}
        sheetTintRGBA="rgba(2,48,71,0.28)"
        blurTopOnly={false}
        dismissOnScrimPress={false}
        ignoreKeyboard
        dragAnywhere={false}
        dragGateRef={emojiDragGateRef}
        header={{
          height: 80,
          innerTopPad: 6,
          sideWidth: 45,
          centerWidthPct: 92,
          blurTint: "dark",
          showHandleTop: true,
          centerHeaderContent: true,
          center: (
            <View style={{ width: "100%", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
                Select Avatar
              </Text>
              <View style={{
                position: "relative", borderRadius: 14, overflow: "hidden",
                height: 44, width: "100%",
                borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)"
              }}>
                <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
                <View style={{ flex: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="search" size={18} color="#9CB4C1" />
                  <TextInput
                    value={emojiSearch}
                    onChangeText={setEmojiSearch}
                    placeholder="Search… rocket, moon, diamond…"
                    placeholderTextColor="#9CB4C1"
                    style={{ flex: 1, color: "#fff", fontSize: 15 }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {!!emojiSearch && (
                    <Pressable onPress={() => setEmojiSearch("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="#9CB4C1" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ),
        }}
      >
        <FlatList
          data={filteredEmojis}
          numColumns={6}
          keyExtractor={(item, idx) => item + idx}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setEmoji(item); setShowEmojiPicker(false); }}
              style={styles.emojiCell}
            >
              <Text style={styles.emoji}>{item}</Text>
            </Pressable>
          )}
        />
      </BottomKeyboardModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "transparent",
  },
  input: { 
    flex: 1, 
    color: "#fff", 
    fontSize: 15,
    fontWeight: "600",
  },
  tokenLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tokenValue: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 2,
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  changeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  atSymbol: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 0,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "rgba(13,24,32,0.95)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    maxHeight: 200,
    zIndex: 1000,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modeRow: { 
    marginBottom: 12,
  },
  selectDot: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: "#8FD3E3",
    backgroundColor: "transparent",
  },
  selectDotOn: { 
    backgroundColor: "#8FD3E3",
    borderColor: "#8FD3E3",
  },
  amountPrefix: { 
    color: "#9FC7D4", 
    fontWeight: "800",
    fontSize: 13,
  },
  amountInput: { 
    minWidth: 80, 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "800", 
    textAlign: "right",
    paddingVertical: 0,
  },
  equalAmount: { 
    color: "#DFF5FF", 
    fontWeight: "800",
    fontSize: 14,
  },
  footer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginTop: 20,
    gap: 12,
  },
  addBtn: { 
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8FD3E3",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    backgroundColor: "rgba(143,211,227,0.3)",
  },
  chainMini: {
    position: "absolute",
    right: -3,
    bottom: -4,
  },
  chainMiniBg: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  modalContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 80,
  },
  modalText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: "90%",
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiDisplay: {
    fontSize: 20,
  },
  emojiCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  emoji: {
    fontSize: 28,
  },
});


