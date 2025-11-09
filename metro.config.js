// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// --- IMPORTANTE ---
// 1) Quita "svg" de assetExts
// 2) Añade "svg" a sourceExts
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// 3) Usa el transformer para SVG
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");

// (opcional pero recomendable) Evita sourceExts duplicados
config.resolver.sourceExts = Array.from(new Set(config.resolver.sourceExts));

// --- CONFIGURACIÓN PRIVY (Oficial + Solución Agresiva) ---
const joseBrowserPath = path.join(__dirname, 'node_modules', 'jose', 'dist', 'browser', 'index.js');
const joseBrowserExists = fs.existsSync(joseBrowserPath);

// Función para convertir cualquier ruta de jose/node a jose/browser
function forceJoseBrowser(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  
  // Si la ruta contiene jose/dist/node, reemplazarla
  if (filePath.includes('jose') && filePath.includes('dist/node')) {
    const browserPath = filePath.replace(/dist\/node/g, 'dist/browser');
    if (fs.existsSync(browserPath)) {
      return browserPath;
    }
  }
  
  // Si contiene jose/dist/node/esm, reemplazarla
  if (filePath.includes('jose') && filePath.includes('dist/node/esm')) {
    const browserPath = filePath.replace(/dist\/node\/esm/g, 'dist/browser');
    if (fs.existsSync(browserPath)) {
      return browserPath;
    }
  }
  
  return null;
}

const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  // CRÍTICO: Interceptar jose PRIMERO con múltiples estrategias
  
  // Estrategia 1: Interceptar directamente "jose"
  if (moduleName === "jose") {
    if (joseBrowserExists) {
      return {
        filePath: joseBrowserPath,
        type: 'sourceFile',
      };
    }
  }
  
  // Estrategia 2: Interceptar rutas que contengan jose y node
  if (typeof moduleName === 'string' && moduleName.includes('jose')) {
    const browserPath = forceJoseBrowser(moduleName);
    if (browserPath) {
      return {
        filePath: browserPath,
        type: 'sourceFile',
      };
    }
  }
  
  // Package exports in `isows` (a `viem` dependency) are incompatible
  if (moduleName === "isows") {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Package exports in `zustand@4` are incompatible
  if (moduleName.startsWith("zustand")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Package exports in `jose` - usar browser version
  if (moduleName === "jose") {
    const ctx = {
      ...context,
      unstable_conditionNames: ["browser"],
      unstable_enablePackageExports: true,
    };
    const result = ctx.resolveRequest(ctx, moduleName, platform);
    
    // POST-PROCESAMIENTO: Si el resultado apunta a node, forzar browser
    if (result && result.filePath) {
      const browserPath = forceJoseBrowser(result.filePath);
      if (browserPath) {
        return {
          ...result,
          filePath: browserPath,
        };
      }
    }
    
    return result;
  }

  // Resolver normalmente
  const result = context.resolveRequest(context, moduleName, platform);
  
  // POST-PROCESAMIENTO CRÍTICO: Interceptar CUALQUIER resultado que apunte a jose/node
  if (result && result.filePath) {
    const browserPath = forceJoseBrowser(result.filePath);
    if (browserPath) {
      return {
        ...result,
        filePath: browserPath,
      };
    }
  }
  
  return result;
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

// Alias para forzar jose a versión browser (esto se aplica ANTES de resolveRequest)
if (joseBrowserExists) {
  config.resolver.alias = {
    ...(config.resolver.alias || {}),
    'jose': joseBrowserPath,
  };
}

module.exports = config;
