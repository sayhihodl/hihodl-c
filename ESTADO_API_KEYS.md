# 🔑 Estado de API Keys y Variables de Entorno

**Fecha de revisión:** 2024-12-19  
**Archivo .env encontrado:** ✅ Sí existe

---

## ✅ API KEYS CONFIGURADAS

### 1. Supabase (✅ COMPLETO)
- ✅ `EXPO_PUBLIC_SUPABASE_URL` = `https://gctwjvfpwkirtybzbnmu.supabase.co`
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` = Configurado

**Estado:** ✅ **COMPLETO** - Autenticación funcionará

---

### 2. Backend API (✅ CONFIGURADO)
- ✅ `EXPO_PUBLIC_API_URL` = `https://hihodl-backend-v-0-1.onrender.com/api/v1`
- ⚠️ También tiene: `http://localhost:5000/api/v1` (para desarrollo)

**Estado:** ✅ **COMPLETO** - Backend conectado

**Nota:** Tienes dos valores, el último es el que se usa. Si quieres usar localhost para desarrollo, comenta la línea de producción.

---

### 3. Alchemy (⚠️ PARCIALMENTE CONFIGURADO)
- ✅ `ALCHEMY_API_KEY_ETH` = `0W91EqeROoUy2tO315BPK`
- ✅ `ALCHEMY_API_KEY_BASE` = `7m0lO7C-WfoUFjG61wd7q`
- ✅ `ALCHEMY_API_KEY_POLYGON` = `AqI_6gOvvBypjrLhcsIb_`
- ❌ `EXPO_PUBLIC_ALCHEMY_API_KEY` = **FALTA**

**Problema:** El código en `src/chain/chains.ts` espera `EXPO_PUBLIC_ALCHEMY_API_KEY` (una sola key), pero tienes keys separadas por chain.

**Solución:** 
- Opción 1: Usar una sola key de Alchemy para todas las chains (recomendado)
- Opción 2: Modificar `src/chain/chains.ts` para usar las keys separadas

**Estado:** ⚠️ **PARCIAL** - Transacciones EVM NO funcionarán hasta configurar

---

## ❌ API KEYS FALTANTES (CRÍTICAS)

### 4. Helius (❌ FALTA)
- ❌ `EXPO_PUBLIC_HELIUS_API_KEY` = **NO CONFIGURADO**

**Impacto:** ⚠️ **CRÍTICO** - Transacciones Solana NO funcionarán

**Cómo obtener:**
1. Ir a https://www.helius.dev/
2. Crear cuenta
3. Crear proyecto
4. Copiar API Key
5. Agregar a `.env`: `EXPO_PUBLIC_HELIUS_API_KEY=tu-api-key`

---

### 5. Google OAuth (❌ FALTA - 3 keys)
- ❌ `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = **NO CONFIGURADO**
- ❌ `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` = **NO CONFIGURADO**
- ❌ `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` = **NO CONFIGURADO**

**Impacto:** ⚠️ **CRÍTICO** - Login con Google NO funcionará

**Cómo obtener:**
1. Ir a https://console.cloud.google.com/
2. Crear proyecto o seleccionar existente
3. Habilitar "Google+ API" o "Google Sign-In"
4. Crear OAuth 2.0 credentials:
   - **Web Client ID:** Para versión web
   - **iOS Client ID:** Para iOS (necesita Bundle ID: `com.sayhihodl.hihodlyes`)
   - **Android Client ID:** Para Android (necesita Package name: `com.sayhihodl.hihodlyes`)
5. Agregar a `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id
   ```

**Nota:** El código en `src/config/app.ts` espera:
- `EXPO_PUBLIC_GOOGLE_IOS_ID` (pero en `app.json` es `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`)
- `EXPO_PUBLIC_GOOGLE_ANDROID_ID` (pero en `app.json` es `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`)
- `EXPO_PUBLIC_GOOGLE_WEB_ID` (pero en `app.json` es `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)

**⚠️ INCONSISTENCIA:** Hay una discrepancia entre los nombres en `src/config/app.ts` y `app.json`. Necesitas verificar cuál es el correcto.

---

## 🟡 API KEYS OPCIONALES (Recomendadas)

### 6. Mixpanel (🟡 OPCIONAL)
- ❌ `EXPO_PUBLIC_MIXPANEL_TOKEN` = **NO CONFIGURADO**

**Impacto:** 🟡 **OPCIONAL** - Analytics no funcionará (pero app funcionará)

**Cómo obtener:**
1. Ir a https://mixpanel.com/
2. Crear cuenta
3. Crear proyecto
4. Copiar Project Token
5. Agregar a `.env`: `EXPO_PUBLIC_MIXPANEL_TOKEN=tu-token`

**Nota:** Según `ANALYTICS_SETUP.md`, el token por defecto es `2e63cb0ef9ad3b8419a852941c60ff7e`, pero deberías verificar si es correcto.

---

### 7. Contentsquare (🟡 OPCIONAL - Solo Web)
- ❌ `EXPO_PUBLIC_CONTENTSQUARE_SITE_ID` = **NO CONFIGURADO**

**Impacto:** 🟡 **OPCIONAL** - Mapas de calor no funcionarán (solo web)

**Cómo obtener:**
1. Ir a https://www.contentsquare.com/
2. Crear cuenta
3. Crear proyecto/sitio
4. Copiar Site ID
5. Agregar a `.env`: `EXPO_PUBLIC_CONTENTSQUARE_SITE_ID=tu-site-id`

---

## 📋 RESUMEN

| API Key | Estado | Prioridad | Impacto |
|---------|--------|-----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Configurado | 🔴 Crítico | Autenticación funciona |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurado | 🔴 Crítico | Autenticación funciona |
| `EXPO_PUBLIC_API_URL` | ✅ Configurado | 🔴 Crítico | Backend conectado |
| `EXPO_PUBLIC_ALCHEMY_API_KEY` | ❌ Falta | 🔴 Crítico | Transacciones EVM NO funcionan |
| `EXPO_PUBLIC_HELIUS_API_KEY` | ❌ Falta | 🔴 Crítico | Transacciones Solana NO funcionan |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | ❌ Falta | 🔴 Crítico | Login Google NO funciona |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | ❌ Falta | 🔴 Crítico | Login Google iOS NO funciona |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | ❌ Falta | 🔴 Crítico | Login Google Android NO funciona |
| `EXPO_PUBLIC_MIXPANEL_TOKEN` | ❌ Falta | 🟡 Opcional | Analytics no funciona |
| `EXPO_PUBLIC_CONTENTSQUARE_SITE_ID` | ❌ Falta | 🟡 Opcional | Mapas de calor no funcionan |

---

## 🚨 ACCIONES INMEDIATAS REQUERIDAS

### 1. Configurar Alchemy (URGENTE)
```bash
# Opción 1: Usar una sola key para todas las chains
# Agregar a .env:
EXPO_PUBLIC_ALCHEMY_API_KEY=0W91EqeROoUy2tO315BPK  # o la que prefieras
```

### 2. Configurar Helius (URGENTE)
```bash
# Agregar a .env:
EXPO_PUBLIC_HELIUS_API_KEY=tu-helius-api-key
```

### 3. Configurar Google OAuth (URGENTE)
```bash
# Agregar a .env:
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id
```

### 4. Verificar Inconsistencias en Nombres
- Revisar `src/config/app.ts` vs `app.json` para nombres de variables Google OAuth
- Asegurarse de que los nombres coincidan

---

## 📝 TEMPLATE DE .env COMPLETO

```env
# ============================================
# CRÍTICAS - REQUERIDAS PARA FUNCIONAR
# ============================================

# Supabase (✅ Ya configurado)
EXPO_PUBLIC_SUPABASE_URL=https://gctwjvfpwkirtybzbnmu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdHdqdmZwd2tpcnR5Ynpibm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDMyNDksImV4cCI6MjA3NjM3OTI0OX0.GAnVrbhthoGOa2oLrH1VD2AtWlKI4of2DzxuYVF09j0

# Backend API (✅ Ya configurado)
EXPO_PUBLIC_API_URL=https://hihodl-backend-v-0-1.onrender.com/api/v1
# Para desarrollo local, descomenta:
# EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Alchemy (⚠️ NECESITA CONFIGURAR)
EXPO_PUBLIC_ALCHEMY_API_KEY=tu-alchemy-api-key-aqui

# Helius (❌ FALTA)
EXPO_PUBLIC_HELIUS_API_KEY=tu-helius-api-key-aqui

# Google OAuth (❌ FALTA - 3 keys)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id-aqui
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id-aqui
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id-aqui

# ============================================
# OPCIONALES - RECOMENDADAS
# ============================================

# Mixpanel Analytics (🟡 Opcional)
EXPO_PUBLIC_MIXPANEL_TOKEN=tu-mixpanel-token-aqui

# Contentsquare (🟡 Opcional - Solo Web)
EXPO_PUBLIC_CONTENTSQUARE_SITE_ID=tu-site-id-aqui

# ============================================
# DESARROLLO
# ============================================

# Mock Payments (para desarrollo)
EXPO_PUBLIC_MOCK_PAYMENTS=1
```

---

## ✅ CHECKLIST RÁPIDO

- [x] Supabase URL y Key configurados
- [x] Backend API URL configurado
- [ ] Alchemy API Key configurado (usar una de las existentes o nueva)
- [ ] Helius API Key configurado
- [ ] Google Web Client ID configurado
- [ ] Google iOS Client ID configurado
- [ ] Google Android Client ID configurado
- [ ] Mixpanel Token configurado (opcional)
- [ ] Contentsquare Site ID configurado (opcional)

**Total configuradas:** 3/8 críticas  
**Total faltantes:** 5/8 críticas  
**Total opcionales:** 0/2

---

**Última actualización:** 2024-12-19



