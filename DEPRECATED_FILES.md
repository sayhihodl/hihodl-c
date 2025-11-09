# ⚠️ Archivos Deprecados

## 📋 Archivos Legacy (No Usar)

Estos archivos están deprecados y deben ser reemplazados por las nuevas implementaciones con Supabase.

### 1. `src/store/useAuth.ts` ❌ DEPRECATED
**Reemplazado por:** `src/store/auth.ts`

**Razón:** Usa Firebase Auth, ya migramos a Supabase.

**Acción:**
- Usar `useAuth()` de `@/store/auth` en su lugar
- Este archivo puede ser eliminado después de migrar todas las referencias

---

### 2. `src/auth/social.ts` ❌ DEPRECATED  
**Reemplazado por:** `src/auth/oauth.ts`

**Razón:** Implementación antigua con sistema mockeado.

**Acción:**
- Usar `signInWithGoogle()` y `signInWithApple()` de `@/auth/oauth`
- Este archivo mantiene compatibilidad pero se debe migrar

---

### 3. `src/lib/firebase.ts` ⚠️ PARCIALMENTE DEPRECATED
**Estado:** Todavía usado por algunos componentes legacy

**Razón:** Migramos a Supabase, pero algunos componentes pueden aún referenciarlo.

**Acción:**
- Buscar referencias y migrarlas
- Puede mantenerse para analytics si es necesario
- **No usar para autenticación**

---

## 🔄 Guía de Migración

### Reemplazar useAuth (Firebase):

**Antes:**
```typescript
import { useAuth } from '@/store/useAuth';
const { user, ready } = useAuth();
```

**Ahora:**
```typescript
import { useAuth } from '@/store/auth';
const { user, session, isAuthenticated, ready } = useAuth();
```

### Reemplazar OAuth (social.ts):

**Antes:**
```typescript
import { useGoogleSignIn, signInWithApple } from '@/auth/social';
const { signIn } = useGoogleSignIn();
await signInWithApple();
```

**Ahora:**
```typescript
import { signInWithGoogle, signInWithApple } from '@/auth/oauth';
await signInWithGoogle();
await signInWithApple();
```

---

## ✅ Archivos Actuales (Usar Estos)

### Authentication:
- ✅ `src/store/auth.ts` - Store principal de autenticación
- ✅ `src/auth/email.ts` - Email/password auth
- ✅ `src/auth/oauth.ts` - OAuth (Google/Apple)
- ✅ `src/auth/passkeys.ts` - Passkeys
- ✅ `src/auth/recovery.ts` - Account recovery
- ✅ `src/auth/vault-passkey.ts` - Vault integration

### Utilities:
- ✅ `src/lib/apiAuth.ts` - API auth helpers
- ✅ `src/lib/supabase.ts` - Supabase client
- ✅ `src/hooks/useAuthGuard.ts` - Route guards
- ✅ `src/utils/auth-errors.ts` - Error handling
- ✅ `src/components/AuthErrorBoundary.tsx` - Error boundary

---

## 🗑️ Plan de Eliminación

### Fase 1 (Inmediato):
- [ ] Buscar todas las referencias a `@/store/useAuth`
- [ ] Migrar a `@/store/auth`
- [ ] Buscar referencias a `@/auth/social`
- [ ] Migrar a `@/auth/oauth`

### Fase 2 (Después de migración):
- [ ] Eliminar `src/store/useAuth.ts`
- [ ] Eliminar o marcar `src/auth/social.ts`
- [ ] Evaluar si `src/lib/firebase.ts` aún es necesario

### Fase 3 (Limpieza final):
- [ ] Remover dependencias de Firebase Auth si ya no se usan
- [ ] Actualizar documentación
- [ ] Limpiar imports no usados

---

**Nota:** Los archivos deprecados se mantienen temporalmente para compatibilidad hacia atrás, pero no deben usarse en código nuevo.
