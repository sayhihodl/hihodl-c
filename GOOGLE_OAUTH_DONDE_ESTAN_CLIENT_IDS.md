# 🔍 Dónde Encontrar los Client IDs de Google

## ❌ NO es Aquí

Lo que estás viendo (Project number, Project ID) **NO son los Client IDs** que necesitas.

---

## ✅ Dónde Están los Client IDs

### Paso 1: Ir a Credenciales

1. En el menú lateral izquierdo, busca **"APIs & Services"** o **"APIs y servicios"**
2. Click en **"Credentials"** o **"Credenciales"**

### Paso 2: Ver los OAuth 2.0 Client IDs

En la página de Credenciales, verás una sección llamada **"OAuth 2.0 Client IDs"**.

Deberías ver una tabla con tus 3 credenciales:

| Name | Type | Client ID |
|------|------|-----------|
| **hihodl-web** | Web application | `928131091332-xxxxx.apps.googleusercontent.com` |
| **hihodl-ios** | iOS | `928131091332-xxxxx.apps.googleusercontent.com` |
| **hihodl-android** | Android | `928131091332-xxxxx.apps.googleusercontent.com` |

### Paso 3: Copiar los Client IDs

1. **Para Web Client ID**:
   - Click en el nombre **"hihodl-web"** (o el ícono de copiar al lado del Client ID)
   - Copia el Client ID completo
   - Este es tu `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

2. **Para iOS Client ID**:
   - Click en el nombre **"hihodl-ios"** (o el ícono de copiar)
   - Copia el Client ID completo
   - Este es tu `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

3. **Para Android Client ID**:
   - Click en el nombre **"hihodl-android"** (o el ícono de copiar)
   - Copia el Client ID completo
   - Este es tu `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

---

## 🔑 Para Obtener el Client Secret (Solo Web)

El **Client Secret** solo lo necesitas para Supabase:

1. Click en **"hihodl-web"** (tu Web Client ID)
2. Busca la sección **"Client secret"**
3. Si está oculto, click en el ícono del ojo 👁️ o en **"Show"**
4. Copia el Client Secret completo
5. Pégalo en Supabase Dashboard

---

## 📋 Resumen de Navegación

```
Google Cloud Console
└── APIs & Services (menú lateral)
    └── Credentials (o "Credenciales")
        └── OAuth 2.0 Client IDs (sección)
            ├── hihodl-web (Web Client ID)
            ├── hihodl-ios (iOS Client ID)
            └── hihodl-android (Android Client ID)
```

---

## ✅ Lo que Necesitas Copiar

1. **Web Client ID** → Para Supabase Dashboard + `.env`
2. **Web Client Secret** → Solo para Supabase Dashboard
3. **iOS Client ID** → Solo para `.env`
4. **Android Client ID** → Solo para `.env`

---

## 🎯 Siguiente Paso

Una vez tengas los 3 Client IDs copiados:
1. Configúralos en Supabase (solo Web Client ID + Secret)
2. Agrega las 3 variables al `.env`
3. Reinicia la app



