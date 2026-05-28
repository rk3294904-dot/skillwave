ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS lectures_complete boolean NOT NULL DEFAULT false;