// app/menu/profile.tsx
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View, Text, Modal, Pressable, TextInput, FlatList,
  KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { useProfileStore } from "@/store/profile";
import { GlassCard, Divider } from "@/ui/Glass";
import Row from "@/ui/Row"; // ✅ usa tu Row como default import

/* ===== theme ===== */
const BG  = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const CTA = (colors as any).cta ?? legacyColors.CTA ?? colors.primary ?? "#FFC107";

/** fondo superior como en el menú (Daily) */
const TOP_GRADIENT: readonly [string, string] = [
  "rgba(0,194,255,0.45)",
  "rgba(54,224,255,0.00)",
];

const EMOJIS = ["🚀","🔥","🔒","🔮","🖼️","💯","🔌","⛓️","🌙","👻","👾","🤖","😎","💎","🙌","🧠","📱","🤑","🪙","🧭","🏴‍☠️","🛡️","⚡️","🌐","🦊","🐼","🐳","🦄","🐵","🐉","🐯","🐻","🦁","🕊️","🌈","🌋","🌊","🌪️","🌟","✨","🛰️","🪐","🌌","🗝️"];

const RE_USERNAME = /^@[a-z0-9_]{3,24}$/;
const AVATAR_SIZE = 112;

type UStatus = "idle" | "checking" | "available" | "taken";

// Palabras reservadas (placeholder; pásalas al backend)
const RESERVED = [
  "admin","administrator","root","support","help","test","tester",
  "hihodl","wallet","security","service","contact","info","helloalex",
  "alexlopez","alex","alexl","hodl","bitcoin","ethereum","satoshi",
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const currentUsername = useProfileStore((s) => s.username);
  const currentAvatar   = useProfileStore((s) => s.avatar);
  const setProfile      = useProfileStore((s) => s.setProfile);

  const [username, setUsername] = useState(currentUsername ?? "@");
  const [avatar,   setAvatar]   = useState(currentAvatar ?? "🚀");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  // ---- username availability ----
  const [uStatus, setUStatus] = useState<UStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0); // evita condiciones de carrera

  const normalized = (t: string) =>
    (t.startsWith("@") ? t : `@${t}`).toLowerCase().replace(/\s+/g, "");

  const validUsername = RE_USERNAME.test(username);
  const dirty  = username !== (currentUsername ?? "@") || avatar !== (currentAvatar ?? "🚀");
  const canSave = validUsername && dirty && uStatus === "available";

  const filtered = useMemo(() => {
    if (!search.trim()) return EMOJIS;
    const map: Record<string, string[]> = {
      rocket:["🚀"], fire:["🔥"], lock:["🔒"], crystal:["🔮"], diamond:["💎"],
      moon:["🌙"], ghost:["👻"], robot:["🤖"], fox:["🦊"], coin:["🪙"],
      brain:["🧠"], phone:["📱"], star:["🌟","✨"], wave:["🌊"],
    };
    const key = search.toLowerCase();
    return Array.from(new Set([...(map[key] ?? []), ...EMOJIS]));
  }, [search]);

  // Simulación / placeholder de disponibilidad; cambia por llamada real
  const checkAvailability = useCallback(async (candidateAt: string) => {
    const candidate = candidateAt.replace(/^@/, "");
    const myReq = ++reqIdRef.current;
    setUStatus("checking");

    // Simula latencia
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 450));

    // RESERVADOS o ejemplo de “ya tomado”
    const takenLocal =
      RESERVED.includes(candidate.toLowerCase() as (typeof RESERVED)[number]) ||
      ["hihodl","admin","test"].includes(candidate.toLowerCase());

    // si cambió de request durante la espera, ignora este resultado
    if (myReq !== reqIdRef.current) return;

    setUStatus(takenLocal ? "taken" : "available");
  }, []);

  // Re-evaluar disponibilidad al escribir
  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }

    // si no es válido, no chequeamos
    if (!validUsername) { setUStatus("idle"); return; }

    // Si no cambió respecto al actual y ya es el usado, considéralo "available"
    const sameAsCurrent = username === (currentUsername ?? "@");
    if (sameAsCurrent) { setUStatus("available"); return; }

    timerRef.current = setTimeout(() => {
      checkAvailability(username);
    }, 450);

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [username, validUsername, currentUsername, checkAvailability]);

  function onChangeUsername(t: string) {
    const v = normalized(t);
    if (v.length <= 25) setUsername(v); // @ + 24
  }

  function saveAndClose() {
    if (!canSave) return;
    setProfile({ username, avatar });
    void Haptics.selectionAsync();
    router.back();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      {/* Fondo HIHODL como en el menú */}
      <LinearGradient
        colors={TOP_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topGrad}
        pointerEvents="none"
      />

      <Stack.Screen options={{ title: "Manage Profile", headerLargeTitle: false }} />

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          data={[{ key:"content" }]}
          keyExtractor={(i) => i.key}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={() => (
            <View>
              {/* Avatar */}
              <View style={styles.avatarBlock}>
                <View style={styles.avatarWrap}>
                  <Pressable
                    style={styles.avatarCircle}
                    onPress={() => setPickerOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Change avatar"
                  >
                    <Text style={styles.avatarEmoji}>{avatar}</Text>
                  </Pressable>

                  {/* lápiz */}
                  <Pressable
                    style={styles.editFab}
                    onPress={() => setPickerOpen(true)}
                    hitSlop={10}
                    accessibilityLabel="Edit avatar"
                  >
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              {/* About */}
              <Text style={styles.sectionTitle}>About</Text>

              <GlassCard>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={onChangeUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={saveAndClose}
                  maxLength={25}
                  style={[styles.input, !validUsername && styles.inputError]}
                  placeholder="@username"
                  placeholderTextColor={SUB}
                  accessibilityHint="3–24 characters, a–z, 0–9, _"
                />

                {/* Estado disponibilidad */}
                <View style={styles.helperRow}>
                  {uStatus === "checking" && (
                    <Text style={[styles.helperText, { color: "#9CA3AF" }]}>Checking…</Text>
                  )}
                  {uStatus === "available" && validUsername && (
                    <Text style={[styles.helperText, { color: "#22C55E" }]}>Username is available ✓</Text>
                  )}
                  {uStatus === "taken" && (
                    <Text style={[styles.helperText, { color: "#FB8500" }]}>Username is not available ⚠︎</Text>
                  )}
                  {uStatus === "idle" && (
                    <Text style={styles.helperText}>
                      Must start with @ and be 3–24 chars (a–z, 0–9, _)
                    </Text>
                  )}
                  <Text style={styles.counter}>{Math.max(0, username.length - 1)}/24</Text>
                </View>
              </GlassCard>

              {/* Connected accounts */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Connected accounts</Text>
              <GlassCard>
                <Row icon="mail-outline"  label="Email"  value="Not connected" onPress={() => { /* TODO */ }} />
                <Divider />
                <Row icon="logo-google"   label="Google" value="Connect"       onPress={() => { /* TODO */ }} />
              </GlassCard>
            </View>
          )}
        />

        {/* Save (sin fondo opaco; respetamos tu overlay transparente) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: CTA }, !canSave && { opacity: 0.5 }]}
            onPress={saveAndClose}
            disabled={!canSave}
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Emoji Picker */}
      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Avatar</Text>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={12} accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Text style={[styles.tab, styles.tabActive]}>Emojis</Text>
            <Text style={[styles.tab, styles.tabDisabled]}>Collectibles • soon</Text>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search… rocket, moon, diamond…"
              placeholderTextColor={SUB}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          {/* Grid */}
          <FlatList
            data={filtered}
            numColumns={6}
            keyExtractor={(item, idx) => item + idx}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { setAvatar(item); setPickerOpen(false); }}
                style={styles.emojiCell}
                accessibilityLabel={`Choose ${item}`}
              >
                <Text style={styles.emoji}>{item}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== styles (manteniendo tus alturas/márgenes) ===== */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  topGrad: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 260,
    zIndex: 0,
  },

  sectionTitle: { color: SUB, fontSize: 13, marginHorizontal: 16, marginBottom: 8, fontWeight: "600" },

  // Avatar
  avatarBlock: { alignItems: "center", marginTop: 12, marginBottom: 16 },
  avatarWrap: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, alignItems: "center", justifyContent: "center",
    alignSelf: "center", position: "relative",
  },
  avatarCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    alignItems: "center", justifyContent: "center", backgroundColor: "#1C1C22",
  },
  avatarEmoji: { fontSize: AVATAR_SIZE / 2 },

  editFab: {
    position: "absolute",
    right: 4,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },

  // Campos dentro de GlassCard
  label: { color: SUB, fontSize: 12, marginBottom: 6, marginHorizontal: 16, marginTop: 8 },
  input: {
    color: "#fff", fontSize: 16, paddingVertical: 12, marginHorizontal: 16, marginBottom: 4,
    borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 12,
  },
  inputError: { borderWidth: StyleSheet.hairlineWidth, borderColor: "#FFFF" },

  helperRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 16, marginBottom: 8,
  },
  helperText: { color: SUB, fontSize: 12 },
  counter: { color: SUB, fontSize: 12 },

  // Footer
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: "transparent" },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  saveText: { color: "#0B0B0F", fontWeight: "800", fontSize: 16 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: BG },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  close: { color: "#fff", fontSize: 18 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  tab: { marginRight: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, fontSize: 12 },
  tabActive: { backgroundColor: "rgba(255,255,255,0.08)", color: "#fff", overflow: "hidden" },
  tabDisabled: { backgroundColor: "rgba(255,255,255,0.04)", color: "#7A7A84" },
  searchBox: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: "rgba(255,255,255,0.04)", color: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  emojiCell: { width: `${100 / 6}%`, paddingVertical: 14, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  emoji: { fontSize: 28 },
});