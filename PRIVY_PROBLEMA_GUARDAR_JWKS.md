# ⚠️ Problema: No se Guarda JWKS Endpoint en Privy

## 🔍 Posibles Causas

### 1. JWKS Endpoint No Accesible
El endpoint puede no estar disponible o no responder correctamente.

**Verificar:**
```bash
curl https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks
```

Si no responde o da error, Supabase puede no exponer JWKS estándar.

### 2. Campos Requeridos Faltantes
Asegúrate de que:
- ✅ JWKS endpoint está ingresado
- ✅ JWT user ID claim está ingresado (`sub`)
- ✅ Authentication environment está seleccionado (Client side)

### 3. Formato del JWKS Endpoint
Privy puede requerir un formato específico. Prueba:
- Con `/jwks` al final
- Sin `/jwks` al final
- Con `.json` al final: `/jwks.json`

### 4. Validación de Privy
Privy puede estar validando el endpoint antes de guardar. Si el endpoint no responde correctamente, no permitirá guardar.

---

## ✅ Solución Alternativa: Usar JWT Secret Directamente

Si el JWKS endpoint no funciona, usa el JWT Secret:

1. **En Privy Dashboard:**
   - Cambia de la pestaña **"JWKS endpoint"** a **"Public verification certificate"**

2. **Obtén el JWT Secret de Supabase:**
   - Ve a Supabase Dashboard → Settings → API → JWT Keys
   - Haz clic en **"Reveal"** para ver el secret
   - **Copia el secret completo**

3. **En Privy:**
   - Pega el JWT Secret en el campo "Public verification certificate"
   - JWT user ID claim: `sub`
   - Guarda

---

## 🔍 Verificar JWKS Endpoint

Ejecuta este comando para verificar si el endpoint funciona:

```bash
curl https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks
```

**Respuesta esperada:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "...",
      "n": "...",
      "e": "..."
    }
  ]
}
```

Si no responde o da error 404, Supabase no expone JWKS y debes usar el JWT Secret directamente.

---

## 📝 Pasos de Diagnóstico

1. **Verifica el endpoint:**
   ```bash
   curl https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks
   ```

2. **Si no funciona, usa JWT Secret:**
   - Cambia a "Public verification certificate" en Privy
   - Usa el JWT Secret de Supabase

3. **Verifica campos requeridos:**
   - Authentication environment: Client side ✅
   - JWT user ID claim: `sub` ✅
   - JWKS endpoint o Public certificate ✅

---

## Referencias

- [Supabase JWT Docs](https://supabase.com/docs/guides/auth/jwts)
- [Privy JWT Setup](https://docs.privy.io/authentication/user-authentication/jwt-based-auth/setup)

