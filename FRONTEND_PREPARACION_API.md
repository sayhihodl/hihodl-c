# 🎯 Preparación del Frontend para Conectar con Backend API

**Última actualización:** 2024-11-02  
**Estado Backend:** ✅ 93 endpoints implementados y listos  
**Prioridad:** 🔴 **CRÍTICO** - Hacer antes de empezar a conectar endpoints

---

## ✅ CHECKLIST DE PREPARACIÓN

### 🔴 CRÍTICO - Hacer ANTES de conectar endpoints

#### 1. Variables de Entorno ⚠️ **CRÍTICO**

- [ ] **Configurar `EXPO_PUBLIC_API_URL`**
  - **Desarrollo:** `http://localhost:5000/api/v1`
  - **Producción:** `https://api.hihodl.xyz/api/v1`
  - **Ubicación:** `.env` en raíz del proyecto o EAS Secrets
  - **Estado actual:** `src/config/runtime.ts` ya lo espera pero falta la variable

  ```bash
  # En .env o EAS Secrets:
  EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1  # desarrollo
  # o
  EXPO_PUBLIC_API_URL=https://api.hihodl.xyz/api/v1  # producción
  ```

- [ ] **Verificar Supabase ya está configurado** ✅
  - `EXPO_PUBLIC_SUPABASE_URL` ✅ (ya implementado)
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` ✅ (ya implementado)

---

#### 2. Mejorar API Client ⚠️ **CRÍTICO**

**Estado actual:** ✅ `src/lib/api.ts` existe pero **no está preparado para el formato del backend**

**Problemas identificados:**
- ❌ No usa URL base automáticamente (necesita concatenar manualmente)
- ❌ No incluye autenticación automáticamente
- ❌ No maneja formato estándar del backend: `{ success: true, data: {...} }`
- ❌ No extrae `data` automáticamente
- ❌ No maneja errores del formato: `{ success: false, error: {...} }`
- ❌ Faltan métodos: `PATCH`, `DELETE`

**Solución:** Mejorar `src/lib/api.ts` o crear `src/lib/apiClient.ts`

---

#### 3. Definir Tipos TypeScript ⚠️ **CRÍTICO**

**Crear:** `src/types/api.ts`

**Necesario para:**
- Tipos de respuesta estándar del backend
- Tipos para request/response de cada endpoint
- Tipos de errores estándar
- Type safety en todos los servicios

---

#### 4. Crear Servicios Organizados 🟡 **IMPORTANTE**

**Estructura sugerida:** `src/services/api/`

Organizar servicios por categoría (matching los 93 endpoints del backend):
- `auth.service.ts` - Auth & Users
- `passkeys.service.ts` - Passkeys
- `wallets.service.ts` - Wallets & Addresses
- `balances.service.ts` - Balances & Prices
- `transfers.service.ts` - Transfers
- `payments.service.ts` - Payments
- etc.

---

#### 5. Actualizar Servicios Existentes 🟡 **IMPORTANTE**

Los siguientes archivos ya existen pero necesitan actualización:
- `src/send/api/sendPayment.ts` - Actualizar para nuevo formato
- `src/send/api/createPaymentRequest.ts` - Verificar formato
- `src/send/api/sendPIXPayment.ts` - Verificar formato
- `src/send/api/sendMercadoPagoPayment.ts` - Verificar formato

---

## 📋 DETALLES DE IMPLEMENTACIÓN

### 1. Variable de Entorno

**Archivo:** `.env` (raíz del proyecto)

```env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Supabase (ya configurado)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**O usando EAS Secrets:**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.hihodl.xyz/api/v1"
```

---

### 2. API Client Mejorado

**Crear:** `src/lib/apiClient.ts`

**Características necesarias:**
- ✅ Usar `API_URL` de `runtime.ts` automáticamente
- ✅ Incluir headers de autenticación automáticamente
- ✅ Manejar formato `{ success, data }` del backend
- ✅ Extraer `data` automáticamente
- ✅ Manejar errores `{ success: false, error: {...} }`
- ✅ Métodos: GET, POST, PATCH, DELETE
- ✅ Soporte para `Idempotency-Key` header
- ✅ Retry automático para 401 (con refresh token)
- ✅ Manejo de rate limiting (429)

---

### 3. Tipos TypeScript

**Crear:** `src/types/api.ts`

**Tipos base necesarios:**
```typescript
// Formato estándar de respuesta
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

// Códigos de error comunes
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_BALANCE'
  | 'INTERNAL_ERROR';

// Tipos específicos por categoría (ejemplos)
export type Wallet = {
  id: string;
  userId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  address: string;
  label?: string;
  createdAt: string;
};

export type Transfer = {
  id: string;
  userId: string;
  chain: string;
  tokenId: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  // ... más campos
};

// ... más tipos
```

---

### 4. Servicios por Categoría

**Estructura:** `src/services/api/*.service.ts`

**Ejemplo:** `src/services/api/wallets.service.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { Wallet } from '@/types/api';

export type LinkWalletRequest = {
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  address: string;
  label?: string;
};

/**
 * Link external wallet to user
 */
export async function linkWallet(params: LinkWalletRequest): Promise<Wallet> {
  return apiClient.post<Wallet>('/wallets/link', params);
}

/**
 * List user wallets
 */
export async function listWallets(chains?: string): Promise<{ wallets: Wallet[] }> {
  const query = chains ? `?chains=${chains}` : '';
  return apiClient.get<{ wallets: Wallet[] }>(`/wallets${query}`);
}

/**
 * Get receive address for wallet
 */
export async function getReceiveAddress(
  walletId: string,
  params: {
    chain: 'eth' | 'base' | 'polygon' | 'sol';
    token?: string;
    reuse_policy?: 'current' | 'new';
    account?: 'daily' | 'savings' | 'social';
  }
): Promise<{
  address: string;
  address_id: string;
  expires_at?: string;
  provision_more?: boolean;
}> {
  const query = new URLSearchParams({
    chain: params.chain,
    ...(params.token && { token: params.token }),
    ...(params.reuse_policy && { reuse_policy: params.reuse_policy }),
    ...(params.account && { account: params.account }),
  });
  return apiClient.get(`/wallets/${walletId}/receive-address?${query}`);
}
```

---

## 🎯 PRIORIZACIÓN

### Fase 1: Preparación Crítica (1-2 días)

1. ⚠️ **Configurar `EXPO_PUBLIC_API_URL`** - 5 minutos
2. ⚠️ **Mejorar API Client** - 2-3 horas
   - Crear `apiClient.ts` con formato estándar
   - Agregar autenticación automática
   - Manejar errores del backend
3. ⚠️ **Crear tipos base** - 1-2 horas
   - `ApiResponse<T>`
   - Tipos de error
   - Tipos básicos para las categorías más usadas

### Fase 2: Servicios Críticos (2-3 días)

4. 🟡 **Crear servicios para endpoints más usados:**
   - `wallets.service.ts` - Wallets (4 endpoints)
   - `balances.service.ts` - Balances & Prices (3 endpoints)
   - `transfers.service.ts` - Transfers (6 endpoints)
   - `payments.service.ts` - Payments (6 endpoints)
   - `auth.service.ts` - Auth (4 endpoints)

5. 🟡 **Actualizar servicios existentes:**
   - `sendPayment.ts` - Usar nuevo client
   - `createPaymentRequest.ts` - Verificar formato
   - `sendPIXPayment.ts` - Actualizar
   - `sendMercadoPagoPayment.ts` - Actualizar

### Fase 3: Servicios Completos (3-5 días)

6. 🟡 **Completar todos los servicios:**
   - Passkeys, Relayers, Accounts, Alias
   - Search, Contacts, Settings, Sessions
   - Plans, Notifications, Proofs, Analytics

7. 🟢 **Mejoras opcionales:**
   - Interceptors para refresh token
   - Cache de respuestas
   - Retry logic mejorado

---

## ✅ RESUMEN EJECUTIVO

### ¿Qué falta hacer?

**🔴 CRÍTICO (antes de conectar):**
1. ⚠️ Configurar `EXPO_PUBLIC_API_URL`
2. ⚠️ Mejorar API client para formato `{ success, data }`
3. ⚠️ Crear tipos TypeScript básicos

**🟡 IMPORTANTE (durante integración):**
4. 🟡 Crear servicios para endpoints más usados
5. 🟡 Actualizar servicios existentes

**🟢 OPCIONAL (después):**
6. 🟢 Completar todos los servicios
7. 🟢 Optimizaciones y mejoras

---

## 🚀 ACCIÓN INMEDIATA

**Para empezar a conectar endpoints, necesitas:**

1. **Configurar variable de entorno** (5 min)
   ```bash
   echo "EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1" >> .env
   ```

2. **Mejorar API client** (2-3 horas)
   - Crear `src/lib/apiClient.ts` con formato estándar
   - O mejorar `src/lib/api.ts` existente

3. **Tipos básicos** (1 hora)
   - Crear `src/types/api.ts` con tipos base

**Con esto puedes empezar a conectar los endpoints más críticos.**

---

**Última actualización:** 2024-11-02