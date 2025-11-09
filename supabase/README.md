# Supabase Migrations

Este directorio contiene migraciones SQL para configurar Supabase.

## 📋 Migraciones Disponibles

### `migrations/create_analytics_events.sql`

Crea la tabla `analytics_events` para reemplazar Firebase Analytics.

**Cómo ejecutar:**

1. **Desde Supabase Dashboard:**
   - Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Click en "SQL Editor"
   - Copia y pega el contenido del archivo
   - Click en "Run"

2. **Desde la línea de comandos (si tienes Supabase CLI):**
   ```bash
   supabase db push
   ```

## 📊 Estructura de la Tabla

La tabla `analytics_events` almacena:
- `user_id`: ID del usuario (puede ser null para eventos anónimos)
- `event_name`: Nombre del evento (ej: "payment_sent", "screen_view")
- `event_params`: JSONB con parámetros del evento
- `user_properties`: JSONB con propiedades del usuario al momento del evento
- `timestamp`: Fecha/hora del evento (automático)
- `platform`: Plataforma ("web", "ios", "android")
- `app_version`: Versión de la app
- `session_id`: ID de sesión

## 🔒 Seguridad

- **RLS (Row Level Security) habilitado**
- Usuarios autenticados pueden ver solo sus propios eventos
- Usuarios anónimos pueden insertar eventos
- Service role tiene acceso completo (para queries admin)

## 📈 Queries Útiles

```sql
-- Eventos más comunes
SELECT event_name, COUNT(*) as count
FROM analytics_events
GROUP BY event_name
ORDER BY count DESC;

-- Eventos por usuario
SELECT user_id, event_name, COUNT(*) as count
FROM analytics_events
WHERE user_id IS NOT NULL
GROUP BY user_id, event_name;

-- Eventos de hoy
SELECT * FROM analytics_events
WHERE timestamp >= CURRENT_DATE
ORDER BY timestamp DESC;
```






