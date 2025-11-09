# 🎯 Pasos Visuales: Crear iOS y Android Client IDs

## 📍 Estás Aquí

Estás en la página de **"Credentials"** y ya ves tu **"hihodl-web"** (Web application).

---

## ✅ Paso 1: Crear iOS Client ID

### 1.1. Click en el Botón

**Ubicación**: Arriba a la derecha, botón azul **"+ Create credentials"**

### 1.2. Seleccionar Tipo

En el menú desplegable, selecciona: **"OAuth client ID"**

### 1.3. Completar Formulario iOS

Aparecerá un formulario. Completa:

1. **Application type**: Selecciona **"iOS"**
2. **Name**: Escribe `hihodl-ios`
3. **Bundle ID**: Escribe `com.sayhihodl.hihodlyes`
   - ⚠️ Debe coincidir exactamente con tu `app.json`
4. Click en **"Create"**

### 1.4. Copiar Client ID

Aparecerá un popup con el Client ID. **Cópialo**:
- Formato: `928131091332-xxxxx.apps.googleusercontent.com`
- Este es tu **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`**

---

## ✅ Paso 2: Crear Android Client ID

### 2.1. Click en el Botón Nuevamente

**Ubicación**: Arriba a la derecha, botón azul **"+ Create credentials"**

### 2.2. Seleccionar Tipo

En el menú desplegable, selecciona: **"OAuth client ID"**

### 2.3. Obtener SHA-1 Primero (IMPORTANTE)

**Antes de completar el formulario**, necesitas el SHA-1:

Abre tu terminal y ejecuta:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Busca la línea que dice **"SHA1:"** y copia el valor completo (algo como `A1:B2:C3:D4:E5:F6:...`)

### 2.4. Completar Formulario Android

En el formulario que aparece:

1. **Application type**: Selecciona **"Android"**
2. **Name**: Escribe `hihodl-android`
3. **Package name**: Escribe `com.sayhihodl.hihodlyes`
   - ⚠️ Debe coincidir exactamente con tu `app.json`
4. **SHA-1 certificate fingerprint**: Pega el SHA-1 que copiaste
5. Click en **"Create"**

### 2.5. Copiar Client ID

Aparecerá un popup con el Client ID. **Cópialo**:
- Formato: `928131091332-xxxxx.apps.googleusercontent.com`
- Este es tu **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`**

---

## 📋 Resultado Final

Después de crear las 3 credenciales, en la tabla "OAuth 2.0 Client IDs" verás:

1. ✅ **hihodl-web** (Web application) - Ya lo tienes
2. ✅ **hihodl-ios** (iOS) - Acabas de crear
3. ✅ **hihodl-android** (Android) - Acabas de crear

---

## 🔍 Verificar Bundle IDs

Antes de crear, verifica en tu `app.json`:

```json
{
  "ios": {
    "bundleIdentifier": "com.sayhihodl.hihodlyes"
  },
  "android": {
    "package": "com.sayhihodl.hihodlyes"
  }
}
```

Si son diferentes, usa los valores correctos de tu `app.json`.

---

## ⚠️ Nota sobre SHA-1

**Para desarrollo:**
- Usa el SHA-1 del debug keystore (el comando de arriba)
- Funciona para testing

**Para producción:**
- Necesitarás el SHA-1 de tu keystore de producción
- Lo obtendrás cuando crees el keystore de producción

**Puedes agregar múltiples SHA-1:**
- Después de crear el Android Client ID
- Click en el nombre "hihodl-android"
- Agrega SHA-1 adicionales si es necesario

---

## ✅ Siguiente Paso

Una vez tengas las 3 credenciales copiadas:

1. Configúralas en Supabase (solo Web Client ID + Secret)
2. Agrega las 3 variables al `.env`
3. Reinicia la app

Ver: `GOOGLE_OAUTH_QUICK_START.md` para los siguientes pasos.

