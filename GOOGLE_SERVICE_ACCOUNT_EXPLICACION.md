# 🔑 Google Service Account Key - ¿Es Necesario?

## ❓ ¿Qué es esto?

El menú que ves es para configurar **Google Service Account Key**, que se usa para:

1. **Play Store Submissions** - Subir automáticamente tu app a Play Store con `eas submit`
2. **Push Notifications (FCM V1)** - Enviar notificaciones push a usuarios

---

## ✅ ¿Es Necesario AHORA?

**NO** - No es crítico para hacer el build de producción.

**Puedes:**
- ✅ Hacer el build sin esto
- ✅ Subir manualmente a Play Store (sin automatización)
- ✅ Configurarlo después cuando lo necesites

---

## 🎯 Cuándo Configurarlo

### Opción A: Ahora (Opcional)

**Si quieres automatizar la subida a Play Store:**

1. Selecciona: `Manage your Google Service Account Key for Play Store Submissions`
2. Sigue las instrucciones de EAS
3. Necesitarás crear un Service Account en Google Cloud Console

**Ventajas:**
- Puedes usar `eas submit` para subir automáticamente
- Más rápido para futuros releases

**Desventajas:**
- Requiere configuración adicional en Google Cloud Console
- Puede tomar 10-15 minutos

---

### Opción B: Después (Recomendado)

**Para ahora:**
- Selecciona: `Go back` y sal del menú
- Continúa con configurar EAS Secrets
- Haz el build de producción
- Sube manualmente a Play Store la primera vez

**Después, cuando quieras automatizar:**
- Vuelve a `eas credentials`
- Configura el Service Account Key
- Usa `eas submit` para futuros releases

---

## 📋 Recomendación

**Para AHORA:**
1. Selecciona: `Go back`
2. Sal del menú de credentials
3. Continúa con: `./scripts/setup-eas-secrets.sh`
4. Haz el build de producción
5. Sube manualmente a Play Store la primera vez

**Para DESPUÉS (cuando quieras automatizar):**
- Configura el Service Account Key
- Usa `eas submit` para futuros releases

---

## 🔍 Qué Necesitas para Configurarlo (si decides hacerlo)

1. **Google Cloud Console:**
   - Crear un Service Account
   - Generar una key JSON
   - Dar permisos de "App Uploader" en Play Console

2. **Google Play Console:**
   - Ir a Setup → API access
   - Conectar el Service Account
   - Dar permisos necesarios

**Tiempo estimado:** 10-15 minutos

---

## ✅ Resumen

**Para lanzar la app:**
- ❌ NO necesitas configurar esto ahora
- ✅ Puedes hacerlo después
- ✅ Puedes subir manualmente a Play Store

**Siguiente paso:**
- Sal del menú (`Go back`)
- Configura EAS Secrets
- Haz el build

