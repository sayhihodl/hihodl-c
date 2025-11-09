# 🔐 Guía: Sign in with Ethereum & Solana (SIWE/SIWS)

**Fecha:** 2024-12-19  
**Objetivo:** Permitir login con wallets (MetaMask, Phantom) usando EIP-4361 y SIWS

---

## 📊 RESUMEN EJECUTIVO

### ✅ ¿Por qué implementar esto?

1. **Reduce fricción:** Usuarios ya tienen wallets, no necesitan crear cuenta
2. **Web3-native:** Alineado con el ecosistema crypto
3. **Mejor UX:** Un clic para conectar wallet vs. múltiples pasos de registro
4. **Seguridad:** No manejas passwords, la wallet maneja las keys
5. **Competitivo:** Phantom, MetaMask, y otras wallets lo ofrecen

### 🎯 Estado Actual vs. Propuesto

**Actualmente tienes:**
- ✅ Email/Password (Supabase)
- ✅ Google OAuth
- ✅ Apple OAuth
- ✅ Passkeys (WebAuthn)

**Agregar:**
- 🆕 Sign in with Ethereum (EIP-4361) - MetaMask, WalletConnect, etc.
- 🆕 Sign in with Solana (SIWS) - Phantom, Solflare, etc.

---

## 🔍 ¿QUÉ ES SIGN IN WITH ETHEREUM/SOLANA?

### Sign in with Ethereum (EIP-4361)

**Estándar:** [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)

**Cómo funciona:**
1. Usuario conecta wallet (MetaMask, WalletConnect, etc.)
2. App genera mensaje firmable con:
   - Dominio de la app
   - Dirección del wallet
   - Nonce único
   - Timestamp
   - Statement (mensaje para el usuario)
3. Usuario firma el mensaje con su wallet
4. Backend verifica la firma
5. Si es válida, crea sesión autenticada

**Ejemplo de mensaje:**
```
hihodl.xyz wants you to sign in with your Ethereum account:
0x1234...5678

Sign in with Ethereum to the app.

URI: https://hihodl.xyz
Version: 1
Chain ID: 1
Nonce: abc123
Issued At: 2024-12-19T10:00:00Z
```

### Sign in with Solana (SIWS)

**Estándar:** Similar a EIP-4361 pero para Solana

**Cómo funciona:**
1. Usuario conecta wallet Solana (Phantom, Solflare, etc.)
2. App genera mensaje firmable
3. Usuario firma con su wallet Solana
4. Backend verifica firma usando la clave pública
5. Crea sesión autenticada

---

## 🏗️ ARQUITECTURA RECOMENDADA

### Opción 1: Implementación Manual (Recomendada para control)

**Ventajas:**
- Control total sobre el flujo
- No dependencias externas
- Más ligero

**Desventajas:**
- Más código que mantener
- Necesitas manejar múltiples wallets

### Opción 2: Usar Librerías (Recomendada para velocidad)

**Para Ethereum:**
- `@spruceid/siwe` - Librería oficial de SIWE
- `wagmi` + `viem` - React hooks para Ethereum
- `@web3modal/react-native` - UI para conectar wallets

**Para Solana:**
- `@solana/wallet-adapter-react` - React hooks para Solana
- `@solana/wallet-adapter-react-native` - Para React Native
- `@solana/web3.js` - SDK de Solana

**Para ambas:**
- `@privy-io/react-native` - MPC wallet + SIWE/SIWS integrado
- `@web3auth/react-native` - Similar a Privy

---

## 💼 BUSINESS WALLETS (MPC Wallets)

### ¿Qué son?

**MPC (Multi-Party Computation) Wallets:**
- No guardas las keys privadas completas
- Keys divididas entre servidor y cliente
- Más seguro que wallets tradicionales
- Mejor UX (no seed phrases)

### Opciones Recomendadas

#### 1. **Privy** ⭐ **RECOMENDADO**

**Ventajas:**
- ✅ Soporta SIWE y SIWS
- ✅ MPC wallet integrado
- ✅ Social logins (Google, Apple) + Wallets
- ✅ React Native SDK
- ✅ Free tier generoso
- ✅ Excelente documentación

**Precio:**
- Free: 1,000 MAU
- Pro: $99/mes (10,000 MAU)

**Ideal para:** Apps que quieren todo en uno (social + wallets)

#### 2. **Web3Auth** ⭐ **BUENA OPCIÓN**

**Ventajas:**
- ✅ MPC wallet integrado
- ✅ Social logins
- ✅ SIWE soportado
- ✅ React Native SDK
- ✅ Open source

**Desventajas:**
- ⚠️ Más complejo de configurar
- ⚠️ SIWS no tan bien soportado

**Ideal para:** Apps que priorizan Ethereum

#### 3. **Magic** (Ahora Magic Link)

**Ventajas:**
- ✅ Social logins
- ✅ Email magic links
- ✅ React Native SDK

**Desventajas:**
- ❌ No soporta SIWE/SIWS nativo
- ❌ Más enfocado en Web2

**Ideal para:** Apps Web2 que quieren agregar crypto

#### 4. **Fireblocks**

**Ventajas:**
- ✅ Enterprise-grade
- ✅ Muy seguro
- ✅ Custodia institucional

**Desventajas:**
- ❌ Caro (enterprise pricing)
- ❌ No para consumidores

**Ideal para:** Apps enterprise/institucionales

---

## 🎯 RECOMENDACIÓN PARA HIHODL

### Opción Recomendada: **Privy** + Implementación Manual de SIWE/SIWS

**Razones:**
1. **Privy** para usuarios nuevos (social login + MPC wallet automático)
2. **SIWE/SIWS manual** para usuarios que ya tienen wallets (MetaMask, Phantom)
3. Mejor de ambos mundos: facilidad para nuevos usuarios + flexibilidad para usuarios avanzados

### Arquitectura Propuesta

```
┌─────────────────────────────────────────┐
│         Pantalla de Login               │
└─────────────────────────────────────────┘
              │
              ├─► Email/Password (Supabase) ✅ Ya tienes
              ├─► Google OAuth (Supabase) ✅ Ya tienes
              ├─► Apple OAuth (Supabase) ✅ Ya tienes
              ├─► Passkeys (WebAuthn) ✅ Ya tienes
              ├─► Sign in with Ethereum 🆕 NUEVO
              │   ├─► MetaMask
              │   ├─► WalletConnect
              │   └─► Coinbase Wallet
              └─► Sign in with Solana 🆕 NUEVO
                  ├─► Phantom
                  ├─► Solflare
                  └─► Backpack
```

---

## 📦 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Instalar Dependencias

```bash
# Para Ethereum
npm install @spruceid/siwe ethers@^6.15.0

# Para Solana
npm install @solana/web3.js @solana/wallet-adapter-base

# Para React Native (wallet connection)
npm install @walletconnect/react-native-dapp
npm install react-native-get-random-values
```

### Paso 2: Crear Servicio de SIWE

**Archivo:** `src/auth/siwe.ts`

```typescript
// src/auth/siwe.ts
import { SiweMessage } from '@spruceid/siwe';
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export interface SiweResult {
  success: boolean;
  error?: Error;
  address?: string;
  session?: any;
}

/**
 * Sign in with Ethereum (EIP-4361)
 */
export async function signInWithEthereum(
  provider: ethers.BrowserProvider
): Promise<SiweResult> {
  try {
    // 1. Obtener dirección del wallet
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // 2. Obtener nonce del backend
    const nonceResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/siwe/nonce`, {
      method: 'GET',
    });
    const { nonce } = await nonceResponse.json();

    // 3. Crear mensaje SIWE
    const domain = 'hihodl.xyz'; // o tu dominio
    const origin = 'https://hihodl.xyz'; // o tu app URL
    const statement = 'Sign in with Ethereum to HIHODL';
    
    const message = new SiweMessage({
      domain,
      address,
      statement,
      uri: origin,
      version: '1',
      chainId: 1, // Ethereum mainnet, ajustar según red
      nonce,
      issuedAt: new Date().toISOString(),
    });

    const messageToSign = message.prepareMessage();

    // 4. Pedir al usuario que firme
    const signature = await signer.signMessage(messageToSign);

    // 5. Verificar con backend
    const verifyResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/siwe/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageToSign,
        signature,
      }),
    });

    const { success, token, user } = await verifyResponse.json();

    if (!success) {
      return { success: false, error: new Error('Verification failed') };
    }

    // 6. Crear sesión en Supabase (o tu sistema de auth)
    // Opción A: Crear usuario en Supabase con address como email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${address}@ethereum.local`, // Email sintético
      password: signature, // Usar signature como password temporal
    });

    if (authError) {
      // Si no existe, crear cuenta
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${address}@ethereum.local`,
        password: signature,
      });

      if (signUpError) {
        return { success: false, error: signUpError };
      }
    }

    // 7. Guardar sesión
    const { setUser } = useAuthStore.getState();
    setUser(authData?.user || signUpData?.user, authData?.session || signUpData?.session, 'ethereum');

    return {
      success: true,
      address,
      session: authData?.session || signUpData?.session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('SIWE failed'),
    };
  }
}
```

### Paso 3: Crear Servicio de SIWS (Solana)

**Archivo:** `src/auth/siws.ts`

```typescript
// src/auth/siws.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export interface SiwsResult {
  success: boolean;
  error?: Error;
  address?: string;
  session?: any;
}

/**
 * Sign in with Solana (SIWS)
 */
export async function signInWithSolana(
  publicKey: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<SiwsResult> {
  try {
    const address = publicKey.toBase58();

    // 1. Obtener nonce del backend
    const nonceResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/siws/nonce`, {
      method: 'GET',
    });
    const { nonce } = await nonceResponse.json();

    // 2. Crear mensaje SIWS
    const domain = 'hihodl.xyz';
    const statement = 'Sign in with Solana to HIHODL';
    const issuedAt = new Date().toISOString();
    
    const message = new TextEncoder().encode(
      `${domain} wants you to sign in with your Solana account:\n${address}\n\n${statement}\n\nURI: https://${domain}\nVersion: 1\nNonce: ${nonce}\nIssued At: ${issuedAt}`
    );

    // 3. Pedir al usuario que firme
    const signature = await signMessage(message);

    // 4. Verificar con backend
    const verifyResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/siws/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: new TextDecoder().decode(message),
        signature: Array.from(signature),
        publicKey: address,
      }),
    });

    const { success, token, user } = await verifyResponse.json();

    if (!success) {
      return { success: false, error: new Error('Verification failed') };
    }

    // 5. Crear sesión en Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${address}@solana.local`,
      password: Buffer.from(signature).toString('base64'),
    });

    if (authError) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${address}@solana.local`,
        password: Buffer.from(signature).toString('base64'),
      });

      if (signUpError) {
        return { success: false, error: signUpError };
      }
    }

    // 6. Guardar sesión
    const { setUser } = useAuthStore.getState();
    setUser(authData?.user || signUpData?.user, authData?.session || signUpData?.session, 'solana');

    return {
      success: true,
      address,
      session: authData?.session || signUpData?.session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('SIWS failed'),
    };
  }
}
```

### Paso 4: Conectar Wallets

**Archivo:** `src/auth/wallet-connection.ts`

```typescript
// src/auth/wallet-connection.ts
import { Platform } from 'react-native';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import { signInWithEthereum } from './siwe';
import { signInWithSolana } from './siws';

/**
 * Conectar MetaMask y hacer SIWE
 */
export async function connectMetaMask(): Promise<{ error: Error | null }> {
  try {
    if (Platform.OS === 'web') {
      // Web: usar window.ethereum
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const result = await signInWithEthereum(provider);
      
      if (!result.success) {
        return { error: result.error || new Error('SIWE failed') };
      }

      return { error: null };
    } else {
      // Mobile: usar WalletConnect o deep linking
      // Implementar según tu preferencia
      throw new Error('MetaMask mobile not yet implemented');
    }
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('MetaMask connection failed') };
  }
}

/**
 * Conectar Phantom y hacer SIWS
 */
export async function connectPhantom(): Promise<{ error: Error | null }> {
  try {
    if (Platform.OS === 'web') {
      // Web: usar window.solana
      if (typeof window === 'undefined' || !window.solana) {
        throw new Error('Phantom not installed');
      }

      const provider = window.solana;
      const response = await provider.connect();
      const publicKey = new PublicKey(response.publicKey);

      const signMessage = async (message: Uint8Array) => {
        const signed = await provider.signMessage(message, 'utf8');
        return signed.signature;
      };

      const result = await signInWithSolana(publicKey, signMessage);
      
      if (!result.success) {
        return { error: result.error || new Error('SIWS failed') };
      }

      return { error: null };
    } else {
      // Mobile: usar deep linking
      // Implementar según tu preferencia
      throw new Error('Phantom mobile not yet implemented');
    }
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Phantom connection failed') };
  }
}
```

### Paso 5: Agregar UI en Login

**Actualizar:** `app/auth/login.tsx`

Agregar botones para conectar wallets:

```typescript
// En app/auth/login.tsx, agregar:

import { connectMetaMask, connectPhantom } from '@/auth/wallet-connection';

// En el componente:
const handleMetaMask = async () => {
  const { error } = await connectMetaMask();
  if (error) {
    Alert.alert('Error', error.message);
  }
};

const handlePhantom = async () => {
  const { error } = await connectPhantom();
  if (error) {
    Alert.alert('Error', error.message);
  }
};

// En el JSX, agregar botones:
<Pressable onPress={handleMetaMask} style={styles.walletButton}>
  <Image source={require('@assets/icons/metamask.png')} />
  <Text>Connect MetaMask</Text>
</Pressable>

<Pressable onPress={handlePhantom} style={styles.walletButton}>
  <Image source={require('@assets/icons/phantom.png')} />
  <Text>Connect Phantom</Text>
</Pressable>
```

---

## 🔧 BACKEND: Endpoints Necesarios

### 1. GET `/auth/siwe/nonce`
```typescript
// Genera nonce único para SIWE
GET /auth/siwe/nonce
Response: { nonce: "abc123..." }
```

### 2. POST `/auth/siwe/verify`
```typescript
// Verifica firma SIWE
POST /auth/siwe/verify
Body: {
  message: string,
  signature: string
}
Response: {
  success: true,
  token: "jwt-token",
  user: { id, address, ... }
}
```

### 3. GET `/auth/siws/nonce`
```typescript
// Similar a SIWE pero para Solana
GET /auth/siws/nonce
Response: { nonce: "xyz789..." }
```

### 4. POST `/auth/siws/verify`
```typescript
// Verifica firma SIWS
POST /auth/siws/verify
Body: {
  message: string,
  signature: number[],
  publicKey: string
}
Response: {
  success: true,
  token: "jwt-token",
  user: { id, address, ... }
}
```

---

## 📊 COMPARACIÓN: Business Wallets vs. SIWE/SIWS

| Aspecto | SIWE/SIWS (MetaMask/Phantom) | MPC Wallets (Privy/Web3Auth) |
|---------|------------------------------|------------------------------|
| **UX para nuevos usuarios** | ⚠️ Requiere instalar wallet | ✅ Social login, sin wallet |
| **UX para usuarios avanzados** | ✅ Ya tienen wallet | ⚠️ Necesitan crear cuenta |
| **Seguridad** | ✅ Keys en wallet del usuario | ✅ Keys compartidas (MPC) |
| **Custodia** | ✅ Usuario controla keys | ⚠️ Compartida con proveedor |
| **Complejidad** | ⚠️ Más código | ✅ SDK listo |
| **Costo** | ✅ Gratis | ⚠️ Puede ser caro |
| **Flexibilidad** | ✅ Control total | ⚠️ Dependes del proveedor |

---

## 🎯 RECOMENDACIÓN FINAL

### Para HIHODL, recomiendo:

1. **Implementar SIWE/SIWS** para usuarios que ya tienen wallets
   - MetaMask (Ethereum)
   - Phantom (Solana)
   - WalletConnect (múltiples wallets)

2. **Mantener opciones actuales** para nuevos usuarios
   - Email/Password
   - Google OAuth
   - Apple OAuth
   - Passkeys

3. **Opcional: Agregar Privy** más adelante
   - Para usuarios que quieren MPC wallet sin seed phrase
   - Mejor UX para usuarios no-crypto

### Flujo Recomendado:

```
Usuario llega a login
    │
    ├─► ¿Ya tiene wallet? → SIWE/SIWS
    │   ├─► MetaMask → Sign in with Ethereum
    │   └─► Phantom → Sign in with Solana
    │
    └─► ¿Nuevo usuario? → Opciones actuales
        ├─► Google OAuth
        ├─► Apple OAuth
        ├─► Passkeys
        └─► Email/Password
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Frontend
- [ ] Instalar dependencias (`@spruceid/siwe`, `ethers`, `@solana/web3.js`)
- [ ] Crear `src/auth/siwe.ts`
- [ ] Crear `src/auth/siws.ts`
- [ ] Crear `src/auth/wallet-connection.ts`
- [ ] Agregar botones en `app/auth/login.tsx`
- [ ] Agregar assets (iconos de MetaMask, Phantom)
- [ ] Testing en web (MetaMask, Phantom)
- [ ] Testing en mobile (WalletConnect, deep linking)

### Backend
- [ ] Endpoint `GET /auth/siwe/nonce`
- [ ] Endpoint `POST /auth/siwe/verify`
- [ ] Endpoint `GET /auth/siws/nonce`
- [ ] Endpoint `POST /auth/siws/verify`
- [ ] Verificación de firmas (Ethereum y Solana)
- [ ] Crear/actualizar usuarios con address
- [ ] Rate limiting para prevenir abuso

### Testing
- [ ] Test con MetaMask (web)
- [ ] Test con Phantom (web)
- [ ] Test con WalletConnect (mobile)
- [ ] Test de verificación de firmas
- [ ] Test de seguridad (nonce único, timestamp)

---

## 📚 RECURSOS

- [EIP-4361 Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [SIWE Library (@spruceid/siwe)](https://github.com/spruceid/siwe)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Privy Documentation](https://docs.privy.io/)
- [Web3Auth Documentation](https://web3auth.io/docs/)

---

**¿Preguntas?** Esta implementación te dará lo mejor de ambos mundos: facilidad para nuevos usuarios y flexibilidad para usuarios avanzados con wallets.

