# ✅ Completar Configuración de Google OAuth

## 📋 Estado Actual

✅ **3 Credenciales creadas en Google Cloud Console:**
- Web Client ID (`hihodl-web`)
- iOS Client ID (`hihodl-ios`)
- Android Client ID (`hihodl-android`)

---

## 🔧 PASO 1: Configurar en Supabase Dashboard (2 min)

### 1.1. Ir a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/gctwjvfpwkirtybzbnmu
2. En el menú lateral, ve a **"Authentication"** → **"Providers"**

### 1.2. Configurar Google Provider

1. Busca **"Google"** en la lista de providers
2. **Habilita el toggle** de Google (debe estar en verde)
3. Completa los campos:
   - **Client ID (for OAuth)**: 
     - Ve a Google Cloud Console → Credenciales
     - Click en tu **Web Client ID** (`hihodl-web`)
     - Copia el **Client ID** completo
     - Pégalo aquí
   
   - **Client Secret (for OAuth)**:
     - En la misma página del Web Client ID
     - Busca **"Client secret"** (puede estar oculto, click en "Show" o el ícono del ojo)
     - Copia el **Client secret** completo
     - Pégalo aquí
   
   - **Redirect URL**: 
     - Debe ser: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
     - (Supabase lo genera automáticamente, solo verifica que esté correcto)

4. Click en **"Save"** o **"Guardar"**

### 1.3. Verificar Redirect URI en Google Cloud Console

1. Ve a Google Cloud Console → Credenciales
2. Click en tu **Web Client ID** (`hihodl-web`)
3. En **"Authorized redirect URIs"**, verifica que esté:
   - `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
4. Si no está, agrégalo y click en **"Save"**

---

## 📝 PASO 2: Agregar Variables al .env (1 min)

### 2.1. Obtener los 3 Client IDs

De Google Cloud Console → Credenciales, copia los Client IDs:

1. **Web Client ID**: Click en `hihodl-web` → Copia el Client ID
2. **iOS Client ID**: Click en `hihodl-ios` → Copia el Client ID
3. **Android Client ID**: Click en `hihodl-android` → Copia el Client ID

### 2.2. Agregar al .env

Abre tu `.env` y agrega:

```env
# Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id.apps.googleusercontent.com
```

**Reemplaza** `tu-*-client-id` con los valores reales que copiaste.

---

## ✅ PASO 3: Verificar y Reiniciar (1 min)

### 3.1. Verificar Variables

```bash
# Verificar que las variables estén en .env
cat .env | grep GOOGLE
```

### 3.2. Reiniciar App

```bash
# Limpiar caché y reiniciar
npx expo start -c
```

### 3.3. Probar Login

1. Abre la app
2. Click en **"Continue with Google"**
3. Deberías ver la pantalla de Google Sign-In
4. Después de autenticarte, deberías ser redirigido de vuelta a la app

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: El redirect URI no está en Google Cloud Console.

**Solución**:
1. Ve a Google Cloud Console → Credenciales
2. Click en tu Web Client ID
3. Agrega: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
4. Guarda

### Error: "invalid_client"

**Causa**: Client ID o Secret incorrectos en Supabase.

**Solución**:
1. Verifica que uses el **Web Client ID** (no iOS/Android)
2. Verifica que el Client Secret sea el correcto
3. Asegúrate de copiar valores completos (sin espacios)

### No funciona en Expo Go

**Causa**: OAuth requiere deep linking.

**Solución**:
- Usa un **development build** o prueba en **web** (`npx expo start --web`)

---

## ✅ Checklist Final

- [ ] Google provider habilitado en Supabase
- [ ] Web Client ID configurado en Supabase
- [ ] Client Secret configurado en Supabase
- [ ] Redirect URI agregado en Google Cloud Console
- [ ] 3 variables agregadas al `.env`
- [ ] App reiniciada con caché limpio
- [ ] Login probado exitosamente

---

## 📚 Referencias

- Supabase Dashboard: https://supabase.com/dashboard/project/gctwjvfpwkirtybzbnmu
- Google Cloud Console: https://console.cloud.google.com/

