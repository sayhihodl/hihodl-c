// app/menu/index.tsx  (o app/(drawer)/(internal)/menu/index.tsx)
import { useMemo, useRef } from "react";
import { View, Pressable, StyleSheet, Animated, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { useProfileStore } from "@/store/profile";
import T from "@/ui/T";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { preloadNamespaces } from "@/i18n/i18n";
import GlassHeader from "@/ui/GlassHeader";
import { useUser } from "@/hooks/useUser";
import { useAuthStore } from "@/store/auth";
import { disableLock } from "@/lib/lock";
import { Alert } from "react-native";

/* ===== theme ===== */
const BG = colors.navBg ?? legacyColors.BG ?? "#0D1820";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const TITLE = "#fff";
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const DIVIDER = "rgba(255,255,255,0.08)";
const ACCOUNT_GRADS: readonly [string, string] = [
  "rgba(0,194,255,0.45)",
  "rgba(54,224,255,0.00)",
];
const TOP_CAP = 23;
const MENU_GRAD_H = 260;

/* ===== styles ===== */
const styles = StyleSheet.create({
  titleSpacer: { color: TITLE },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 2, marginBottom: 10 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 34 },
  tileGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  tile: { flex: 1, height: 128, borderRadius: 18, backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER, padding: 14, overflow: "hidden" },
  tileIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileChevron: { position: "absolute", right: 12, top: 12 },
  footerNote: { textAlign: "center", marginTop: 18 },
});

const glass = StyleSheet.create({
  card: { borderRadius: 18, backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginLeft: 46 },
});

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const username = useProfileStore((s) => s.username) ?? "@username";
  const avatar = useProfileStore((s) => s.avatar) ?? "🚀";
  const { t, i18n } = useTranslation(["menu"]);
  const { user } = useUser();
  const { clearAuth } = useAuthStore();
  useEffect(() => { preloadNamespaces(["menu"]); }, [i18n.language]);
  const scrolly = useRef(new Animated.Value(0)).current;

  // Get current plan name
  const currentPlanId = user?.profile?.plan || "standard";
  const planNameMap: Record<string, string> = {
    free: "Standard",
    standard: "Standard",
    plus: "Plus",
    premium: "Premium",
    pro: "Premium",
    metal: "Metal",
  };
  const currentPlanName = planNameMap[currentPlanId] || "Standard";
  
  // Get plan subtitle
  const getPlanSubtitle = (planId: string) => {
    switch (planId) {
      case "plus":
        return "Gasless transfers";
      case "premium":
      case "pro":
        return "Gasless transfers";
      case "metal":
        return "Coming Soon";
      default:
        return "Your plan";
    }
  };

  // 🔁 Helper: salir del Menú sin dejarlo en la pila
  const go = (path: string) => router.replace(path);

  // 🔁 Cerrar menú (si no hay back posible, salta al dashboard)
  const closeMenu = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace("/(drawer)/(tabs)/(home)");
  };

  // Cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      t("rows.logout.label", "Sign Out"),
      t("rows.logout.confirm", "Are you sure you want to sign out?"),
      [
        {
          text: t("rows.logout.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("rows.logout.confirmButton", "Sign Out"),
          style: "destructive",
          onPress: async () => {
            try {
              await clearAuth();
              await disableLock(); // Deshabilitar lock al cerrar sesión
              router.replace("/auth/login");
            } catch (error) {
              console.error('[Menu] Error signing out:', error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const TopCapOverlay = useMemo(
    () => (
      <LinearGradient
        colors={ACCOUNT_GRADS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + TOP_CAP, zIndex: 2 }}
        pointerEvents="none"
      />
    ),
    [insets.top]
  );

  const MenuBackdrop = useMemo(
    () => (
      <LinearGradient
        colors={ACCOUNT_GRADS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + MENU_GRAD_H, zIndex: 0 }}
        pointerEvents="none"
      />
    ),
    [insets.top]
  );

  const HEADER_TOTAL = insets.top + 6 + 42; // insets.top + innerTopPad + height

  // Animación para mostrar avatar y username cuando hay scroll
  const userInfoOpacity = scrolly.interpolate({
    inputRange: [20, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const userInfoTranslateY = scrolly.interpolate({
    inputRange: [20, 60],
    outputRange: [-8, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {MenuBackdrop}
      {TopCapOverlay}

      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={45}
        leftSlot={
          <Pressable onPress={closeMenu} hitSlop={10} style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" }}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <Pressable
            onPress={() => go("/(drawer)/(internal)/menu/profile")}
            hitSlop={10}
            style={{ opacity: 1 }}
          >
            <Animated.View
              style={{
                opacity: userInfoOpacity,
                transform: [{ translateY: userInfoTranslateY }],
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16 }}>{avatar}</Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
                {username}
              </Text>
            </Animated.View>
          </Pressable>
        }
        rightSlot={<View style={{ width: 45 }} />}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      <SafeAreaView 
        style={{ flex: 1 }} 
        edges={["left", "bottom", "right"]}
        {...(Platform.OS === "android" && {
          // Forzar renderizado en Android
          collapsable: false,
        })}
      >
        <Animated.ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: HEADER_TOTAL + 8, paddingBottom: insets.bottom + 24 }}
          bounces
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrolly } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero */}
          <Pressable
            onPress={() => go("/(drawer)/(internal)/menu/profile")}
            style={styles.heroRow}
            accessibilityRole="button"
          >
            <View style={styles.avatarCircle}><T kind="h1" style={{ fontSize: 34 }}>{avatar}</T></View>
            <View style={{ flex: 1 }}>
              <T kind="h3" numberOfLines={1}>{username}</T>
            </View>
          </Pressable>

          {/* Tiles */}
          <View style={styles.tileGrid}>
            <Tile
              icon="card-outline"
              title={currentPlanName}
              sub={getPlanSubtitle(currentPlanId)}
              onPress={() => go("/(drawer)/(internal)/(paywall)/plans")}
            />
            <Tile
              icon="person-add-outline"
              title="Invite friends"
              sub="Earn rewards together"
              onPress={() => go("/(drawer)/(tabs)/referral")}
            />
          </View>

          {/* Account */}
          <T kind="caption" style={{ color: SUB, marginTop: 6, marginBottom: 8, fontWeight: "600" }}>{t("sections.account", "Account")}</T>
          <GlassCard>
            <MenuRow
              icon="settings-outline"
              label={t("rows.settings.label", "Settings")}
              sub={t("rows.settings.sub", "Notifications, language & currency")}
              onPress={() => go("/(drawer)/(internal)/menu/settings")}
            />
            <Divider />
            <MenuRow
              icon="shield-checkmark-outline"
              label={t("rows.security.label", "Security")}
              sub={t("rows.security.sub", "Passcode, biometrics")}
              onPress={() => go("/(drawer)/(internal)/menu/security")}
            />
          </GlassCard>

          {/* Support & About */}
          <T kind="caption" style={{ color: SUB, marginTop: 16, marginBottom: 8, fontWeight: "600" }}>{t("sections.supportLegal", "Support & Legal")}</T>
          <GlassCard>
            <MenuRow
              icon="help-circle-outline"
              label={t("rows.help.label", "Help & Support")}
              sub={t("rows.help.sub", "FAQs and contact")}
              onPress={() => go("/(drawer)/(internal)/menu/help")} 
            />
            <Divider />
            <MenuRow
              icon="document-text-outline"
              label={t("rows.terms.label", "Terms of Service")}
              sub={t("rows.terms.sub", "Legal")}
              onPress={() => go("/(drawer)/(internal)/menu/legal-terms")}
            />
            <Divider />
            <MenuRow
              icon="shield-outline"
              label={t("rows.privacy.label", "Privacy Policy")}
              sub={t("rows.privacy.sub", "Legal")}
              onPress={() => go("/(drawer)/(internal)/menu/legal-privacy")}
            />
            <Divider />
            <MenuRow
              icon="information-circle-outline"
              label={t("rows.about.label", "About HIHODL")}
              sub={t("rows.about.sub", "App info")}
              onPress={() => go("/(drawer)/(internal)/menu/about")}
            />
          </GlassCard>

          {/* Logout - Separado al final */}
          <View style={{ marginTop: 24 }}>
            <GlassCard>
              <MenuRow
                icon="log-out-outline"
                label={t("rows.logout.label", "Sign Out")}
                sub={t("rows.logout.sub", "Sign out and switch account")}
                onPress={handleLogout}
              />
            </GlassCard>
          </View>

          <T kind="caption" style={[{ color: SUB }, styles.footerNote]}>
            Need something else? We're here to help.
          </T>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

function GlassCard({ children, style }: React.PropsWithChildren<{ style?: any }>) {
  return <View style={[glass.card, style]}>{children}</View>;
}
function Divider() { return <View style={glass.divider} />; }

function MenuRow({ icon, label, sub, onPress }:{
  icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; sub?: string; onPress:()=>void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "transparent" }}
      style={({ pressed }) => [glass.row, pressed && { backgroundColor: "rgba(255,255,255,0.03)" }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color="#fff" style={{ marginTop: sub ? 2 : 0 }} />
      <View style={{ flex: 1 }}>
        <T kind="bodyStrong">{label}</T>
        {sub ? <T kind="caption" style={{ color: SUB, marginTop: 2 }}>{sub}</T> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={SUB} />
    </Pressable>
  );
}

function Tile({ icon, title, sub, onPress }:{
  icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; sub: string; onPress:()=>void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tile} android_ripple={{ color: "transparent" }}>
      <View style={styles.tileIconBg}><Ionicons name={icon} size={18} color="#fff" /></View>
      <T kind="title">{title}</T>
      <T kind="caption" style={{ color: SUB, marginTop: 4, lineHeight: 18 }}>{sub}</T>
      <Ionicons name="chevron-forward" size={16} color={SUB} style={styles.tileChevron} />
    </Pressable>
  );
}