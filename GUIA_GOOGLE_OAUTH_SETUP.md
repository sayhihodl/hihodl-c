# 🔐 Guía Completa: Configurar Google OAuth

## 📋 Resumen

Tu app usa **Supabase OAuth** para Google Sign-In, lo cual simplifica el proceso. Solo necesitas configurar las credenciales de Google en **dos lugares**:
1. **Google Cloud Console** - Obtener las credenciales
2. **Supabase Dashboard** - Configurar OAuth provider

---

## 🚀 PASO 1: Crear/Configurar Proyecto en Google Cloud Console

### 1.1. Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Selecciona un proyecto existente o crea uno nuevo:
   - Click en el selector de proyectos (arriba)
   - Click en "NUEVO PROYECTO"
   - Nombre: `HIHODL` (o el que prefieras)
   - Click en "CREAR"

### 1.2. Habilitar Google+ API

1. En el menú lateral, ve a **"APIs y servicios"** → **"Biblioteca"**
2. Busca **"Google+ API"** o **"Google Sign-In API"**
3. Click en **"HABILITAR"**

### 1.3. Configurar Pantalla de Consentimiento OAuth

1. Ve a **"APIs y servicios"** → **"Pantalla de consentimiento OAuth"**
2. Selecciona **"Externo"** (o "Interno" si tienes Google Workspace)
3. Click en **"CREAR"**
4. Completa el formulario:
   - **Nombre de la app**: `HIHODL`
   - **Email de soporte**: Tu email
   - **Dominio autorizado**: `hihodl.xyz` (o tu dominio)
   - **Email del desarrollador**: Tu email
5. Click en **"GUARDAR Y CONTINUAR"**
6. En **"Scopes"**, click en **"GUARDAR Y CONTINUAR"** (no necesitas agregar scopes adicionales)
7. En **"Usuarios de prueba"**, agrega tu email si es necesario, luego **"GUARDAR Y CONTINUAR"**
8. Click en **"VOLVER AL PANEL"**

---

## 🔑 PASO 2: Crear Credenciales OAuth 2.0

### 2.1. Crear Web Client ID

1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Click en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"**
3. Selecciona **"Aplicación web"**
4. Completa:
   - **Nombre**: `HIHODL Web Client`
   - **Orígenes JavaScript autorizados**: 
     - `http://localhost:8081` (para desarrollo)
     - `https://hihodl.xyz` (para producción)
   - **URI de redirección autorizados**:
     - `http://localhost:8081/auth/callback` (para desarrollo)
     - `https://hihodl.xyz/auth/callback` (para producción)
     - `hihodl://auth/callback` (para deep linking en mobile)
5. Click en **"CREAR"**
6. **Copia el "ID de cliente"** (algo como `123456789-abcdefg.apps.googleusercontent.com`)
   - Este es tu **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`**

### 2.2. Crear iOS Client ID

1. Click en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"**
2. Selecciona **"iOS"**
3. Completa:
   - **Nombre**: `HIHODL iOS Client`
   - **ID del paquete**: `com.sayhihodl.hihodlyes` (debe coincidir con tu `app.json`)
4. Click en **"CREAR"**
5. **Copia el "ID de cliente"**
   - Este es tu **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`**

### 2.3. Crear Android Client ID

1. Click en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"**
2. Selecciona **"Android"**
3. Completa:
   - **Nombre**: `HIHODL Android Client`
   - **Nombre del paquete**: `com.sayhihodl.hihodlyes` (debe coincidir con tu `app.json`)
   - **SHA-1 del certificado**: Necesitas obtener el SHA-1 de tu keystore
     - Para desarrollo: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
     - Para producción: Usa el SHA-1 de tu keystore de producción
4. Click en **"CREAR"**
5. **Copia el "ID de cliente"**
   - Este es tu **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`**

---

## 🔧 PASO 3: Configurar en Supabase Dashboard

### 3.1. Ir a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: `gctwjvfpwkirtybzbnmu`
3. Ve a **"Authentication"** → **"Providers"**

### 3.2. Configurar Google Provider

1. Busca **"Google"** en la lista de providers
2. Click en el toggle para **habilitar Google**
3. Completa los campos:
   - **Client ID (for OAuth)**: Pega tu **Web Client ID** de Google
   - **Client Secret (for OAuth)**: 
     - Ve a Google Cloud Console → Credenciales
     - Click en tu Web Client ID
     - Click en **"Descargar JSON"** o copia el **"Secreto de cliente"**
     - Pega el secreto aquí
4. **Redirect URL**: Debe ser `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
   - (Supabase lo genera automáticamente, solo verifica que esté correcto)
5. Click en **"GUARDAR"**

### 3.3. Agregar Redirect URLs en Google Cloud Console

1. Vuelve a Google Cloud Console → Credenciales
2. Click en tu **Web Client ID**
3. En **"URI de redirección autorizados"**, agrega:
   - `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
4. Click en **"GUARDAR"**

---

## 📝 PASO 4: Configurar Variables en tu Proyecto

### 4.1. Agregar al `.env`

```env
# Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id-aqui.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id-aqui.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id-aqui.apps.googleusercontent.com
```

### 4.2. Verificar `app.json`

Ya están configuradas en `app.json:
```json
"extra": {
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID}",
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID}",
  "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "${EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID}",
}
```

✅ **Ya está listo** - No necesitas cambiar nada en `app.json`

---

## ✅ PASO 5: Verificar Configuración

### 5.1. Verificar Variables

```bash
# Verificar que las variables estén en .env
cat .env | grep GOOGLE
```

### 5.2. Reiniciar App

```bash
# Limpiar caché y reiniciar
npx expo start -c
```

### 5.3. Probar Login

1. Abre la app
2. Click en **"Continue with Google"**
3. Deberías ver la pantalla de Google Sign-In
4. Después de autenticarte, deberías ser redirigido de vuelta a la app

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: El redirect URI no está configurado correctamente en Google Cloud Console.

**Solución**:
1. Ve a Google Cloud Console → Credenciales
2. Click en tu Web Client ID
3. Agrega estos redirect URIs:
   - `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
   - `hihodl://auth/callback`
   - `http://localhost:8081/auth/callback` (para desarrollo)

### Error: "invalid_client"

**Causa**: El Client ID o Client Secret están incorrectos en Supabase.

**Solución**:
1. Verifica que el Client ID en Supabase sea el **Web Client ID** (no iOS/Android)
2. Verifica que el Client Secret sea el correcto (del Web Client)

### Error: "OAuth not enabled"

**Causa**: Google OAuth no está habilitado en Supabase.

**Solución**:
1. Ve a Supabase Dashboard → Authentication → Providers
2. Asegúrate de que el toggle de Google esté **habilitado**

### No funciona en Expo Go

**Causa**: OAuth requiere deep linking que no funciona bien en Expo Go.

**Solución**:
- Usa un **development build** o **production build**
- O prueba en **web** (`npx expo start --web`)

---

## 📚 Referencias

- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Expo AuthSession Docs](https://docs.expo.dev/guides/authentication/#google)

---

## ✅ Checklist Final

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google+ API habilitada
- [ ] Pantalla de consentimiento OAuth configurada
- [ ] Web Client ID creado y copiado
- [ ] iOS Client ID creado y copiado
- [ ] Android Client ID creado y copiado
- [ ] Google provider habilitado en Supabase
- [ ] Client ID y Secret configurados en Supabase
- [ ] Redirect URIs agregados en Google Cloud Console
- [ ] Variables agregadas al `.env`
- [ ] App reiniciada con caché limpio
- [ ] Login probado exitosamente

---

**¿Necesitas ayuda?** Revisa los logs de la consola cuando intentes hacer login para ver errores específicos.



