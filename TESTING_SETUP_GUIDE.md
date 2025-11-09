# 🧪 Guía de Setup de Testing

## 📋 Estado Actual

- ❌ No hay tests implementados
- ❌ No hay framework configurado
- ✅ TypeScript configurado (base para tests)

---

## 🚀 Setup Inicial

### 1. Instalar Dependencias

```bash
npm install --save-dev \
  jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  @testing-library/user-event \
  jest-expo \
  @types/jest
```

### 2. Configurar Jest

Crear `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

### 3. Agregar Scripts a package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## 📝 Primeros Tests a Crear

### Prioridad 1: Lógica Crítica

#### 1. Vault Encryption (`__tests__/lib/vault.test.ts`)

```typescript
import { createOrUnlockVault, changePassphrase } from '@/lib/vault';

describe('Vault', () => {
  it('should create vault with mnemonic', async () => {
    const { mnemonic, created } = await createOrUnlockVault(
      'test-uid',
      'test-passphrase',
      () => 'test mnemonic phrase'
    );
    
    expect(created).toBe(true);
    expect(mnemonic).toBe('test mnemonic phrase');
  });

  it('should unlock existing vault', async () => {
    // Test unlock
  });
});
```

#### 2. Crypto Utilities (`__tests__/lib/crypto.test.ts`)

```typescript
import { scryptKey, aesGcmEncrypt, aesGcmDecrypt } from '@/lib/crypto';

describe('Crypto', () => {
  it('should encrypt and decrypt correctly', async () => {
    const key = await scryptKey('password', new Uint8Array(16), { N: 16384, r: 8, p: 1 });
    const data = new TextEncoder().encode('secret');
    const { iv, ct } = await aesGcmEncrypt(key, data);
    const decrypted = await aesGcmDecrypt(key, iv, ct);
    
    expect(new TextDecoder().decode(decrypted)).toBe('secret');
  });
});
```

#### 3. Auth Utilities (`__tests__/utils/auth-errors.test.ts`)

```typescript
import { normalizeAuthError, getAuthErrorMessage } from '@/utils/auth-errors';

describe('Auth Errors', () => {
  it('should normalize invalid credentials error', () => {
    const error = { message: 'Invalid login credentials', status: 401 };
    const normalized = normalizeAuthError(error);
    
    expect(normalized.code).toBe('INVALID_CREDENTIALS');
    expect(normalized.message).toContain('Invalid email or password');
  });
});
```

#### 4. Stores (`__tests__/store/auth.test.ts`)

```typescript
import { useAuthStore } from '@/store/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should set user correctly', () => {
    const mockUser = { id: '123', email: 'test@test.com' };
    const mockSession = { access_token: 'token', user: mockUser };
    
    useAuthStore.getState().setUser(mockUser, mockSession, 'email');
    
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

### Prioridad 2: Hooks

#### 5. Custom Hooks (`__tests__/hooks/useAccount.test.ts`)

```typescript
import { renderHook } from '@testing-library/react-native';
import { useAccount } from '@/hooks/useAccountNavigation';

describe('useAccount', () => {
  it('should return Daily for undefined', () => {
    const { result } = renderHook(() => useAccount());
    expect(result.current).toBe('Daily');
  });

  it('should map account IDs correctly', () => {
    const { result } = renderHook(() => useAccount('savings'));
    expect(result.current).toBe('Savings');
  });
});
```

### Prioridad 3: Utilities

#### 6. Formatters (`__tests__/utils/dashboard/formatting.test.ts`)

```typescript
import { formatCurrency, formatRelativeDate } from '@/utils/dashboard/formatting';

describe('Formatting', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
  });

  it('should format dates correctly', () => {
    const today = new Date();
    expect(formatRelativeDate(today)).toBe('Today');
  });
});
```

---

## 🎯 Coverage Goals

### Mínimo para Producción (60%):
- ✅ Lógica de cifrado: 90%+
- ✅ Stores: 80%+
- ✅ Hooks críticos: 70%+
- ✅ Utilities: 70%+
- ✅ Componentes: 40%+ (UI menos crítico)

### Ideal (80%+):
- Todo lo anterior: 80%+
- Componentes: 60%+
- Flujos completos: 50%+

---

## 📦 Estructura de Tests

```
__tests__/
├── lib/
│   ├── vault.test.ts
│   ├── crypto.test.ts
│   └── supabase.test.ts
├── store/
│   ├── auth.test.ts
│   └── session.test.ts
├── hooks/
│   ├── useAccount.test.ts
│   └── useAuthGuard.test.ts
├── utils/
│   ├── auth-errors.test.ts
│   └── logger.test.ts
└── components/
    └── ErrorBoundary.test.tsx
```

---

## 🧪 Testing Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('should do something', () => {
  // Arrange
  const input = 'test';
  
  // Act
  const result = processInput(input);
  
  // Assert
  expect(result).toBe('expected');
});
```

### 2. Mock External Dependencies

```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));
```

### 3. Test Edge Cases

```typescript
it('should handle empty input', () => {
  expect(processInput('')).toBeNull();
});

it('should handle null input', () => {
  expect(() => processInput(null)).toThrow();
});
```

---

## 🚀 Comandos

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (single run, no watch)
npm run test:ci
```

---

## 📚 Próximos Pasos

1. **Esta semana:**
   - Setup Jest
   - Tests para vault/crypto
   - Tests para stores

2. **Siguiente semana:**
   - Tests para hooks
   - Tests para utilities
   - Coverage a 60%

3. **Largo plazo:**
   - Integration tests
   - E2E tests (si es necesario)
   - Coverage a 80%+

