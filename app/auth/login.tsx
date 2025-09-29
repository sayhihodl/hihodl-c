// app/auth/login.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  ImageBackground,
  Image,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ aquí el correcto
import { router, type Href } from "expo-router";

import { useGoogleSignIn, signInWithApple } from "@/auth/social";
import { useSessionStore } from "@/store/session";

// Background/logo
const BG = require("@assets/onboarding/onboarding-background-0.png");
const LOGO = require("@assets/logos/HIHODL-white.png");

let G_ICON: any, A_ICON: any;
try { G_ICON = require("@assets/icons/google.png"); } catch {}
try { A_ICON = require("@assets/icons/apple.png"); } catch {}

// 👉 ajusta esto si tu “home real” es "/"
const DASHBOARD_PATH = "/dashboard" as const;

// Helpers para navegar sin pelearse con la unión de Href
const go  = (to: string) => router.replace(to as unknown as Href);
const nav = (to: string) => router.push(to as unknown as Href);

export default function Login() {
  const { signIn: googleSignIn } = useGoogleSignIn();

  // ¿ya hay sesión?
  const loggedIn = useSessionStore((s) => !!s.session?.wallet);

  const [appleOk, setAppleOk] = useState(false);

  // Redirige si ya hay sesión
  useEffect(() => {
    if (loggedIn) go(DASHBOARD_PATH);
  }, [loggedIn]);

  // Apple sólo en iOS real (si está disponible)
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "ios") return setAppleOk(false);
      try {
        const AppleAuth: any = await import("expo-apple-authentication" as any);
        const available = await AppleAuth.isAvailableAsync();
        setAppleOk(!!available);
      } catch {
        setAppleOk(false);
      }
    })();
  }, []);

  const goEmailSignIn = () => nav("/auth/email?mode=signin");
  const goBack = () => nav("/onboarding/entry");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <ImageBackground source={BG} resizeMode="cover" style={{ flex: 1 }} />
      </View>

      <View style={styles.container}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        {/* Google */}
        <Pressable style={[styles.cta, styles.ctaLight]} onPress={() => googleSignIn()}>
          <View style={styles.row}>
            {G_ICON ? <Image source={G_ICON} style={styles.icon} /> : null}
            <Text style={[styles.ctaText, styles.ctaTextDark]}>Continue with Google</Text>
          </View>
        </Pressable>

        {/* Apple (solo iOS y si está disponible) */}
        {appleOk && (
          <Pressable
            style={[styles.cta, styles.ctaDark]}
            onPress={async () => {
              try {
                await signInWithApple();
                go(DASHBOARD_PATH);
              } catch (e) {
                console.log("Apple sign-in error", e);
              }
            }}
          >
            <View style={styles.row}>
              {A_ICON ? <Image source={A_ICON} style={styles.icon} /> : null}
              <Text style={[styles.ctaText, styles.ctaTextLight]}>Continue with Apple</Text>
            </View>
          </Pressable>
        )}

        {/* Email → modo signin */}
        <Pressable style={[styles.cta, styles.ctaPrimary]} onPress={goEmailSignIn}>
          <Text style={[styles.ctaText, styles.ctaTextDark]}>Continue with email</Text>
        </Pressable>

        <Pressable onPress={goBack} style={{ alignSelf: "center", marginTop: 10 }}>
          <Text style={{ color: "#CFE3EC" }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end", padding: 24, gap: 12 },
  logo: { width: 120, height: 48, position: "absolute", top: 24, left: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" },
  icon: { width: 20, height: 20 },
  cta: { height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  ctaLight: { backgroundColor: "#FFFFFF" },
  ctaDark: { backgroundColor: "#0F0F1A" },
  ctaPrimary: { backgroundColor: "#FFB703" },
  ctaText: { fontWeight: "800", fontSize: 16 },
  ctaTextLight: { color: "#FFFFFF" },
  ctaTextDark: { color: "#0A1A24" },
});