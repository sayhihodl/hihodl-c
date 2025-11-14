# 🍎 Configurar Sign In with Apple - App ID

## 📋 En la Pantalla Actual

### 1. Sign In with Apple: App ID Configuration

**Selecciona esta opción:**
- ✅ **"Enable as a primary App ID"** ← MARCAR ESTA
  - Es la primera vez que configuras Sign In with Apple para esta app
  - Esta es la opción correcta para apps nuevas

**NO seleccionar:**
- ❌ "Group with an existing primary App ID" 
  - Solo si ya tienes otra app con Sign In with Apple configurado
  - Como dice "No Primary App ID is available", no puedes usar esta opción

---

### 2. Server-to-Server Notification Endpoint

**¿Necesitas esto?**

**Opción A: Dejar vacío (Recomendado para empezar)** ✅
- Si usas **Supabase** para autenticación (que es tu caso)
- Supabase maneja las notificaciones de Apple automáticamente
- Puedes agregarlo después si lo necesitas

**Opción B: Configurar endpoint propio** (Opcional)
- Solo si tienes tu propio backend que maneja notificaciones de Apple
- Necesitarías un endpoint como: `https://tu-backend.com/api/apple/notifications`
- Debe usar TLS 1.2 o superior

**Recomendación:** 
- **Dejar vacío por ahora** ✅
- Puedes agregarlo después si necesitas manejar notificaciones específicas

---

## ✅ Pasos a Seguir

1. **Marca:** ✅ "Enable as a primary App ID"
2. **Server-to-Server Notification Endpoint:** Déjalo vacío (o agrega tu endpoint si lo tienes)
3. Haz clic en **"Continue"** o **"Save"**

---

## 📝 Después de Guardar

Una vez guardado, necesitarás:

1. **Crear un Service ID** (siguiente paso)
   - Ve a "Identifiers" → "+" → "Services IDs"
   - Crea uno para Sign In with Apple
   - Ver `APPLE_SIGNIN_SETUP.md` para más detalles

2. **Configurar dominios y return URLs**
   - En el Service ID, configura:
     - Domain: `gctwjvfpwkirtybzbnmu.supabase.co`
     - Return URL: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`

---

## ⚠️ Notas Importantes

- **Primary App ID:** Una vez marcado como "primary", este App ID será el principal para Sign In with Apple
- **Server-to-Server Notifications:** Son útiles si necesitas saber cuando:
  - Un usuario elimina su cuenta de Apple
  - Cambian preferencias de email forwarding
  - Se elimina permanentemente la cuenta de Apple
- **Con Supabase:** Supabase maneja esto automáticamente, así que no necesitas el endpoint ahora

---

**Siguiente paso:** Guardar esta configuración y luego crear el Service ID para Sign In with Apple 🚀



