# 🚀 Integración Completa de API - Frontend

**Fecha:** 2024-12-19  
**Estado:** ✅ **COMPLETADO** - Todos los servicios y hooks listos para usar

---

## 📦 Lo que se ha implementado

### ✅ 1. Servicios API Completos (`src/services/api/`)

**Todos los servicios están implementados y listos:**

- ✅ `auth.service.ts` - Autenticación y usuarios
- ✅ `passkeys.service.ts` - Passkeys (WebAuthn)
- ✅ `wallets.service.ts` - Wallets y direcciones
- ✅ `balances.service.ts` - Balances y precios
- ✅ `transfers.service.ts` - Transferencias
- ✅ `payments.service.ts` - Pagos (incluye PIX, Mercado Pago)
- ✅ `relayers.service.ts` - Gasless transactions
- ✅ `accounts.service.ts` - Cuentas y rotación
- ✅ `alias.service.ts` - Alias
- ✅ `contacts.service.ts` - Contactos
- ✅ `search.service.ts` - Búsqueda
- ✅ `settings.service.ts` - Configuración
- ✅ `sessions.service.ts` - Sesiones y seguridad
- ✅ `plans.service.ts` - Planes y límites
- ✅ `notifications.service.ts` - Push notifications
- ✅ `proofs.service.ts` - Comprobantes y estados de cuenta
- ✅ `analytics.service.ts` - Analytics y diagnósticos
- ✅ `health.service.ts` - Health checks

**Total:** 18 servicios, ~100+ funciones listas para usar

---

### ✅ 2. Hooks Personalizados (`src/hooks/`)

**Hooks listos para usar en componentes:**

- ✅ `useBalances.ts` - Obtener balances con auto-refresh
- ✅ `useWallets.ts` - Obtener wallets
- ✅ `useUser.ts` - Obtener y actualizar perfil de usuario
- ✅ `useTransfers.ts` - Obtener historial de transferencias con paginación
- ✅ `useReceiveAddress.ts` - Obtener dirección de recepción (actualizado)

**Ejemplo de uso:**
```typescript
import { useBalances } from '@/hooks/useBalances';
import { useWallets } from '@/hooks/useWallets';
import { useUser } from '@/hooks/useUser';

function MyComponent() {
  const { balances, loading, error, refresh } = useBalances({
    chains: ['eth', 'base', 'sol'],
    account: 'daily',
    autoRefresh: true,
    refreshInterval: 30000, // 30 segundos
  });

  const { wallets, loading: walletsLoading } = useWallets({
    chains: ['eth', 'sol'],
  });

  const { user, updateUserProfile } = useUser();

  // ...
}
```

---

### ✅ 3. API Client Mejorado (`src/lib/apiClient.ts`)

**Características:**
- ✅ Maneja formato estándar: `{ success: true, data: T }`
- ✅ Extrae `data` automáticamente
- ✅ Maneja errores: `{ success: false, error: {...} }`
- ✅ Autenticación automática (Bearer token)
- ✅ Idempotency-Key automática para requests mutantes
- ✅ Métodos: GET, POST, PATCH, PUT, DELETE
- ✅ Manejo de errores de red y rate limiting

---

### ✅ 4. Tipos TypeScript Completos (`src/types/api.ts`)

**Todos los tipos están definidos:**
- ✅ ~100+ tipos TypeScript
- ✅ Tipos para todos los endpoints
- ✅ Tipos de request/response
- ✅ Tipos de errores estándar

---

## 🔧 Configuración

### Variables de Entorno

**Crear archivo `.env` en la raíz del proyecto:**

```env
# Backend API
EXPO_PUBLIC_API_URL=https://hihodl-backend-v-0-1.onrender.com/api/v1

# Para desarrollo local:
# EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Supabase (ya configurado)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**O usar EAS Secrets:**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://hihodl-backend-v-0-1.onrender.com/api/v1"
```

---

## 📱 Cómo Conectar Pantallas

### Dashboard (Home)

**Archivo:** `app/(drawer)/(tabs)/(home)/index.tsx`

```typescript
import { useBalances } from '@/hooks/useBalances';
import { useUser } from '@/hooks/useUser';
import { useTransfers } from '@/hooks/useTransfers';

export default function Dashboard() {
  // Obtener balances
  const { balances, loading: balancesLoading, refresh: refreshBalances } = useBalances({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Obtener usuario
  const { user, loading: userLoading } = useUser();

  // Obtener transferencias recientes
  const { transfers, loading: transfersLoading } = useTransfers({
    limit: 10,
    autoRefresh: true,
  });

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshBalances(),
      // ... otros refreshes
    ]);
  }, [refreshBalances]);

  // ...
}
```

### Send Screen

**Archivo:** `app/(drawer)/(internal)/send/index.tsx`

```typescript
import { sendPayment } from '@/services/api/payments.service';
import { getTransferQuote } from '@/services/api/transfers.service';
import { useBalances } from '@/hooks/useBalances';

export default function SendScreen() {
  const { balances } = useBalances();

  const handleSend = async (params: {
    to: string;
    tokenId: string;
    chain: ChainKey;
    amount: string;
    account: AccountType;
  }) => {
    try {
      // Obtener quote primero
      const quote = await getTransferQuote({
        from: params.to, // dirección del usuario
        to: params.to,
        tokenId: params.tokenId,
        chain: params.chain,
        amount: params.amount,
      });

      // Enviar pago
      const result = await sendPayment({
        to: params.to,
        tokenId: params.tokenId,
        chain: params.chain,
        amount: params.amount,
        account: params.account,
      });

      // Navegar a confirmación
      router.push(`/payments/tx-details/${result.txId}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // ...
}
```

### Receive Screen

**Archivo:** `app/(drawer)/(internal)/receive/index.tsx`

```typescript
import { useReceiveAddress } from '@/hooks/useReceiveAddress';
import { useWallets } from '@/hooks/useWallets';

export default function ReceiveScreen() {
  const { wallets } = useWallets();
  const selectedWallet = wallets[0]; // o selección del usuario

  const { data: receiveAddress, loading, refresh } = useReceiveAddress(
    selectedWallet?.id || '',
    'sol', // o chain seleccionado
    {
      reuse: 'current',
      account: 'daily',
    }
  );

  // ...
}
```

### Payments Screen

**Archivo:** `app/(drawer)/(internal)/payments/QuickSendScreen.tsx`

```typescript
import { sendPayment } from '@/services/api/payments.service';
import { createPaymentRequest } from '@/services/api/payments.service';
import { useBalances } from '@/hooks/useBalances';

export default function QuickSendScreen() {
  const { balances, refresh: refreshBalances } = useBalances();

  const handleSend = async (params: PaymentSendRequest) => {
    try {
      const result = await sendPayment(params);
      await refreshBalances(); // Actualizar balances después del envío
      // Navegar o mostrar éxito
    } catch (error) {
      // Manejar error
    }
  };

  const handleRequest = async (params: PaymentRequestCreateRequest) => {
    try {
      const result = await createPaymentRequest(params);
      // Mostrar link o QR
    } catch (error) {
      // Manejar error
    }
  };

  // ...
}
```

### Settings Screen

**Archivo:** `app/(drawer)/(internal)/menu/settings/index.tsx`

```typescript
import { getSettings, updateSettings } from '@/services/api/settings.service';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const { user, updateUserProfile } = useUser();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    try {
      const updated = await updateSettings(updates);
      setSettings(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  // ...
}
```

### Security Screen

**Archivo:** `app/(drawer)/(internal)/menu/security.tsx`

```typescript
import { listSessions, revokeSession, revokeAllSessions } from '@/services/api/sessions.service';
import { useState, useEffect } from 'react';

export default function SecurityScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { sessions: data } = await listSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      await loadSessions();
    } catch (error) {
      Alert.alert('Error', 'Failed to revoke session');
    }
  };

  // ...
}
```

---

## 🎯 Checklist de Integración por Pantalla

### ✅ Pantallas Principales

- [ ] **Dashboard (Home)**
  - [ ] Conectar `useBalances` para mostrar balances
  - [ ] Conectar `useUser` para mostrar perfil
  - [ ] Conectar `useTransfers` para mostrar historial
  - [ ] Implementar pull-to-refresh

- [ ] **Send Screen**
  - [ ] Conectar `sendPayment` o `submitTransfer`
  - [ ] Conectar `getTransferQuote` para mostrar fees
  - [ ] Validar balances antes de enviar
  - [ ] Manejar errores y mostrar feedback

- [ ] **Receive Screen**
  - [ ] Conectar `useReceiveAddress` para mostrar QR
  - [ ] Conectar `useWallets` para seleccionar wallet
  - [ ] Implementar refresh de dirección

- [ ] **Payments Screen**
  - [ ] Conectar `sendPayment` para envíos
  - [ ] Conectar `createPaymentRequest` para requests
  - [ ] Conectar `useTransfers` para historial
  - [ ] Implementar polling para actualizaciones

- [ ] **Settings Screen**
  - [ ] Conectar `getSettings` / `updateSettings`
  - [ ] Conectar `getSettingsLimits` para mostrar límites
  - [ ] Conectar `useUser` para perfil

- [ ] **Security Screen**
  - [ ] Conectar `listSessions` para mostrar sesiones
  - [ ] Conectar `revokeSession` / `revokeAllSessions`
  - [ ] Conectar `getPepper` si es necesario

- [ ] **Contacts Screen**
  - [ ] Conectar `listContacts` / `createContact` / `deleteContact`
  - [ ] Implementar búsqueda local

- [ ] **Wallets Screen**
  - [ ] Conectar `listWallets` / `linkWallet`
  - [ ] Mostrar direcciones de recepción

---

## 🔄 Flujos Comunes

### Enviar Pago

```typescript
import { sendPayment } from '@/services/api/payments.service';
import { getTransferQuote } from '@/services/api/transfers.service';

async function sendPaymentFlow(params: {
  to: string;
  tokenId: string;
  chain: ChainKey;
  amount: string;
  account: AccountType;
}) {
  try {
    // 1. Obtener quote (opcional, para mostrar fees)
    const quote = await getTransferQuote({
      from: userAddress,
      to: params.to,
      tokenId: params.tokenId,
      chain: params.chain,
      amount: params.amount,
    });

    // 2. Enviar pago
    const result = await sendPayment({
      to: params.to,
      tokenId: params.tokenId,
      chain: params.chain,
      amount: params.amount,
      account: params.account,
    });

    // 3. Navegar a detalles
    router.push(`/payments/tx-details/${result.txId}`);

    return result;
  } catch (error) {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      Alert.alert('Insufficient Balance', 'You don\'t have enough funds');
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      Alert.alert('Too Many Requests', 'Please try again later');
    } else {
      Alert.alert('Error', error.message);
    }
    throw error;
  }
}
```

### Obtener Balances

```typescript
import { useBalances } from '@/hooks/useBalances';

function MyComponent() {
  const { balances, loading, error, refresh } = useBalances({
    chains: ['eth', 'base', 'sol'],
    account: 'daily',
    autoRefresh: true,
    refreshInterval: 30000,
  });

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View>
      {balances.map((balance) => (
        <BalanceItem key={balance.id} balance={balance} />
      ))}
      <Button onPress={refresh}>Refresh</Button>
    </View>
  );
}
```

### Crear Payment Request

```typescript
import { createPaymentRequest } from '@/services/api/payments.service';

async function createRequest(params: {
  to: string; // alias o address
  tokenId: string;
  chain: ChainKey;
  amount: string;
  memo?: string;
}) {
  try {
    const result = await createPaymentRequest({
      to: params.to,
      tokenId: params.tokenId,
      chain: params.chain,
      amount: params.amount,
      memo: params.memo,
    });

    // Mostrar link o QR
    const link = `https://hihodl.app/pay/${result.requestId}`;
    // ... mostrar QR o copiar link

    return result;
  } catch (error) {
    Alert.alert('Error', error.message);
    throw error;
  }
}
```

---

## 🚨 Manejo de Errores

### Errores Comunes

```typescript
import { ApiClientError } from '@/lib/apiClient';

try {
  await sendPayment(params);
} catch (error) {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Token expirado, redirigir a login
        router.push('/auth/login');
        break;
      case 'INSUFFICIENT_BALANCE':
        Alert.alert('Insufficient Balance', 'You don\'t have enough funds');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        Alert.alert('Too Many Requests', 'Please try again later');
        break;
      case 'VALIDATION_ERROR':
        Alert.alert('Invalid Input', error.message);
        break;
      default:
        Alert.alert('Error', error.message);
    }
  } else {
    Alert.alert('Error', 'An unexpected error occurred');
  }
}
```

---

## 📚 Recursos

- **API Client:** `src/lib/apiClient.ts`
- **Servicios:** `src/services/api/`
- **Hooks:** `src/hooks/`
- **Tipos:** `src/types/api.ts`
- **Backend Docs:** `BACKEND_ENDPOINTS_COMPLETO.md`

---

## ✅ Próximos Pasos

1. **Configurar `EXPO_PUBLIC_API_URL`** en `.env` o EAS Secrets
2. **Conectar pantallas principales** usando los hooks y servicios
3. **Implementar manejo de errores** en cada pantalla
4. **Agregar loading states** y feedback visual
5. **Testear flujos completos** (send, receive, payments)

---

**¡Todo está listo para conectar! 🚀**




