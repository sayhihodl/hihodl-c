#!/bin/bash
# Script para verificar que las URLs legales existen
# Uso: ./scripts/check-legal-urls.sh

echo "🔍 Verificando URLs legales..."
echo ""

PRIVACY_URL="https://hihodl.xyz/privacy"
TERMS_URL="https://hihodl.xyz/terms"

check_url() {
    local url=$1
    local name=$2
    
    echo "Verificando $name: $url"
    
    # Usar -L para seguir redirects y verificar la URL final
    response=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    final_url=$(curl -sL -o /dev/null -w "%{url_effective}" --max-time 10 "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ $name está disponible (HTTP $response)"
        if [ "$final_url" != "$url" ]; then
            echo "   (Redirige a: $final_url)"
        fi
        return 0
    elif [ "$response" = "308" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        # Redirect permanente o temporal - verificar si la URL final funciona
        if [ -n "$final_url" ] && [ "$final_url" != "$url" ]; then
            final_response=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 10 "$final_url" 2>/dev/null)
            if [ "$final_response" = "200" ]; then
                echo "✅ $name está disponible (HTTP $response → $final_response)"
                echo "   (Redirige a: $final_url)"
                return 0
            else
                echo "⚠️  $name redirige pero la URL final no funciona (HTTP $final_response)"
                return 1
            fi
        else
            echo "⚠️  $name responde con HTTP $response (redirect sin URL final)"
            return 1
        fi
    elif [ "$response" = "000" ]; then
        echo "❌ $name NO está disponible (no responde o timeout)"
        return 1
    else
        echo "⚠️  $name responde con HTTP $response"
        return 1
    fi
}

privacy_ok=false
terms_ok=false

check_url "$PRIVACY_URL" "Privacy Policy" && privacy_ok=true
check_url "$TERMS_URL" "Terms of Service" && terms_ok=true

echo ""
if [ "$privacy_ok" = true ] && [ "$terms_ok" = true ]; then
    echo "✅ Todas las URLs legales están disponibles"
    exit 0
else
    echo "❌ Algunas URLs legales no están disponibles"
    echo ""
    echo "Acción requerida:"
    if [ "$privacy_ok" = false ]; then
        echo "- Crear o actualizar: $PRIVACY_URL"
    fi
    if [ "$terms_ok" = false ]; then
        echo "- Crear o actualizar: $TERMS_URL"
    fi
    exit 1
fi

