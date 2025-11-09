# 🔐 Guía Completa de Implementación Backend

Este documento consolida TODA la información necesaria para implementar el backend, con enfoque práctico y simplificado.

**Filosofía:** No pedir códigos al usuario si ya tienen métodos más seguros (Passkeys, Google/Apple OAuth).

---

## 📋 Índice

1. [Filosofía y Prioridades](#-filosofía-y-prioridades)
2. [Passkeys Endpoints](#1-passkeys-endpoints) - **ESENCIAL**
3. [Session Management](#2-session-management) - **ÚTIL**
4. [Recovery Codes Opcional](#3-recovery-codes-opcional)
5. [Security Endpoints](#4-security-endpoints)
6. [Implementación de Código](#5-implementación-de-código)
7. [Database Schema](#6-database-schema)
8. [Security Considerations](#7-security-considerations)
9. [Testing Checklist](#8-testing-checklist)

---

## 🎯 Filosofía y Prioridades

### Stack de Autenticación Recomendado

1. **Primera opción:** Passkey (más seguro, sin códigos)
2. **Segunda opción:** Google/Apple OAuth (seguro, familiar)
3. **Tercera opción (solo backup):** Email/Password + Recovery Codes

**NO pedir códigos si tienen métodos mejores.**

### Prioridades de Implementación

#### 🔴 **CRÍTICO (Implementar primero):**
1. ✅ Passkeys endpoints (4 endpoints)
2. ✅ Tabla `passkeys` en Supabase
3. ✅ Tabla `vaults` en Supabase (si usas vaults)

#### 🟡 **IMPORTANTE (Implementar después):**
4. ✅ Session Management básico (listar, revocar)
5. ✅ Tabla `user_sessions` en Supabase
6. ✅ Security endpoint `/api/security/pepper`

#### 🟢 **OPCIONAL (Solo si usas email/password):**
7. ⚪ Recovery Codes básicos
8. ⚪ Tabla `recovery_codes`

#### ⚪ **NO NECESARIO:**
9. ❌ MFA TOTP (passkeys ya es 2FA)
10. ❌ Session Management complejo con geolocalización
11. ❌ MFA Backup Codes (passkeys ya son seguros)

---

## 1. Passkeys Endpoints

### ✅ Ya tienes esto parcialmente implementado en frontend

El backend solo necesita completar los endpoints que ya estás llamando.

---

### 1.1 `POST /api/passkeys/register/begin`

**Propósito:** Iniciar registro de passkey

**Request:**
```json
{
  "email": "user@example.com",
  "userId": "optional-user-id-if-authenticated"
}
```

**Response:**
```json
{
  "publicKey": {
    "rp": {
      "name": "HIHODL",
      "id": "hihodl.xyz"
    },
    "user": {
      "id": "base64-encoded-user-id",
      "name": "user@example.com",
      "displayName": "User Name"
    },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "challenge": "base64-encoded-random-challenge",
    "timeout": 60000,
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "userVerification": "required",
      "requireResidentKey": true
    }
  }
}
```

**Implementation Notes:**
- Generate a random challenge (32 bytes, base64 encoded)
- Store challenge in session/cache with TTL (5 minutes)
- Use `@simplewebauthn/server` to generate options
- Find or create user in Supabase if needed

---

### 1.2 `POST /api/passkeys/register/complete`

**Propósito:** Completar registro de passkey

**Request:**
```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "clientDataJSON": "base64-json",
      "attestationObject": "base64-encoded"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "credentialId": "credential-id",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "supabase-access-token",
    "refresh_token": "supabase-refresh-token"
  }
}
```

**Implementation Notes:**
- Verify the challenge from `/begin` endpoint
- Use `@simplewebauthn/server` to verify attestation
- Store credential in database:
  - `credentialId` (primary key)
  - `userId` (Supabase user ID)
  - `publicKey` (COSE public key)
  - `counter` (initialized to 0)
  - `createdAt`
- Create or update Supabase user if needed
- Return Supabase session tokens

---

### 1.3 `POST /api/passkeys/login/begin`

**Propósito:** Iniciar autenticación con passkey

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "publicKey": {
    "challenge": "base64-encoded-random-challenge",
    "timeout": 60000,
    "rpId": "hihodl.xyz",
    "allowCredentials": [
      {
        "id": "credential-id",
        "type": "public-key"
      }
    ],
    "userVerification": "required"
  }
}
```

**Implementation Notes:**
- Find all passkeys for the email/user
- Generate challenge and store with TTL
- Return allowCredentials array with all user's passkeys

---

### 1.4 `POST /api/passkeys/login/complete`

**Propósito:** Completar autenticación con passkey

**Request:**
```json
{
  "assertion": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "clientDataJSON": "base64-json",
      "authenticatorData": "base64-encoded",
      "signature": "base64-signature",
      "userHandle": "base64-user-id"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "supabase-access-token",
    "refresh_token": "supabase-refresh-token"
  }
}
```

**Implementation Notes:**
- Verify challenge from `/begin`
- Find credential by ID
- Use `@simplewebauthn/server` to verify assertion
- Check counter (prevent replay attacks)
- Update counter in database
- Return Supabase session tokens

---

### 1.5 `GET /api/passkeys/list`

**Propósito:** Listar passkeys del usuario

**Headers:**
```
Authorization: Bearer <supabase-access-token>
```

**Response:**
```json
{
  "passkeys": [
    {
      "id": "credential-id",
      "name": "iPhone 15 Pro",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": "2024-11-02T10:00:00Z"
    }
  ]
}
```

---

### 1.6 `DELETE /api/passkeys/:id`

**Propósito:** Eliminar un passkey

**Headers:**
```
Authorization: Bearer <supabase-access-token>
```

**Response:**
```json
{
  "success": true
}
```

---

## 2. Session Management

### 2.1 Listar Sesiones Activas

**GET** `/api/auth/sessions`

**Autenticación:** Requerida (JWT token)

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "deviceName": "iPhone 15 Pro",
      "deviceType": "mobile", // 'mobile' | 'desktop' | 'tablet'
      "lastActiveAt": "2024-11-02T10:00:00Z",
      "currentSession": true
    }
  ],
  "totalActive": 2
}
```

**Notas:**
- Solo mostrar nombre del dispositivo y última actividad
- NO necesitas geolocalización compleja (eso es "nice to have")
- Extraer info básica del User-Agent

---

### 2.2 Revocar Sesión

**DELETE** `/api/auth/sessions/:sessionId`

**Autenticación:** Requerida (JWT token)

**Response:**
```json
{
  "revoked": true,
  "message": "Session revoked successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "revoked": false,
  "error": "CANNOT_REVOKE_CURRENT",
  "message": "Cannot revoke current session. Use sign out instead."
}
```

**Notas:**
- Invalidar refresh token en Supabase
- No permitir revocar sesión actual

---

### 2.3 Revocar Todas las Sesiones (Excepto Actual)

**POST** `/api/auth/sessions/revoke-all`

**Autenticación:** Requerida (JWT token)

**Request Body:**
```json
{
  "password": "userPassword" // Confirmar con password
}
```

**Response:**
```json
{
  "revoked": 3,
  "message": "All other sessions revoked successfully"
}
```

**Notas:**
- Requerir confirmación con password
- Revocar todas las sesiones excepto la actual
- Devolver número de sesiones revocadas

---

## 3. Recovery Codes Opcional

### ⚠️ SOLO necesario si usas email/password como método principal

**Si el usuario solo usa Passkeys + Google/Apple OAuth:**
- ❌ **NO necesitas Recovery Codes** - Pueden recuperar desde Google/Apple
- ❌ **NO necesitas MFA TOTP** - Passkeys YA ES 2FA

**Si el usuario usa email/password como backup:**
- ✅ **SÍ necesitas Recovery Codes básicos** (para recuperar cuenta sin email)

---

### 3.1 Generar Recovery Codes

**POST** `/api/auth/recovery-codes/generate`

**Autenticación:** Requerida (JWT token)

**Request Body:**
```json
{
  "userId": "uuid-del-usuario"
}
```

**Response (200 OK):**
```json
{
  "codes": [
    "ABCD-1234-EFGH",
    "IJKL-5678-MNOP",
    "QRST-9012-UVWX",
    "YZAB-3456-CDEF",
    "GHIJ-7890-KLMN",
    "OPQR-2345-STUV",
    "WXYZ-6789-ABCD",
    "EFGH-0123-IJKL"
  ],
  "generatedAt": "2024-11-02T10:00:00Z"
}
```

**Notas:**
- Debe generar 8 códigos únicos
- Cada código debe tener formato: `XXXX-XXXX-XXXX` (12 caracteres, guiones cada 4)
- Los códigos deben ser hasheados antes de almacenarlos (usar bcrypt)
- Solo almacenar hashes, nunca códigos en texto plano
- Devolver códigos SOLO una vez al usuario

---

### 3.2 Verificar Recovery Code

**POST** `/api/auth/recovery-codes/verify`

**Autenticación:** NO requerida (usuario no está autenticado)

**Request Body:**
```json
{
  "code": "ABCD-1234-EFGH",
  "email": "user@example.com" // Opcional, para identificar usuario
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "userId": "uuid-del-usuario",
  "token": "temporary-recovery-token", // Token temporal válido por 15 minutos
  "message": "Recovery code verified successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "valid": false,
  "error": "INVALID_CODE",
  "message": "Invalid or already used recovery code"
}
```

**Notas:**
- Debe verificar el hash del código
- Debe marcar el código como usado (no permitir reutilización)
- El token temporal permite cambiar password sin estar autenticado
- El token expira en 15 minutos
- Rate limiting: máximo 5 intentos por código por hora

---

## 4. Security Endpoints

### 4.1 `GET /api/security/pepper`

**Propósito:** Obtener pepper del servidor para encriptación del vault

**Headers:**
```
Authorization: Bearer <supabase-access-token>
```

**Response:**
```json
{
  "pepper": "base64-encoded-32-byte-random-pepper"
}
```

**Implementation Notes:**
- Pepper debe ser:
  - Generado por usuario o por app
  - Almacenado de forma segura (encriptado en reposo)
  - Nunca logueado o expuesto
  - Rotado periódicamente (requiere re-encriptación de vaults)
- Considerar usar variable de entorno o servicio de gestión de claves (AWS KMS, HashiCorp Vault, etc.)

---

## 5. Implementación de Código

### Package Dependencies

```json
{
  "dependencies": {
    "@simplewebauthn/server": "^11.0.0",
    "@supabase/supabase-js": "^2.78.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "bcrypt": "^5.1.1"
  }
}
```

### Example Implementation (Node.js/Express)

```typescript
import express from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin access
);

// Store challenges temporarily (use Redis in production)
const challenges = new Map<string, { challenge: string; userId?: string; expires: number }>();

// ============================================
// PASSKEY REGISTRATION
// ============================================

app.post('/api/passkeys/register/begin', async (req, res) => {
  try {
    const { email, userId } = req.body;

    // Find or create user in Supabase
    let supabaseUserId = userId;
    if (!supabaseUserId) {
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      if (!existingUser) {
        // Create user (requires Supabase Admin API)
        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (error) throw error;
        supabaseUserId = newUser.user.id;
      } else {
        supabaseUserId = existingUser.user.id;
      }
    }

    const options = await generateRegistrationOptions({
      rpName: 'HIHODL',
      rpID: process.env.RP_ID || 'hihodl.xyz',
      userID: Buffer.from(supabaseUserId),
      userName: email,
      userDisplayName: email,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: true,
      },
    });

    // Store challenge
    challenges.set(options.challenge, {
      challenge: options.challenge,
      userId: supabaseUserId,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    res.json({ publicKey: options });
  } catch (error) {
    console.error('Registration begin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/passkeys/register/complete', async (req, res) => {
  try {
    const { credential } = req.body;

    // Extract challenge from clientDataJSON
    const clientData = JSON.parse(
      Buffer.from(credential.response.clientDataJSON, 'base64').toString()
    );
    const stored = challenges.get(clientData.challenge);

    if (!stored || stored.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: stored.challenge,
      expectedOrigin: process.env.RP_ORIGIN || 'https://hihodl.xyz',
      expectedRPID: process.env.RP_ID || 'hihodl.xyz',
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Save passkey to database
    const { error: insertError } = await supabase.from('passkeys').insert({
      id: credential.id,
      user_id: stored.userId,
      credential_id: credential.id,
      public_key: Buffer.from(verification.registrationInfo.publicKey),
      counter: verification.registrationInfo.counter || 0,
      device_name: extractDeviceName(req.headers['user-agent']),
    });

    if (insertError) {
      console.error('Passkey insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save passkey' });
    }

    // Create Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId: stored.userId!,
    });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    challenges.delete(stored.challenge);

    res.json({
      success: true,
      credentialId: credential.id,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
    });
  } catch (error) {
    console.error('Registration complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PASSKEY AUTHENTICATION
// ============================================

app.post('/api/passkeys/login/begin', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user's passkeys
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: userPasskeys, error: passkeysError } = await supabase
      .from('passkeys')
      .select('credential_id')
      .eq('user_id', user.user.id);

    if (passkeysError) {
      console.error('Passkeys query error:', passkeysError);
      return res.status(500).json({ error: 'Failed to fetch passkeys' });
    }

    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID || 'hihodl.xyz',
      allowCredentials:
        userPasskeys?.map((pk) => ({
          id: Buffer.from(pk.credential_id, 'base64'),
          type: 'public-key',
        })) || [],
      userVerification: 'required',
      timeout: 60000,
    });

    challenges.set(options.challenge, {
      challenge: options.challenge,
      userId: user.user.id,
      expires: Date.now() + 5 * 60 * 1000,
    });

    res.json({ publicKey: options });
  } catch (error) {
    console.error('Login begin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/passkeys/login/complete', async (req, res) => {
  try {
    const { assertion } = req.body;

    // Extract challenge
    const clientData = JSON.parse(
      Buffer.from(assertion.response.clientDataJSON, 'base64').toString()
    );
    const stored = challenges.get(clientData.challenge);

    if (!stored || stored.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    // Find passkey
    const { data: passkey, error: passkeyError } = await supabase
      .from('passkeys')
      .select('*')
      .eq('credential_id', assertion.id)
      .single();

    if (passkeyError || !passkey) {
      return res.status(404).json({ error: 'Passkey not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: stored.challenge,
      expectedOrigin: process.env.RP_ORIGIN || 'https://hihodl.xyz',
      expectedRPID: process.env.RP_ID || 'hihodl.xyz',
      authenticator: {
        credentialID: Buffer.from(passkey.credential_id, 'base64'),
        credentialPublicKey: passkey.public_key,
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Update counter
    await supabase
      .from('passkeys')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', passkey.id);

    // Create session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId: stored.userId!,
    });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    challenges.delete(stored.challenge);

    res.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
    });
  } catch (error) {
    console.error('Login complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function
function extractDeviceName(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';
  // Simple device name extraction (you can use a library like 'ua-parser-js' for better results)
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Mac')) return 'MacBook';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Windows')) return 'Windows PC';
  return 'Unknown Device';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 6. Database Schema

### 6.1 Tabla `passkeys`

```sql
CREATE TABLE passkeys (
  id TEXT PRIMARY KEY, -- credential ID from WebAuthn
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE, -- base64 encoded credential ID
  public_key BYTEA NOT NULL, -- COSE public key
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX idx_passkeys_credential_id ON passkeys(credential_id);

-- RLS Policies
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passkeys"
  ON passkeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passkeys"
  ON passkeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passkeys"
  ON passkeys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own passkeys"
  ON passkeys FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 6.2 Tabla `vaults` (si usas vaults)

```sql
CREATE TABLE vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  cipher_blob JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- RLS Policies
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vaults"
  ON vaults FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vaults"
  ON vaults FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vaults"
  ON vaults FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### 6.3 Tabla `user_sessions`

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  user_agent TEXT,
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_last_active ON user_sessions(user_id, last_active_at DESC);
CREATE INDEX idx_user_sessions_revoked ON user_sessions(user_id, revoked);
```

**Cómo trackear sesiones:**
- Interceptar refresh token en Supabase
- Cuando se refresca, actualizar `last_active_at`
- Guardar metadata del User-Agent al crear sesión

---

### 6.4 Tabla `recovery_codes` (opcional)

```sql
CREATE TABLE recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  batch_id UUID NOT NULL, -- Para agrupar códigos generados juntos
  
  UNIQUE(user_id, code_hash)
);

CREATE INDEX idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX idx_recovery_codes_batch_id ON recovery_codes(batch_id);
CREATE INDEX idx_recovery_codes_used ON recovery_codes(user_id, used);
```

---

## 7. Security Considerations

### 7.1 Challenge Storage
- **Producción:** Usar Redis o similar
- **TTL:** 5 minutos
- **Incluir user ID en challenge** para prevenir ataques

### 7.2 Rate Limiting
- Implementar rate limiting en todos los endpoints
- Prevenir ataques de fuerza bruta
- Limitar registro de passkeys por usuario (ej: máximo 10)

### 7.3 CORS
- Configurar CORS correctamente
- Solo permitir dominios de tu frontend

### 7.4 Pepper Storage
- Encriptar pepper en reposo
- Usar servicio de gestión de claves (AWS KMS, HashiCorp Vault, etc.)
- Rotar periódicamente (requiere re-encriptación de vaults)

### 7.5 Logging
- Registrar intentos de autenticación (sin datos sensibles)
- Monitorear patrones sospechosos
- Alertar en múltiples intentos fallidos

### 7.6 Recovery Codes
- **Hashear códigos:** Usar bcrypt con salt rounds >= 10
- **Rate limiting:** Máximo 5 intentos por código por hora
- **Invalidar al usar:** Los códigos solo se pueden usar una vez
- **Token temporal:** Los recovery tokens expiran en 15 minutos
- **Logging:** Registrar todos los intentos de verificación

---

## 8. Testing Checklist

### Passkeys
- [ ] Passkey registration flow completo
- [ ] Passkey authentication flow completo
- [ ] Múltiples passkeys por usuario
- [ ] Eliminación de passkey
- [ ] Expiración de challenge
- [ ] Verificación de counter
- [ ] Manejo de errores (challenge inválido, passkey no encontrado, etc.)

### Sessions
- [ ] Listar sesiones activas
- [ ] Revocar sesión individual
- [ ] Revocar todas las sesiones
- [ ] No permitir revocar sesión actual
- [ ] Actualización de `last_active_at`

### Recovery Codes (si implementado)
- [ ] Generación de códigos
- [ ] Verificación de códigos
- [ ] Invalidación después de usar
- [ ] Rate limiting

### General
- [ ] Rate limiting en todos los endpoints
- [ ] Error handling apropiado
- [ ] CORS configuration
- [ ] Security endpoint (pepper) solo para usuarios autenticados
- [ ] Logging de eventos importantes

---

## 📦 Dependencias Backend

```json
{
  "dependencies": {
    "@simplewebauthn/server": "^11.0.0",
    "@supabase/supabase-js": "^2.78.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "bcrypt": "^5.1.1",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 📝 Variables de Entorno Requeridas

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WebAuthn
RP_ID=hihodl.xyz
RP_ORIGIN=https://hihodl.xyz

# Server
PORT=3000
NODE_ENV=production

# Security
PEPPER_SECRET=your-pepper-secret (opcional, si no usas servicio de claves)
```

---

**Fecha:** 2024-11-02  
**Versión:** 3.0 (Consolidado)  
**Estado:** ✅ Guía completa y práctica

