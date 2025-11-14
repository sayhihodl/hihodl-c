# 📱 Guía: Registrar App ID en Apple Developer Portal

## ✅ Información que Necesitas

- **Bundle ID**: `com.sayhihodl.hihodlyes` ✅
- **Team ID**: `VLV25ZF66P` ✅ (visible en tu pantalla)
- **Description**: `HIHODL iOS App`

---

## 📋 Pasos para Registrar el App ID

### Paso 1: Completar el Formulario

En la pantalla que estás viendo:

1. **Description** (campo de texto vacío):
   ```
   HIHODL iOS App
   ```
   - No uses caracteres especiales (@, &, *, ")
   - Puede ser cualquier descripción clara

2. **Bundle ID**:
   - ✅ Selecciona **"Explicit"** (ya está seleccionado)
   - En el campo de texto, escribe:
     ```
     com.sayhihodl.hihodlyes
     ```
   - Debe coincidir exactamente con el de `app.json`

### Paso 2: Seleccionar Capabilities (REQUERIDAS)

Basándome en tu código, tu app **NECESITA** estas capabilities:

#### 🔴 OBLIGATORIAS (marcar estas):
- ✅ **Sign In with Apple** - Tu app usa `expo-apple-authentication` ✅ REQUERIDO
- ✅ **Push Notifications** - Tienes `aps-environment` en entitlements ✅ REQUERIDO
- ✅ **Associated Domains** - Tienes `CFBundleURLSchemes` para deep linking ✅ REQUERIDO
- ✅ **App Attest** - Ya está marcado ✅
- ✅ **Accessibility Merchant API Control** - Ya está marcado ✅

#### 🟡 Opcionales (NO marcar a menos que las necesites):
- **Wallet** - Solo si usas Apple Wallet
- **In-App Purchase** - Solo si vendes contenido
- **Background Modes** - Solo si necesitas ejecutar en background
- **App Groups** - Solo si compartes datos entre apps

**⚠️ IMPORTANTE:** 
- Si no marcas **Sign In with Apple**, el login con Apple NO funcionará
- Si no marcas **Push Notifications**, las notificaciones NO funcionarán
- Si no marcas **Associated Domains**, el deep linking NO funcionará

**Nota:** Puedes agregar capabilities después, pero tendrás que regenerar perfiles de provisioning.

### Paso 3: Continuar

1. Haz clic en **"Continue"** (botón azul, se activará cuando completes los campos requeridos)
2. Revisa la información
3. Haz clic en **"Register"**

---

## ✅ Después de Registrar

Una vez registrado el App ID:

1. **Verificar que se creó correctamente:**
   - Ve a "Identifiers" en el menú lateral
   - Busca `com.sayhihodl.hihodlyes`
   - Debería aparecer en la lista

2. **Siguiente paso:**
   - Ahora SÍ puedes crear la app en **App Store Connect**
   - El Bundle ID estará disponible para seleccionar

---

## 🔍 Verificar Capabilities Necesarias

Para saber qué capabilities necesitas, revisa tu código:

### Si usas Push Notifications:
```bash
grep -r "expo-notifications\|PushNotification" app.json src/
```

### Si usas Deep Linking:
```bash
grep -r "scheme\|universal\|associated" app.json
```

### Si usas Sign In with Apple:
```bash
grep -r "apple.*sign\|AppleAuthentication" src/
```

---

## 📝 Resumen Rápido

**En la pantalla actual:**

1. **Description**: `HIHODL iOS App`
2. **Bundle ID**: `com.sayhihodl.hihodlyes` (Explicit)
3. **Capabilities**: Marca estas OBLIGATORIAS:
   - ✅ **Sign In with Apple** (requerido para login con Apple)
   - ✅ **Push Notifications** (requerido para notificaciones)
   - ✅ **Associated Domains** (requerido para deep linking)
   - ✅ **App Attest** (ya está marcado)
   - ✅ **Accessibility Merchant API Control** (ya está marcado)
4. **Continue** → **Register**

---

## ⚠️ Errores Comunes

### "Bundle ID already exists"
- Significa que ya está registrado
- Ve a "Identifiers" y verifica si existe
- Si existe, puedes usarlo directamente

### "Invalid Bundle ID format"
- Verifica que no tenga espacios
- Debe ser formato reverse-domain: `com.dominio.app`

### "Continue button disabled"
- Verifica que Description y Bundle ID estén completos
- Bundle ID debe ser válido (sin asteriscos si es Explicit)

---

**Una vez completado este paso, puedes proceder a crear la app en App Store Connect** 🚀

