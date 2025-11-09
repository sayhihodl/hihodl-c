# 🔐 Backend Pepper Endpoint - Especificación

## 📋 Resumen

Este endpoint proporciona el "pepper" (pimienta) - un secreto del lado del servidor que se usa para reforzar el cifrado del vault. El pepper se combina con la passphrase del usuario para derivar la clave AES final.

**CRÍTICO PARA SEGURIDAD:** Sin este endpoint funcionando, el vault usa un pepper mock (inseguro).

---

## 🔗 Endpoint

```
GET /api/security/pepper
```

### Headers Requeridos

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Response Exitoso

**Status:** `200 OK`

```json
{
  "pepper": "<base64-encoded-32-byte-pepper>",
  "algorithm": "HKDF-SHA256",
  "version": 1
}
```

### Response de Error

**Status:** `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

**Status:** `429 Too Many Requests`
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 🔒 Requisitos de Seguridad

### 1. Autenticación
- ✅ **REQUERIDO:** Verificar token de Supabase
- ✅ El usuario debe estar autenticado
- ✅ Validar que el token no esté expirado

### 2. Rate Limiting
- ✅ Máximo 10 requests por usuario por minuto
- ✅ Máximo 100 requests por IP por hora
- ✅ Retornar `429` con `Retry-After` header cuando se exceda

### 3. Pepper Management
- ✅ Pepper debe ser único por usuario (opcional, pero recomendado)
- ✅ O pepper global (más simple, pero menos seguro si se compromete)
- ✅ Almacenar pepper encriptado en base de datos
- ✅ Usar servicio de gestión de secretos (AWS KMS, HashiCorp Vault, etc.)

### 4. Rotación (Opcional pero Recomendado)
- ✅ Permitir rotación de pepper periódica
- ✅ Mantener versión anterior para desbloquear vaults existentes
- ✅ Migrar vaults a nuevo pepper durante unlock

---

## 🛠️ Implementación Sugerida

### NestJS Example

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RateLimit } from 'nestjs-rate-limiter';

@Controller('api/security')
@UseGuards(AuthGuard('supabase'))
export class SecurityController {
  
  @Get('pepper')
  @RateLimit({ points: 10, duration: 60 }) // 10 requests per minute
  async getPepper(@Req() req) {
    const userId = req.user.id; // From Supabase token
    
    // Option 1: User-specific pepper (more secure)
    const pepper = await this.getOrCreateUserPepper(userId);
    
    // Option 2: Global pepper (simpler)
    // const pepper = await this.getGlobalPepper();
    
    return {
      pepper: Buffer.from(pepper).toString('base64'),
      algorithm: 'HKDF-SHA256',
      version: 1,
    };
  }
  
  private async getOrCreateUserPepper(userId: string): Promise<Uint8Array> {
    // Check if user has pepper in DB
    const existing = await this.db.peppers.findUnique({ where: { userId } });
    
    if (existing) {
      // Decrypt pepper from DB (using master key from KMS)
      return this.decryptPepper(existing.encryptedPepper);
    }
    
    // Generate new pepper
    const newPepper = crypto.getRandomValues(new Uint8Array(32));
    
    // Encrypt and store
    const encrypted = await this.encryptPepper(newPepper);
    await this.db.peppers.create({
      data: {
        userId,
        encryptedPepper: encrypted,
        createdAt: new Date(),
      },
    });
    
    return newPepper;
  }
  
  private async getGlobalPepper(): Promise<Uint8Array> {
    // Fetch from environment or secret manager
    const pepperB64 = process.env.GLOBAL_PEPPER;
    if (!pepperB64) {
      throw new Error('Global pepper not configured');
    }
    return Buffer.from(pepperB64, 'base64');
  }
  
  private async encryptPepper(pepper: Uint8Array): Promise<string> {
    // Use AWS KMS, HashiCorp Vault, or similar
    // For example with AWS KMS:
    // const encrypted = await kms.encrypt({ KeyId: 'pepper-key', Plaintext: pepper });
    // return encrypted.CiphertextBlob.toString('base64');
    
    // TEMPORARY: For development, use env var
    // PRODUCTION: Must use proper secret management
    throw new Error('Pepper encryption not implemented');
  }
  
  private async decryptPepper(encrypted: string): Promise<Uint8Array> {
    // Decrypt using same method as encrypt
    throw new Error('Pepper decryption not implemented');
  }
}
```

### Supabase Edge Function Example

```typescript
// supabase/functions/security-pepper/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create pepper for user
    const { data: pepperData, error: pepperError } = await supabase
      .from('user_peppers')
      .select('pepper')
      .eq('user_id', user.id)
      .single();

    let pepper: string;

    if (pepperError || !pepperData) {
      // Generate new pepper
      const pepperBytes = crypto.getRandomValues(new Uint8Array(32));
      pepper = btoa(String.fromCharCode(...pepperBytes));

      // Store encrypted (use Supabase Vault or similar)
      await supabase
        .from('user_peppers')
        .insert({
          user_id: user.id,
          pepper: pepper, // TODO: Encrypt before storing
          created_at: new Date().toISOString(),
        });
    } else {
      pepper = pepperData.pepper; // TODO: Decrypt
    }

    return new Response(
      JSON.stringify({
        pepper: pepper,
        algorithm: 'HKDF-SHA256',
        version: 1,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: error.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 📊 Database Schema

### Opción 1: Pepper por Usuario (Recomendado)

```sql
CREATE TABLE user_peppers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_pepper TEXT NOT NULL, -- Base64 encrypted pepper
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_peppers_user_id ON user_peppers(user_id);
```

### Opción 2: Pepper Global (Más Simple)

```sql
-- Store in environment variable or secret manager
-- No table needed
```

---

## 🧪 Testing

```bash
# Test successful request
curl -X GET https://api.hihodl.xyz/api/security/pepper \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Expected: 200 OK with pepper
```

---

## ✅ Checklist de Implementación

- [ ] Endpoint `/api/security/pepper` creado
- [ ] Autenticación Supabase implementada
- [ ] Rate limiting configurado (10/min por usuario)
- [ ] Pepper almacenado de forma segura (encriptado)
- [ ] Manejo de errores implementado
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Documentación API actualizada
- [ ] Frontend actualizado para usar endpoint real (eliminar mock)

---

## 🚨 Notas Importantes

1. **CRÍTICO:** El pepper NO debe ser accesible sin autenticación
2. **CRÍTICO:** El pepper debe estar encriptado en reposo
3. **IMPORTANTE:** Implementar rate limiting para prevenir ataques
4. **RECOMENDADO:** Usar servicio de gestión de secretos (KMS, Vault)
5. **RECOMENDADO:** Rotación periódica de pepper

---

**Prioridad:** 🔴 **CRÍTICO** - Bloquea producción  
**Estimación:** 2-3 días (backend)

