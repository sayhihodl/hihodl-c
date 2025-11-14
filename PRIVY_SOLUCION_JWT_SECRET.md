# ✅ Solución: Usar JWT Secret en Lugar de JWKS

## ❌ Problema

El JWKS endpoint de Supabase requiere autenticación, por lo que Privy no puede validarlo automáticamente.

## ✅ Solución: Usar "Public verification certificate"

### Pasos en Privy Dashboard:

1. **Cambia de pestaña:**
   - En la sección "Verification"
   - Cambia de **"JWKS endpoint"** a **"Public verification certificate"**

2. **Obtén el JWT Secret de Supabase:**
   - Ve a: **Supabase Dashboard → Settings → API → JWT Keys → Legacy JWT Secret**
   - Haz clic en **"Reveal"** para ver el secret
   - **Copia el secret completo** (es una cadena larga)

3. **Pega el JWT Secret en Privy:**
   - En el campo "Public verification certificate"
   - Pega el JWT Secret que copiaste de Supabase

4. **Configura los Claims:**
   - **JWT user ID claim:** `sub`
   - **JWT additional claims:** (opcional, puedes dejarlo vacío)
   - **JWT aud claim:** (opcional, puedes dejarlo vacío)

5. **Guarda los cambios**

---

## 📋 Resumen de Configuración

- **Authentication environment:** Client side ✅
- **Verification:** Public verification certificate (no JWKS endpoint)
- **Public verification certificate:** [JWT Secret de Supabase]
- **JWT user ID claim:** `sub`
- **JWT additional claims:** (vacío, opcional)
- **JWT aud claim:** (vacío, opcional)

---

## 🔄 Después de Guardar

1. Guarda los cambios en Privy
2. Reinicia la app: `npx expo start -c`
3. El error debería desaparecer

---

## ⚠️ Nota de Seguridad

- El JWT Secret es sensible, no lo compartas públicamente
- Solo úsalo para configurar Privy
- No lo subas a repositorios públicos



