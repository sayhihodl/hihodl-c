#!/bin/bash
# Script para descargar builds de EAS con autenticación
# Uso: ./scripts/download-build-auth.sh [android|ios] [build-id]

PLATFORM=${1:-android}
BUILD_ID=${2:-latest}

echo "📥 Descargando build de $PLATFORM..."
echo ""

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI no está instalado."
    exit 1
fi

# Verificar que estás logueado
if ! eas whoami &> /dev/null; then
    echo "❌ No estás logueado. Ejecuta: eas login"
    exit 1
fi

echo "✅ Autenticado como: $(eas whoami 2>/dev/null | head -1)"
echo ""

# Obtener información del build
echo "📋 Buscando builds de $PLATFORM..."
BUILD_INFO=$(eas build:list --platform $PLATFORM --limit 1 --non-interactive 2>/dev/null)

if [ -z "$BUILD_INFO" ]; then
    echo "❌ No se encontraron builds de $PLATFORM"
    exit 1
fi

BUILD_ID=$(echo "$BUILD_INFO" | grep "^ID" | awk '{print $2}')
BUILD_URL=$(echo "$BUILD_INFO" | grep "Application Archive URL" | awk '{print $4}')

if [ -z "$BUILD_ID" ] || [ -z "$BUILD_URL" ]; then
    echo "❌ No se pudo obtener información del build"
    echo ""
    echo "📋 Builds disponibles:"
    eas build:list --platform $PLATFORM --limit 5 --non-interactive
    exit 1
fi

echo "✅ Build encontrado:"
echo "   ID: $BUILD_ID"
echo "   URL: $BUILD_URL"
echo ""

# Determinar extensión del archivo
if [ "$PLATFORM" = "android" ]; then
    EXT="aab"
    FILENAME="hihodl-production-android.aab"
else
    EXT="ipa"
    FILENAME="hihodl-production-ios.ipa"
fi

echo "💡 SOLUCIÓN AL ERROR 403:"
echo ""
echo "El problema es que los links requieren autenticación en el NAVEGADOR."
echo ""
echo "Pasos para descargar:"
echo ""
echo "1. 🌐 Abre este link en tu navegador (mientras estás logueado en expo.dev):"
echo "   $BUILD_URL"
echo ""
echo "2. 🔐 Si no estás logueado en el navegador:"
echo "   a) Ve a: https://expo.dev"
echo "   b) Inicia sesión con tu cuenta: sayhihodl"
echo "   c) Luego abre el link del build"
echo ""
echo "3. 📱 Alternativa - Dashboard Web:"
echo "   https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds"
echo "   - Busca el build con ID: $BUILD_ID"
echo "   - Haz clic en 'Download'"
echo ""
echo "4. 🔄 Si el problema persiste, intenta:"
echo "   - Cerrar todas las pestañas de expo.dev"
echo "   - Limpiar cookies del navegador para expo.dev"
echo "   - Iniciar sesión nuevamente en expo.dev"
echo "   - Abrir el link del build"
echo ""

