# 📋 SHA-1 para Android Client ID

## ✅ SHA-1 Obtenido

Tu SHA-1 del debug keystore es:

```
1C:BA:E8:2B:5B:D2:EE:73:A4:8C:44:91:7D:98:74:65:F4:CC:CC:1C
```

---

## 📝 Cómo Usarlo

1. Ve a Google Cloud Console → Credenciales
2. Click en **"+ Create credentials"** → **"OAuth client ID"**
3. Selecciona **"Android"** como Application type
4. Completa:
   - **Name**: `hihodl-android`
   - **Package name**: `com.sayhihodl.hihodlyes`
   - **SHA-1 certificate fingerprint**: Pega el SHA-1 de arriba
5. Click en **"Create"**
6. Copia el Client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

---

## ⚠️ Nota

Este SHA-1 es del **debug keystore** (para desarrollo).

**Para producción:**
- Necesitarás el SHA-1 de tu keystore de producción
- Lo obtendrás cuando crees el keystore de producción con EAS
- Puedes agregar múltiples SHA-1 al mismo Android Client ID

---

## 🔄 Agregar SHA-1 Adicional Después

Si necesitas agregar el SHA-1 de producción después:

1. Ve a Google Cloud Console → Credenciales
2. Click en **"hihodl-android"**
3. En **"SHA-1 certificate fingerprints"**, click en **"+ Add fingerprint"**
4. Pega el nuevo SHA-1

---

## ✅ Siguiente Paso

Una vez tengas los 3 Client IDs (Web, iOS, Android):
1. Configúralos en Supabase (solo Web Client ID + Secret)
2. Agrega las 3 variables al `.env`
3. Reinicia la app

