# 🔍 Revisar Pestaña "Advanced"

## 📍 Ubicación Actual

Estás en: **User management → Authentication → Socials**

Esta sección es para proveedores OAuth sociales (Google, Apple, etc.), **NO** para Custom Auth.

## ✅ Siguiente Paso

En la misma página, haz clic en la pestaña **"Advanced"** (está al lado de "Socials").

En "Advanced" deberías buscar:
- "External auth providers"
- "Custom authentication"
- "Using your own authentication"
- "JWT-based authentication"

## ⚠️ Si No Lo Encuentras

Si después de revisar "Advanced" no encuentras la opción, significa que:

1. **Requiere un plan específico** (puede no estar en el plan gratuito)
2. **Debe ser habilitado por soporte de Privy**

## ✅ Solución Temporal Aplicada

Ya deshabilitamos Custom Auth en el código, así que:
- ✅ La app debería funcionar sin errores
- ✅ Privy sigue disponible para wallet management futuro
- ✅ Supabase funciona independientemente

Cuando tengas acceso a Custom Auth, solo necesitas:
1. Habilitarlo en el dashboard
2. Descomentar las líneas en `PrivyAuthProvider.tsx`

---

## 📝 Acción Inmediata

**Haz clic en la pestaña "Advanced"** y dime qué opciones ves.

