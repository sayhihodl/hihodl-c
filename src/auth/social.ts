// src/auth/social.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';

import { OAUTH } from '@/config/app';
import { createOrLoadMPCWallet } from '@/lib/mpc';
import { useSessionStore } from '@/store/session';
import { analytics } from '@/utils/analytics';

// Tipos propios (ajusta si tu store define otros)
type Provider = 'google' | 'apple';
type MPCWallet = {
  address: string;
  publicKey: string;
  chains: string[];
  ready: boolean;
};

// Acepta cualquier cosa “parcial”
type RawWallet = Partial<MPCWallet> | unknown;

function normalizeWallet(raw: RawWallet): MPCWallet {
  const r = (raw ?? {}) as Partial<MPCWallet>;
  return {
    address: typeof r.address === 'string' ? r.address : '',
    publicKey: typeof r.publicKey === 'string' ? r.publicKey : '',
    chains: Array.isArray(r.chains)
      ? r.chains.filter((x): x is string => typeof x === 'string')
      : [],
    ready: !!r.ready,
  };
}

/* =========================
 * Google Sign-In (hook)
 * ========================= */
export function useGoogleSignIn() {
  const setSession = useSessionStore((s) => s.setSession);

  const [, response, promptAsync] = Google.useAuthRequest({
  iosClientId:     OAUTH.google.iosClientId,
  androidClientId: OAUTH.google.androidClientId,
  webClientId:     OAUTH.google.webClientId,
  scopes: ['profile', 'email'],
});

  useEffect(() => {
    (async () => {
      if (response?.type !== 'success') {
        if (response?.type === 'error') {
          analytics.trackEvent({
            name: "login_failed",
            parameters: { method: "google", error: response.error?.message || "unknown" },
          });
        }
        return;
      }

      const idToken: string | null = response.authentication?.idToken ?? null;
      const raw = await createOrLoadMPCWallet({ provider: 'google' as Provider, idToken: idToken ?? undefined });
      const wallet = normalizeWallet(raw);

      setSession({ provider: 'google', idToken, wallet } as any);
      
      // Trackear login exitoso
      analytics.trackLogin("google");
      if (wallet.address) {
        analytics.setUserId(wallet.address);
      }
    })();
  }, [response, setSession]);

  return { signIn: () => promptAsync() };
}

/* =========================
 * Apple Sign-In (función)
 * ========================= */
export async function signInWithApple() {
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In solo está disponible en iOS.');

  const AppleAuth = (await import('expo-apple-authentication')) as typeof import('expo-apple-authentication');
  if (!AppleAuth?.isAvailableAsync) {
    throw new Error("Falta el módulo 'expo-apple-authentication'. Instálalo: npx expo install expo-apple-authentication");
  }

  const available = await AppleAuth.isAvailableAsync();
  if (!available) throw new Error('Apple Sign-In no está disponible en este dispositivo.');

  const credential = await AppleAuth.signInAsync({
    requestedScopes: [
      AppleAuth.AppleAuthenticationScope.FULL_NAME,
      AppleAuth.AppleAuthenticationScope.EMAIL,
    ],
  });

  const idToken: string | null = typeof credential?.identityToken === 'string' ? credential.identityToken : null;
  const raw = await createOrLoadMPCWallet({ provider: 'apple' as Provider, idToken: idToken ?? undefined });
  const wallet = normalizeWallet(raw);

  useSessionStore.getState().setSession({ provider: 'apple', idToken, wallet } as any);
  
  // Trackear login exitoso
  analytics.trackLogin("apple");
  if (wallet.address) {
    analytics.setUserId(wallet.address);
  }
}