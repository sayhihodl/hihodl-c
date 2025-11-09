# 🔐 Configuración de Privy

## Información de la App

- **App ID**: `cmhqg199a000tl70ca9h3i1pu`
- **Client ID**: `client-WY6SW4RmsPB8PycfQo73oTiGao63hkxP7AmThmF3NyzGg`
- **JWKS Endpoint**: `https://auth.privy.io/api/v1/apps/cmhqg199a000tl70ca9h3i1pu/jwks.json`

## Configuración Actual

### Frontend (React Native/Expo)

- **Provider**: `PrivyAuthProvider` en `src/auth/PrivyAuthProvider.tsx`
- **Integración**: Custom Auth con Supabase
- **Método**: JWT-based authentication usando tokens de Supabase

### Variables de Entorno

```env
EXPO_PUBLIC_PRIVY_APP_ID=cmhqg199a000tl70ca9h3i1pu
EXPO_PUBLIC_PRIVY_CLIENT_ID=client-WY6SW4RmsPB8PycfQo73oTiGao63hkxP7AmThmF3NyzGg
```

**Nota**: El Client ID se usa principalmente en el backend para verificación de tokens y llamadas a la API de Privy. En React Native con Custom Auth, el App ID es suficiente para el frontend.

## Verificación de Tokens en Backend

Para verificar tokens de Privy en tu backend, usa el JWKS endpoint:

### Node.js/Express Ejemplo

```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const PRIVY_APP_ID = 'cmhqg199a000tl70ca9h3i1pu';
const PRIVY_CLIENT_ID = 'client-WY6SW4RmsPB8PycfQo73oTiGao63hkxP7AmThmF3NyzGg';
const JWKS_URI = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`;

const client = jwksClient({
  jwksUri: JWKS_URI
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function verifyPrivyToken(token: string) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      algorithms: ['ES256']
    }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}

// Ejemplo de uso del Client ID para llamadas a la API de Privy
export async function getPrivyUser(userId: string) {
  const response = await fetch(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${PRIVY_CLIENT_ID}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### Python Ejemplo

```python
import jwt
from jwt import PyJWKClient

jwks_client = PyJWKClient('https://auth.privy.io/api/v1/apps/cmhqg199a000tl70ca9h3i1pu/jwks.json')

def verify_privy_token(token: str):
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256"]
    )
```

## Flujo de Autenticación

1. Usuario se autentica con **Supabase** (email, Google, Apple, etc.)
2. Supabase genera JWT token
3. `PrivyAuthProvider` obtiene el token via `getCustomAccessToken()`
4. Privy sincroniza estado y crea/actualiza usuario en su sistema
5. Privy emite su propio token (si es necesario para el backend)
6. Backend puede verificar tokens de Privy usando el JWKS endpoint

## Referencias

- [Privy Docs - Using Your Own Authentication](https://docs.privy.io/guides/authentication/using-your-own-authentication)
- [Privy Dashboard](https://dashboard.privy.io/)
- [JWKS Endpoint](https://auth.privy.io/api/v1/apps/cmhqg199a000tl70ca9h3i1pu/jwks.json)

