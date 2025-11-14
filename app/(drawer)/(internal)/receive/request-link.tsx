import React, { useMemo, useEffect, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, Share, Platform, ScrollView,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import GlassHeader from "@/ui/GlassHeader";
import ScreenBg from "@/ui/ScreenBg";
import { CTAButton } from "@/ui/CTAButton";
import { GlassCard } from "@/ui/Glass";
import { useProfileStore } from "@/store/profile";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/apiClient";
import type { Alias } from "@/types/api";

const { BG, TEXT, SUB } = legacy;

/**
 * Hook para obtener el alias del usuario actual desde el backend
 */
function useUserAlias() {
  const [alias, setAlias] = useState<Alias | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAlias() {
      try {
        setLoading(true);
        setError(null);
        // Intentar obtener el alias del usuario actual
        // El endpoint GET /alias devuelve { success: true, data: { aliases: [...] } }
        const response = await apiClient.get<{ aliases?: Alias[] } | Alias[]>('/alias');
        if (!cancelled) {
          // Manejar diferentes estructuras de respuesta
          let aliases: Alias[] = [];
          if (Array.isArray(response)) {
            aliases = response;
          } else if (response && typeof response === 'object' && 'aliases' in response) {
            aliases = response.aliases || [];
          } else if (response && typeof response === 'object' && 'data' in response) {
            // Si viene envuelto en { data: { aliases: [...] } }
            const data = (response as any).data;
            aliases = Array.isArray(data) ? data : (data?.aliases || []);
          }
          
          // El usuario puede tener múltiples aliases, tomamos el primero o el principal
          const userAlias = aliases[0] || null;
          setAlias(userAlias);
        }
      } catch (err: any) {
        if (!cancelled) {
          // Si el endpoint no existe (404) o no hay alias, no es un error crítico
          if (err?.status === 404 || err?.code === 'NOT_FOUND' || err?.status === 401) {
            setAlias(null);
            setError(null);
          } else {
            const error = err instanceof Error ? err : new Error('Failed to fetch alias');
            setError(error);
            console.warn('[useUserAlias] Error fetching alias:', error);
            // No establecer error para no bloquear la UI, solo loguear
            setAlias(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAlias();

    return () => {
      cancelled = true;
    };
  }, []);

  return { alias, loading, error };
}

export default function RequestLinkModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: userLoading } = useUser();
  const { alias: backendAlias, loading: aliasLoading } = useUserAlias();
  const { username: localUsername, avatar: localAvatar } = useProfileStore();

  // Header config - igual que referral screen
  const HEADER_HEIGHT = 44;
  const HEADER_INNER_TOP = 10;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_HEIGHT;

  // Generar link universal del usuario - prioridad: backend alias > local username > fallback
  const alias = useMemo(() => {
    // 1. Prioridad: alias del backend (si existe)
    if (backendAlias?.alias) {
      return backendAlias.alias.replace(/^@/, "");
    }
    
    // 2. Fallback: username local del store
    if (localUsername && localUsername !== "@") {
      return localUsername.replace(/^@/, "");
    }
    
    // 3. Fallback final: usar email del usuario o "user"
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix || "user";
    }
    
    // 4. Último fallback
    return "alex.hih";
  }, [backendAlias, localUsername, user]);

  const universalLink = useMemo(() => `https://hi.me/${alias}`, [alias]);
  
  // Obtener el nombre para mostrar - prioridad: displayName > username > email > fallback
  const displayName = useMemo(() => {
    if (user?.profile?.displayName) {
      return user.profile.displayName;
    }
    if (localUsername && localUsername !== "@") {
      // Capitalizar el username sin el @
      const cleanUsername = localUsername.replace(/^@/, "");
      return cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
    }
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return "User";
  }, [user, localUsername]);

  // Obtener el avatar - usar el del store local
  const userAvatar = localAvatar || "👤";
  
  const isLoading = userLoading || aliasLoading;

  const copy = async () => { 
    await Clipboard.setStringAsync(universalLink); 
  };

  const share = async (url?: string) => {
    const u = url ?? universalLink;
    try { await Share.share({ message: u }); }
    catch { await Clipboard.setStringAsync(u); }
  };

  // Reemplaza este modal por request-amount (no apilar)
  const goAmount = () => {
    Keyboard.dismiss();
    router.replace("/(drawer)/(internal)/receive/request-amount");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      {/* Background - debe estar primero para que cubra el notch */}
      <ScreenBg account="Daily" height={HEADER_TOTAL + 160} showTopSeam />
      
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: "transparent" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: "transparent" }}>

            {/* GlassHeader - blur desactivado para notch transparente */}
            <GlassHeader
              height={HEADER_HEIGHT}
              innerTopPad={HEADER_INNER_TOP}
              blurTint="dark"
              overlayColor="transparent"
              blurRange={[999, 999, 999]} // Blur solo cuando hay mucho scroll (nunca en esta pantalla)
              leftSlot={
                <Pressable onPress={() => router.back()} hitSlop={10} style={s.closeBtn} accessibilityLabel="Go back">
                  <Ionicons name="chevron-back" size={20} color="#fff" />
                </Pressable>
              }
              centerSlot={
                <Text style={s.headerTitle}>Request via link</Text>
              }
              rightSlot={<View style={{ width: 36 }} />}
              showBottomHairline={false}
              contentStyle={{ paddingHorizontal: 16 }}
            />

            <ScrollView
              contentContainerStyle={{
                paddingTop: HEADER_TOTAL + 16, // Body más bajo
                paddingHorizontal: 20,
                paddingBottom: insets.bottom + 180,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Card mejorada con GlassCard */}
              <GlassCard tone="glass">
                <View style={s.cardContent}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{userAvatar}</Text>
                  </View>
                  <Text style={s.name}>{displayName}</Text>
                  <Text style={s.sub}>Share your Hi.me link so anyone can pay you</Text>

                  {/* Link + Copy centrados */}
                  <View style={s.linkRow}>
                    {isLoading ? (
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                        <ActivityIndicator size="small" color="#89D7FF" />
                        <Text style={[s.linkTxt, { marginLeft: 8 }]}>Loading...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={s.linkTxt} numberOfLines={1}>{universalLink}</Text>
                        <Pressable onPress={copy} hitSlop={8} style={s.copyBtn}>
                          <Ionicons name="copy-outline" size={16} color="#89D7FF" />
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </GlassCard>
            </ScrollView>

            {/* CTAs mejorados con CTAButton */}
            <View style={[s.bottomBar, { bottom: insets.bottom + 22 }]}>
              <CTAButton
                title="Share link"
                onPress={() => share()}
                variant="secondary"
                tone="light"
                backdrop="blur"
                fullWidth
              />
              <CTAButton
                title="Request a specific amount"
                onPress={goAmount}
                variant="primary"
                fullWidth
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  cardContent: {
    padding: 24,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    textAlign: "center",
  },
  name: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  sub: {
    color: SUB,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },

  linkRow: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.28)",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  linkTxt: {
    color: "#89D7FF",
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    textAlign: "left",
  },
  copyBtn: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  bottomBar: {
    position: "absolute",
    left: 20,
    right: 20,
    gap: 12,
  },
});