#!/usr/bin/env ts-node
/**
 * Script para verificar que toda la configuración está lista para testing
 * Uso: npx ts-node scripts/verify-setup.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, passMessage: string, failMessage: string) {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message: condition ? passMessage : failMessage,
  });
}

function checkWarning(name: string, condition: boolean, passMessage: string, warnMessage: string) {
  results.push({
    name,
    status: condition ? 'pass' : 'warning',
    message: condition ? passMessage : warnMessage,
  });
}

async function verifySetup() {
  console.log('🔍 Verificando configuración del proyecto...\n');

  // Check 1: package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  check(
    'package.json existe',
    fs.existsSync(packageJsonPath),
    '✅ package.json encontrado',
    '❌ package.json no encontrado'
  );

  // Check 2: API_URL configuration
  const runtimeConfigPath = path.join(process.cwd(), 'src/config/runtime.ts');
  if (fs.existsSync(runtimeConfigPath)) {
    const runtimeConfig = fs.readFileSync(runtimeConfigPath, 'utf-8');
    const hasApiUrl = runtimeConfig.includes('EXPO_PUBLIC_API_URL');
    check(
      'Configuración de API_URL en runtime.ts',
      hasApiUrl,
      '✅ runtime.ts lee EXPO_PUBLIC_API_URL',
      '❌ runtime.ts no lee EXPO_PUBLIC_API_URL'
    );
  }

  // Check 3: API Client exists
  const apiClientPath = path.join(process.cwd(), 'src/lib/apiClient.ts');
  check(
    'apiClient.ts existe',
    fs.existsSync(apiClientPath),
    '✅ apiClient.ts encontrado',
    '❌ apiClient.ts no encontrado'
  );

  // Check 4: API Services exist
  const servicesDir = path.join(process.cwd(), 'src/services/api');
  const requiredServices = [
    'auth.service.ts',
    'payments.service.ts',
    'transfers.service.ts',
    'wallets.service.ts',
    'balances.service.ts',
  ];

  requiredServices.forEach((service) => {
    const servicePath = path.join(servicesDir, service);
    check(
      `Servicio ${service}`,
      fs.existsSync(servicePath),
      `✅ ${service} existe`,
      `❌ ${service} no encontrado`
    );
  });

  // Check 5: Payment flow files
  const paymentFiles = [
    'app/(drawer)/(internal)/payments/QuickSendScreen.tsx',
    'src/send/api/sendPayment.ts',
    'src/send/api/sendPIXPayment.ts',
    'src/send/api/sendMercadoPagoPayment.ts',
  ];

  paymentFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    check(
      `Archivo ${path.basename(file)}`,
      fs.existsSync(filePath),
      `✅ ${path.basename(file)} existe`,
      `❌ ${path.basename(file)} no encontrado`
    );
  });

  // Check 6: Environment variables (check app.json)
  const appJsonPath = path.join(process.cwd(), 'app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const hasApiUrl = appJson?.expo?.extra?.EXPO_PUBLIC_API_URL !== undefined;
      checkWarning(
        'EXPO_PUBLIC_API_URL en app.json',
        hasApiUrl,
        '✅ EXPO_PUBLIC_API_URL configurado en app.json',
        '⚠️  EXPO_PUBLIC_API_URL no configurado en app.json (debe estar en EAS Secrets)'
      );
    } catch (e) {
      results.push({
        name: 'app.json parse',
        status: 'warning',
        message: '⚠️  No se pudo leer app.json',
      });
    }
  }

  // Check 7: Supabase configuration
  const supabaseConfigPath = path.join(process.cwd(), 'src/lib/supabase.ts');
  check(
    'Configuración de Supabase',
    fs.existsSync(supabaseConfigPath),
    '✅ supabase.ts encontrado',
    '❌ supabase.ts no encontrado'
  );

  // Check 8: Testing documentation
  const testingDocPath = path.join(process.cwd(), 'TESTING_COMPLETO_PRE_LANZAMIENTO.md');
  check(
    'Documentación de testing',
    fs.existsSync(testingDocPath),
    '✅ TESTING_COMPLETO_PRE_LANZAMIENTO.md existe',
    '❌ TESTING_COMPLETO_PRE_LANZAMIENTO.md no encontrado'
  );

  // Print results
  console.log('📋 Resultados:\n');
  console.log('─'.repeat(80));

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name.padEnd(50)} ${result.message}`);
  });

  console.log('─'.repeat(80));

  const passed = results.filter((r) => r.status === 'pass').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ Hay errores que deben corregirse antes de continuar.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Hay advertencias. Revisa la configuración.');
    process.exit(0);
  } else {
    console.log('✅ Toda la configuración básica está correcta.');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Verificar que EXPO_PUBLIC_API_URL está configurado en EAS Secrets o .env');
    console.log('2. Ejecutar: npm start');
    console.log('3. Seguir la guía en TESTING_COMPLETO_PRE_LANZAMIENTO.md');
  }
}

// Run verification
verifySetup().catch((error) => {
  console.error('❌ Error ejecutando verificación:', error);
  process.exit(1);
});



