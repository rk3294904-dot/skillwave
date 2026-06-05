ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_daily_reminder boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_achievement_email boolean NOT NULL DEFAULT true;