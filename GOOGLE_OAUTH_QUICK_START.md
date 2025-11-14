# 🚀 Google OAuth - Quick Start

## ⚡ Resumen Rápido

Tu app usa **Supabase OAuth**, así que solo necesitas:

1. **Obtener credenciales de Google** (5 minutos)
2. **Configurarlas en Supabase** (2 minutos)
3. **Agregar variables al .env** (1 minuto)

---

## 📋 Checklist Rápido

### ✅ Paso 1: Google Cloud Console (5 min)

1. Ve a: https://console.cloud.google.com/
2. Crea proyecto o selecciona existente
3. **Habilita "Google+ API"**:
   - APIs y servicios → Bibliotecas → Busca "Google+ API" → Habilitar
4. **Configura Pantalla de Consentimiento**:
   - APIs y servicios → Pantalla de consentimiento OAuth
   - Tipo: Externo
   - Nombre: `HIHODL`
   - Email: Tu email
   - Guardar y continuar (puedes saltar scopes y usuarios de prueba)
5. **Crea 3 Credenciales OAuth**:
   - **Web Client**:
     - Tipo: Aplicación web
     - Redirect URIs:
       - `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
       - `hihodl://auth/callback`
     - **Copia el Client ID** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - **iOS Client**:
     - Tipo: iOS
     - Bundle ID: `com.sayhihodl.hihodlyes`
     - **Copia el Client ID** → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - **Android Client**:
     - Tipo: Android
     - Package: ` com.sayhihodl.hihodlyes`
     - SHA-1: Obtener con `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
     - **Copia el Client ID** → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### ✅ Paso 2: Supabase Dashboard (2 min)

1. Ve a: https://supabase.com/dashboard/project/gctwjvfpwkirtybzbnmu
2. **Authentication** → **Providers** → **Google**
3. **Habilita Google** (toggle)
4. **Client ID**: Pega tu **Web Client ID** de Google
5. **Client Secret**: 
   - Ve a Google Cloud Console → Credenciales
   - Click en tu Web Client ID
   - Copia el **"Secreto de cliente"**
   - Pégalo en Supabase
6. **Guardar**

### ✅ Paso 3: Variables de Entorno (1 min)

Agrega al `.env`:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id.apps.googleusercontent.com
```

### ✅ Paso 4: Reiniciar y Probar

```bash
npx expo start -c
```

Luego prueba el botón "Continue with Google" en la app.

---

## 🔍 Valores Importantes

- **Bundle ID iOS**: `com.sayhihodl.hihodlyes`
- **Package Android**: `com.sayhihodl.hihodlyes`
- **Supabase Redirect**: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
- **App Redirect**: `hihodl://auth/callback`

---

## 📚 Guía Completa

Para más detalles, ver: `GUIA_GOOGLE_OAUTH_SETUP.md`



