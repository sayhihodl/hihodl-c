# 🔗 Guía: Integración Mínima de Privy (Solo Wallet Login)

**Objetivo:** Usar Privy SOLO para login con MetaMask/Phantom, manteniendo Supabase para todo lo demás.

---

## 📊 ARQUITECTURA

```
┌─────────────────────────────────────────┐
│         Sistema de Autenticación        │
└─────────────────────────────────────────┘
              │
              ├─► Supabase (✅ Ya tienes)
              │   ├─► Email/Password
              │   ├─► Google OAuth
              │   ├─► Apple OAuth
              │   └─► Passkeys
              │
              └─► Privy (🆕 Solo para wallets)
                  ├─► MetaMask (Ethereum)
                  └─► Phantom (Solana)
```

**Flujo:**
1. Usuario conecta wallet con Privy
2. Privy autentica y obtiene address
3. Crear/actualizar usuario en Supabase con address
4. Usar Supabase session para todo lo demás

---

## 📦 QUÉ NECESITAS DE PRIVY

### Solo necesitas:
- ✅ **Privy SDK** - Para conectar wallets (MetaMask, Phantom)
- ✅ **App ID de Privy** - Gratis hasta 500 MAU

### NO necesitas:
- ❌ Privy para auth completo (ya tienes Supabase)
- ❌ Privy embedded wallets (solo quieres conectar wallets externas)
- ❌ Privy para base de datos (ya tienes Supabase)

---

## 🚀 PASO 1: Instalar Privy

```bash
npm install @privy-io/react-native
```

**Nota:** Si estás usando Expo, también necesitas:
```bash
npx expo install expo-crypto expo-secure-store
```

---

## 🔑 PASO 2: Obtener App ID de Privy

1. Ir a https://dashboard.privy.io/
2. Crear cuenta (gratis)
3. Crear nueva app
4. Copiar **App ID**

Agregar al `.env`:
```env
EXPO_PUBLIC_PRIVY_APP_ID=tu-privy-app-id
```

---

## 💻 PASO 3: Configurar Privy Provider

**Archivo:** `app/_layout.tsx` (o donde tengas tu root provider)

```typescript
// app/_layout.tsx
import { PrivyProvider } from '@privy-io/react-native';
import Constants from 'expo-constants';

const PRIVY_APP_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_PRIVY_APP_ID || '';

export default function RootLayout() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Solo habilitar wallets externas (MetaMask, Phantom)
        loginMethods: ['wallet'], // Solo wallets, no social logins
        appearance: {
          walletList: ['metamask', 'phantom', 'walletconnect'], // Wallets a mostrar
        },
        // Deshabilitar embedded wallets (no los necesitas)
        embeddedWallets: {
          createOnLogin: 'off', // No crear wallets embebidos
        },
      }}
    >
      {/* Tu app aquí */}
      <Slot />
    </PrivyProvider>
  );
}
```

---

## 🔐 PASO 4: Crear Servicio de Wallet Auth

**Archivo:** `src/auth/wallet-privy.ts`

```typescript
// src/auth/wallet-privy.ts
// Integración de Privy con Supabase para wallet authentication
import { usePrivy } from '@privy-io/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { logger } from '@/utils/logger';

export interface WalletAuthResult {
  success: boolean;
  error?: Error;
  address?: string;
  chain?: 'ethereum' | 'solana';
}

/**
 * Conectar wallet con Privy y crear sesión en Supabase
 */
export async function signInWithWallet(): Promise<WalletAuthResult> {
  try {
    const { connectWallet, ready, authenticated, user: privyUser } = usePrivy();

    // 1. Conectar wallet con Privy
    if (!ready) {
      return { success: false, error: new Error('Privy not ready') };
    }

    if (!authenticated) {
      // Conectar wallet
      await connectWallet();
      
      // Esperar a que se autentique
      // Nota: connectWallet es async pero no retorna el resultado directamente
      // Necesitas usar el hook usePrivy para obtener el estado
      return { success: false, error: new Error('Wallet connection pending') };
    }

    // 2. Obtener address del wallet
    if (!privyUser) {
      return { success: false, error: new Error('No user after wallet connection') };
    }

    // Obtener wallet address
    const wallet = privyUser.wallet;
    if (!wallet) {
      return { success: false, error: new Error('No wallet found') };
    }

    const address = wallet.address;
    const chain = wallet.chainType === 'ethereum' ? 'ethereum' : 'solana';

    // 3. Crear o actualizar usuario en Supabase
    // Usar address como email sintético
    const syntheticEmail = `${address}@${chain}.local`;
    
    // Intentar login primero
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password: address, // Usar address como password temporal
    });

    // Si no existe, crear cuenta
    if (authError && authError.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: syntheticEmail,
        password: address,
        options: {
          data: {
            wallet_address: address,
            wallet_chain: chain,
            privy_user_id: privyUser.id,
          },
        },
      });

      if (signUpError) {
        logger.error('Failed to create Supabase user:', signUpError);
        return { success: false, error: signUpError };
      }

      authData = signUpData;
    } else if (authError) {
      logger.error('Failed to sign in:', authError);
      return { success: false, error: authError };
    }

    // 4. Guardar sesión en store
    if (authData?.user && authData?.session) {
      const { setUser } = useAuthStore.getState();
      setUser(authData.user, authData.session, 'wallet');
    }

    return {
      success: true,
      address,
      chain,
    };
  } catch (error) {
    logger.error('Wallet auth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Wallet authentication failed'),
    };
  }
}

/**
 * Hook para usar wallet auth
 */
export function useWalletAuth() {
  const { connectWallet, ready, authenticated, user: privyUser } = usePrivy();
  const { isAuthenticated } = useAuthStore();

  const signIn = async (): Promise<WalletAuthResult> => {
    if (!ready) {
      return { success: false, error: new Error('Privy not ready') };
    }

    try {
      // Conectar wallet
      await connectWallet();
      
      // Esperar a que se complete la conexión
      // Nota: En React Native, connectWallet puede requerir manejo diferente
      // Ver documentación de Privy para React Native
      
      // Una vez conectado, crear sesión en Supabase
      return await signInWithWallet();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to connect wallet'),
      };
    }
  };

  const signOut = async () => {
    // Cerrar sesión en Privy
    const { logout } = usePrivy();
    await logout();
    
    // Cerrar sesión en Supabase
    await useAuthStore.getState().clearAuth();
  };

  return {
    signIn,
    signOut,
    ready,
    authenticated: authenticated && isAuthenticated,
    address: privyUser?.wallet?.address,
    chain: privyUser?.wallet?.chainType,
  };
}
```

---

## 🎨 PASO 5: Agregar UI en Login

**Actualizar:** `app/auth/login.tsx`

```typescript
// app/auth/login.tsx
import { useWalletAuth } from '@/auth/wallet-privy';
import { Image, Pressable, Text } from 'react-native';

export default function Login() {
  const { signIn, ready } = useWalletAuth();
  const [loading, setLoading] = useState(false);

  const handleMetaMask = async () => {
    setLoading(true);
    try {
      const result = await signIn();
      if (!result.success) {
        Alert.alert('Error', result.error?.message || 'Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* ... otros métodos de login ... */}
      
      {/* Botón para conectar MetaMask */}
      <Pressable 
        onPress={handleMetaMask} 
        disabled={!ready || loading}
        style={styles.walletButton}
      >
        <Image 
          source={require('@assets/icons/metamask.png')} 
          style={styles.walletIcon}
        />
        <Text>Connect MetaMask</Text>
      </Pressable>

      {/* Botón para conectar Phantom */}
      <Pressable 
        onPress={handleMetaMask} // Mismo handler, Privy mostrará opciones
        disabled={!ready || loading}
        style={styles.walletButton}
      >
        <Image 
          source={require('@assets/icons/phantom.png')} 
          style={styles.walletIcon}
        />
        <Text>Connect Phantom</Text>
      </Pressable>
    </View>
  );
}
```

---

## ⚙️ PASO 6: Actualizar app.json

Agregar variable de entorno:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_PRIVY_APP_ID": "${EXPO_PUBLIC_PRIVY_APP_ID}"
    }
  }
}
```

---

## 🔧 PASO 7: Configurar Supabase Schema

Agregar campos de wallet a la tabla de usuarios (si no existen):

```sql
-- En Supabase SQL Editor
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_chain TEXT,
ADD COLUMN IF NOT EXISTS privy_user_id TEXT;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
ON auth.users(wallet_address);
```

---

## 📋 RESUMEN: QUÉ USAS DE CADA UNO

### Privy (Solo para esto):
- ✅ Conectar MetaMask
- ✅ Conectar Phantom
- ✅ Obtener address del wallet
- ✅ Verificar que el usuario tiene el wallet

### Supabase (Para todo lo demás):
- ✅ Autenticación (email, Google, Apple, Passkeys)
- ✅ Base de datos
- ✅ Session management
- ✅ User profiles
- ✅ Storage
- ✅ Real-time subscriptions

---

## 🎯 FLUJO COMPLETO

```
1. Usuario hace clic en "Connect MetaMask"
   │
   ├─► Privy muestra modal de conexión
   │
2. Usuario aprueba en MetaMask
   │
   ├─► Privy obtiene address: 0x1234...
   │
3. App crea/actualiza usuario en Supabase
   │
   ├─► Email: 0x1234...@ethereum.local
   ├─► Password: 0x1234... (address)
   ├─► Metadata: { wallet_address, wallet_chain, privy_user_id }
   │
4. Supabase retorna session
   │
   ├─► App guarda session en store
   │
5. Usuario autenticado ✅
   │
   └─► Todo lo demás usa Supabase (como antes)
```

---

## ✅ CHECKLIST

- [ ] Crear cuenta en Privy
- [ ] Obtener App ID
- [ ] Agregar `EXPO_PUBLIC_PRIVY_APP_ID` al `.env`
- [ ] Instalar `@privy-io/react-native`
- [ ] Agregar `PrivyProvider` en `_layout.tsx`
- [ ] Crear `src/auth/wallet-privy.ts`
- [ ] Agregar botones en `app/auth/login.tsx`
- [ ] Actualizar schema de Supabase (agregar campos wallet)
- [ ] Testing con MetaMask (web)
- [ ] Testing con Phantom (web)
- [ ] Testing en mobile (si aplica)

---

## 💰 COSTO

**Privy:**
- ✅ **Gratis** hasta 500 MAU
- ✅ **Gratis** hasta 100K transacciones/mes

**Supabase:**
- ✅ Ya lo tienes configurado
- ✅ Mismo costo que antes (no cambia)

**Total:** $0/mes hasta 500 usuarios activos

---

## 🚨 NOTAS IMPORTANTES

1. **Privy solo para conectar wallets:** No uses Privy para auth completo, solo para obtener el address del wallet.

2. **Supabase sigue siendo tu fuente de verdad:** Todos los usuarios (email, Google, Apple, Passkeys, Wallets) están en Supabase.

3. **Address como email sintético:** Usamos `${address}@ethereum.local` como email. Esto permite que Supabase maneje el usuario normalmente.

4. **Password temporal:** Usamos el address como password. En producción, considera un hash más seguro o un sistema de tokens.

5. **React Native:** Privy para React Native puede tener diferencias con la versión web. Revisa la documentación específica.

---

## 📚 RECURSOS

- [Privy React Native Docs](https://docs.privy.io/guide/react/react-native)
- [Privy Wallet Connectors](https://docs.privy.io/wallets/connectors)
- [Privy Pricing](https://www.privy.io/pricing)

---

**¿Preguntas?** Esta integración mínima te da lo mejor de ambos mundos: Privy para conectar wallets fácilmente, y Supabase para todo lo demás que ya tienes funcionando.

