# ❌ Qué Falta para Completar Privy

**App ID:** `cmhqg199a000tl70ca9h3i1pu`  
**Paquete instalado:** ✅ `@privy-io/expo@0.60.1`

---

## ✅ COMPLETADO

- [x] Instalar `@privy-io/expo`
- [x] Agregar `EXPO_PUBLIC_PRIVY_APP_ID` al `.env`
- [x] Agregar variable a `app.json`

---

## ❌ FALTA (5 items críticos)

### 1. 🔴 Instalar Dependencias Adicionales de Expo

```bash
npx expo install expo-apple-authentication expo-application expo-crypto expo-linking expo-secure-store expo-web-browser react-native-passkeys react-native-webview @privy-io/expo-native-extensions
npm install fast-text-encoding react-native-get-random-values @ethersproject/shims
```

**Estado:** ❌ No instalado  
**Impacto:** Privy no funcionará sin estas dependencias

---

### 2. 🔴 Crear entrypoint.js con Polyfills

**Archivo:** `entrypoint.js` (nuevo)

```javascript
// entrypoint.js
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import './src/shims/node';
import 'expo-router/entry';
```

**Estado:** ❌ No existe  
**Impacto:** App no iniciará correctamente con Privy

**También actualizar `package.json`:**
```json
{
  "main": "entrypoint.js"  // Cambiar de "index.js"
}
```

---

### 3. 🔴 Actualizar metro.config.js

Agregar configuración de Privy para resolver módulos correctamente.

**Estado:** ❌ No configurado  
**Impacto:** Errores de resolución de módulos

---

### 4. 🔴 Agregar PrivyProvider en _layout.tsx

Envolver la app con `PrivyProvider` y configurar para solo wallets externas.

**Estado:** ❌ No implementado  
**Impacto:** Privy no funcionará

---

### 5. 🔴 Crear Servicio de Wallet Auth

**Archivo:** `src/auth/wallet-privy.ts` (nuevo)

- Función para conectar wallet
- Función para crear usuario en Supabase
- Hook `useWalletAuth`

**Estado:** ❌ No existe  
**Impacto:** No puedes conectar wallets

---

### 6. 🟡 Agregar Botones en Login

**Archivo:** `app/auth/login.tsx`

- Botón "Connect MetaMask"
- Botón "Connect Phantom"

**Estado:** ❌ No implementado  
**Impacto:** Usuarios no pueden iniciar sesión con wallets

---

## 📋 RESUMEN

| Item | Estado | Prioridad | Tiempo |
|------|--------|-----------|--------|
| Dependencias adicionales | ❌ | 🔴 Crítico | 5 min |
| entrypoint.js | ❌ | 🔴 Crítico | 5 min |
| metro.config.js | ❌ | 🔴 Crítico | 10 min |
| PrivyProvider | ❌ | 🔴 Crítico | 10 min |
| Servicio wallet-privy.ts | ❌ | 🔴 Crítico | 30 min |
| Botones en login | ❌ | 🟡 Importante | 20 min |

**Total estimado:** ~1.5 horas

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

1. **Instalar dependencias** (5 min)
2. **Crear entrypoint.js** (5 min)
3. **Actualizar metro.config.js** (10 min)
4. **Agregar PrivyProvider** (10 min)
5. **Crear servicio wallet-privy.ts** (30 min)
6. **Agregar botones en login** (20 min)

---

## ⚠️ NOTA IMPORTANTE

**Client ID:** Necesitas también el `clientId` de Privy (no solo App ID).  
Según la documentación, Privy para Expo requiere:
- `appId` ✅ (ya lo tienes)
- `clientId` ❌ (falta obtenerlo del dashboard)

**Dónde obtenerlo:**
- Dashboard de Privy → Tu App → Settings → Client ID



