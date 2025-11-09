# 📋 Sistema de Suscripciones - Flujo Completo

**Última actualización:** 2024  
**Estado:** ✅ Implementado (con mejoras pendientes)

---

## 🎯 Resumen Ejecutivo

Este documento explica **cómo funciona el sistema de suscripciones** en HiHODL, incluyendo:
- Qué pasa cuando un usuario cambia de suscripción
- Cómo se actualizan los planes
- Cómo funciona el cobro (NO hay smart contracts)
- Cómo se muestra el plan actual al usuario

---

## 🔄 Flujo de Cambio de Suscripción

### 1. **Usuario Selecciona un Plan**

Cuando el usuario navega a la pantalla de planes (`app/(drawer)/(internal)/(paywall)/plans.tsx`):
- Ve todos los planes disponibles (Standard, Plus, Premium, Metal)
- Su plan actual se muestra con el texto **"You're on this plan"**
- Puede hacer scroll horizontal entre los planes
- Al hacer clic en "Join Plus" o "Join Premium", navega al checkout

### 2. **Checkout y Confirmación** (`checkout.tsx`)

Cuando el usuario confirma la suscripción:

```typescript
// 1. Crear la suscripción en el backend
const subscription = await createSubscription({
  planId: plan.id, // 'standard' | 'plus' | 'premium' | 'metal'
  kycData: requiresKYC ? {
    fullName: kycData.fullName,
    address: kycData.address,
    city: kycData.city,
    country: kycData.country,
    postalCode: kycData.postalCode,
    idDocument: kycData.idDocument || undefined,
  } : undefined,
});

// 2. Activar el plan
await activatePlan({ planId: plan.id });

// 3. Refrescar el usuario para obtener el plan actualizado
refetchUser();
```

**Endpoints del backend:**
- `POST /subscriptions/create` - Crea la suscripción
- `POST /plans/activate` - Activa el plan para el usuario

### 3. **Actualización del Plan**

**Backend:**
- El endpoint `/plans/activate` actualiza el campo `plan` en el perfil del usuario
- El plan se guarda en la base de datos asociado al usuario

**Frontend:**
- Después de activar, se llama a `refetchUser()` que hace `GET /me`
- El endpoint `/me` devuelve el usuario con su plan actualizado:
  ```json
  {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "profile": {
        "plan": "plus"  // ← Plan actualizado
      }
    }
  }
  ```
- El hook `useUser()` actualiza el estado global con el nuevo plan
- La UI se actualiza automáticamente porque usa `useUser()`

---

## 💳 Sistema de Cobro

### ⚠️ **Estado Actual: Proceso Manual (Temporal)**

Actualmente el sistema usa un **proceso manual/administrativo**:

1. **Proceso Manual/Administrativo (Actual):**
   - Cuando el usuario confirma la suscripción, se crea un registro en el backend
   - El backend marca la suscripción como `status: 'pending'` o `status: 'active'`
   - **El equipo de HiHODL contacta al usuario** para completar el pago
   - Esto se muestra en el checkout:
     ```
     "Since we handle payments internally, our team will contact you 
     shortly after subscription activation to complete the payment process."
     ```

2. **KYC Requerido:**
   - Para planes de pago (Plus, Premium), se requiere verificación de identidad (KYC)
   - El usuario completa un formulario con:
     - Nombre completo
     - Dirección
     - Ciudad
     - Código postal
     - País
     - Documento de identidad (opcional)

3. **Código de Error 402:**
   - Si el backend devuelve `402 Payment Required`, significa que el pago aún no está completo
   - Se muestra un mensaje: "Please complete payment to activate your subscription"

### ✅ **Recomendación: Integrar Stripe para Cobros Automáticos**

**SÍ, deberían integrar Stripe directamente.** Es la mejor opción porque:

- ✅ **Cobros automáticos recurrentes** (mensuales)
- ✅ **Manejo automático de fallos** (Stripe reintenta)
- ✅ **No requiere contacto manual** con usuarios
- ✅ **PCI Compliance incluido** (no manejas datos de tarjetas)
- ✅ **Dashboard completo** para ver pagos y suscripciones
- ✅ **Webhooks automáticos** para actualizar estado

**Ver guía completa:** `STRIPE_INTEGRATION_GUIDE.md`

### 🔮 **Otras Opciones (Futuro)**

1. **Opción B: Smart Contract (Solana/Blockchain)**
   - Crear un programa en Solana que maneje suscripciones
   - El usuario autoriza un cargo recurrente desde su wallet
   - El contrato cobra automáticamente cada mes
   - **Desventaja:** Requiere que el usuario tenga fondos en su wallet

2. **Opción C: Híbrido**
   - Stripe para usuarios tradicionales
   - Smart contract para usuarios crypto-nativos

**Recomendación:** Empezar con Stripe para facilitar la adopción, luego agregar opción crypto.

---

## 📱 Mostrar Plan Actual al Usuario

### Cómo Funciona Actualmente

1. **Hook `useUser()`:**
   ```typescript
   const { user } = useUser();
   const currentPlanId = user?.profile?.plan || "standard";
   ```

2. **Pantalla de Planes (`plans.tsx`):**
   - Usa `useCurrentPlanId()` que obtiene el plan del usuario
   - Compara `plan.id === currentPlanId`
   - Si coincide, muestra: **"You're on this plan"**

3. **Menú (`menu/index.tsx`):**
   - Muestra el nombre del plan actual:
     ```typescript
     const currentPlanId = user?.profile?.plan || "standard";
     const planNameMap = {
       free: "Standard",
       standard: "Standard",
       plus: "Plus",
       premium: "Premium",
       pro: "Premium",
       metal: "Metal",
     };
     const currentPlanName = planNameMap[currentPlanId] || "Standard";
     ```

### Ejemplo: Cambio de Standard a Premium

1. **Usuario está en Standard:**
   - Ve "You're on this plan" en la pestaña Standard
   - En el menú ve "Standard"

2. **Usuario hace clic en "Join Premium":**
   - Navega a checkout
   - Completa KYC (si es necesario)
   - Confirma la suscripción

3. **Después de confirmar:**
   - Backend actualiza `user.profile.plan = "premium"`
   - Frontend refresca con `refetchUser()`
   - La UI se actualiza automáticamente
   - Ahora ve "You're on this plan" en Premium
   - En el menú ve "Premium"

---

## 🔧 Implementación Técnica

### Archivos Clave

1. **`src/services/api/plans.service.ts`**
   - `listPlans()` - Obtiene todos los planes disponibles
   - `createSubscription()` - Crea la suscripción
   - `activatePlan()` - Activa el plan

2. **`app/(drawer)/(internal)/(paywall)/checkout.tsx`**
   - Pantalla de confirmación
   - Maneja KYC y activación

3. **`app/(drawer)/(internal)/(paywall)/plans.tsx`**
   - Pantalla de selección de planes
   - Muestra plan actual

4. **`src/hooks/useUser.ts`**
   - Hook para obtener usuario actual
   - Incluye `refresh()` para actualizar después de cambios

5. **`src/types/api.ts`**
   - Tipos TypeScript para planes y suscripciones

### Tipos de Plan

```typescript
type PlanId = "standard" | "plus" | "premium" | "metal";

interface Plan {
  id: PlanId;
  name: string;
  priceMonthlyEUR: number;
  perks: string[];
}
```

### Mapeo Backend ↔ Frontend

El backend puede usar diferentes nombres:
- `free` → Frontend: `standard`
- `standard` → Frontend: `standard`
- `plus` → Frontend: `plus`
- `premium` o `pro` → Frontend: `premium`
- `metal` → Frontend: `metal`

---

## ✅ Checklist de Funcionalidad

### Cuando un Usuario Cambia de Plan:

- [x] Se crea la suscripción en el backend (`createSubscription`)
- [x] Se activa el plan (`activatePlan`)
- [x] Se refresca el usuario (`refetchUser`)
- [x] La UI se actualiza automáticamente
- [x] Se muestra el plan actual correctamente
- [x] Se requiere KYC para planes de pago
- [ ] ⚠️ **PENDIENTE:** Sistema de pago automático (actualmente manual)

### Mostrar Plan Actual:

- [x] Hook `useUser()` obtiene el plan del backend
- [x] Pantalla de planes muestra "You're on this plan"
- [x] Menú muestra el nombre del plan
- [x] Mapeo correcto entre backend y frontend

---

## 🐛 Bugs Conocidos y Mejoras

### ✅ **ARREGLADO:** `useCurrentPlanId()` estaba hardcodeado

**Antes:**
```typescript
function useCurrentPlanId(): Plan["id"] | undefined {
  return "standard"; // demo ← BUG!
}
```

**Después:**
```typescript
function useCurrentPlanId(): Plan["id"] | undefined {
  const { user } = useUser();
  const planMap: Record<string, Plan["id"]> = {
    free: "standard",
    standard: "standard",
    plus: "plus",
    premium: "premium",
    pro: "premium",
    metal: "metal",
  };
  const backendPlan = user?.profile?.plan || "standard";
  return planMap[backendPlan] || "standard";
}
```

### Mejoras Pendientes:

1. **Sistema de Pago Automático:**
   - Integrar Stripe o similar
   - Implementar webhooks para actualizar estado
   - Manejar fallos de pago

2. **Notificaciones:**
   - Notificar cuando el plan está por expirar
   - Recordar renovación

3. **Historial de Cambios:**
   - Guardar historial de cambios de plan
   - Mostrar fecha de activación

4. **Downgrade:**
   - Permitir cambiar a un plan inferior
   - Manejar prorrateo si aplica

---

## 📝 Resumen de Preguntas

### ❓ ¿Qué pasa cuando un usuario cambia de suscripción?

1. Usuario selecciona nuevo plan
2. Completa checkout (KYC si es necesario)
3. Backend crea suscripción y activa plan
4. Frontend refresca usuario
5. UI se actualiza automáticamente

### ❓ ¿Los planes se actualizan?

**Sí**, automáticamente:
- Backend actualiza `user.profile.plan`
- Frontend refresca con `refetchUser()`
- UI re-renderiza con nuevo plan

### ❓ ¿Qué acción hay cuando se subscribe?

1. `createSubscription()` - Crea registro
2. `activatePlan()` - Activa el plan
3. `refetchUser()` - Actualiza UI
4. Muestra alerta de éxito

### ❓ ¿Necesitamos smart contract para cobrar automáticamente?

**No**, actualmente:
- El sistema es **manual/administrativo**
- El equipo contacta al usuario para completar pago
- **Futuro:** Se puede integrar Stripe o smart contract

### ❓ ¿Cómo le enseñamos el plan actual?

- Pantalla de planes: "You're on this plan"
- Menú: Muestra nombre del plan (Standard/Plus/Premium)
- Hook `useUser()` obtiene plan del backend
- Se actualiza automáticamente después de cambios

### ❓ Ejemplo: Standard → Premium

1. Usuario en Standard ve "You're on this plan"
2. Selecciona Premium → Checkout
3. Confirma → Backend actualiza a Premium
4. Frontend refresca → Ahora ve "You're on this plan" en Premium
5. Menú muestra "Premium"

---

## 🔗 Referencias

- `BACKEND_PLANS_SPEC.md` - Especificaciones del backend
- `PLANS_UPGRADE_IMPROVEMENTS.md` - Mejoras de UX/UI
- `API_ENDPOINTS_FRONTEND_GUIDE.md` - Guía de endpoints

---

**Última revisión:** 2024  
**Mantenido por:** Equipo de Desarrollo HiHODL

