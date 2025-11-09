-- Create analytics_events table for tracking user events
-- This replaces Firebase Analytics with Supabase Postgres

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  event_name TEXT NOT NULL,
  event_params JSONB,
  user_properties JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  platform TEXT, -- 'web' | 'ios' | 'android'
  app_version TEXT,
  session_id TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_timestamp ON analytics_events(user_id, timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON analytics_events;
DROP POLICY IF EXISTS "Users can view own events" ON analytics_events;
DROP POLICY IF EXISTS "Service role full access" ON analytics_events;

-- Policy: Allow anonymous inserts (so unauthenticated users can track events)
CREATE POLICY "Allow anonymous inserts" ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can only view their own events
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Policy: Service role can do everything (for admin queries)
CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE analytics_events IS 'User analytics events stored in Postgres (replaces Firebase Analytics)';
COMMENT ON COLUMN analytics_events.event_params IS 'JSON object with event parameters';
COMMENT ON COLUMN analytics_events.user_properties IS 'JSON object with user properties at time of event';

