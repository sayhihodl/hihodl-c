# 🎯 Backend Plans Specification - HiHODL

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation

---

## 📋 Executive Summary

This document defines the complete business logic and technical specifications for HiHODL's subscription plans system. It serves as the single source of truth for backend implementation, ensuring alignment between frontend and backend.

### Key Decisions Confirmed:
- ✅ **Gasless Model**: Phantom-style (automatic, no visible credit limits)
- ✅ **Transfer Fees**: Only on gasless transfers (Standard: 0.25%, Plus: 0.1%, Premium: 0%)
- ✅ **Address Rotation**: Standard (none), Plus (manual, 10 addresses), Premium (auto, 50 addresses)
- ✅ **StableCard**: Available in all plans with tiered features (Standard: basic, Plus: enhanced, Premium: premium) - all "Coming soon"
- ✅ **Metal Plan**: All features "Coming Soon" (not available yet)
- ✅ **Swap Fees**: Complex structure with Jupiter fee + HiHODL markup + premium gasless fee
- ✅ **Fees Display**: Not shown in app (tooltips only), shown at transaction time

### Document Alignment:
- ✅ Unified with `PLANS_UPGRADE_IMPROVEMENTS.md` (frontend guide)
- ✅ Unified with `app/(drawer)/(internal)/(paywall)/plans.tsx` (implementation)

### Pending Decisions:
- ⚠️ **Daily Limit**: Still under discussion (Option A: No limits, Option B: Soft limits for fraud, Option C: Differentiated by plan)

---

## 🏗️ Plan Structure

### Plan IDs
```typescript
type PlanId = "standard" | "plus" | "premium" | "metal";
```

### Plan Data Model

```typescript
interface Plan {
  id: PlanId;
  name: string;
  title: string;
  priceMonthlyUSD: number;
  priceMonthlyEUR: number;
  highlight: boolean;
  comingSoon?: boolean; // Only for Metal plan
  
  // Limits (internal use, not shown to users)
  limits: {
    // Internal cost controls may exist but not shown to users
    // No visible "gasless credit" or monthly limits
  };
  
  // Configuration
  config: {
    addressPoolSize: number;        // 0 = no rotation, 10 = manual, 50 = auto
    gaslessMode: string;            // Internal: "net-deduction" | "partial-sponsor" | "full-sponsor"
    gaslessTransferFee: number;      // Fee percentage (0.0025 = 0.25%)
    swapMarkupBase: number;          // Base swap markup (0.0035 = 0.35%)
    swapPremiumGasless: number;     // Premium gasless fee (0.0025 = 0.25%)
    wallets: number;                // -1 = unlimited
    aliasType: "basic" | "custom" | "premium";
  };
  
  // Rate Limits (for abuse prevention, technical limits)
  rateLimits: {
    rotation: number;   // Per day
    relayer: number;    // Per day
    transfer: number;   // Per day
    quote: number;      // Per day
  };
  
  // Features (for comparison table)
  features: Feature[];
}

interface Feature {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  included: boolean;
  tooltip?: string;
  value?: string; // For features with specific values (e.g., "3", "10", "Unlimited")
}
```

---

## 📊 Plan Specifications

### Standard Plan

```typescript
{
  id: "standard",
  name: "Standard",
  title: "Start your crypto journey",
  priceMonthlyUSD: 0,
  priceMonthlyEUR: 0,
  highlight: false,
  
  limits: {},
  
  config: {
    addressPoolSize: 0,              // No address rotation
    gaslessMode: "net-deduction",    // Internal implementation
    gaslessTransferFee: 0.0025,     // 0.25% fee on gasless transfers
    swapMarkupBase: 0.0035,         // 0.35% swap markup base
    swapPremiumGasless: 0.0025,     // +0.25% premium gasless fee
    wallets: 3,
    aliasType: "basic",
  },
  
  rateLimits: {
    rotation: 10,
    relayer: 20,
    transfer: 5,
    quote: 30,
  },
  
  // Features for comparison table
  features: [
    {
      id: "gasless_transfers",
      label: "Gasless Transfers",
      description: "Available automatically (min $1)",
      included: true,
    },
    {
      id: "address_rotation",
      label: "Address Rotation",
      description: "Not available",
      included: false,
    },
    {
      id: "wallets",
      label: "Wallets",
      description: "3 wallets",
      value: "3",
      included: true,
    },
    {
      id: "alias_type",
      label: "Alias Type",
      description: "Basic (@username)",
      value: "Basic",
      included: true,
    },
    {
      id: "support",
      label: "Support",
      description: "Community support",
      value: "Community",
      included: true,
    },
    {
      id: "stablecard",
      label: "StableCard",
      description: "Coming soon",
      value: "Coming soon",
      included: false,
    },
  ],
}
```

### Plus Plan

```typescript
{
  id: "plus",
  name: "Plus",
  title: "Level up your experience",
  priceMonthlyUSD: 4.99,
  priceMonthlyEUR: 4.99,
  highlight: true,
  
  limits: {},
  
  config: {
    addressPoolSize: 10,             // Manual rotation (10 addresses)
    gaslessMode: "partial-sponsor",  // Internal implementation
    gaslessTransferFee: 0.001,       // 0.1% fee on gasless transfers
    swapMarkupBase: 0.0025,         // 0.25% swap markup base
    swapPremiumGasless: 0.0020,     // +0.20% premium gasless fee
    wallets: 10,
    aliasType: "custom",
  },
  
  rateLimits: {
    rotation: 50,
    relayer: 100,
    transfer: 20,
    quote: 100,
  },
  
  // Features for comparison table
  features: [
    {
      id: "gasless_transfers",
      label: "Gasless Transfers",
      description: "Available automatically (min $1)",
      included: true,
    },
    {
      id: "address_rotation",
      label: "Address Rotation",
      description: "Manual (10 addresses)",
      value: "Manual (10)",
      included: true,
    },
    {
      id: "wallets",
      label: "Wallets",
      description: "10 wallets",
      value: "10",
      included: true,
    },
    {
      id: "alias_type",
      label: "Alias Type",
      description: "Custom alias",
      value: "Custom",
      included: true,
    },
    {
      id: "support",
      label: "Support",
      description: "Email support",
      value: "Email",
      included: true,
    },
    {
      id: "stablecard",
      label: "StableCard Plus",
      description: "Coming soon",
      value: "Coming soon",
      included: false,
    },
  ],
}
```

### Premium Plan

```typescript
{
  id: "premium",
  name: "Premium",
  title: "Maximum power and privacy",
  priceMonthlyUSD: 9.99,
  priceMonthlyEUR: 9.99,
  highlight: true,
  
  limits: {},
  
  config: {
    addressPoolSize: 50,            // Automatic rotation (50 addresses)
    gaslessMode: "full-sponsor",     // Internal implementation
    gaslessTransferFee: 0,           // 0% fee (no fee)
    swapMarkupBase: 0,              // 0% swap markup base
    swapPremiumGasless: 0.0010,     // +0.10% premium gasless fee (only for gasless)
    wallets: -1,                    // Unlimited
    aliasType: "premium",
  },
  
  rateLimits: {
    rotation: 200,
    relayer: 500,
    transfer: 100,
    quote: 500,
  },
  
  // Features for comparison table
  features: [
    {
      id: "gasless_transfers",
      label: "Gasless Transfers",
      description: "Available automatically (min $1)",
      included: true,
    },
    {
      id: "address_rotation",
      label: "Address Rotation",
      description: "Automatic (50 addresses)",
      value: "Automatic (50)",
      included: true,
    },
    {
      id: "wallets",
      label: "Wallets",
      description: "Unlimited sub-wallets",
      value: "Unlimited",
      included: true,
    },
    {
      id: "alias_type",
      label: "Alias Type",
      description: "Premium (3 handles)",
      value: "Premium (3)",
      included: true,
    },
    {
      id: "support",
      label: "Support",
      description: "Priority support",
      value: "Priority",
      included: true,
    },
    {
      id: "stablecard",
      label: "StableCard Premium",
      description: "Coming soon",
      value: "Coming soon",
      included: false,
    },
  ],
}
```

### Metal Plan (Coming Soon)

```typescript
{
  id: "metal",
  name: "Metal",
  title: "Coming Soon",
  priceMonthlyUSD: 0,               // Coming Soon
  priceMonthlyEUR: 0,               // Coming Soon
  highlight: true,
  comingSoon: true,                 // Not available yet
  
  limits: {},
  
  config: {
    addressPoolSize: 0,             // Coming Soon
    gaslessMode: "full-sponsor",     // Coming Soon
    gaslessTransferFee: 0,          // Coming Soon
    swapMarkupBase: 0,             // Coming Soon
    swapPremiumGasless: 0,         // Coming Soon
    wallets: 0,                    // Coming Soon
    aliasType: "premium",          // Coming Soon
  },
  
  rateLimits: {
    rotation: 0,                   // Coming Soon
    relayer: -1,                   // Unlimited (when available)
    transfer: -1,                  // Unlimited (when available)
    quote: -1,                     // Unlimited (when available)
  },
  
  // Features for comparison table (all Coming Soon)
  features: [
    {
      id: "gasless_transfers",
      label: "Gasless Transfers",
      description: "Coming Soon",
      included: false,
      value: "Coming Soon",
    },
    {
      id: "address_rotation",
      label: "Address Rotation",
      description: "Coming Soon",
      included: false,
      value: "Coming Soon",
    },
    {
      id: "wallets",
      label: "Wallets",
      description: "Coming Soon",
      included: false,
      value: "Coming Soon",
    },
    {
      id: "alias_type",
      label: "Alias Type",
      description: "Coming Soon",
      included: false,
      value: "Coming Soon",
    },
    {
      id: "support",
      label: "Support",
      description: "Coming Soon",
      included: false,
      value: "Coming Soon",
    },
  ],
}
```

---

## 💰 Fee Structure

### Gasless Transfer Fees

**Important:** Fees only apply to **gasless transfers**. Non-gasless transfers only pay network fees.

| Plan | Transfer Fee | Notes |
|------|-------------|-------|
| Standard | 0.25% | Applied to gasless transfers only |
| Plus | 0.1% | Applied to gasless transfers only |
| Premium | 0% | No fee (free gasless transfers) |
| Metal | Coming Soon | TBD |

**Minimum Transaction Value:** $1 USD (for gasless eligibility)

**Calculation:**
```typescript
function calculateGaslessTransferFee(
  amountUSD: number,
  planId: PlanId
): number {
  const plan = PLANS[planId];
  if (plan.config.gaslessTransferFee === 0) return 0;
  
  return amountUSD * plan.config.gaslessTransferFee;
}

// Example: $100 transfer on Standard plan
// Fee = $100 × 0.0025 = $0.25
```

---

### Swap Fees

**Complex Structure:** Swap fees consist of multiple components.

#### Fee Components

1. **Jupiter Fee**: ~0.85% (already deducted from quote)
2. **HiHODL Markup Base**: Varies by plan
3. **Premium Gasless Fee**: Additional fee for gasless swaps

#### Fee Breakdown by Plan

| Plan | Jupiter Fee | Markup Base | Premium Gasless | Total HiHODL | **Total Final** |
|------|-------------|-------------|-----------------|--------------|-----------------|
| Standard | ~0.85% | 0.35% | +0.25% | 0.60% | **1.45%** |
| Plus | ~0.85% | 0.25% | +0.20% | 0.45% | **1.30%** |
| Premium | ~0.85% | 0% | +0.10% | 0.10% | **0.95%** |

**Important Notes:**
- **Normal Swaps** (with SOL): Only pay markup base (no premium gasless fee)
- **Gasless Swaps**: Pay markup base + premium gasless fee
- Jupiter fee is already deducted from the quote amount
- Premium plan has the lowest fees (0.95% total for gasless swaps)

#### Calculation Logic

```typescript
interface SwapFeeBreakdown {
  jupiterFee: number;        // Already deducted in quote
  markupBase: number;        // HiHODL markup base
  premiumGasless: number;    // Premium gasless fee (if gasless)
  totalHiHODL: number;       // Total HiHODL fees
  finalAmount: number;        // Amount user receives
}

function calculateSwapFees(
  jupiterQuoteAmount: number,  // Amount from Jupiter (already has Jupiter fee deducted)
  isGasless: boolean,
  planId: PlanId
): SwapFeeBreakdown {
  const plan = PLANS[planId];
  
  // Markup base (always applies)
  const markupBase = plan.config.swapMarkupBase;
  const markupBaseUSD = jupiterQuoteAmount * markupBase;
  
  // Premium gasless fee (only if gasless)
  const premiumGasless = isGasless ? plan.config.swapPremiumGasless : 0;
  const premiumGaslessUSD = jupiterQuoteAmount * premiumGasless;
  
  // Total HiHODL fees
  const totalHiHODLUSD = markupBaseUSD + premiumGaslessUSD;
  
  // Estimate Jupiter fee (already deducted in quote)
  const estimatedOriginalAmount = jupiterQuoteAmount / (1 - 0.0085);
  const jupiterFeeUSD = estimatedOriginalAmount - jupiterQuoteAmount;
  
  return {
    jupiterFee: jupiterFeeUSD,
    markupBase: markupBaseUSD,
    premiumGasless: premiumGaslessUSD,
    totalHiHODL: totalHiHODLUSD,
    finalAmount: jupiterQuoteAmount - totalHiHODLUSD,
  };
}
```

#### Example Calculation

**Scenario:** Standard Plan, Gasless Swap $100 USDC → SOL

```typescript
// 1. Jupiter quote: $99.15 SOL
//    (Already includes ~0.85% Jupiter fee = ~$0.85 deducted)

// 2. HiHODL Fees:
//    - Markup base: $99.15 × 0.0035 = $0.35
//    - Premium gasless: $99.15 × 0.0025 = $0.25
//    - Total HiHODL: $0.60

// 3. Final Amount:
//    You receive: $99.15 - $0.60 = $98.55 SOL

// 4. Total Fee Breakdown:
//    Jupiter fee: ~$0.85 (already deducted in quote)
//    HiHODL markup: $0.35
//    Premium gasless: $0.25
//    Total fee: ~$1.45 (1.45%)
```

---

## 🔄 Gasless Model (Phantom-Style)

### Key Principles

1. **Automatic Availability**: Gasless transfers available automatically (no user selection needed)
2. **No Visible Credit Limits**: Users don't see "gasless credit left" or monthly limits
3. **Fee-Based Differentiation**: Fees vary by plan (this is the differentiator)
4. **Minimum Transaction**: $1 USD minimum for gasless eligibility

### Gasless Modes (Internal Implementation)

**Note:** These are backend implementation details, NOT shown to users.

| Mode | Description | Used By |
|------|-------------|---------|
| `net-deduction` | Fee deducted from transaction amount | Standard |
| `partial-sponsor` | HiHODL sponsors part of gas | Plus |
| `full-sponsor` | HiHODL sponsors all gas | Premium, Metal |

### User-Facing Messaging

**What users see:**
- ✅ "Gasless transfers available automatically (minimum $1)"
- ✅ Fees shown at transaction time (not in plans screen)
- ✅ Tooltips show fees when user wants details

**What users DON'T see:**
- ❌ "Gasless credit left"
- ❌ "Gasless mode selection"
- ❌ Monthly credit limits
- ❌ Internal implementation details

---

## 🔐 Address Rotation

### Structure

| Plan | Rotation Type | Address Pool Size | Notes |
|------|--------------|-------------------|-------|
| Standard | None | 0 | Not available |
| Plus | Manual | 10 | User must manually rotate |
| Premium | Automatic | 50 | System rotates automatically |
| Metal | Coming Soon | 0 | TBD |

### Implementation

```typescript
interface AddressRotation {
  enabled: boolean;
  poolSize: number;
  mode: "manual" | "automatic";
  rotationLimit: number; // Per day (rate limit)
}

function getAddressRotation(planId: PlanId): AddressRotation {
  const plan = PLANS[planId];
  
  return {
    enabled: plan.config.addressPoolSize > 0,
    poolSize: plan.config.addressPoolSize,
    mode: plan.config.addressPoolSize === 10 ? "manual" : 
          plan.config.addressPoolSize === 50 ? "automatic" : "none",
    rotationLimit: plan.rateLimits.rotation,
  };
}
```

---

## 🚦 Rate Limits

### Purpose

Rate limits are **technical limits for abuse prevention**, not user-facing features. They should be implemented but not prominently displayed to users.

### Rate Limit Structure

```typescript
interface RateLimits {
  rotation: number;   // Address rotations per day
  relayer: number;    // Relayer requests per day
  transfer: number;   // Transfers per day
  quote: number;      // Quote requests per day
}

// -1 = Unlimited
// 0 = Not available
// > 0 = Limit per day
```

### Rate Limits by Plan

| Plan | Rotation | Relayer | Transfer | Quote |
|------|----------|---------|----------|-------|
| Standard | 10 | 20 | 5 | 30 |
| Plus | 50 | 100 | 20 | 100 |
| Premium | 200 | 500 | 100 | 500 |
| Metal | 0 (Coming Soon) | -1 (Unlimited) | -1 (Unlimited) | -1 (Unlimited) |

### Implementation

```typescript
function checkRateLimit(
  userId: string,
  action: "rotation" | "relayer" | "transfer" | "quote",
  planId: PlanId
): { allowed: boolean; resetAt?: Date } {
  const plan = PLANS[planId];
  const limit = plan.rateLimits[action];
  
  // Unlimited
  if (limit === -1) return { allowed: true };
  
  // Not available
  if (limit === 0) return { allowed: false };
  
  // Check user's current count for today
  const userCount = getUserActionCount(userId, action, "today");
  
  if (userCount >= limit) {
    const resetAt = getNextDayReset();
    return { allowed: false, resetAt };
  }
  
  return { allowed: true };
}
```

---

## 📡 API Endpoints

### 1. Get Plans

**Endpoint:** `GET /api/v1/plans`

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "standard",
        "name": "Standard",
        "title": "Start your crypto journey",
        "priceMonthlyUSD": 0,
        "priceMonthlyEUR": 0,
        "highlight": false,
        "config": {
          "addressPoolSize": 0,
          "gaslessTransferFee": 0.0025,
          "swapMarkupBase": 0.0035,
          "swapPremiumGasless": 0.0025,
          "wallets": 3,
          "aliasType": "basic"
        },
        "rateLimits": {
          "rotation": 10,
          "relayer": 20,
          "transfer": 5,
          "quote": 30
        }
      }
      // ... more plans
    ]
  }
}
```

### 2. Get Current User Plan

**Endpoint:** `GET /api/v1/me`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "plan": "standard",
      "planActivatedAt": "2024-01-01T00:00:00Z",
      // ... other user fields
    }
  }
}
```

### 3. Activate Plan

**Endpoint:** `POST /api/v1/plans/activate`

**Request:**
```json
{
  "planId": "plus"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "plus",
      "activatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid plan ID
- `402 Payment Required`: Payment required for paid plans
- `429 Too Many Requests`: Rate limit exceeded

### 4. Get Fees

**Endpoint:** `GET /api/v1/settings/limits`

**Response:**
```json
{
  "success": true,
  "data": {
    "limits": {
      "fees": {
        "sol": {
          "swap": "0.0035",
          "swapGasless": "0.0060",
          "bridge": "0.0050"
        }
      },
      "swapFeeBreakdown": {
        "markupBase": "0.0035",
        "premiumGasless": "0.0025",
        "totalHiHODL": "0.0060"
      }
    }
  }
}
```

### 5. Calculate Transfer Fee

**Endpoint:** `POST /api/v1/transfers/calculate-fee`

**Request:**
```json
{
  "amountUSD": 100,
  "chain": "solana",
  "isGasless": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fee": {
      "gaslessTransferFee": 0.25,
      "networkFee": 0,
      "totalFee": 0.25,
      "finalAmount": 99.75
    },
    "breakdown": {
      "gaslessTransferFee": {
        "amount": 0.25,
        "percentage": 0.0025,
        "description": "Gasless transfer fee (0.25%)"
      },
      "networkFee": {
        "amount": 0,
        "description": "Sponsored by HiHODL"
      }
    }
  }
}
```

### 6. Calculate Swap Fee

**Endpoint:** `POST /api/v1/swaps/calculate-fee`

**Request:**
```json
{
  "jupiterQuoteAmount": 99.15,
  "isGasless": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fee": {
      "jupiterFee": 0.85,
      "markupBase": 0.35,
      "premiumGasless": 0.25,
      "totalHiHODL": 0.60,
      "finalAmount": 98.55
    },
    "breakdown": {
      "jupiterFee": {
        "amount": 0.85,
        "percentage": 0.0085,
        "description": "Jupiter fee (already deducted in quote)"
      },
      "markupBase": {
        "amount": 0.35,
        "percentage": 0.0035,
        "description": "HiHODL markup base"
      },
      "premiumGasless": {
        "amount": 0.25,
        "percentage": 0.0025,
        "description": "Premium gasless fee"
      }
    }
  }
}
```

---

## 🔒 Business Logic Rules

### Gasless Transfer Rules

1. **Minimum Transaction Value**: $1 USD
2. **Fee Calculation**: Applied only to gasless transfers
3. **Network Fees**: Sponsored by HiHODL (user doesn't pay)
4. **Fee Display**: Shown at transaction preview, not in plans screen

### Swap Rules

1. **Normal Swap**: User pays markup base only (no premium gasless fee)
2. **Gasless Swap**: User pays markup base + premium gasless fee
3. **Jupiter Fee**: Already deducted from quote (backend handles)
4. **Fee Display**: Shown in swap preview screen

### Address Rotation Rules

1. **Standard**: No rotation available
2. **Plus**: Manual rotation (user must trigger)
3. **Premium**: Automatic rotation (system handles)
4. **Rate Limits**: Applied per day (prevents abuse)

### Plan Activation Rules

1. **Free Plan**: Can activate immediately
2. **Paid Plans**: Payment required before activation
3. **Upgrade**: Can upgrade from any plan to higher plan
4. **Downgrade**: Can downgrade (refund policy applies)

---

## ⚠️ Edge Cases & Error Handling

### Gasless Transfer Edge Cases

1. **Transaction < $1**: Not eligible for gasless (regular transfer with network fees)
2. **Insufficient Balance**: User must have enough for amount + fee
3. **Rate Limit Exceeded**: Return 429 with reset time
4. **Plan Not Active**: Return 403 with upgrade message

### Swap Edge Cases

1. **Jupiter Quote Expired**: Request new quote
2. **Slippage Exceeded**: Transaction fails, user can retry
3. **Insufficient Balance**: User must have enough for swap + fees
4. **Network Congestion**: Show estimated delay

### Address Rotation Edge Cases

1. **Pool Exhausted**: Create new addresses or wait for rotation
2. **Rate Limit Exceeded**: Return 429 with reset time
3. **Plan Not Eligible**: Return 403 with upgrade message

---

## 📝 Testing Checklist

### Unit Tests

- [ ] Plan configuration correctness
- [ ] Fee calculation accuracy
- [ ] Rate limit enforcement
- [ ] Address rotation logic

### Integration Tests

- [ ] Plan activation flow
- [ ] Fee calculation endpoints
- [ ] Rate limit tracking
- [ ] Gasless transfer flow

### Edge Case Tests

- [ ] Transaction < $1 USD
- [ ] Rate limit exceeded
- [ ] Insufficient balance
- [ ] Plan downgrade/upgrade

---

## 🔄 Migration Notes

### Existing Users

- All existing users default to "standard" plan
- No migration needed (standard is free)
- Users can upgrade at any time

### Data Migration

- Add `plan` field to users table (default: "standard")
- Add `planActivatedAt` timestamp
- Add rate limit tracking tables

---

## 📚 Additional Resources

- **Frontend Document**: `PLANS_UPGRADE_IMPROVEMENTS.md`
- **API Documentation**: `API_ENDPOINTS_FRONTEND_GUIDE.md`
- **Fees Strategy**: See "Fees Display Strategy" section in frontend doc

---

## ✅ Sign-Off

**Backend Team:** _________________  
**Frontend Team:** _________________  
**Product Team:** _________________  
**Date:** _________________

---

**Questions or Clarifications?**

Contact: [Your contact information]

