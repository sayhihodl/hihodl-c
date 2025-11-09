#!/bin/bash
# Script para configurar todas las variables de entorno en EAS Secrets
# Uso: ./scripts/setup-eas-secrets.sh

echo "🔐 Configurando EAS Secrets..."
echo ""

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI no está instalado. Instalando..."
    npm install -g eas-cli
fi

# Verificar que estás logueado
echo "Verificando login en EAS..."
eas whoami || {
    echo "❌ No estás logueado. Ejecuta: eas login"
    exit 1
}

echo ""
echo "📝 Configurando variables de entorno..."
echo ""

# Leer variables del .env de forma segura
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado"
    exit 1
fi

# Función para leer valor del .env de forma segura
get_env_value() {
    local key=$1
    grep "^${key}=" .env | cut -d '=' -f2- | sed 's/^"//;s/"$//' | head -1
}

# Función para crear secret usando el nuevo comando
create_secret() {
    local name=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo "⚠️  Saltando $name (valor vacío)"
        return
    fi
    
    echo "Configurando $name..."
    # Variables EXPO_PUBLIC_* deben usar plaintext (son públicas en el bundle)
    # Otras variables pueden usar sensitive o secret
    if [[ "$name" == EXPO_PUBLIC_* ]]; then
        visibility="plaintext"
    else
        visibility="sensitive"
    fi
    
    # Usar el nuevo comando eas env:create
    eas env:create --name "$name" --value "$value" --type string --visibility "$visibility" --scope project --environment production --non-interactive --force 2>/dev/null || {
        echo "⚠️  Error al configurar $name (puede que ya exista o necesite actualización)"
        echo "   Intenta manualmente: eas env:create --name $name --value \"...\" --type string --visibility $visibility --scope project --environment production"
    }
}

# Leer y configurar todas las variables
SUPABASE_URL=$(get_env_value "EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_KEY=$(get_env_value "EXPO_PUBLIC_SUPABASE_ANON_KEY")
GOOGLE_WEB=$(get_env_value "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")
GOOGLE_IOS=$(get_env_value "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID")
GOOGLE_ANDROID=$(get_env_value "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID")
ALCHEMY=$(get_env_value "EXPO_PUBLIC_ALCHEMY_API_KEY")
HELIUS=$(get_env_value "EXPO_PUBLIC_HELIUS_API_KEY")
API_URL=$(get_env_value "EXPO_PUBLIC_API_URL")
PRIVY_APP=$(get_env_value "EXPO_PUBLIC_PRIVY_APP_ID")
PRIVY_CLIENT=$(get_env_value "EXPO_PUBLIC_PRIVY_CLIENT_ID")

# Configurar todas las variables
create_secret "EXPO_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
create_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_KEY"
create_secret "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" "$GOOGLE_WEB"
create_secret "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" "$GOOGLE_IOS"
create_secret "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID" "$GOOGLE_ANDROID"
create_secret "EXPO_PUBLIC_ALCHEMY_API_KEY" "$ALCHEMY"
create_secret "EXPO_PUBLIC_HELIUS_API_KEY" "$HELIUS"
create_secret "EXPO_PUBLIC_API_URL" "$API_URL"
create_secret "EXPO_PUBLIC_PRIVY_APP_ID" "$PRIVY_APP"
create_secret "EXPO_PUBLIC_PRIVY_CLIENT_ID" "$PRIVY_CLIENT"

echo ""
echo "✅ Proceso completado"
echo ""
echo "📋 Verificar con: eas env:list"
echo ""
echo "💡 Si alguna variable falló, configúrala manualmente:"
echo "   eas env:create --name VARIABLE_NAME --type secret --scope project"

