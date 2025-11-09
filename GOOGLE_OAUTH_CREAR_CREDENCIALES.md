# 🔑 Cómo Crear las 3 Credenciales OAuth en Google Cloud Console

## 📍 Ubicación Actual

Estás en la página de configuración de tu **Web Client ID** (`hihodl-web`).

---

## ✅ Paso 1: Ya Tienes Web Client ID

Tu Web Client ID ya está creado. **Copia el Client ID** (algo como `123456789-abc.apps.googleusercontent.com`).

Este es tu **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`**.

---

## 📱 Paso 2: Crear iOS Client ID

### 2.1. Ir a la Lista de Credenciales

1. En la parte superior de la página, click en **"← Credenciales"** o ve a:
   - Menú lateral → **"APIs y servicios"** → **"Credenciales"**

### 2.2. Crear Nueva Credencial

1. Click en el botón **"+ CREAR CREDENCIALES"** (arriba a la izquierda)
2. Selecciona **"ID de cliente de OAuth"**

### 2.3. Configurar iOS Client

1. En el formulario que aparece, selecciona **"iOS"** como tipo de aplicación
2. Completa:
   - **Nombre**: `hihodl-ios`
   - **ID del paquete**: `com.sayhihodl.hihodlyes`
     - ⚠️ **IMPORTANTE**: Debe coincidir exactamente con el `bundleIdentifier` en tu `app.json`
3. Click en **"CREAR"**
4. **Copia el Client ID** que aparece
   - Este es tu **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`**

---

## 🤖 Paso 3: Crear Android Client ID

### 3.1. Volver a Crear Credencial

1. Click en **"+ CREAR CREDENCIALES"** nuevamente
2. Selecciona **"ID de cliente de OAuth"**

### 3.2. Configurar Android Client

1. Selecciona **"Android"** como tipo de aplicación
2. Completa:
   - **Nombre**: `hihodl-android`
   - **Nombre del paquete**: `com.sayhihodl.hihodlyes`
     - ⚠️ **IMPORTANTE**: Debe coincidir exactamente con el `package` en tu `app.json` (Android)
   - **SHA-1 del certificado**: Necesitas obtener el SHA-1

### 3.3. Obtener SHA-1 del Certificado

**Para desarrollo (debug keystore):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Para producción:**
```bash
# Si ya tienes un keystore de producción
keytool -list -v -keystore tu-keystore.jks -alias tu-alias
```

**Copiar SHA-1:**
- Busca la línea que dice **"SHA1:"**
- Copia el valor (algo como: `A1:B2:C3:D4:E5:F6:...`)
- Pégalo en el campo "SHA-1 del certificado" en Google Cloud Console

### 3.4. Finalizar Android Client

1. Pega el SHA-1 en el campo
2. Click en **"CREAR"**
3. **Copia el Client ID** que aparece
   - Este es tu **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`**

---

## 📋 Resumen: Las 3 Credenciales

Después de crear las 3, deberías tener:

1. ✅ **Web Client** (`hihodl-web`)
   - Client ID: `xxxxx-web.apps.googleusercontent.com`
   - → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

2. ✅ **iOS Client** (`hihodl-ios`)
   - Client ID: `xxxxx-ios.apps.googleusercontent.com`
   - → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

3. ✅ **Android Client** (`hihodl-android`)
   - Client ID: `xxxxx-android.apps.googleusercontent.com`
   - → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

---

## 🔍 Verificar Bundle IDs

Antes de crear iOS/Android clients, verifica que los IDs coincidan:

**En tu `app.json:**
- iOS: `bundleIdentifier: "com.sayhihodl.hihodlyes"`
- Android: `package: "com.sayhihodl.hihodlyes"`

Si son diferentes, usa los valores correctos de tu `app.json`.

---

## ⚠️ Nota Importante sobre SHA-1

**Para desarrollo rápido:**
- Puedes usar el SHA-1 del debug keystore (el comando de arriba)
- Esto funcionará para testing en desarrollo

**Para producción:**
- Necesitarás el SHA-1 de tu keystore de producción
- Lo obtendrás cuando crees el keystore de producción

**Puedes agregar múltiples SHA-1:**
- Click en tu Android Client ID
- Agrega SHA-1 adicionales si es necesario

---

## ✅ Siguiente Paso

Una vez tengas las 3 credenciales:
1. Configúralas en Supabase (solo necesitas el Web Client ID + Secret)
2. Agrega las 3 variables al `.env`
3. Reinicia la app

Ver: `GOOGLE_OAUTH_QUICK_START.md` para los siguientes pasos.

