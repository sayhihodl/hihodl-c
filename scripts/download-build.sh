#!/bin/bash
# Script para descargar builds de EAS
# Uso: ./scripts/download-build.sh [android|ios] [build-id]

PLATFORM=${1:-android}
BUILD_ID=${2:-latest}

echo "📥 Descargando build de $PLATFORM..."
echo ""

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI no está instalado. Instalando..."
    npm install -g eas-cli
fi

# Verificar que estás logueado
echo "Verificando login en EAS..."
if ! eas whoami &> /dev/null; then
    echo "❌ No estás logueado. Ejecuta: eas login"
    exit 1
fi

echo ""
echo "📋 Opciones para descargar el build:"
echo ""
echo "1. 🌐 Dashboard Web (RECOMENDADO):"
echo "   Abre: https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds"
echo "   - Inicia sesión si es necesario"
echo "   - Busca el build más reciente"
echo "   - Haz clic en 'Download' junto al build"
echo ""
echo "2. 📱 Ver builds disponibles:"
echo "   Ejecuta: eas build:list --platform $PLATFORM --limit 5"
echo ""
echo "3. 🔗 Link directo (requiere estar autenticado en el navegador):"
echo "   - Primero inicia sesión en: https://expo.dev"
echo "   - Luego abre el link del build en el mismo navegador"
echo ""

# Mostrar builds recientes
echo "📦 Builds recientes de $PLATFORM:"
echo ""
eas build:list --platform $PLATFORM --limit 3 --non-interactive

echo ""
echo "💡 Para descargar desde el dashboard:"
echo "   1. Ve a: https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds"
echo "   2. Busca el build que quieres descargar"
echo "   3. Haz clic en el botón 'Download' o en el link del artifact"
echo ""

