# ✅ Pegar JWT Secret en Privy

## 📍 Ubicación Correcta

Sí, el campo **"Enter public verification certificate"** es donde debes pegar el JWT Secret.

## ⚠️ Nota Importante

El texto dice que espera un **certificado x.509** (formato PEM con header/footer), pero Supabase usa **HS256** (HMAC) con un JWT Secret simple.

### Opción 1: Intentar con JWT Secret Directo

1. **Copia el JWT Secret completo** de Supabase (después de hacer "Reveal")
2. **Pégalo directamente** en el campo "Enter public verification certificate"
3. **Guarda** y prueba

Si Privy acepta el JWT Secret directamente, funcionará.

### Opción 2: Si No Funciona (Necesita Formato PEM)

Si Privy rechaza el JWT Secret porque espera un certificado x.509, necesitarás:

1. **Obtener la clave pública de Supabase** (si está disponible)
2. **Convertirla a formato PEM** con headers:
   ```
   -----BEGIN PUBLIC KEY-----
   [clave pública aquí]
   -----END PUBLIC KEY-----
   ```

Pero primero, **intenta con el JWT Secret directo**.

---

## 📝 Pasos Exactos

1. **En Supabase:**
   - Settings → API → JWT Keys → Legacy JWT Secret
   - Haz clic en **"Reveal"**
   - **Copia el secret completo** (es una cadena larga sin espacios)

2. **En Privy:**
   - Pega el secret en el campo **"Enter public verification certificate"**
   - Verifica que **"JWT user ID claim"** sea `sub`
   - **Guarda los cambios**

3. **Si no guarda o da error:**
   - Puede que necesite formato PEM
   - O que Supabase use HS256 y Privy solo acepte RS256
   - En ese caso, contacta a Privy support

---

## ✅ Verificación

Después de guardar:
- Reinicia la app: `npx expo start -c`
- El error "JWT-based authentication is not enabled" debería desaparecer

---

## 🔍 Si No Funciona

Si Privy rechaza el JWT Secret porque espera un certificado x.509:

1. **Verifica el algoritmo de Supabase:**
   - Supabase puede usar HS256 (HMAC) o RS256 (RSA)
   - Si usa HS256, el secret funciona directamente
   - Si usa RS256, necesitas la clave pública en formato PEM

2. **Contacta a Privy Support:**
   - Pregunta si soportan HS256 con JWT Secret
   - O cómo obtener la clave pública de Supabase en formato PEM

---

## Referencias

- [Supabase JWT Docs](https://supabase.com/docs/guides/auth/jwts)
- [Privy JWT Setup](https://docs.privy.io/authentication/user-authentication/jwt-based-auth/setup)



