# 🔧 Configurar JWT-based Auth con Supabase en Privy

## 📋 Valores a Configurar

### 1. JWKS Endpoint

**Formato de Supabase:**
```
https://[project-ref].supabase.co/auth/v1/jwks
```

**Para tu proyecto:**
Basado en tu configuración, tu Supabase URL es: `https://gctwjvfpwkirtybzbnmu.supabase.co`

**JWKS Endpoint a ingresar:**
```
https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks
```

### 2. JWT User ID Claim

Supabase usa el claim `sub` (subject) para el ID único del usuario.

**Valor a ingresar:**
```
sub
```

### 3. JWT Additional Claims (Opcional)

Puedes agregar claims adicionales para verificación:

**Key:** `iss` (issuer)  
**Value:** `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1`

O simplemente deja esto vacío si no es necesario.

### 4. JWT aud Claim (Opcional)

Supabase generalmente usa el `aud` claim como `authenticated` o el project ref.

Puedes dejarlo vacío o agregar:
```
authenticated
```

---

## 📝 Pasos en el Dashboard

1. **JWKS endpoint:**
   - Reemplaza `https://example.com/.well-known/jwks.json`
   - Con: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/jwks`

2. **JWT user ID claim:**
   - Ingresa: `sub`

3. **JWT additional claims:**
   - Opcional: Agrega `iss` = `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1`

4. **JWT aud claim:**
   - Opcional: Agrega `authenticated`

5. **Guarda los cambios**

---

## ✅ Verificación

Después de guardar, reinicia la app:
```bash
npx expo start -c
```

El error "JWT-based authentication is not enabled for your app" debería desaparecer.

---

## 🔍 Si el JWKS Endpoint No Funciona

Si Supabase no expone un endpoint JWKS estándar, puedes:

1. **Usar "Public verification certificate"** en lugar de "JWKS endpoint"
2. Obtener la clave pública de Supabase desde:
   - Supabase Dashboard → Settings → API → JWT Secret
   - O usar el JWT Secret directamente (si Privy lo permite)

---

## Referencias

- [Supabase JWT Docs](https://supabase.com/docs/guides/auth/jwts)
- [Privy JWT-based Auth Setup](https://docs.privy.io/authentication/user-authentication/jwt-based-auth/setup)



