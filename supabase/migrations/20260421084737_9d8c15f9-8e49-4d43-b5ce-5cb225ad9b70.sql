
-- App timers: per user limits per app
CREATE TABLE public.app_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_key TEXT NOT NULL,
  app_name TEXT NOT NULL,
  limit_seconds INTEGER NOT NULL DEFAULT 120,
  used_seconds INTEGER NOT NULL DEFAULT 0,
  reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_key)
);

-- Usage sessions for reports
CREATE TABLE public.usage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_key TEXT NOT NULL,
  app_name TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Night lock settings
CREATE TABLE public.night_lock_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  start_hour INTEGER NOT NULL DEFAULT 0,
  end_hour INTEGER NOT NULL DEFAULT 6,
  mute_notifications BOOLEAN NOT NULL DEFAULT true,
  distracting_apps JSONB NOT NULL DEFAULT '["instagram","tiktok","youtube","twitter","facebook","snapchat"]'::jsonb,
  allowed_during_lock JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.night_lock_settings ENABLE ROW LEVEL SECURITY;

-- RLS: users only see/manage their own rows
CREATE POLICY "own timers select" ON public.app_timers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own timers insert" ON public.app_timers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own timers update" ON public.app_timers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own timers delete" ON public.app_timers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own sessions select" ON public.usage_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sessions insert" ON public.usage_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sessions delete" ON public.usage_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own night select" ON public.night_lock_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own night insert" ON public.night_lock_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own night update" ON public.night_lock_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_started ON public.usage_sessions(user_id, started_at DESC);
