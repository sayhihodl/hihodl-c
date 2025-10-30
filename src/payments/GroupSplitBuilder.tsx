import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Platform, ActionSheetIOS, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "@/ui/Glass";
import Row from "@/ui/Row";
import { renderChainBadge, mapChainKeyToChainId } from "@/config/iconRegistry";

type Member = {
  id: string;        // stable key
  alias: string;     // e.g. "@maria"
  amount: number;    // per-person amount (human units)
  selected: boolean; // included in the split
};

type Props = {
  initialMembers?: Array<{ id: string; alias: string }>;
  initialTotal?: number; // optional total to prefill
  onConfirm: (p: { groupName: string; members: Array<{ id: string; alias: string; amount: number }>; total: number; mode: "equal" | "custom" }) => void;
  onCancel: () => void;
  tokenSymbol?: string; // e.g. USDC
  chain?: string;       // e.g. "solana"
};

export default function GroupSplitBuilder({ initialMembers = [], initialTotal = 0, onConfirm, onCancel, tokenSymbol = "USDC", chain }: Props) {
  const [groupName, setGroupName] = useState("");
  const [total, setTotal] = useState<number>(initialTotal);
  const [mode, setMode] = useState<"equal" | "custom">("equal");
  const [members, setMembers] = useState<Member[]>(
    initialMembers.map((m, idx) => ({ id: m.id || String(idx), alias: m.alias, selected: true, amount: 0 }))
  );
  const [newAlias, setNewAlias] = useState<string>("");

  // Equal split calculation
  const equalAmount = useMemo(() => {
    const selectedCount = members.filter((m) => m.selected).length || 1;
    return selectedCount > 0 ? Number((total / selectedCount).toFixed(2)) : 0;
  }, [total, members]);

  const computedMembers = useMemo(() => {
    if (mode === "equal") {
      return members.map((m) => (m.selected ? { ...m, amount: equalAmount } : m));
    }
    return members;
  }, [mode, members, equalAmount]);

  const sumCustom = useMemo(() => computedMembers.reduce((acc, m) => acc + (m.selected ? m.amount : 0), 0), [computedMembers]);

  const canConfirm = useMemo(() => {
    if (!groupName.trim()) return false;
    const hasSelected = computedMembers.some((m) => m.selected);
    if (!hasSelected) return false;
    if (mode === "equal") return total > 0;
    // custom: allow small rounding differences
    return total > 0 && Math.abs(sumCustom - total) < 0.01 * Math.max(1, total);
  }, [groupName, computedMembers, mode, total, sumCustom]);

  const toggleMember = (id: string) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));

  const setMemberAmount = (id: string, v: string) => {
    const num = Number(v.replace(/[^0-9.]/g, "")) || 0;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, amount: num } : m)));
  };

  const confirm = () => {
    const finalMembers = computedMembers.filter((m) => m.selected).map(({ id, alias, amount }) => ({ id, alias, amount }));
    onConfirm({ groupName: groupName.trim(), members: finalMembers, total, mode });
  };

  const addMember = () => {
    const alias = newAlias.trim();
    if (!alias) return;
    const normalized = alias.startsWith("@") ? alias : `@${alias}`;
    const id = `m_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    setMembers((prev) => [...prev, { id, alias: normalized, selected: true, amount: 0 }]);
    setNewAlias("");
  };

  const removeMember = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create group</Text>

      <GlassCard style={{ marginBottom: 10 }}>
        <Row
          icon="people"
          labelNode={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group name"
                placeholderTextColor="#99BACA"
              />
            </View>
          }
          rightIcon={null}
        />
        <Row
          icon="cash"
          labelNode={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: "#9FC7D4", fontWeight: "800" }}>{tokenSymbol}</Text>
              {chain ? (
                <View style={{ marginLeft: 4 }}>
                  {renderChainBadge(mapChainKeyToChainId(chain as any), { size: 14, chip: true, chipPadding: 3 })}
                </View>
              ) : null}
              <TextInput
                style={[styles.input, { textAlign: "left" }]}
                keyboardType="decimal-pad"
                value={total ? String(total) : ""}
                onChangeText={(v) => setTotal(Number(v.replace(/[^0-9.]/g, "")) || 0)}
                placeholder={`Total in ${tokenSymbol}`}
                placeholderTextColor="#99BACA"
              />
            </View>
          }
          rightIcon={null}
        />
      </GlassCard>

      <View style={styles.modeRow}>
        <Pressable style={[styles.modeBtn, mode === "equal" && styles.modeActive]} onPress={() => setMode("equal")}>
          <Text style={[styles.modeTxt, mode === "equal" && styles.modeTxtActive]}>Equal split</Text>
        </Pressable>
        <Pressable style={[styles.modeBtn, mode === "custom" && styles.modeActive]} onPress={() => setMode("custom")}>
          <Text style={[styles.modeTxt, mode === "custom" && styles.modeTxtActive]}>Custom</Text>
        </Pressable>
      </View>

      {/* Add member inline */}
      <GlassCard style={{ marginBottom: 10 }}>
        <Row
          icon="person-add"
          labelNode={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]} 
                placeholder="@username"
                placeholderTextColor="#99BACA"
                value={newAlias}
                onChangeText={setNewAlias}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          }
          rightSlot={
            <Pressable onPress={addMember} style={styles.addBtn}>
              <Text style={styles.addBtnTxt}>Add</Text>
            </Pressable>
          }
          rightIcon={null}
        />
      </GlassCard>

      <GlassCard>
        <FlatList
          data={computedMembers}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Row
              icon={null}
              leftSlot={
                <Pressable onPress={() => toggleMember(item.id)} style={[styles.selectDot, item.selected && styles.selectDotOn]} />
              }
              label={item.alias}
              onLongPress={() => {
                const doToggle = () => toggleMember(item.id);
                const doRemove = () => removeMember(item.id);
                if (Platform.OS === "ios") {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: ["Cancel", item.selected ? "Exclude from split" : "Include in split", "Remove"],
                      cancelButtonIndex: 0,
                      destructiveButtonIndex: 2,
                      userInterfaceStyle: "dark",
                    },
                    (i) => {
                      if (i === 1) doToggle();
                      else if (i === 2) doRemove();
                    }
                  );
                } else {
                  Alert.alert(item.alias, "", [
                    { text: "Cancel", style: "cancel" },
                    { text: item.selected ? "Exclude" : "Include", onPress: doToggle },
                    { text: "Remove", style: "destructive", onPress: doRemove },
                  ]);
                }
              }}
              rightIcon={null}
              value={
                mode === "custom" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.amountPrefix}>{tokenSymbol}</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="decimal-pad"
                      value={String(item.amount || 0)}
                      onChangeText={(v) => setMemberAmount(item.id, v)}
                    />
                  </View>
                ) : (
                  <Text style={styles.equalAmount}>{equalAmount} {tokenSymbol}</Text>
                )
              }
            />
          )}
        />
      </GlassCard>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}><Text style={styles.cancelTxt}>Cancel</Text></Pressable>
        <Pressable style={[styles.confirmBtn, !canConfirm && { opacity: 0.5 }]} disabled={!canConfirm} onPress={confirm}>
          <Text style={styles.confirmTxt}>Create group</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D1820", padding: 12 },
  title: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 8 },
  rowInput: {
    height: 40, borderRadius: 12, paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8,
  },
  input: { flex: 1, color: "#fff", fontSize: 14 },
  modeRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 6 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  modeActive: { backgroundColor: "#FFB703" },
  modeTxt: { color: "#CFE3EC", fontWeight: "800", fontSize: 12 },
  modeTxtActive: { color: "#0A1A24" },
  memberRow: {
    height: 46, borderRadius: 12, paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8,
  },
  selectDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#8FD3E3" },
  selectDotOn: { backgroundColor: "#8FD3E3" },
  alias: { color: "#fff", fontWeight: "800", fontSize: 14, flex: 1 },
  amountPrefix: { color: "#9FC7D4", fontWeight: "800" },
  amountInput: { minWidth: 70, color: "#fff", fontSize: 14, fontWeight: "800", textAlign: "right" },
  equalAmount: { color: "#DFF5FF", fontWeight: "800" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  cancelTxt: { color: "#CFE3EC", fontWeight: "900" },
  confirmBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "#FFB703" },
  confirmTxt: { color: "#0A1A24", fontWeight: "900" },
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#8FD3E3" },
  addBtnTxt: { color: "#0A1A24", fontWeight: "900" },
});


