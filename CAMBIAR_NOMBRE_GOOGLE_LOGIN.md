# 🔧 Cambiar Nombre en Login de Google

## 📋 Problema

Cuando los usuarios hacen login con Google, ven:
- **"Iniciar sesión en gctwjvfpwkirtybzbnmu.supabase.co"**

Esto es confuso porque es el ID del proyecto de Supabase, no el nombre de tu app.

---

## ✅ Solución: Cambiar en Google Cloud Console

### Paso 1: Ir a OAuth Consent Screen

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=hihodlapp
2. O navega manualmente:
   - Google Cloud Console → **APIs & Services** → **OAuth consent screen**

### Paso 2: Editar App Name

1. En la sección **"App information"**, busca el campo **"App name"**
2. Cambia el nombre a: **"HIHODL"** (o el nombre que quieras)
3. **Guarda** los cambios

### Paso 3: Verificar Otros Campos (Opcional pero Recomendado)

Mientras estás ahí, verifica/actualiza:

- **User support email**: Tu email de soporte
- **App logo**: Sube el logo de HIHODL (opcional)
- **Application home page**: `https://hihodl.xyz` (si tienes)
- **Privacy policy URL**: `https://hihodl.xyz/privacy` (requerido)
- **Terms of service URL**: `https://hihodl.xyz/terms` (requerido)

### Paso 4: Guardar y Esperar

1. Click en **"Save and Continue"**
2. Los cambios pueden tardar **5-10 minutos** en propagarse
3. Después de esperar, prueba el login de nuevo

---

## 🎯 Resultado

Después de cambiar el nombre, los usuarios verán:
- **"Iniciar sesión en HIHODL"** ✅

En lugar de:
- ~~"Iniciar sesión en gctwjvfpwkirtybzbnmu.supabase.co"~~ ❌

---

## ⚠️ Nota Importante

El nombre que cambias es solo para la **pantalla de consentimiento de Google**. 
El dominio técnico (`gctwjvfpwkirtybzbnmu.supabase.co`) seguirá siendo el mismo en las URLs, pero los usuarios verán el nombre amigable que configures.

---

## 📝 Checklist

- [ ] Ir a Google Cloud Console → OAuth consent screen
- [ ] Cambiar "App name" a "HIHODL"
- [ ] Verificar/actualizar otros campos (email, URLs)
- [ ] Guardar cambios
- [ ] Esperar 5-10 minutos
- [ ] Probar login de Google
- [ ] Verificar que aparece "HIHODL" en lugar del ID de Supabase

