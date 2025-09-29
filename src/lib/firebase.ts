// src/lib/firebase.ts
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
// Namespace import para evitar falsos negativos del tipado
import * as Auth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Config desde EXPO_PUBLIC_* ----
const projectId = (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();

const firebaseConfig = {
  apiKey: (process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '').trim(),
  authDomain: (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim(),
  projectId,
  storageBucket: projectId ? `${projectId}.appspot.com` : '',
  messagingSenderId: (process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
  appId: (process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '').trim(),
};

// App única
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth con persistencia según plataforma, tolerante a tipos/versiones
let auth: Auth.Auth;

if (Platform.OS === 'web') {
  auth = Auth.getAuth(app);
  // Persistencia en web (localStorage)
  Auth.setPersistence(auth, Auth.browserLocalPersistence).catch(() => {});
} else {
  // React Native / Expo Go / Dev Client
  try {
    // MUY IMPORTANTE: initializeAuth debe ir ANTES que getAuth en RN
    const init = (Auth as any).initializeAuth as
      | ((a: any, o: { persistence: any }) => Auth.Auth)
      | undefined;
    const getRNPersist = (Auth as any).getReactNativePersistence as
      | ((storage: typeof AsyncStorage) => any)
      | undefined;

    if (init && getRNPersist) {
      auth = init(app, { persistence: getRNPersist(AsyncStorage) });
    } else {
      // Fallback: sin persistencia (memoria), pero funcional para desarrollo
      auth = Auth.getAuth(app);
    }
  } catch {
    // Si ya estaba inicializado (Fast Refresh), caemos a getAuth
    auth = Auth.getAuth(app);
  }
}

export { auth };