# ✅ Capabilities Recomendadas para HIHODL App ID

## 🔴 OBLIGATORIAS - Marcar Estas (5)

### 1. ✅ **Sign In with Apple** 
- **Por qué:** Tu app usa `expo-apple-authentication` en `src/auth/oauth.ts` y `src/auth/social.ts`
- **Acción:** Marcar ✅ y hacer clic en **"Configure"** después
- **Configuración necesaria:** Configurar dominios después (ver `APPLE_SIGNIN_SETUP.md`)

### 2. ✅ **Push Notifications**
- **Por qué:** Tienes `expo-notifications` instalado y servicios de notificaciones en `src/services/api/notifications.service.ts`
- **Acción:** Marcar ✅
- **Nota:** Ya tienes `aps-environment` en `ios/HIHODL/HIHODL.entitlements`

### 3. ✅ **Associated Domains**
- **Por qué:** Usas universal links (`hi.me`) y tienes `CFBundleURLSchemes` en `Info.plist`
- **Acción:** Marcar ✅ y hacer clic en **"Configure"** después
- **Configuración necesaria:** Agregar dominio `hi.me` después

### 4. ✅ **App Attest**
- **Por qué:** Ya está marcado ✅ (no desmarcar)
- **Acción:** Dejar marcado ✅

### 5. ✅ **App Attest Opt-In**
- **Por qué:** Ya está marcado ✅ (no desmarcar)
- **Acción:** Dejar marcado ✅

### 6. ✅ **Accessibility Merchant API Control**
- **Por qué:** Ya está marcado ✅ (no desmarcar)
- **Acción:** Dejar marcado ✅

---

## 🟡 OPCIONALES - NO Marcar Ahora (Puedes Agregar Después)

### NFC Tag Reading
- **Por qué NO ahora:** No veo que uses NFC actualmente
- **Cuándo agregar:** Si planeas leer códigos QR/NFC de wallets con NFC
- **Nota:** Ya tienes cámara para QR codes, NFC sería adicional

### Wallet
- **Por qué NO ahora:** No veo integración con Apple Wallet
- **Cuándo agregar:** Si planeas agregar tarjetas a Apple Wallet

### In-App Purchase
- **Por qué NO ahora:** No veo compras dentro de la app
- **Cuándo agregar:** Si planeas vender contenido/premium features

---

## ❌ NO Marcar (No Necesarias)

- **Access Wi-Fi Information** - No necesario
- **Background Modes** - No necesario ahora
- **App Groups** - No necesario (solo una app)
- **HealthKit** - No relacionado con wallet
- **HomeKit** - No relacionado
- **Cualquier DriverKit** - Solo para macOS drivers
- **Cualquier cosa "Development only"** - Solo para desarrollo específico

---

## 📋 Checklist Final

Marca SOLO estas 6:

- [x] **App Attest** (ya marcado)
- [x] **App Attest Opt-In** (ya marcado)
- [x] **Accessibility Merchant API Control** (ya marcado)
- [ ] **Sign In with Apple** ← MARCAR ESTA
- [ ] **Push Notifications** ← MARCAR ESTA
- [ ] **Associated Domains** ← MARCAR ESTA

**Total: 6 capabilities marcadas**

---

## ⚠️ Después de Registrar

Una vez registrado el App ID, necesitarás configurar:

1. **Sign In with Apple:**
   - Configurar dominios y return URLs
   - Ver `APPLE_SIGNIN_SETUP.md`

2. **Associated Domains:**
   - Agregar dominio: `hi.me`
   - Configurar universal links

3. **Push Notifications:**
   - Configurar certificados APNs (EAS lo hace automáticamente)

---

## 💡 Consejo

**Sé conservador ahora:** Solo marca lo que realmente necesitas. Puedes agregar más capabilities después editando el App ID, pero es mejor empezar con lo mínimo necesario.

**Si no estás seguro de algo:** Déjalo sin marcar. Siempre puedes agregarlo después.



