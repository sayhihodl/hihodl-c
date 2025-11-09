# 📚 API Endpoints & Frontend Integration Guide

**Last Updated:** 2024-11-02  
**Status:** ✅ Complete Reference Guide  
**Target Audience:** Frontend Developers & UX/UI Designers

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Endpoint Overview](#endpoint-overview)
3. [Frontend Integration](#frontend-integration)
4. [Plans & Pricing](#plans--pricing)
5. [Best Practices](#best-practices)
6. [UX/UI Considerations](#uxui-considerations)
7. [Error Handling](#error-handling)

---

## 🚀 Quick Start

### How to View All Endpoints

**Option 1: Swagger UI (Recommended)**
- Visit: `https://hihodl-backend-v-0-1.onrender.com/api/v1/docs`
- Interactive API documentation with testing capabilities

**Option 2: Code**
- Check `server/api/index.ts` for complete endpoint list

**Option 3: Documentation Files**
- Review: `API_ENDPOINTS_FOR_FRONTEND.md` (complete documentation)

---

## 📋 Endpoint Overview

### 🔐 Authentication

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

### 👤 User Management

```
GET    /api/v1/me
PATCH  /api/v1/me
GET    /api/v1/me/accounts
```

### 🔑 Passkeys (WebAuthn)

```
POST   /api/v1/passkeys/register/start
POST   /api/v1/passkeys/register/complete
POST   /api/v1/passkeys/login/start
POST   /api/v1/passkeys/login/complete
GET    /api/v1/passkeys
DELETE /api/v1/passkeys/:id
```

### 💼 Wallets

```
GET    /api/v1/wallets
POST   /api/v1/wallets
GET    /api/v1/wallets/:id
PATCH  /api/v1/wallets/:id
DELETE /api/v1/wallets/:id
```

### 💰 Balances & Prices

```
GET    /api/v1/balances
GET    /api/v1/balances/:chain/:address
GET    /api/v1/prices
GET    /api/v1/prices/:tokenId
```

### 📤 Transfers

```
POST   /api/v1/transfers/quote
POST   /api/v1/transfers/submit
GET    /api/v1/transfers
GET    /api/v1/transfers/:id
```

### 💳 Payments

```
POST   /api/v1/payments/send
POST   /api/v1/payments/request
GET    /api/v1/payments/requests
```

### 🔍 Alias

```
GET    /api/v1/alias/:alias
POST   /api/v1/alias
GET    /api/v1/alias
PATCH  /api/v1/alias/:id
DELETE /api/v1/alias/:id
```

### 👥 Contacts

```
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PATCH  /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
```

### ⚙️ Settings

```
GET    /api/v1/settings
PATCH  /api/v1/settings
```

### 🔒 Security

```
GET    /api/v1/sessions
DELETE /api/v1/sessions/:id
GET    /api/v1/security/audit-logs
```

### 📊 Chains & Tokens

```
GET    /api/v1/chains
GET    /api/v1/chains/:key
```

### ✅ Health Check

```
GET    /api/v1/health
GET    /api/v1/health/db
GET    /api/v1/health/full
```

---

## 🔗 Frontend Integration

### 1. Configure Base URL

```typescript
// config/api.ts
export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://hihodl-backend-v-0-1.onrender.com/api/v1';

// For React Native / Expo
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  'https://hihodl-backend-v-0-1.onrender.com/api/v1';

// For Next.js
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://hihodl-backend-v-0-1.onrender.com/api/v1';

// For Vite
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://hihodl-backend-v-0-1.onrender.com/api/v1';
```

### 2. Create HTTP Client

#### Recommended: Axios with Interceptors

```typescript
// lib/api-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '@/config/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor: Add authentication token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from secure storage (React Native) or localStorage (Web)
    const token = getAuthToken(); // Implement based on your storage solution
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add idempotency key for mutating requests
    if (config.method === 'post' || config.method === 'patch' || config.method === 'put') {
      config.headers['Idempotency-Key'] = generateIdempotencyKey();
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors and extract data
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from { success: true, data: {...} } format
    if (response.data?.success && response.data?.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError) => {
    // Handle error responses
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        // Clear token and redirect to login
        clearAuthToken();
        // Redirect to login (implement based on your router)
        redirectToLogin();
        return Promise.reject(new Error('Unauthorized'));
      }
      
      // Handle 403 Forbidden
      if (status === 403) {
        return Promise.reject(new Error('Forbidden: Insufficient permissions'));
      }
      
      // Handle 429 Rate Limit
      if (status === 429) {
        const rateLimitInfo = {
          limit: parseInt(error.response.headers['x-ratelimit-limit'] || '0'),
          remaining: parseInt(error.response.headers['x-ratelimit-remaining'] || '0'),
          reset: error.response.headers['x-ratelimit-reset'],
          plan: error.response.headers['x-ratelimit-plan'] || 'free',
        };
        return Promise.reject({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          rateLimitInfo,
        });
      }
      
      // Extract error message from backend format
      const errorMessage = (data as any)?.error?.message || error.message;
      return Promise.reject(new Error(errorMessage));
    }
    
    // Network error
    if (error.request) {
      return Promise.reject(new Error('Network error: Please check your connection'));
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
function getAuthToken(): string | null {
  // React Native: Use AsyncStorage or SecureStore
  // Web: Use localStorage
  // Implement based on your platform
  return null; // Placeholder
}

function clearAuthToken(): void {
  // Implement token clearing logic
}

function redirectToLogin(): void {
  // Implement router redirect logic
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default apiClient;
```

### 3. Service Layer Examples

#### Health Check

```typescript
// services/health.service.ts
import apiClient from '@/lib/api-client';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health');
}

export async function checkDatabaseHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health/db');
}

export async function checkFullHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health/full');
}
```

#### Authentication

```typescript
// services/auth.service.ts
import apiClient from '@/lib/api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

export async function loginWithEmail(email: string, password: string): Promise<LoginResponse> {
  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // 2. Store token securely
  await storeAuthToken(data.session.access_token);

  // 3. Sync user with backend
  await syncUserWithBackend(data.session.access_token);

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token || '',
    user: {
      id: data.user.id,
      email: data.user.email || '',
    },
  };
}

export async function refreshToken(refreshToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  
  await storeAuthToken(response.access_token);
  return response;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  await clearAuthToken();
}

async function syncUserWithBackend(token: string): Promise<void> {
  // Backend automatically creates/updates user on first authenticated request
  // This is just to ensure sync
  await apiClient.get('/me');
}

async function storeAuthToken(token: string): Promise<void> {
  // Implement secure storage (AsyncStorage, SecureStore, etc.)
}

async function clearAuthToken(): Promise<void> {
  // Implement token clearing
}
```

#### Wallets

```typescript
// services/wallets.service.ts
import apiClient from '@/lib/api-client';

export interface Wallet {
  id: string;
  chain: string;
  address: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletRequest {
  chain: string;
  address: string;
  label?: string;
}

export async function getWallets(): Promise<Wallet[]> {
  return apiClient.get<Wallet[]>('/wallets');
}

export async function getWallet(id: string): Promise<Wallet> {
  return apiClient.get<Wallet>(`/wallets/${id}`);
}

export async function createWallet(data: CreateWalletRequest): Promise<Wallet> {
  return apiClient.post<Wallet>('/wallets', data);
}

export async function updateWallet(id: string, data: Partial<CreateWalletRequest>): Promise<Wallet> {
  return apiClient.patch<Wallet>(`/wallets/${id}`, data);
}

export async function deleteWallet(id: string): Promise<void> {
  return apiClient.delete(`/wallets/${id}`);
}
```

#### Balances & Prices

```typescript
// services/balances.service.ts
import apiClient from '@/lib/api-client';

export interface Balance {
  chain: string;
  address: string;
  tokenId: string;
  symbol: string;
  balance: string;
  balanceUSD: number;
}

export interface Price {
  tokenId: string;
  symbol: string;
  priceUSD: number;
  priceChange24h: number;
  lastUpdated: string;
}

export async function getBalances(): Promise<Balance[]> {
  return apiClient.get<Balance[]>('/balances');
}

export async function getBalanceByAddress(chain: string, address: string): Promise<Balance[]> {
  return apiClient.get<Balance[]>(`/balances/${chain}/${address}`);
}

export async function getPrices(): Promise<Price[]> {
  return apiClient.get<Price[]>('/prices');
}

export async function getTokenPrice(tokenId: string): Promise<Price> {
  return apiClient.get<Price>(`/prices/${tokenId}`);
}
```

#### Transfers

```typescript
// services/transfers.service.ts
import apiClient from '@/lib/api-client';

export interface TransferQuoteRequest {
  from: string;
  to: string;
  tokenId: string;
  chain: string;
  amount: string;
}

export interface TransferQuote {
  from: string;
  to: string;
  amount: string;
  fee: string;
  feeUSD: number;
  total: string;
  estimatedGas?: string;
  estimatedTime?: number;
}

export interface TransferSubmitRequest extends TransferQuoteRequest {
  quoteId?: string;
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  tokenId: string;
  chain: string;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  createdAt: string;
}

export async function getTransferQuote(data: TransferQuoteRequest): Promise<TransferQuote> {
  return apiClient.post<TransferQuote>('/transfers/quote', data);
}

export async function submitTransfer(data: TransferSubmitRequest): Promise<Transfer> {
  return apiClient.post<Transfer>('/transfers/submit', data);
}

export async function getTransferHistory(): Promise<Transfer[]> {
  return apiClient.get<Transfer[]>('/transfers');
}

export async function getTransfer(id: string): Promise<Transfer> {
  return apiClient.get<Transfer>(`/transfers/${id}`);
}
```

### 4. React Hooks

```typescript
// hooks/useBalances.ts
import { useState, useEffect } from 'react';
import { getBalances, Balance } from '@/services/balances.service';

export function useBalances() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalances() {
      try {
        setLoading(true);
        setError(null);
        const data = await getBalances();
        setBalances(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load balances');
      } finally {
        setLoading(false);
      }
    }

    fetchBalances();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBalances();
      setBalances(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  return { balances, loading, error, refetch };
}
```

### 5. Environment Variables

Create `.env.local` or `.env` file:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://hihodl-backend-v-0-1.onrender.com/api/v1
# OR
NEXT_PUBLIC_API_URL=https://hihodl-backend-v-0-1.onrender.com/api/v1
# OR
VITE_API_URL=https://hihodl-backend-v-0-1.onrender.com/api/v1

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 💳 Plans & Pricing

### Get Plans Endpoint

```
GET /api/v1/plans
```

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
        "priceUSD": 0,
        "features": [
          {
            "id": "multichain_enabled",
            "description": "🌐 Multichain: Solana, Base, Polygon, Ethereum"
          },
          {
            "id": "gasless_token_deduction",
            "description": "🔥 Gasless by default (pay with the token you send)"
          }
        ],
        "limits": {
          "perTxUSD": 1000,
          "dailyUSD": 2500,
          "monthlyUSD": 10000,
          "gaslessMode": "net-deduction",
          "gaslessCreditUSD": 0,
          "addressPoolSize": 0
        }
      }
    ]
  }
}
```

### Service Implementation

```typescript
// services/plans.service.ts
import apiClient from '@/lib/api-client';

export interface PlanFeature {
  id: string;
  description: string;
}

export interface PlanLimits {
  perTxUSD: number;
  dailyUSD: number;
  monthlyUSD: number;
  gaslessMode: 'net-deduction' | 'partial-sponsor' | 'full-sponsor';
  gaslessCreditUSD: number;
  addressPoolSize: number;
}

export interface Plan {
  id: 'standard' | 'plus' | 'premium';
  name: string;
  title: string;
  priceUSD: number;
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlansResponse {
  plans: Plan[];
}

export async function getPlans(): Promise<PlansResponse> {
  return apiClient.get<PlansResponse>('/plans');
}

export interface ActivatePlanRequest {
  planId: 'standard' | 'plus' | 'premium';
}

export async function activatePlan(planId: 'standard' | 'plus' | 'premium'): Promise<void> {
  return apiClient.post('/plans/activate', { planId } as ActivatePlanRequest);
}
```

### Plan Comparison Table

| Feature | Standard | Plus | Premium |
|---------|----------|------|---------|
| **Price** | $0/month | $4.99/month | $9.99/month |
| **Per Transaction Limit** | $1,000 | $5,000 | $15,000 |
| **Daily Limit** | $2,500 | $15,000 | $50,000 |
| **Monthly Limit** | $10,000 | $50,000 | $150,000 |
| **Address Rotation** | ❌ Not available | ✅ Manual (10 addresses) | ✅ Automatic (50 addresses) |
| **Transfer Fee** | 0.25% | 0.1% | 0% |
| **Gasless Credit** | $0/month | $2/month | $6/month |
| **Gasless Mode** | Net deduction | Partial sponsor | Full sponsor |
| **Rotation Rate Limit** | 10/day | 50/day | 200/day |
| **Relayer Rate Limit** | 20/day | 100/day | 500/day |
| **Transfer Rate Limit** | 5/min | 20/min | 100/min |
| **Quote Rate Limit** | 30/min | 100/min | 500/min |

### Plan Details

#### 🆓 Standard Plan ($0/month)

**Transaction Limits:**
- Per transaction: **$1,000 USD**
- Daily: **$2,500 USD**
- Monthly: **$10,000 USD**

**Features:**
- ✅ Multichain (Solana, Base, Polygon, Ethereum)
- ✅ Gasless by default (net-deduction)
- ✅ Basic alias (@username)
- ✅ Instant swaps & bridges
- ✅ Real-time balances and prices
- ✅ Transaction history: up to 100 transactions
- ✅ Payment requests: 20/month
- ✅ Push notifications: 1 device
- ✅ PIX, Mercado Pago (beta)
- ❌ **Address Rotation: NOT available** (`addressPoolSize: 0`)

**Configuration:**
- Address Pool: **0 addresses** (no rotation)
- Gasless Mode: `net-deduction`
- Gasless Credit: **$0 USD/month**
- Transfer Fee: **0.25%**

**Rate Limits:**
- Rotation: **10/day** (not available in Standard)
- Relayer: **20/day**
- Transfer: **5/minute**
- Quote: **30/minute**

---

#### ⚡ Plus Plan ($4.99/month)

**Transaction Limits:**
- Per transaction: **$5,000 USD**
- Daily: **$15,000 USD**
- Monthly: **$50,000 USD**

**Features:**
- ✅ Everything in Standard plan
- ✅ Priority transactions (medium relayer)
- ✅ **Manual Address Rotation** (`address_rotation_manual`)
- ✅ Custom alias: choose your handle
- ✅ Contact book
- ✅ Advanced search
- ✅ Transaction history: up to 1,000 transactions
- ✅ Downloadable statements (CSV/JSON)
- ✅ Payment diagnostics
- ✅ Better swap & bridge rates
- ✅ Multi-device notifications (up to 3 devices)

**Configuration:**
- Address Pool: **10 addresses** (manual rotation)
- Gasless Mode: `partial-sponsor`
- Gasless Credit: **$2 USD/month**
- Transfer Fee: **0.1%**

**Rate Limits:**
- Rotation: **50/day**
- Relayer: **100/day**
- Transfer: **20/minute**
- Quote: **100/minute**

---

#### 🚀 Premium Plan ($9.99/month)

**Transaction Limits:**
- Per transaction: **$15,000 USD**
- Daily: **$50,000 USD**
- Monthly: **$150,000 USD**

**Features:**
- ✅ Everything in Plus plan
- ✅ Premium alias (up to 3 handles)
- ✅ **Smart Automatic Address Rotation** (`smart_address_rotation`)
- ✅ Priority relayer with immediate execution
- ✅ Pro swaps and bridges (no margins)
- ✅ Advanced analytics
- ✅ Automatic email statements
- ✅ Verifiable proofs & links
- ✅ Session and security management
- ✅ Address batch provisioning
- ✅ Priority support

**Configuration:**
- Address Pool: **50 addresses** (automatic rotation)
- Gasless Mode: `full-sponsor`
- Gasless Credit: **$6 USD/month**
- Transfer Fee: **0%** (no fee)

**Rate Limits:**
- Rotation: **200/day**
- Relayer: **500/day**
- Transfer: **100/minute**
- Quote: **500/minute**

---

### Get Current User Plan

```typescript
// services/me.service.ts
export interface User {
  id: string;
  email: string;
  plan: 'standard' | 'plus' | 'premium';
  // ... other fields
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ user: User }>('/me');
  return response.user;
}
```

**Response from `/me` endpoint:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "plan": "standard",
      // ... other fields
    }
  }
}
```

### Check Feature Availability

```typescript
// utils/plan-features.ts
import { getCurrentUser } from '@/services/me.service';
import { getPlans } from '@/services/plans.service';

export async function hasFeature(featureId: string): Promise<boolean> {
  const user = await getCurrentUser();
  const plansResponse = await getPlans();
  
  const userPlan = plansResponse.plans.find(p => p.id === user.plan);
  if (!userPlan) return false;
  
  return userPlan.features.some(f => f.id === featureId);
}

// Usage in components
const canRotateAddress = await hasFeature('address_rotation_manual');
const canSmartRotate = await hasFeature('smart_address_rotation');
```

### Check Transaction Limits

```typescript
// utils/transaction-limits.ts
import { getCurrentUser } from '@/services/me.service';
import { getPlans } from '@/services/plans.service';

export async function getTransactionLimits(): Promise<{
  perTxUSD: number;
  dailyUSD: number;
  monthlyUSD: number;
}> {
  const user = await getCurrentUser();
  const plansResponse = await getPlans();
  
  const userPlan = plansResponse.plans.find(p => p.id === user.plan);
  if (!userPlan) {
    // Default to Standard plan
    return {
      perTxUSD: 1000,
      dailyUSD: 2500,
      monthlyUSD: 10000,
    };
  }
  
  return userPlan.limits;
}

// Usage
const limits = await getTransactionLimits();
if (amountUSD > limits.perTxUSD) {
  toast.error(`Amount exceeds per-transaction limit of $${limits.perTxUSD}`);
}
```

### Rate Limit Headers

The backend sends rate limit information in response headers:

```typescript
// Response headers
X-RateLimit-Limit: 20        // Maximum limit
X-RateLimit-Remaining: 15   // Remaining requests
X-RateLimit-Reset: 2024-01-01T00:00:00Z  // Reset time
X-RateLimit-Plan: standard  // Current plan
```

**Rate limit interceptor example:**

```typescript
apiClient.interceptors.response.use(
  (response) => {
    const rateLimitInfo = {
      limit: parseInt(response.headers['x-ratelimit-limit'] || '0'),
      remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
      reset: response.headers['x-ratelimit-reset'],
      plan: response.headers['x-ratelimit-plan'] || 'standard',
    };
    
    // Store in context or state for UI display
    // You can show this in a header or status bar
    
    return response.data;
  },
  (error) => {
    if (error.response?.status === 429) {
      // Rate limit exceeded
      const rateLimitInfo = error.response.data?.error?.data;
      const resetTime = rateLimitInfo?.resetAt 
        ? new Date(rateLimitInfo.resetAt).toLocaleString()
        : 'soon';
      
      toast.error(`Rate limit exceeded. Resets at: ${resetTime}`);
    }
    return Promise.reject(error);
  }
);
```

---

## 🎨 UX/UI Considerations

### 1. Loading States

**Best Practices:**
- Show skeleton loaders instead of spinners for list content
- Use inline loading indicators for individual items
- Provide progress feedback for long operations

```typescript
// Example: Skeleton loader for balances
function BalanceList() {
  const { balances, loading } = useBalances();
  
  if (loading) {
    return <BalanceSkeleton count={5} />;
  }
  
  return balances.map(balance => <BalanceItem key={balance.id} {...balance} />);
}
```

### 2. Error States

**Best Practices:**
- Show user-friendly error messages
- Provide retry actions
- Display error context (what failed, why)

```typescript
function ErrorDisplay({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <View>
      <Text>{getUserFriendlyMessage(error)}</Text>
      <Button onPress={onRetry}>Try Again</Button>
    </View>
  );
}
```

### 3. Rate Limit Indicators

**Best Practices:**
- Show rate limit status in header or status bar
- Warn users when approaching limits
- Display reset time countdown

```typescript
function RateLimitIndicator() {
  const { remaining, limit, reset } = useRateLimit();
  const percentage = (remaining / limit) * 100;
  
  return (
    <View>
      <ProgressBar value={percentage} />
      <Text>{remaining} of {limit} requests remaining</Text>
      <Text>Resets: {formatTimeUntil(reset)}</Text>
    </View>
  );
}
```

### 4. Plan-Specific UI

**Best Practices:**
- Show upgrade prompts for locked features
- Display plan badges on premium features
- Provide clear upgrade path

```typescript
function FeatureCard({ feature, userPlan }: { feature: Feature; userPlan: Plan }) {
  const isLocked = !hasFeatureInPlan(feature, userPlan);
  
  return (
    <View>
      {isLocked && <LockIcon />}
      <Text>{feature.name}</Text>
      {isLocked && <UpgradeButton plan={getMinPlanForFeature(feature)} />}
    </View>
  );
}
```

---

## 🚨 Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token",
    "details": {}
  }
}
```

### Error Handling Implementation

```typescript
// utils/error-handler.ts
export function handleApiError(error: any): string {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data?.error?.message || 'An error occurred. Please try again.';
    }
  }
  
  if (error.request) {
    return 'Network error. Please check your connection.';
  }
  
  return error.message || 'An unexpected error occurred.';
}

// Usage in components
try {
  await apiClient.post('/transfers/submit', data);
} catch (error) {
  const message = handleApiError(error);
  toast.error(message);
}
```

---

## ✅ Integration Checklist

### Setup
- [ ] Configure `API_BASE_URL` in environment variables
- [ ] Create HTTP client with interceptors
- [ ] Set up authentication token storage
- [ ] Configure error handling

### Authentication
- [ ] Implement login flow
- [ ] Implement token refresh
- [ ] Implement logout
- [ ] Handle token expiration

### Core Features
- [ ] Test health check endpoint
- [ ] Implement wallet management
- [ ] Implement balances fetching
- [ ] Implement transfers
- [ ] Implement payments

### Plans & Limits
- [ ] Fetch and display plans
- [ ] Check user's current plan
- [ ] Implement plan activation
- [ ] Check feature availability
- [ ] Validate transaction limits
- [ ] Display rate limit information

### UX/UI
- [ ] Implement loading states
- [ ] Implement error states
- [ ] Add retry mechanisms
- [ ] Show rate limit indicators
- [ ] Display plan-specific features

### Testing
- [ ] Test all endpoints
- [ ] Test error scenarios
- [ ] Test rate limiting
- [ ] Test plan upgrades
- [ ] Test on different network conditions

---

## 📚 Additional Resources

- **Complete Documentation:** `API_ENDPOINTS_FOR_FRONTEND.md`
- **Swagger UI:** `https://hihodl-backend-v-0-1.onrender.com/api/v1/docs`
- **Health Check:** `https://hihodl-backend-v-0-1.onrender.com/api/v1/health`

---

## 🔑 Important Notes

1. **Address Rotation:**
   - **Standard:** NOT available (`addressPoolSize: 0`)
   - **Plus:** Manual only (`address_rotation_manual`)
   - **Premium:** Automatic (`smart_address_rotation`)

2. **Gasless Modes:**
   - `net-deduction`: User pays with the token being sent
   - `partial-sponsor`: HiHODL sponsors part of the gas
   - `full-sponsor`: HiHODL sponsors all gas fees

3. **Rate Limits:**
   - Applied per endpoint and per plan
   - Returns `429 Too Many Requests` when exceeded
   - Headers indicate when limit resets

4. **Transfer Fees:**
   - Calculated automatically based on user's plan
   - Standard: 0.25%, Plus: 0.1%, Premium: 0%

---

**Last Updated:** 2024-11-02  
**Version:** 1.0.0


