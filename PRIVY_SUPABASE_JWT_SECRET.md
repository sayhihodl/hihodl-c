# 🔐 Usar JWT Secret de Supabase en Privy

## 📍 Ubicación del JWT Secret

Estás en: **Supabase Dashboard → Settings → API → JWT Keys → Legacy JWT Secret**

## ✅ Opción 1: JWKS Endpoint (Recomendado)

En Privy Dashboard, usa el **JWKS endpoint**:

```
https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks
```

**Ventajas:**
- ✅ Más seguro (no expone el secret)
- ✅ Se actualiza automáticamente
- ✅ Estándar de la industria

## ✅ Opción 2: JWT Secret Directo (Si JWKS no funciona)

Si el JWKS endpoint no funciona, puedes usar el JWT Secret directamente:

1. **En Supabase:**
   - Haz clic en **"Reveal"** para ver el JWT Secret
   - **Copia el secret completo**

2. **En Privy Dashboard:**
   - En la sección "Verification", cambia de la pestaña **"JWKS endpoint"** a **"Public verification certificate"**
   - Pega el JWT Secret de Supabase

**Nota:** Esta opción es menos segura pero funciona si JWKS no está disponible.

---

## 🎯 Pasos Recomendados

1. **Primero intenta con JWKS endpoint:**
   - En Privy: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks`
   - JWT user ID claim: `sub`
   - Guarda y prueba

2. **Si no funciona, usa JWT Secret:**
   - Revela el secret en Supabase
   - Cámbialo a "Public verification certificate" en Privy
   - Pega el secret

---

## ⚠️ Importante

- **NO compartas el JWT Secret** públicamente
- **NO lo subas a repositorios públicos**
- Úsalo solo para configurar Privy

---

## Referencias

- [Supabase JWT Docs](https://supabase.com/docs/guides/auth/jwts)
- [Privy JWT-based Auth](https://docs.privy.io/authentication/user-authentication/jwt-based-auth/setup)

