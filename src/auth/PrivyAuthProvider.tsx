// src/auth/PrivyAuthProvider.tsx
// Wrapper personalizado de PrivyProvider que integra Supabase como proveedor de autenticación
// Basado en: https://docs.privy.io/guides/authentication/using-your-own-authentication
import { useCallback, PropsWithChildren } from 'react';
import { PrivyProvider } from '@privy-io/expo';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';

export const PrivyAuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Obtener credenciales de Privy
  // Las variables de app.json pueden venir como ${VAR} si no se resuelven
  const appIdFromConfig = Constants.expoConfig?.extra?.EXPO_PUBLIC_PRIVY_APP_ID || '';
  const clientIdFromConfig = Constants.expoConfig?.extra?.EXPO_PUBLIC_PRIVY_CLIENT_ID || '';
  const appIdFromEnv = process.env.EXPO_PUBLIC_PRIVY_APP_ID || '';
  const clientIdFromEnv = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID || '';
  
  // Si las variables vienen como ${VAR}, usar fallback directo
  const PRIVY_APP_ID = (appIdFromConfig && !appIdFromConfig.startsWith('${')) 
    ? appIdFromConfig 
    : (appIdFromEnv && !appIdFromEnv.startsWith('${'))
    ? appIdFromEnv
    : 'cmhqg199a000tl70ca9h3i1pu'; // Fallback directo
  
  const PRIVY_CLIENT_ID = (clientIdFromConfig && !clientIdFromConfig.startsWith('${'))
    ? clientIdFromConfig
    : (clientIdFromEnv && !clientIdFromEnv.startsWith('${'))
    ? clientIdFromEnv
    : 'client-WY6SW4RmsPB8PycfQo73oTiGao63hkxP7AmThmF3NyzGg'; // Fallback directo

  // Obtener estado de autenticación de Supabase
  const { session, user, isLoading } = useAuthStore();

  // Callback para obtener el token JWT de Supabase
  // Este callback se llama cuando Privy necesita el token del usuario
  const getCustomToken = useCallback(async () => {
    try {
      // Primero intentar usar la sesión del store (más rápido)
      if (session?.access_token) {
        return session.access_token;
      }

      // Si no hay sesión en el store, intentar obtenerla directamente de Supabase
      // Esto puede pasar si el store no se ha actualizado aún
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Error getting Supabase session for Privy:', error);
        return undefined;
      }

      if (currentSession?.access_token) {
        return currentSession.access_token;
      }

      // Si no hay token, el usuario no está autenticado
      return undefined;
    } catch (error) {
      // Si hay un error, el usuario probablemente no está autenticado
      console.warn('Error getting Supabase token for Privy:', error);
      return undefined;
    }
  }, [session, user, isLoading]); // Re-create when auth state changes

  // Validar que tenemos las credenciales necesarias
  if (!PRIVY_APP_ID || PRIVY_APP_ID === '') {
    console.error('⚠️ PRIVY_APP_ID is missing. Please set EXPO_PUBLIC_PRIVY_APP_ID');
    console.error('   Current value:', PRIVY_APP_ID);
  } else {
    console.log('✅ Privy App ID loaded:', PRIVY_APP_ID.substring(0, 10) + '...');
  }
  
  if (!PRIVY_CLIENT_ID || PRIVY_CLIENT_ID === '') {
    console.error('⚠️ PRIVY_CLIENT_ID is missing. Please set EXPO_PUBLIC_PRIVY_CLIENT_ID');
    console.error('   Current value:', PRIVY_CLIENT_ID);
  } else {
    console.log('✅ Privy Client ID loaded:', PRIVY_CLIENT_ID.substring(0, 15) + '...');
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        // Solo External Wallets (MetaMask, Phantom, etc.)
        // Custom Auth deshabilitado (incompatibilidad HS256 vs RS256)
        // Usamos Supabase para otros métodos de auth (email, Google, Apple, etc.)
        loginMethods: ['wallet'], // Solo wallets externas
        // Deshabilitar embedded wallets automáticos
        embeddedWallets: {
          createOnLogin: 'off',
        },
        // Configuración adicional para React Native
        appearance: {
          walletList: ['metamask', 'phantom', 'walletconnect'],
        },
        // IMPORTANTE: No interceptar OAuth de Supabase
        // Privy solo maneja wallets, no social logins
        // Supabase maneja Google, Apple, Email, etc.
      }}
      // Deshabilitar interceptación de requests de red
      // Esto evita que Privy interfiera con Supabase OAuth
      onError={(error) => {
        // Solo loguear errores, no bloquear
        console.warn('[Privy] Error (no bloqueante):', error);
      }}
    >
      {children}
    </PrivyProvider>
  );
};

