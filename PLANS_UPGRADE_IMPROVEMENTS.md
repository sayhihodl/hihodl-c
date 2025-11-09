# 🎨 Plans & Upgrade Screen - Comprehensive Improvements Guide

**Last Updated:** 2024-11-02  
**Status:** ✅ Implementation Guide (Unified with Backend Spec)  
**Target:** Upgrade Plan Screen (`app/(drawer)/(internal)/(paywall)/plans.tsx`)  
**Related Documents:** `BACKEND_PLANS_SPEC.md` (backend alignment)

---

## 📌 Document Unification Note

This document has been unified with:
- ✅ `BACKEND_PLANS_SPEC.md` - Backend technical specifications
- ✅ `app/(drawer)/(internal)/(paywall)/plans.tsx` - Frontend implementation

**All concepts, features, fees, and business logic are now aligned across all documents.**

---

## 📋 Table of Contents

1. [Executive Summary & Key Decisions](#executive-summary--key-decisions)
2. [UX/UI Design Improvements](#uxui-design-improvements)
3. [Frontend Development Improvements](#frontend-development-improvements)
4. [Unified Pricing & Features (English)](#unified-pricing--features-english)
5. [API Integration Guide](#api-integration-guide)
6. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Executive Summary & Key Decisions

### ✅ **Confirmed Business Decisions**

1. **No Transaction Limits**: Users have full freedom to send any amount (user-first philosophy)
2. **Gasless Transfers**:
   - Available automatically for all plans (minimum $1 transaction)
   - No credit limits shown to users (simplified UX like Phantom)
   - Gasless Transfer Fee varies by plan (this is the differentiator)
3. **Address Rotation**:
   - Standard: Not available (`addressPoolSize: 0`)
   - Plus: Manual (`address_rotation_manual`, 10 addresses)
   - Premium: Automatic (`smart_address_rotation`, 50 addresses)
4. **Gasless Transfer Fees**:
   - Standard: 0.25% (on gasless transfers, minimum $1)
   - Plus: 0.1% (on gasless transfers, minimum $1)
   - Premium: 0% (no fee on gasless transfers)
   - **Note**: Practically all transfers are gasless. Non-gasless transfers only pay network fees.
5. **Swap Fees (Gasless)**:
   - Standard: 1.45% total (0.85% Jupiter + 0.60% HiHODL)
   - Plus: 1.30% total (0.85% Jupiter + 0.45% HiHODL)
   - Premium: 0.95% total (0.85% Jupiter + 0.10% HiHODL)
6. **Plan Metal**: All features show "Coming Soon" (not yet available)
7. **StableCard**: Available in all plans with tiered features:
   - Standard: "StableCard" (basic, coming soon)
   - Plus: "StableCard Plus" (enhanced, coming soon)
   - Premium: "StableCard Premium" (premium features, coming soon)
   - Metal: Coming Soon
8. **Features Removed**: Transaction history depth and notification devices (not differentiating)
9. **Support Tiers**: Kept in comparison (Community / Email / Priority / Dedicated)
10. **Rate Limits**: Applied per endpoint and plan, shown in headers (X-RateLimit-*)

### ⚠️ **Pending Decisions (Need Discussion)**

1. **Daily Limit**:
   - **Option A** (Recommended): No daily limits - maximum user freedom
   - **Option B**: Soft limits ($50,000+ daily) for fraud protection only (not prominently displayed)
   - **Option C**: Differentiated by plan (Standard: $10k, Plus: $50k, Premium: Unlimited)
   - **See detailed discussion in Section 2.1**

### 📊 **Final Comparison Table**

| Feature | Standard | Plus | Premium | Metal |
|---------|---------|------|---------|-------|
| **Price** | Free | $4.99/mo | $9.99/mo | Coming Soon |
| **Address Rotation** | ❌ Not available | ✅ Manual (10 addresses) | ✅ Automatic (50 addresses) | Coming Soon |
| **Gasless Transfers** | ✅ Available (min $1) | ✅ Available (min $1) | ✅ Available (min $1) | Coming Soon |
| **Wallets** | 3 | 10 | Unlimited | Coming Soon |
| **Alias Type** | Basic (@username) | Custom | Premium (3 handles) | Coming Soon |
| **StableCard** | StableCard (Coming soon) | StableCard Plus (Coming soon) | StableCard Premium (Coming soon) | Coming Soon |
| **Support** | Community | Email | Priority | Coming Soon |

**Note:** Fees (gasless transfer fees and swap fees) are shown in transaction details, not in the main comparison table. This keeps the focus on features and value, not costs. See detailed fee breakdown in tooltips or "Learn More" sections.

**Next Steps:**
1. Review and decide on Daily Limit option (A, B, or C) - see Section 2.1
2. Finalize comparison table structure
3. Proceed with implementation

---

## 🎨 UX/UI Design Improvements

### 1. **Enhanced Plan Selection & Current Plan Indication**

#### Current Issues:
- ❌ Plan prices not visible in tabs
- ❌ Current plan indicator is subtle ("You're on this plan" text)
- ❌ No visual distinction between available and unavailable plans

#### Proposed Improvements:

**A. Pricing in Tabs**
```typescript
// Tab labels should show:
"Standard" → "Standard • Free"
"Plus" → "Plus • $4.99/mo"
"Premium" → "Premium • $9.99/mo"
"Metal" → "Metal • $19.99/mo" (or "Coming Soon" if placeholder)
```

**B. Prominent Current Plan Badge**
- Add a checkmark icon (✓) or badge directly on the current plan tab
- Use a subtle border highlight or background tint
- Show "You're on this plan" more prominently with an icon + background

**C. Plan Availability Status**
- Clearly indicate "Coming Soon" for Metal if not available
- Use disabled state for unavailable plans
- Show "Contact Us" CTA for enterprise plans

---

### 2. **Feature Comparison & Value Proposition**

#### Current Issues:
- ❌ Features shown only for one plan at a time
- ❌ No side-by-side comparison
- ❌ Features described technically, not benefit-focused

#### Proposed Improvements:

**A. Comparison Table (Primary View)**
Create a side-by-side comparison table showing key features across all plans:

| Feature | Standard | Plus | Premium | Metal |
|---------|---------|------|---------|-------|
| **Price** | Free | $4.99/mo | $9.99/mo | Coming Soon |
| **Address Rotation** | ❌ Not available | ✅ Manual (10 addresses) | ✅ Automatic (50 addresses) | Coming Soon |
| **Gasless Transfers** | ✅ Available (min $1) | ✅ Available (min $1) | ✅ Available (min $1) | Coming Soon |
| **Wallets** | 3 | 10 | Unlimited | Coming Soon |
| **Alias Type** | Basic (@username) | Custom | Premium (3 handles) | Coming Soon |
| **StableCard** | StableCard (Coming soon) | StableCard Plus (Coming soon) | StableCard Premium (Coming soon) | Coming Soon |
| **Support** | Community | Email | Priority | Coming Soon |

**Note:** 
- Metal plan features are hidden until launch. All features show "Coming Soon" for Metal tier.
- Gasless transfers are available automatically for all plans (minimum $1 transaction value).
- **StableCard** is available in all plans with different tiers: Standard (basic), Plus (enhanced), Premium (premium features).
- **Fees are shown in transaction details and tooltips, not in main comparison table** (see Fees Display Strategy below).

---

### 📊 **Business Model Discussion & Key Decisions**

This section addresses core business decisions that need discussion and alignment:

#### 1. **Transaction Limits - Daily Limit Discussion**

**Current Decision:** No per-transaction limits. Users have full freedom to send any amount.

**Arguments AGAINST Transaction Limits:**
- ✅ **User-First Philosophy**: We're a self-custody, multi-chain wallet. Users own their keys and should control their funds freely.
- ✅ **Business Model Alignment**: Our revenue comes from:
  - Subscription fees (not transaction fees)
  - Volume-based income (swaps, bridges, more usage = more revenue)
  - More transactions = more opportunities for value-added services
- ✅ **Competitive Positioning**: Phantom, MetaMask don't limit transactions. We'd be adding friction competitors don't have.
- ✅ **Trust & Transparency**: Limiting transactions contradicts our "self-custody" and "user-first" messaging.

**Arguments FOR Daily Limit (Discussion Point):**

**Option A: No Daily Limits (Recommended)**
- Maximum freedom = maximum trust
- Aligns with self-custody philosophy
- Users can move large amounts when needed (crypto adoption, DeFi, etc.)

**Option B: Soft Daily Limits (Fraud/Abuse Protection Only)**
- **Purpose**: Only for fraud prevention, not revenue protection
- **Implementation**: Very high limits (e.g., $50,000+ daily) that only affect abuse cases
- **Visibility**: Not prominently displayed, only in terms of service
- **Rationale**: Protects against compromised accounts, not against legitimate use

**Option C: Daily Limits as Premium Differentiator**
- Standard: $10,000/day
- Plus: $50,000/day  
- Premium: Unlimited
- **Rationale**: Creates upgrade incentive without blocking core functionality

**Recommendation:** 
Given your user-first philosophy and self-custody model, I recommend **Option A (No Daily Limits)**. However, if you want a safety net, **Option B (Soft Limits for Fraud Only)** is a good compromise that doesn't contradict your messaging.

---

#### 2. **Gasless Transfer Fees - Backend Implementation**

**Important:** Practically all transfers are gasless (minimum $1 transaction value).

**Gasless Transfer Fees Structure:**
- **Standard**: 0.25% fee on gasless transfers
- **Plus**: 0.1% fee on gasless transfers
- **Premium**: 0% fee on gasless transfers (no fee)

**Non-Gasless Transfers:**
- If a transfer is not gasless (below $1 minimum), user only pays network fees (gas)
- No HiHODL fees applied

**UI Display Decision:**
- Fees are calculated automatically by the backend based on user's plan
- Shown in transaction details when user makes a gasless transfer
- Tooltip: "Gasless transfer fees are automatically calculated based on your plan. Most transfers are gasless (minimum $1)."
- Premium plan has 0% fee (strong upgrade incentive)

**Rationale:**
- Standard and Plus have small fees to support gasless infrastructure
- Premium plan has 0% fee (strong upgrade incentive)
- Fees only apply to gasless transfers, not regular network fee payments

---

#### 3. **Gasless Transfers - Simplified Model (Phantom-Style)**

**Gasless Availability:**
- **All Plans**: Gasless transfers available automatically (minimum $1 transaction value)
- **No Credit Limits**: No monthly credit limits shown to users (simplified UX)
- **Automatic**: Works like Phantom - automatically triggers when conditions are met

**Gasless Transfer Fees (Differentiator):**
- **Standard**: 0.25% fee on gasless transfers
- **Plus**: 0.1% fee on gasless transfers
- **Premium**: 0% fee on gasless transfers (no fee)

**Rationale:**
- ✅ Simpler UX (matches Phantom's approach)
- ✅ Clear value differentiation (fees vary by plan)
- ✅ Strong upgrade incentive (0% fee for Premium)
- ✅ No confusion about "credit left" or "gasless modes"
- ✅ Users care about: "Is it gasless?" (yes) and "What's the fee?" (varies by plan)

**Technical Implementation (Internal, Not Shown to Users):**
- Gasless modes (net-deduction, partial-sponsor, full-sponsor) are backend implementation details
- Rate limits exist for abuse prevention (technical limits, not user-facing)
- Internal cost controls may exist but don't affect user experience

**User-Facing Messaging:**
- "Gasless transfers available automatically (minimum $1)"
- "Transfer fees: 0.25% (Standard), 0.1% (Plus), 0% (Premium)"
- Clean, simple, no confusion

---

#### 4. **Address Rotation - Confirmed Structure**

✅ **Standard**: Not available (`addressPoolSize: 0`)
✅ **Plus**: Manual rotation (10 addresses)
✅ **Premium**: Automatic rotation (50 addresses)
✅ **Metal**: Coming Soon (features hidden)

This structure is confirmed and aligns with privacy-focused premium features.

---

#### 5. **Features Removed from Comparison**

**Removed:**
- ❌ Transaction History Depth (not a differentiating feature)
- ❌ Notification Devices (not relevant for plan comparison)

**Kept:**
- ✅ Support tier (Community / Email / Priority / Dedicated) - Important differentiator

---

#### 6. **Plan Metal - "Coming Soon" Strategy**

**Decision:** All Metal features show "Coming Soon"
- No specific feature list
- Price: "Coming Soon"
- All rows: "Coming Soon"

**Rationale:**
- Avoids over-promising features not yet ready
- Keeps table simple and focused
- Can add features later when ready

---

#### 7. **Swap Fees - Detailed Breakdown**

**Gasless Swap Fee Structure:**

The total swap fee consists of:
1. **Jupiter Fee**: ~0.85% (already included in quote)
2. **HiHODL Markup Base**: Varies by plan
3. **Premium Gasless Fee**: Additional fee for gasless swaps

**Fee Breakdown by Plan:**

| Plan | Jupiter Fee | Markup Base | Premium Gasless | Total HiHODL | **Total Final** |
|------|-------------|-------------|-----------------|--------------|-----------------|
| **Standard** | ~0.85% | 0.35% | +0.25% | 0.60% | **1.45%** |
| **Plus** | ~0.85% | 0.25% | +0.20% | 0.45% | **1.30%** |
| **Premium** | ~0.85% | 0% | +0.10% | 0.10% | **0.95%** |

**Important Notes:**
- **Normal Swaps** (with SOL): Only pay the markup base (no premium gasless fee)
- **Gasless Swaps**: Pay markup base + premium gasless fee
- Jupiter fee is already deducted from the quote amount
- Premium plan has the lowest fees (0.95% total for gasless swaps)

**Example Calculation (Standard Plan, Gasless Swap $100 USDC → SOL):**

```
1. Jupiter quote: $99.15 SOL
   (Already includes ~0.85% Jupiter fee = ~$0.85 deducted)

2. HiHODL Fees:
   - Markup base: $99.15 × 0.0035 = $0.35
   - Premium gasless: $99.15 × 0.0025 = $0.25
   - Total HiHODL: $0.60

3. Final Amount:
   You receive: $99.15 - $0.60 = $98.55 SOL

4. Total Fee Breakdown:
   Jupiter fee: ~$0.85 (already deducted in quote)
   HiHODL markup: $0.35
   Premium gasless: $0.25
   Total fee: ~$1.45 (1.45%)
```

**API Endpoint for Fees:**

```typescript
// Get fees from backend
const response = await apiClient.get('/settings/limits');
const fees = response.data.limits.fees;

// Fees by chain
fees.sol.swap          // Markup base (normal swap)
fees.sol.swapGasless   // Markup base + premium gasless
fees.sol.bridge        // Bridge fees

// Fee breakdown
response.data.limits.swapFeeBreakdown = {
  markupBase: "0.0035",      // 0.35%
  premiumGasless: "0.0025",  // +0.25%
  totalHiHODL: "0.0060"      // 0.60% total
}
```

**UI Display:**
- Show swap fees breakdown in swap preview screen
- Display total fee percentage clearly
- Show savings for Premium plan users
- Tooltip: "Swap fees include Jupiter fee (~0.85%) + HiHODL markup. Premium plan has lowest fees."

---

#### 8. **Fees Display Strategy - Phantom-Style Approach**

**Decision:** Don't show fees in main comparison table (matches Phantom app approach)

**Rationale:**
- ✅ **Matches Industry Standard**: Phantom doesn't show fees in app plans screen
- ✅ **Reduces Friction**: Focus on features and value, not costs
- ✅ **Cleaner UX**: Simpler comparison table
- ✅ **Still Transparent**: Fees shown when relevant (transaction time, tooltips)

**Where to Show Fees:**

**1. Feature Tooltips (Primary)**
When user taps "Gasless Transfers" or "Learn More" icon:
```
✅ Gasless Transfers Available

• Available automatically (minimum $1 transaction)
• Transfer fee: 0.25% on gasless transfers
• Swap fee: 1.45% on gasless swaps
• No monthly credit limits

Upgrade to Plus for lower fees (0.1% transfers, 1.30% swaps)
Upgrade to Premium for 0% transfer fees
```

**2. Transaction Preview Screen (Most Important)**
Show fee breakdown before user confirms:
```
Transfer Preview:
Amount: $100 USDC
Gasless Transfer Fee: 0.25% ($0.25)
Network Fee: Sponsored by HiHODL
Total: $100 USDC sent
```

**3. Settings/Help Section**
"Pricing & Fees" page with full breakdown (like Phantom's web docs)

**4. Web Documentation**
Complete transparency for power users

**Comparison Table Structure:**
- **Main Table**: No fees shown (clean, feature-focused)
- **Tooltips**: Fees shown when user wants details
- **Transaction Screen**: Fees shown when user is about to pay
- **Help Section**: Full fee breakdown available

**Benefits:**
- Matches Phantom's proven approach
- Reduces upgrade friction
- Still maintains transparency
- Fees shown when most relevant (at transaction time)

---

### 📋 **Final Comparison Table Structure**

| Feature | Standard | Plus | Premium | Metal |
|---------|---------|------|---------|-------|
| **Price** | Free | $4.99/mo | $9.99/mo | Coming Soon |
| **Address Rotation** | ❌ Not available | ✅ Manual (10 addresses) | ✅ Automatic (50 addresses) | Coming Soon |
| **Gasless Transfers** | ✅ Available (min $1) | ✅ Available (min $1) | ✅ Available (min $1) | Coming Soon |
| **Wallets** | 3 | 10 | Unlimited | Coming Soon |
| **Alias Type** | Basic (@username) | Custom | Premium (3 handles) | Coming Soon |
| **StableCard** | StableCard (Coming soon) | StableCard Plus (Coming soon) | StableCard Premium (Coming soon) | Coming Soon |
| **Support** | Community | Email | Priority | Coming Soon |

**Note:** 
- Gasless transfers are available automatically for all plans (minimum $1 transaction value).
- **StableCard** is available in all plans with tiered features: Standard (basic), Plus (enhanced features), Premium (premium features). All variants show "Coming soon" status.
- **Fees (gasless transfer fees and swap fees) are shown in transaction details and feature tooltips, not in the main comparison table.**
- This keeps the focus on features and value, matching industry standards (Phantom doesn't show fees in app plans screen).
- See "Fees Display Strategy" section below for detailed approach.

---

**B. Visual Cues**
- ✅ Checkmark for included features
- ❌ Cross for excluded features
- ⬆️ Up arrow for improvements (show values)
- 🔒 Lock icon for premium features
- 💡 Info icon (ⓘ) for tooltips

**C. Benefit-Oriented Language**
Instead of technical descriptions, use benefit-focused copy:

**Before:**
- "Gasless — 5 tx/mo"
- "Address Rotation Manual"

**After:**
- "5 Gasless Transactions per month (save on fees!)"
- "Manual Address Rotation (privacy protection)"
- "Zero Transfer Fees (save money on every transaction)"

**D. Feature Tooltips (Including Fees)**

**Gasless Transfers Tooltip Example:**
```
✅ Gasless Transfers Available

• Available automatically (minimum $1 transaction)
• Transfer fee: 0.25% on gasless transfers
• Swap fee: 1.45% on gasless swaps
• No monthly credit limits

Upgrade to Plus for lower fees (0.1% transfers, 1.30% swaps)
Upgrade to Premium for 0% transfer fees
```

**Tooltip Strategy:**
- Add info icons (ⓘ) next to "Gasless Transfers" feature
- Show fees in tooltip (not in main table)
- Include upgrade incentive in tooltip
- Show when user wants details (tap to learn more)

**Other Tooltips:**
- Address rotation benefits
- Rate limits (technical, in advanced settings)
- Gasless modes (internal implementation, not shown to users)

---

### 3. **Call to Action (CTA) Improvements**

#### Current Issues:
- ❌ Generic "View all features" button
- ❌ CTA not contextual to plan state
- ❌ No sticky CTA for long comparison tables

#### Proposed Improvements:

**A. Contextual CTAs**
- **Current Plan:** "Manage Plan" or hide CTA if nothing to manage
- **Upgrade Available:** "Upgrade to Plus" / "Upgrade to Premium"
- **Coming Soon:** "Notify Me" or "Contact Us"
- **Downgrade:** "Downgrade to Standard" (if applicable)

**B. Sticky Bottom CTA**
- Keep upgrade CTA visible while scrolling
- Show price breakdown: "Upgrade to Plus — $4.99/month"
- Add loading state during upgrade process
- Show success animation after upgrade

**C. CTA Visual Hierarchy**
- Primary CTA: Large, prominent, with price
- Secondary: "View all features" (smaller, less prominent)
- Tertiary: "Learn more" links for specific features

---

### 4. **Visual Design & Micro-interactions**

#### Proposed Improvements:

**A. Icons for Features**
- 💰 Wallet icon for "3 wallets"
- 🔒 Shield icon for "Self-custody"
- ⛽ Gas pump icon for "Gasless"
- 🔄 Rotating arrows for "Address Rotation"
- 📊 Chart icon for "Analytics"
- 🔔 Bell icon for "Notifications"

**B. Highlighting Differences**
- When comparing plans, highlight differences between current and selected plan
- Use subtle color change or border
- Show "Upgrade unlocks" section

**C. Loading States**
- Skeleton loaders when fetching plan data
- Loading spinner on CTA during upgrade
- Progress indicator during upgrade process

**D. Confirmation & Feedback**
- Success animation after upgrade
- Confirmation modal: "You've upgraded to Plus!"
- Toast notification with summary
- Show updated plan badge immediately

---

### 5. **Information Architecture**

#### Proposed Structure:

**Option A: Comparison Table (Recommended)**
- Primary view: Side-by-side comparison
- Secondary: Detailed feature breakdown per plan
- Tertiary: "Learn more" modals for specific features

**Option B: Plan Cards (Current)**
- Keep current card-based view
- Add "Compare Plans" button that switches to table view
- Allow users to toggle between views

**Option C: Hybrid**
- Show comparison table by default
- Allow users to dive into specific plan details
- Quick switch between table and card views

---

## 💻 Frontend Development Improvements

### 1. **Dynamic Data Fetching & State Management**

#### Create `usePlans` Hook

```typescript
// hooks/usePlans.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { Plan, PlansResponse } from '@/types/api';

export function usePlans() {
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [currentUserPlanId, setCurrentUserPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [plansResponse, userResponse] = await Promise.all([
          apiClient.get<PlansResponse>('/plans'),
          apiClient.get('/me'),
        ]);
        
        setAllPlans(plansResponse.plans);
        setCurrentUserPlanId(userResponse.user?.plan || 'free');
      } catch (err: any) {
        setError(err.message || 'Failed to load plans.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const upgradeToPlan = useCallback(async (planId: string) => {
    try {
      setError(null);
      await apiClient.post('/plans/activate', { planId });
      
      // Optimistically update UI
      setCurrentUserPlanId(planId);
      
      // Optionally refetch to ensure consistency
      const userResponse = await apiClient.get('/me');
      setCurrentUserPlanId(userResponse.user?.plan || planId);
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to activate plan.');
      return { success: false, error: err.message };
    }
  }, []);

  return { 
    allPlans, 
    currentUserPlanId, 
    loading, 
    error, 
    upgradeToPlan,
    refetch: () => {
      // Refetch logic
    }
  };
}
```

#### Create `plans.service.ts`

```typescript
// services/plans.service.ts
import { apiClient } from '@/lib/apiClient';
import type { PlansResponse, ActivatePlanRequest } from '@/types/api';

export async function getPlans(): Promise<PlansResponse> {
  return apiClient.get<PlansResponse>('/plans');
}

export async function activatePlan(planId: 'free' | 'plus' | 'pro'): Promise<void> {
  return apiClient.post('/plans/activate', { planId } as ActivatePlanRequest);
}

export async function getCurrentUserPlan(): Promise<string> {
  const response = await apiClient.get('/me');
  return response.user?.plan || 'free';
}
```

---

### 2. **Component Architecture**

#### Proposed Structure:

```
app/(drawer)/(internal)/(paywall)/plans/
├── index.tsx                 # Main screen orchestrator
├── components/
│   ├── PlanSelector.tsx      # Tab selector with prices
│   ├── PlanComparisonTable.tsx  # Side-by-side comparison
│   ├── PlanCard.tsx          # Individual plan card
│   ├── FeatureDetail.tsx     # Feature with tooltip
│   ├── UpgradeCTA.tsx         # Sticky CTA button
│   └── PlanTooltip.tsx       # Tooltip component
└── hooks/
    └── usePlans.ts           # Data fetching hook
```

#### Component Props:

```typescript
// PlanSelector.tsx
interface PlanSelectorProps {
  plans: Plan[];
  currentPlanId: string | null;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

// PlanComparisonTable.tsx
interface PlanComparisonTableProps {
  plans: Plan[];
  currentPlanId: string | null;
  onUpgrade: (planId: string) => Promise<void>;
}

// FeatureDetail.tsx
interface FeatureDetailProps {
  feature: {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    tooltip?: string;
  };
  available: boolean;
  showTooltip?: boolean;
}
```

---

### 3. **Internationalization (i18n)**

#### Translation Keys Structure:

```typescript
// i18n/en/plans.json
{
  "plans": {
    "standard": {
      "name": "Standard",
      "title": "Start your crypto journey",
      "description": "Perfect for getting started"
    },
    "plus": {
      "name": "Plus",
      "title": "Level up your experience",
      "description": "More features, more power"
    },
    // ... more plans
  },
  "features": {
    "gasless": {
      "label": "Gasless Transactions",
      "description": "Save on gas fees with our gasless mode",
      "tooltip": "Gasless mode allows you to pay for transactions using the token you're sending, or have HiHODL sponsor part or all of the gas fees."
    },
    // ... more features
  },
  "cta": {
    "upgrade": "Upgrade to {{plan}}",
    "manage": "Manage Plan",
    "current": "You're on this plan"
  }
}
```

#### Usage in Components:

```typescript
import { useTranslation } from 'react-i18next';

function PlanCard({ plan }: { plan: Plan }) {
  const { t } = useTranslation('plans');
  
  return (
    <View>
      <Text>{t(`plans.${plan.id}.name`)}</Text>
      <Text>{t(`plans.${plan.id}.description`)}</Text>
    </View>
  );
}
```

---

### 4. **Styling and Responsiveness**

#### Responsive Design:

```typescript
// utils/responsive.ts
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export function useResponsive() {
  return {
    isMobile: width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
  };
}

// Usage in PlanComparisonTable
function PlanComparisonTable() {
  const { isMobile } = useResponsive();
  
  if (isMobile) {
    // Show vertical stack of plan cards
    return <PlanCardsStack />;
  }
  
  // Show side-by-side comparison table
  return <ComparisonTable />;
}
```

---

### 5. **Error Handling & User Feedback**

#### Error Handling:

```typescript
// hooks/usePlans.ts - Enhanced error handling
try {
  await upgradeToPlan('plus');
  toast.success('Successfully upgraded to Plus!');
} catch (error: any) {
  if (error.code === 'PAYMENT_REQUIRED') {
    // Redirect to payment screen
    router.push('/payment');
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    toast.error('Too many requests. Please try again later.');
  } else {
    toast.error('Failed to upgrade. Please try again.');
  }
}
```

#### Rate Limit Handling:

```typescript
// lib/apiClient.ts - Add rate limit interceptor
apiClient.interceptors.response.use(
  (response) => {
    const rateLimitInfo = {
      limit: parseInt(response.headers['x-ratelimit-limit'] || '0'),
      remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
      reset: response.headers['x-ratelimit-reset'],
      plan: response.headers['x-ratelimit-plan'] || 'free',
    };
    
    // Store in context or state for UI display
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      const resetAt = error.response.data?.error?.data?.resetAt;
      toast.error(
        `Rate limit exceeded. Resets at: ${new Date(resetAt).toLocaleString()}`
      );
    }
    return Promise.reject(error);
  }
);
```

---

### 6. **Accessibility**

#### Accessibility Improvements:

```typescript
// PlanSelector.tsx
<Pressable
  onPress={() => onSelectPlan(plan.id)}
  accessibilityRole="button"
  accessibilityLabel={`Select ${plan.name} plan. ${plan.priceMonthlyUSD === 0 ? 'Free' : `$${plan.priceMonthlyUSD} per month`}`}
  accessibilityState={{ selected: selectedPlanId === plan.id }}
  accessibilityHint="Double tap to view plan details and upgrade"
>
  {/* Plan content */}
</Pressable>

// FeatureDetail.tsx
<View
  accessible={true}
  accessibilityLabel={`${feature.label}. ${available ? 'Included' : 'Not included'}`}
  accessibilityHint={feature.tooltip}
>
  {/* Feature content */}
</View>
```

---

## 📊 Unified Pricing & Features (English)

### Standardized Plan Data Structure

```typescript
// constants/plans.ts
export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    title: "Start your crypto journey",
    priceMonthlyUSD: 0,
    priceMonthlyEUR: 0,
    highlight: false,
    
    // Gasless Transfers (available automatically, no credit limits shown to users)
    limits: {
      // Internal cost controls may exist but not shown to users
    },
    
    // Configuration
    config: {
      addressPoolSize: 0, // No address rotation
      gaslessMode: "net-deduction", // Internal implementation detail (not shown to users)
      gaslessTransferFee: 0.0025, // 0.25% fee on gasless transfers (min $1)
      swapMarkupBase: 0.0035, // 0.35% swap markup base
      swapPremiumGasless: 0.0025, // +0.25% premium gasless fee
      wallets: 3,
      aliasType: "basic",
    },
    
    // Rate Limits
    rateLimits: {
      rotation: 10,
      relayer: 20,
      transfer: 5,
      quote: 30,
    },
    
    // Features
    features: [
      {
        id: "multichain",
        label: "Multichain Support",
        description: "Solana, Base, Polygon, Ethereum",
        icon: "🌐",
        included: true,
      },
      {
        id: "gasless",
        label: "Gasless Transfers",
        description: "Available automatically (min $1)",
        icon: "⛽",
        included: true,
        tooltip: "Gasless transfers available automatically. Fee: 0.25% (varies by plan).",
      },
      {
        id: "alias",
        label: "Basic Alias",
        description: "@username",
        icon: "🏷️",
        included: true,
      },
      {
        id: "address_rotation",
        label: "Address Rotation",
        description: "Not available",
        icon: "🔄",
        included: false,
        tooltip: "Rotate addresses for enhanced privacy",
      },
      {
        id: "stablecard",
        label: "StableCard",
        description: "Coming soon",
        icon: "💳",
        included: false,
        tooltip: "StableCard coming soon",
      },
      {
        id: "support",
        label: "Support",
        description: "Community support",
        icon: "💬",
        included: true,
      },
    ],
    
    heroPerks: [
      "Self-custody & Passkey login",
      "3 wallets (Daily / Savings / Social)",
      "Alias (@username)",
      "Gasless transfers",
      "StableCard (Coming soon)",
    ],
  },
  
  {
    id: "plus",
    name: "Plus",
    title: "Level up your experience",
    priceMonthlyUSD: 4.99,
    priceMonthlyEUR: 4.99,
    highlight: true,
    
    // Gasless Transfers (available automatically, no credit limits shown to users)
    limits: {
      // Internal cost controls may exist but not shown to users
    },
    
    config: {
      addressPoolSize: 10, // Manual rotation (10 addresses)
      gaslessMode: "partial-sponsor", // Internal implementation detail (not shown to users)
      gaslessTransferFee: 0.001, // 0.1% fee on gasless transfers (min $1)
      swapMarkupBase: 0.0025, // 0.25% swap markup base
      swapPremiumGasless: 0.0020, // +0.20% premium gasless fee
      wallets: 10,
      aliasType: "custom",
    },
    
    rateLimits: {
      rotation: 50,
      relayer: 100,
      transfer: 20,
      quote: 100,
    },
    
    features: [
      // All Standard features plus:
      {
        id: "address_rotation_manual",
        label: "Manual Address Rotation",
        description: "10 addresses available",
        icon: "🔄",
        included: true,
        tooltip: "Manually rotate addresses for enhanced privacy",
      },
      {
        id: "custom_alias",
        label: "Custom Alias",
        description: "Choose your handle",
        icon: "🏷️",
        included: true,
      },
      {
        id: "stablecard_plus",
        label: "StableCard Plus",
        description: "Coming soon",
        icon: "💳",
        included: false,
        tooltip: "StableCard Plus coming soon",
      },
      {
        id: "support",
        label: "Support",
        description: "Email support",
        icon: "📧",
        included: true,
      },
    ],
  },
  
  {
    id: "premium",
    name: "Premium",
    title: "Maximum power and privacy",
    priceMonthlyUSD: 9.99,
    priceMonthlyEUR: 9.99,
    highlight: true,
    
    // Gasless Transfers (available automatically, no credit limits shown to users)
    limits: {
      // No limits - gasless available automatically
    },
    
    config: {
      addressPoolSize: 50, // Automatic rotation (50 addresses)
      gaslessMode: "full-sponsor", // Internal implementation detail (not shown to users)
      gaslessTransferFee: 0, // 0% fee on gasless transfers (no fee)
      swapMarkupBase: 0, // 0% swap markup base
      swapPremiumGasless: 0.0010, // +0.10% premium gasless fee (only for gasless)
      wallets: -1, // Unlimited
      aliasType: "premium",
    },
    
    rateLimits: {
      rotation: 200,
      relayer: 500,
      transfer: 100,
      quote: 500,
    },
    
    features: [
      // All Plus features plus:
      {
        id: "smart_address_rotation",
        label: "Smart Address Rotation",
        description: "Automatic rotation (50 addresses)",
        icon: "🔄",
        included: true,
        tooltip: "Automatically rotate addresses for maximum privacy",
      },
      {
        id: "unlimited_gasless",
        label: "Gasless Transfers",
        description: "0% fee (no fee)",
        icon: "⛽",
        included: true,
        tooltip: "Gasless transfers available automatically. Premium plan has 0% fee.",
      },
      {
        id: "stablecard_premium",
        label: "StableCard Premium",
        description: "Coming soon",
        icon: "💳",
        included: false,
        tooltip: "StableCard Premium coming soon",
      },
      {
        id: "support",
        label: "Support",
        description: "Priority support",
        icon: "⭐",
        included: true,
      },
    ],
  },
  
  {
    id: "metal",
    name: "Metal",
    title: "Coming Soon",
    priceMonthlyUSD: 0, // Coming Soon
    priceMonthlyEUR: 0, // Coming Soon
    highlight: true,
    comingSoon: true, // Not available yet
    
    // All features show "Coming Soon" - no specific limits defined yet
    limits: {
      gaslessCreditUSD: 0, // Coming Soon
    },
    
    config: {
      addressPoolSize: 0, // Coming Soon
      gaslessMode: "full-sponsor", // Coming Soon
      wallets: 0, // Coming Soon
      aliasType: "premium", // Coming Soon
    },
    
    rateLimits: {
      rotation: 0, // Coming Soon
      relayer: -1,
      transfer: -1,
      quote: -1,
    },
    
    features: [
      // All Premium features plus:
      {
        id: "metal_card",
        label: "Metal Card Design",
        description: "Exclusive NFT card designs",
        icon: "💳",
        included: true,
      },
      {
        id: "dedicated_support",
        label: "Dedicated Support",
        description: "24/7 priority support",
        icon: "🎧",
        included: true,
      },
      // ... more features
    ],
  },
];
```

---

## 🔌 API Integration Guide

### 1. Fetch Plans from Backend

```typescript
// services/plans.service.ts
import { apiClient } from '@/lib/apiClient';
import type { PlansResponse } from '@/types/api';

export async function getPlans(): Promise<PlansResponse> {
  const response = await apiClient.get<PlansResponse>('/plans');
  return response;
}

// Response format:
// {
//   success: true,
//   data: {
//     plans: [
//       {
//         id: "free",
//         name: "Free",
//         title: "Start your crypto journey",
//         priceUSD: 0,
//         features: [...],
//         limits: {...},
//       },
//       // ... more plans
//     ]
//   }
// }
```

### 2. Get Current User Plan

```typescript
// services/me.service.ts
export async function getCurrentUserPlan(): Promise<string> {
  const response = await apiClient.get('/me');
  return response.user?.plan || 'free';
}
```

### 3. Activate Plan

```typescript
// services/plans.service.ts
export async function activatePlan(planId: 'free' | 'plus' | 'pro'): Promise<void> {
  await apiClient.post('/plans/activate', { planId });
  
  // The backend will:
  // 1. Validate the plan exists
  // 2. Process payment (if required)
  // 3. Update user's plan
  // 4. Return success response
}
```

### 4. Check Feature Availability

```typescript
// utils/plan-features.ts
export async function hasFeature(featureId: string): Promise<boolean> {
  const user = await getCurrentUser();
  const plans = await getPlans();
  
  const userPlan = plans.data.plans.find(p => p.id === user.plan);
  if (!userPlan) return false;
  
  return userPlan.features.some(f => f.id === featureId);
}
```

### 5. Calculate Swap Fees

```typescript
// utils/swap-fees.ts
import { getCurrentUser } from '@/services/me.service';

export interface SwapFeeBreakdown {
  markupBase: number;
  premiumGasless: number;
  totalHiHODL: number;
  finalAmount: number;
  feeBreakdown: {
    jupiterFee: number;
    markupBase: number;
    premiumGasless: number;
    totalHiHODL: number;
  };
}

export async function calculateSwapFees(
  jupiterQuoteAmount: number,
  isGasless: boolean
): Promise<SwapFeeBreakdown> {
  const user = await getCurrentUser();
  return calculateForPlan(user.plan || 'standard', jupiterQuoteAmount, isGasless);
}

function calculateForPlan(
  plan: 'standard' | 'plus' | 'premium',
  jupiterQuoteAmount: number,
  isGasless: boolean
): SwapFeeBreakdown {
  const markups = { standard: 0.0035, plus: 0.0025, premium: 0 };
  const premiums = { standard: 0.0025, plus: 0.0020, premium: 0.0010 };
  
  const markupBase = markups[plan];
  const premiumGasless = isGasless ? premiums[plan] : 0;
  const totalHiHODL = markupBase + premiumGasless;
  
  const markupBaseUSD = jupiterQuoteAmount * markupBase;
  const premiumGaslessUSD = jupiterQuoteAmount * premiumGasless;
  const totalHiHODLUSD = markupBaseUSD + premiumGaslessUSD;
  
  // Estimate Jupiter fee (already deducted in quote)
  const estimatedOriginalAmount = jupiterQuoteAmount / (1 - 0.0085);
  const jupiterFeeUSD = estimatedOriginalAmount - jupiterQuoteAmount;
  
  return {
    markupBase: markupBaseUSD,
    premiumGasless: premiumGaslessUSD,
    totalHiHODL: totalHiHODLUSD,
    finalAmount: jupiterQuoteAmount - totalHiHODLUSD,
    feeBreakdown: {
      jupiterFee: jupiterFeeUSD,
      markupBase: markupBaseUSD,
      premiumGasless: premiumGaslessUSD,
      totalHiHODL: totalHiHODLUSD,
    },
  };
}
```

### 6. Get Fees from Backend

```typescript
// services/fees.service.ts
import { apiClient } from '@/lib/apiClient';

export interface FeesResponse {
  limits: {
    fees: {
      sol: {
        swap: string;        // Markup base (normal swap)
        swapGasless: string; // Markup base + premium gasless
        bridge: string;      // Bridge fees
      };
    };
    swapFeeBreakdown: {
      markupBase: string;
      premiumGasless: string;
      totalHiHODL: string;
    };
  };
}

export async function getFees(): Promise<FeesResponse> {
  return apiClient.get<FeesResponse>('/settings/limits');
}
```

---

## ✅ Implementation Checklist

### Phase 1: Data Integration (Week 1)
- [ ] Create `usePlans` hook
- [ ] Create `plans.service.ts`
- [ ] Integrate with `/api/v1/plans` endpoint
- [ ] Integrate with `/api/v1/me` to get current plan
- [ ] Add error handling for API calls
- [ ] Add loading states

### Phase 2: UI Improvements (Week 2)
- [ ] Add pricing to tabs
- [ ] Enhance current plan indicator
- [ ] Create comparison table component
- [ ] Add feature icons
- [ ] Implement tooltips for complex features
- [ ] Add benefit-oriented language

### Phase 3: CTA & Interactions (Week 3)
- [ ] Implement contextual CTAs
- [ ] Add sticky bottom CTA
- [ ] Create upgrade flow
- [ ] Add loading states during upgrade
- [ ] Implement success animations
- [ ] Add confirmation modals

### Phase 4: Polish & Accessibility (Week 4)
- [ ] Add i18n translations
- [ ] Implement responsive design
- [ ] Add accessibility labels
- [ ] Test keyboard navigation
- [ ] Add rate limit indicators
- [ ] Performance optimization

---

## 🎯 Key Takeaways

### UX/UI Focus:
1. **Comparison is Key** - Side-by-side comparison helps users make informed decisions
2. **Benefit-Focused** - Language should emphasize user benefits, not technical details
3. **Visual Hierarchy** - Clear distinction between plans and features
4. **Contextual CTAs** - CTAs should be relevant to user's current state

### Frontend Focus:
1. **Centralized Data** - Use hooks and services for data management
2. **Type Safety** - Leverage TypeScript for all API interactions
3. **Error Handling** - Comprehensive error handling with user-friendly messages
4. **Performance** - Optimize rendering and API calls
5. **Accessibility** - Ensure all interactions are accessible

---

**Next Steps:**
1. Review this document with the team
2. Prioritize improvements based on user feedback
3. Create detailed tickets for each phase
4. Start with Phase 1 (Data Integration)

