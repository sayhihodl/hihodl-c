# ✅ Checklist: Integración de Privy

**App ID:** `cmhqg199a000tl70ca9h3i1pu`  
**Estado:** ⏳ En progreso

---

## ✅ COMPLETADO

- [x] **Instalar Privy SDK**
  - ✅ `@privy-io/react-auth` instalado (v3.6.1)

- [x] **Configurar App ID en .env**
  - ✅ `EXPO_PUBLIC_PRIVY_APP_ID=cmhqg199a000tl70ca9h3i1pu`

---

## ❌ PENDIENTE

### 1. Configuración Básica

- [ ] **Agregar variable a app.json**
  - Agregar `EXPO_PUBLIC_PRIVY_APP_ID` en `app.json > extra`

- [ ] **Agregar PrivyProvider en _layout.tsx**
  - Envolver app con `PrivyProvider`
  - Configurar para solo wallets externas
  - Deshabilitar embedded wallets

### 2. Servicio de Autenticación

- [ ] **Crear `src/auth/wallet-privy.ts`**
  - Función para conectar wallet
  - Función para crear usuario en Supabase
  - Hook `useWalletAuth`

### 3. UI en Login

- [ ] **Agregar botones en `app/auth/login.tsx`**
  - Botón "Connect MetaMask"
  - Botón "Connect Phantom"
  - Manejar estados de loading/error

### 4. Assets

- [ ] **Iconos de wallets**
  - MetaMask icon (si no existe)
  - Phantom icon (si no existe)

### 5. Backend (Opcional)

- [ ] **Verificar tokens de Privy en backend**
  - Usar JWKS endpoint para verificar
  - Endpoint: `https://auth.privy.io/api/v1/apps/cmhqg199a000tl70ca9h3i1pu/jwks.json`

---

## 📋 RESUMEN

**Completado:** 2/7 items  
**Pendiente:** 5/7 items

**Prioridad:**
1. 🔴 **CRÍTICO:** PrivyProvider en _layout.tsx
2. 🔴 **CRÍTICO:** Servicio wallet-privy.ts
3. 🟡 **IMPORTANTE:** Botones en login.tsx
4. 🟡 **IMPORTANTE:** app.json config
5. 🟢 **OPCIONAL:** Assets y backend verification

