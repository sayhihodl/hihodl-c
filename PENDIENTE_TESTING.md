# 🧪 Pendiente de Testing - Checklist Completo

**Fecha:** 2024-11-02  
**Estado:** Frontend implementado, pendiente de testear con backend real

---

## ✅ Tests Existentes (Ya implementados)

### Tests Unitarios ✅
- ✅ `__tests__/lib/crypto.test.ts` - Funciones críticas de cifrado
- ✅ `__tests__/lib/vault.test.ts` - Vault creation/unlock
- ✅ `__tests__/store/auth.test.ts` - Auth store (Zustand)
- ✅ `__tests__/utils/auth-errors.test.ts` - Error normalization
- ✅ `__tests__/auth/recovery.test.ts` - Account recovery
- ✅ `__tests__/components/ErrorBoundary.test.tsx` - Error boundaries
- ✅ `__tests__/hooks/useAuthGuard.test.tsx` - Auth guards
- ✅ `__tests__/auth/vault-passkey.test.ts` - Integración vault-passkey

---

## ⏳ PENDIENTE DE TESTEAR (Frontend Implementado)

### 🔐 Autenticación - Flujos Completos

#### Email/Password ✅ Implementado | ⏳ Pendiente Testear
- [ ] **Signup completo:**
  - [ ] Registro con email válido
  - [ ] Validación de email inválido
  - [ ] Email ya registrado
  - [ ] Contraseña débil
  - [ ] Confirmación de email enviada

- [ ] **Login completo:**
  - [ ] Login con credenciales correctas
  - [ ] Login con email incorrecto
  - [ ] Login con contraseña incorrecta
  - [ ] Email no verificado
  - [ ] Usuario no existe
  - [ ] Rate limiting (si está implementado)

- [ ] **Password Reset:**
  - [ ] Solicitar reset con email válido
  - [ ] Solicitar reset con email inexistente
  - [ ] Actualizar contraseña con token válido
  - [ ] Actualizar contraseña con token expirado
  - [ ] Actualizar contraseña con token inválido

#### OAuth ✅ Implementado | ⏳ Pendiente Testear
- [ ] **Google OAuth:**
  - [ ] Login exitoso con Google
  - [ ] Cancelación de login
  - [ ] Manejo de errores

- [ ] **Apple OAuth (iOS):**
  - [ ] Login exitoso con Apple
  - [ ] Cancelación de login
  - [ ] Manejo de errores

#### Passkeys ✅ Implementado | ⏳ Pendiente Testear (Requiere Backend)
- [ ] **Registro de Passkey:**
  - [ ] Registro exitoso en web
  - [ ] Registro durante onboarding
  - [ ] Múltiples passkeys por usuario
  - [ ] Cancelación durante registro
  - [ ] Error si dispositivo no soporta

- [ ] **Login con Passkey:**
  - [ ] Login exitoso con passkey
  - [ ] Selección de passkey correcto
  - [ ] Error si passkey no encontrado
  - [ ] Cancelación durante login

- [ ] **Gestión de Passkeys:**
  - [ ] Listar passkeys del usuario
  - [ ] Eliminar passkey
  - [ ] Error al eliminar passkey inexistente

#### Session Management ✅ Implementado | ⏳ Pendiente Testear
- [ ] **Auto-refresh de sesión:**
  - [ ] Refresh automático antes de expirar
  - [ ] Manejo de refresh fallido
  - [ ] Logout automático si refresh falla

- [ ] **Logout:**
  - [ ] Logout exitoso
  - [ ] Limpieza de tokens
  - [ ] Redirección correcta

- [ ] **Session persistence:**
  - [ ] Session persiste después de cerrar app
  - [ ] Session válida después de reiniciar app
  - [ ] Session expirada requiere login

---

### 🔒 Seguridad - Funcionalidades Implementadas

#### Vault ✅ Implementado | ⏳ Pendiente Testear
- [ ] **Creación de Vault:**
  - [ ] Creación durante onboarding
  - [ ] Creación con passphrase segura
  - [ ] Error con passphrase débil
  - [ ] Integración con passkey (creación)

- [ ] **Unlock de Vault:**
  - [ ] Unlock con passphrase correcta
  - [ ] Unlock con passphrase incorrecta
  - [ ] Unlock con passkey (si está configurado)
  - [ ] Error después de múltiples intentos fallidos

- [ ] **Cambio de Passphrase:**
  - [ ] Cambio exitoso
  - [ ] Validación de passphrase actual
  - [ ] Error con passphrase actual incorrecta

- [ ] **Pepper Integration:**
  - [ ] Obtener pepper desde backend (cuando esté listo)
  - [ ] Fallback si backend no disponible (dev)
  - [ ] Error en producción sin backend

#### PIN ✅ Implementado | ⏳ Pendiente Testear
- [ ] **Creación/Actualización:**
  - [ ] Guardar PIN hasheado con scrypt
  - [ ] Validación de PIN (4-6 dígitos)
  - [ ] Requiere autenticación biométrica para acceder

- [ ] **Verificación:**
  - [ ] Verificación correcta
  - [ ] Error con PIN incorrecto
  - [ ] Rate limiting de intentos

---

### 🎨 Dashboard - Componentes Refactorizados

#### Funcionalidad Principal ✅ Implementado | ⏳ Pendiente Testear
- [ ] **Carga de datos:**
  - [ ] Carga de balances
  - [ ] Carga de tokens
  - [ ] Carga de payments
  - [ ] Manejo de errores de carga
  - [ ] Loading states

- [ ] **Navegación de cuentas:**
  - [ ] Cambio entre daily/savings/social
  - [ ] Sincronización con URL
  - [ ] Persistencia de cuenta seleccionada

- [ ] **Display de tokens:**
  - [ ] Modo agregado (aggregated)
  - [ ] Modo separado (split)
  - [ ] Filtro de dust
  - [ ] Ordenamiento correcto

- [ ] **Interacciones:**
  - [ ] Tap en token → navegar a detalle
  - [ ] Pull to refresh
  - [ ] Scroll infinito (si aplica)
  - [ ] Abrir sheets (tx, add token)

#### Componentes Extraídos ✅ Implementado | ⏳ Pendiente Testear
- [ ] **DashboardHeader:**
  - [ ] Scroll effects funcionan
  - [ ] BlurView animations
  - [ ] Navegación correcta

- [ ] **HeroSection:**
  - [ ] Balance display correcto
  - [ ] SegmentedPills funcionan
  - [ ] Mini actions funcionan

- [ ] **TokenList:**
  - [ ] Renderizado correcto de tokens
  - [ ] Separadores correctos
  - [ ] Performance aceptable

- [ ] **PaymentList:**
  - [ ] Renderizado correcto de payments
  - [ ] Avatars funcionan
  - [ ] Navegación a detalles

---

### 💰 Payments - Componentes Refactorizados

#### PaymentsThread ✅ Refactorizado | ⏳ Pendiente Testear
- [ ] **Funcionalidad básica:**
  - [ ] Carga de threads
  - [ ] Display de mensajes
  - [ ] Filtrado y búsqueda
  - [ ] Polling de actualizaciones

- [ ] **Interacciones:**
  - [ ] Tap en payment → detalles
  - [ ] Remind request
  - [ ] Marcar como pagado
  - [ ] Enviar payment

#### QuickSendScreen ✅ Refactorizado | ⏳ Pendiente Testear
- [ ] **Flujo de envío:**
  - [ ] Selección de destinatario
  - [ ] Selección de token
  - [ ] Ingreso de cantidad
  - [ ] Validación de balance
  - [ ] Envío exitoso
  - [ ] Manejo de errores

- [ ] **Features avanzadas:**
  - [ ] Auto-bridge
  - [ ] Múltiples chains
  - [ ] Validación de fees

---

### 🔄 Integración Frontend-Backend

#### Endpoints Críticos ⏳ Pendiente Implementar y Testear
- [ ] **Auth:**
  - [ ] `POST /auth/supabase/verify` - Verificar token
  - [ ] `POST /auth/refresh` - Refresh token
  - [ ] `POST /api/passkeys/*` - Endpoints de passkeys

- [ ] **Security:**
  - [ ] `GET /api/security/pepper` - Obtener pepper

- [ ] **User:**
  - [ ] `GET /me` - Perfil del usuario
  - [ ] `PATCH /me` - Actualizar perfil

#### Database ⏳ Pendiente Ejecutar y Testear
- [ ] **Supabase Schema:**
  - [ ] Tabla `vaults` creada y funcionando
  - [ ] Tabla `passkeys` creada y funcionando
  - [ ] Tabla `analytics_events` creada
  - [ ] RLS policies funcionando

---

### 🐛 Edge Cases y Errores

#### Errores de Red ✅ Implementado | ⏳ Pendiente Testear
- [ ] Sin conexión a internet
- [ ] Timeout de requests
- [ ] Error 500 del servidor
- [ ] Error 401 (no autorizado)
- [ ] Error 403 (prohibido)
- [ ] Error 404 (no encontrado)
- [ ] Rate limiting (429)

#### Errores de Autenticación ✅ Implementado | ⏳ Pendiente Testear
- [ ] Token expirado
- [ ] Token inválido
- [ ] Sesión revocada
- [ ] Usuario eliminado
- [ ] Email no verificado

#### Errores de Validación ✅ Implementado | ⏳ Pendiente Testear
- [ ] Email inválido
- [ ] Contraseña débil
- [ ] Cantidad inválida en payments
- [ ] Dirección de wallet inválida
- [ ] Balance insuficiente

---

### 📱 Plataformas Específicas

#### Web ✅ Implementado | ⏳ Pendiente Testear
- [ ] Passkeys funcionan en Chrome
- [ ] Passkeys funcionan en Safari
- [ ] Passkeys funcionan en Firefox
- [ ] OAuth funciona en todos los navegadores
- [ ] Responsive design funciona

#### iOS ✅ Implementado | ⏳ Pendiente Testear
- [ ] Face ID funciona
- [ ] Apple OAuth funciona
- [ ] Push notifications (si implementado)
- [ ] Deep links funcionan
- [ ] SecureStore funciona

#### Android ✅ Implementado | ⏳ Pendiente Testear
- [ ] Fingerprint funciona
- [ ] Google OAuth funciona
- [ ] Push notifications (si implementado)
- [ ] Deep links funcionan
- [ ] SecureStore funciona

---

## 🎯 Priorización de Testing

### Prioridad CRÍTICA (Antes de Producción)
1. ⏳ Flujos de autenticación completos (email, OAuth)
2. ⏳ Passkeys (cuando backend esté listo)
3. ⏳ Vault creation/unlock
4. ⏳ Session management (refresh, logout)
5. ⏳ Integración frontend-backend básica

### Prioridad ALTA (Antes de Release)
6. ⏳ Dashboard completo (carga, navegación, display)
7. ⏳ PaymentsThread completo
8. ⏳ QuickSendScreen completo
9. ⏳ Manejo de errores en todos los flujos
10. ⏳ Testing en devices físicos (iOS y Android)

### Prioridad MEDIA (Mejora continua)
11. ⏳ Edge cases y casos límite
12. ⏳ Performance testing
13. ⏳ Accessibility testing
14. ⏳ Cross-platform testing

---

## 📝 Notas

### Tests Unitarios
Los tests unitarios básicos ya existen para funciones críticas. Falta:
- Tests de integración para flujos completos
- Tests E2E para user journeys
- Tests de componentes con React Testing Library

### Ambiente de Testing
- **Local:** Jest + React Testing Library (ya configurado)
- **Integration:** Requiere backend Supabase configurado
- **E2E:** Pendiente configurar (Detox o similar)

### Cobertura Objetivo
- **Crítico:** 80%+ (auth, vault, security)
- **Importante:** 60%+ (dashboard, payments)
- **General:** 50%+ (resto del código)

---

**Estado:** ⏳ **Frontend implementado, pendiente de testear con backend real**  
**Próximos pasos:** Configurar backend Supabase → Testing de integración → Testing E2E
