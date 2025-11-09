// src/types/api.ts
// TypeScript types for Backend API responses and requests

/**
 * Standard API response format from backend
 * All endpoints return: { success: true, data: T } or { success: false, error: ApiError }
 */
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * Standard API error format
 */
export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

/**
 * Standard API error codes
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_BALANCE'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

// ============================================================================
// Auth & Users Types
// ============================================================================

export type User = {
  id: string;
  supabaseUid: string;
  email: string;
  profile?: {
    displayName?: string;
    country?: string;
    plan?: 'free' | 'plus' | 'pro';
  };
};

export type UserProfile = {
  displayName?: string;
  country?: string;
  plan?: 'free' | 'plus' | 'pro';
};

export type AuthTokenResponse = {
  token: string;
  user: User;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

// ============================================================================
// Passkeys Types
// ============================================================================

export type PasskeyRegisterBeginRequest = {
  email: string;
  userId?: string;
};

export type PasskeyRegisterBeginResponse = {
  publicKey: {
    rp: { name: string; id: string };
    user: { id: string; name: string };
    challenge: string;
    timeout: number;
    authenticatorSelection: {
      authenticatorAttachment: 'platform';
      userVerification: 'required';
      requireResidentKey: boolean;
    };
  };
};

export type PasskeyRegisterCompleteRequest = {
  credential: {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      attestationObject: string;
    };
    type: 'public-key';
  };
};

export type PasskeyRegisterCompleteResponse = {
  credentialId: string;
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
  };
};

export type PasskeyLoginBeginRequest = {
  email: string;
};

export type PasskeyLoginBeginResponse = {
  publicKey: {
    challenge: string;
    timeout: number;
    rpId: string;
    allowCredentials: Array<{ id: string; type: 'public-key' }>;
    userVerification: 'required';
  };
};

export type PasskeyLoginCompleteRequest = {
  assertion: {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      authenticatorData: string;
      signature: string;
      userHandle: string;
    };
    type: 'public-key';
  };
};

export type PasskeyLoginCompleteResponse = {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
  };
};

export type Passkey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
};

export type PasskeyListResponse = {
  passkeys: Passkey[];
};

// ============================================================================
// Wallets & Addresses Types
// ============================================================================

export type Wallet = {
  id: string;
  userId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  address: string;
  label?: string;
  createdAt: string;
};

export type LinkWalletRequest = {
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  address: string;
  label?: string;
};

export type WalletsListResponse = {
  wallets: Wallet[];
};

export type ReceiveAddressRequest = {
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  token?: string;
  reuse_policy?: 'current' | 'new';
  account?: 'daily' | 'savings' | 'social';
};

export type ReceiveAddressResponse = {
  address: string;
  address_id: string;
  expires_at?: string;
  provision_more?: boolean;
};

export type BatchAddressesRequest = {
  addresses: string[];
};

export type BatchAddressesResponse = {
  provisioned: number;
};

// ============================================================================
// Balances & Prices Types
// ============================================================================

export type Balance = {
  tokenId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  amount: string;
  account: 'daily' | 'savings' | 'social';
  rawAmount: string;
};

export type BalancesResponse = {
  balances: Balance[];
  updatedAt: string;
};

export type Price = {
  symbol: string;
  price: number;
  fiat: string;
  updatedAt: string;
};

export type PricesResponse = {
  prices: Price[];
};

export type PriceHistoryResponse = {
  symbol: string;
  prices: Array<{
    timestamp: number;
    price: number;
  }>;
};

// ============================================================================
// Transfers Types
// ============================================================================

export type TokenRef = 
  | { chain: 'sol'; mint: string }
  | { chain: 'eth' | 'base' | 'polygon'; contract?: string };

export type TransferQuoteRequest = {
  fromWalletId: string;
  to: string; // address or @username
  token: TokenRef;
  amount: string;
};

export type TransferQuoteResponse = {
  estimatedFee: string;
  estimatedTime: string;
  canProceed: boolean;
  errors: string[];
};

export type TransferSubmitRequest = {
  fromWalletId: string;
  to: string; // address or @username
  token: TokenRef;
  amount: string;
  account: 'daily' | 'savings' | 'social';
  autoBridge?: {
    plan: Array<{ chain: 'eth' | 'base' | 'polygon' | 'sol'; amount: string }>;
    sourceChains: ('eth' | 'base' | 'polygon' | 'sol')[];
  };
};

export type TransferSubmitResponse = {
  transferId: string;
  status: 'queued';
  estimatedTime: string;
};

export type Transfer = {
  id: string;
  userId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  tokenId: string;
  amount: string;
  fromWalletId: string;
  toAddress: string;
  status: 'confirmed' | 'pending' | 'failed';
  txHash?: string;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransferDetails = Transfer & {
  fromWallet?: Wallet;
  idempotencyKey?: string;
  inbound?: {
    confirmations: number;
    confirmedAt: string;
    fromAddress: string;
    tokenId: string;
    amount: string;
  };
};

export type TransfersListResponse = {
  transfers: Transfer[];
  total: number;
  hasMore: boolean;
};

export type TransferSummaryResponse = {
  range: string;
  period: {
    start: string;
    end: string;
  };
  totalSent: string;
  totalReceived: string;
  totalFees: string;
  countSent: number;
  countReceived: number;
  topTokens: Array<{ token: string; amount: string }>;
  topRecipients: Array<{ address: string; count: number }>;
};

// ============================================================================
// Payments Types
// ============================================================================

export type PaymentSendRequest = {
  to: string; // address or @username
  tokenId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  amount: string;
  account: 'daily' | 'savings' | 'social';
  autoBridge?: unknown;
};

export type PaymentSendResponse = {
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  ts: number;
  fee?: string;
};

export type PaymentRequestCreateRequest = {
  from: string; // @username
  tokenId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  amount: string;
  account: 'daily' | 'savings' | 'social';
};

export type PaymentRequestCreateResponse = {
  requestId: string;
  status: 'requested';
  ts: number;
};

export type PIXSendRequest = {
  pixKey: string;
  amount: string;
  description?: string;
  merchantName?: string;
  account: 'daily' | 'savings' | 'social';
  reference?: string;
};

export type PIXSendResponse = {
  pixId: string;
  status: 'pending' | 'confirmed' | 'failed';
  ts: number;
  fee?: string;
  endToEndId?: string;
  qrCode?: string;
};

export type PIXConvertRequest = {
  amount: string;
  tokenId: string;
};

export type PIXConvertResponse = {
  brlAmount: string;
  rate: number;
};

export type MercadoPagoSendRequest = {
  amount: string;
  currency?: string; // default: ARS
  account: 'daily' | 'savings' | 'social';
};

export type MercadoPagoSendResponse = {
  paymentId: string;
  status: 'pending' | 'confirmed' | 'failed';
  ts: number;
};

export type MercadoPagoConvertRequest = {
  amount: string;
  fromCurrency: string;
  toCurrency: string;
};

export type MercadoPagoConvertResponse = {
  convertedAmount: string;
  rate: number;
};

// ============================================================================
// Relayers (Gasless) Types
// ============================================================================

export type RelayerSolanaQuoteRequest = {
  from: string;
  to: string;
  tokenId: string;
  amount: string;
  sponsored?: boolean;
};

export type RelayerSolanaQuoteResponse = {
  estimatedGasUSD: string;
  rebateUSDC: string;
  sponsored: boolean;
};

export type RelayerSolanaSubmitRequest = {
  transaction: string; // base64
  from: string;
  to: string;
  tokenId: string;
  amount: string;
};

export type RelayerSolanaSubmitResponse = {
  signature: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
};

export type RelayerSolanaTxResponse = {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  slot: number;
};

export type RelayerEVMQuoteRequest = {
  chain: 'eth' | 'base' | 'polygon';
  from: string;
  to: string;
  tokenId: string;
  amount: string;
  sponsored?: boolean;
};

export type RelayerEVMQuoteResponse = {
  estimatedGasUSD: string;
  rebateUSDC: string;
  sponsored: boolean;
};

export type RelayerEVMSubmitRequest = {
  chain: 'eth' | 'base' | 'polygon';
  transaction: string;
  from: string;
  to: string;
  tokenId: string;
  amount: string;
};

export type RelayerEVMSubmitResponse = {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
};

export type RelayerEVMTxResponse = {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber: number;
};

// ============================================================================
// Accounts & Rotation Types
// ============================================================================

export type Account = {
  id: string;
  userId: string;
  type: 'daily' | 'savings' | 'social';
  createdAt: string;
};

export type AccountsResponse = {
  accounts: Account[];
};

export type CreateAccountRequest = {
  type: 'daily' | 'savings' | 'social';
};

export type RotationActiveResponse = {
  address: string;
  addressId: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  state: 'active';
};

export type RotationRotateResponse = {
  oldAddress: string;
  newAddress: string;
  rotatedAt: string;
};

export type RotationRegisterBatchRequest = {
  addresses: string[];
  nonce?: string;
};

export type RotationRegisterBatchResponse = {
  registered: number;
};

// ============================================================================
// Alias Types
// ============================================================================

export type CreateAliasRequest = {
  alias: string; // @username
  targetChain: 'eth' | 'base' | 'polygon' | 'sol';
  targetAddress: string;
};

export type Alias = {
  id: string;
  userId: string;
  alias: string;
  targetChain: 'eth' | 'base' | 'polygon' | 'sol';
  targetAddress: string;
};

export type ResolveAliasResponse = {
  alias: string;
  targetChain: 'eth' | 'base' | 'polygon' | 'sol';
  targetAddress: string;
  resolvedAt: string;
};

// ============================================================================
// Search & Discovery Types
// ============================================================================

export type SearchUsersResponse = {
  users: Array<{
    id: string;
    alias?: string;
    email?: string;
  }>;
};

export type SearchTokensResponse = {
  tokens: Array<{
    symbol: string;
    name: string;
    chains: ('eth' | 'base' | 'polygon' | 'sol')[];
  }>;
};

// ============================================================================
// Contacts Types
// ============================================================================

export type Contact = {
  id: string;
  userId: string;
  name: string;
  address: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
  createdAt: string;
};

export type ContactsResponse = {
  contacts: Contact[];
};

export type CreateContactRequest = {
  name: string;
  address: string;
  chain: 'eth' | 'base' | 'polygon' | 'sol';
};

// ============================================================================
// Settings Types
// ============================================================================

export type Settings = {
  notifications: boolean;
  currency: string;
  language: string;
  twoFactorEnabled?: boolean;
};

export type SettingsLimitsResponse = {
  plan: 'free' | 'plus' | 'pro';
  limits: {
    perTxUSD: number;
    dailyUSD: number;
    monthlyUSD: number;
    gaslessCreditUSD: number;
  };
  fees: {
    transferRate: number;
    gaslessMode: string;
  };
};

// ============================================================================
// Security & Sessions Types
// ============================================================================

export type Session = {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'web';
  lastActiveAt: string;
  currentSession?: boolean;
  userAgent?: string;
  ip?: string;
  createdAt?: string;
  expiresAt?: string;
};

export type SessionsResponse = {
  sessions: Session[];
  totalActive: number;
};

export type RevokeAllSessionsRequest = {
  password: string;
};

export type RevokeAllSessionsResponse = {
  revoked: number;
  message: string;
};

export type PepperResponse = {
  pepper: string; // base64
  algorithm: string;
  version: number;
};

// ============================================================================
// Plans & Limits Types
// ============================================================================

export type Plan = {
  id: 'free' | 'plus' | 'pro';
  name: string;
  limits: {
    perTxUSD: number;
    dailyUSD: number;
    monthlyUSD: number;
    gaslessCreditUSD: number;
  };
  gaslessMode: string;
};

export type PlansResponse = {
  plans: Plan[];
};

export type CreateSubscriptionRequest = {
  planId: 'standard' | 'plus' | 'premium' | 'metal';
  kycData?: {
    fullName?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    idDocument?: string;
  };
};

export type CreateSubscriptionResponse = {
  subscriptionId: string;
  planId: 'standard' | 'plus' | 'premium' | 'metal';
  status: 'pending' | 'active';
  createdAt: string;
};

export type ActivatePlanRequest = {
  planId: 'plus' | 'pro';
};

export type ActivatePlanResponse = {
  planId: 'plus' | 'pro';
  activatedAt: string;
};

export type LimitsResponse = {
  plan: 'free' | 'plus' | 'pro';
  limits: {
    perTxUSD: number;
    dailyUSD: number;
    monthlyUSD: number;
    gaslessCreditUSD: number;
  };
  remaining: {
    dailyUSD: number;
    monthlyUSD: number;
    gaslessCreditUSD: number;
  };
};

// ============================================================================
// Notifications Types
// ============================================================================

export type SubscribePushRequest = {
  token: string; // FCM or Expo token
  platform: 'ios' | 'android' | 'web';
};

export type SubscribePushResponse = {
  deviceTokenId: string;
  subscribedAt: string;
};

// ============================================================================
// Proofs & Statements Types
// ============================================================================

export type CreateProofRequest = {
  transferId: string;
  type: 'payment' | 'receipt';
};

export type Proof = {
  id: string;
  transferId: string;
  type: 'payment' | 'receipt';
  data?: unknown;
  createdAt: string;
};

export type Statement = {
  id: string;
  period: string;
  totalIn: string;
  totalOut: string;
  createdAt: string;
};

export type StatementsResponse = {
  month: string;
  statements: Statement[];
};

// ============================================================================
// Analytics & Diagnostics Types
// ============================================================================

export type PaymentDiagnosticsResponse = {
  canSend: boolean;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    solution: string;
  }>;
  alternatives?: Array<{
    chain: 'eth' | 'base' | 'polygon' | 'sol';
    available: boolean;
  }>;
};

export type AnalyticsEventRequest = {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
};

export type AnalyticsEventResponse = {
  tracked: boolean;
};

// ============================================================================
// Health & Metrics Types
// ============================================================================

export type HealthResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
};

export type HealthFullResponse = {
  database: { status: string; latency: number };
  redis: { status: string; latency: number };
  solanaRpc: { status: string };
  evmRpcs: {
    ethereum: { status: string };
    base: { status: string };
    polygon: { status: string };
  };
  memory: { used: string; total: string };
};

// ============================================================================
// Common Types
// ============================================================================

export type ChainKey = 'eth' | 'base' | 'polygon' | 'sol';
export type AccountType = 'daily' | 'savings' | 'social';
export type TransferStatus = 'pending' | 'confirmed' | 'failed';
export type PlanType = 'free' | 'plus' | 'pro';

// ============================================================================
// Stable Cards Types
// ============================================================================

export type StableCard = {
  id: string;
  walletId: string;
  account: AccountType;
  last4: string;
  expirationMonth: string;
  expirationYear: string;
  type: 'virtual' | 'physical';
  status: 'active' | 'frozen' | 'cancelled' | 'pending';
  provider: 'lithic' | 'stripe' | 'rain';
  brand: 'VISA' | 'MASTERCARD';
  label?: string;
  limit?: {
    amount: string;
    frequency: 'per24HourPeriod' | 'perMonth' | 'perTransaction';
  };
  createdAt: string;
  updatedAt: string;
};

export type StableCardsResponse = {
  cards: StableCard[];
};

export type CreateStableCardRequest = {
  walletId: string;
  account: AccountType;
  type: 'virtual' | 'physical';
  provider?: 'lithic' | 'stripe' | 'rain';
  label?: string;
};

export type CreateStableCardResponse = {
  card: StableCard;
};

export type StableCardDetailsResponse = {
  card: StableCard;
  secrets?: {
    panFull?: string;
    exp?: string;
    cvv?: string;
  };
};

export type FreezeStableCardRequest = {
  freeze: boolean;
};

export type FreezeStableCardResponse = {
  card: StableCard;
};

export type RevealStableCardSecretsResponse = {
  panFull: string;
  exp: string;
  cvv: string;
};

