#!/usr/bin/env ts-node
/**
 * Script para verificar conexión con todas las APIs
 * Uso: npx ts-node scripts/test-api-connection.ts
 */

import { API_URL } from '../src/config/runtime';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  responseTime?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  method: 'GET' | 'POST',
  path: string,
  body?: any,
  skipAuth = false
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${API_URL}${path}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // TODO: Agregar autenticación si es necesario
    // if (!skipAuth) {
    //   headers['Authorization'] = `Bearer ${token}`;
    // }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        endpoint: path,
        status: 'success',
        message: `✅ ${response.status} ${response.statusText}`,
        responseTime,
      };
    } else {
      return {
        endpoint: path,
        status: 'error',
        message: `❌ ${response.status} ${response.statusText}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint: path,
      status: 'error',
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      responseTime,
    };
  }
}

async function runTests() {
  console.log('🧪 Testing API Connection\n');
  console.log(`API URL: ${API_URL || 'NOT CONFIGURED'}\n`);

  if (!API_URL) {
    console.error('❌ EXPO_PUBLIC_API_URL no está configurado');
    console.log('\nPara configurar:');
    console.log('1. Crear archivo .env con: EXPO_PUBLIC_API_URL=https://api.hihodl.xyz/api/v1');
    console.log('2. O configurar en EAS Secrets');
    process.exit(1);
  }

  // Health checks (no requieren auth)
  console.log('📊 Health Checks...');
  results.push(await testEndpoint('GET', '/health', undefined, true));
  results.push(await testEndpoint('GET', '/health/db', undefined, true));

  // Auth endpoints (requieren configuración especial)
  console.log('\n🔐 Auth Endpoints (requieren token)...');
  // Estos tests se saltan por ahora ya que requieren autenticación
  results.push({
    endpoint: '/auth/supabase',
    status: 'skipped',
    message: '⏭️  Requiere token de Supabase',
  });

  // Wallets
  console.log('\n💼 Wallet Endpoints...');
  results.push({
    endpoint: '/wallets',
    status: 'skipped',
    message: '⏭️  Requiere autenticación',
  });

  // Balances
  console.log('\n💰 Balance Endpoints...');
  results.push({
    endpoint: '/balances',
    status: 'skipped',
    message: '⏭️  Requiere autenticación',
  });

  // Payments
  console.log('\n💳 Payment Endpoints...');
  results.push({
    endpoint: '/payments/send',
    status: 'skipped',
    message: '⏭️  Requiere autenticación',
  });

  // Print results
  console.log('\n📋 Results:\n');
  console.log('─'.repeat(80));

  const success = results.filter((r) => r.status === 'success').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  results.forEach((result) => {
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    console.log(`${result.endpoint.padEnd(40)} ${result.message}${time}`);
  });

  console.log('─'.repeat(80));
  console.log(`\n✅ Success: ${success}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (errors > 0) {
    console.log('⚠️  Algunos endpoints fallaron. Revisa la configuración.');
    process.exit(1);
  } else if (success === 0) {
    console.log('⚠️  No se pudo probar ningún endpoint. Verifica la configuración.');
    process.exit(1);
  } else {
    console.log('✅ Conexión básica con el backend funciona.');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Error ejecutando tests:', error);
  process.exit(1);
});



