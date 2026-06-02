
-- Achievements catalog
CREATE TABLE public.achievements (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  xp_reward integer NOT NULL DEFAULT 0,
  threshold integer,
  kind text NOT NULL,
  display_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements viewable by all" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- User achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO anon, authenticated;
GRANT INSERT, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User achievements public read" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users insert own achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- XP events log for leaderboards
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_xp_events_created ON public.xp_events (created_at DESC);
CREATE INDEX idx_xp_events_user ON public.xp_events (user_id);
GRANT SELECT ON public.xp_events TO anon, authenticated;
GRANT INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "XP events public read" ON public.xp_events FOR SELECT USING (true);
CREATE POLICY "Users insert own xp events" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add daily goal to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes integer NOT NULL DEFAULT 15;

-- Lesson playback positions (for resume + smart player)
CREATE TABLE public.lesson_playback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  position_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_playback TO authenticated;
GRANT ALL ON public.lesson_playback TO service_role;
ALTER TABLE public.lesson_playback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own playback" ON public.lesson_playback FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Update bump_user_activity to also log xp_event
CREATE OR REPLACE FUNCTION public.bump_user_activity(_user_id uuid, _xp_delta integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  today date := (now() at time zone 'utc')::date;
  prev record;
  new_streak integer;
BEGIN
  IF _xp_delta > 0 THEN
    INSERT INTO public.xp_events(user_id, delta, source) VALUES (_user_id, _xp_delta, 'activity');
  END IF;
  SELECT * INTO prev FROM public.user_stats WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.user_stats(user_id, xp, current_streak, longest_streak, last_active_date)
      VALUES (_user_id, GREATEST(_xp_delta,0), 1, 1, today);
    RETURN;
  END IF;
  IF prev.last_active_date = today THEN
    new_streak := prev.current_streak;
  ELSIF prev.last_active_date = today - 1 THEN
    new_streak := prev.current_streak + 1;
  ELSE
    new_streak := 1;
  END IF;
  UPDATE public.user_stats
    SET xp = prev.xp + GREATEST(_xp_delta,0),
        current_streak = new_streak,
        longest_streak = GREATEST(prev.longest_streak, new_streak),
        last_active_date = today,
        updated_at = now()
    WHERE user_id = _user_id;
END;
$function$;

-- Seed achievements
INSERT INTO public.achievements(id,title,description,icon,xp_reward,threshold,kind,display_order) VALUES
  ('first_lesson','First Steps','Complete your first lesson','footprints',20,1,'lessons',1),
  ('streak_3','On a Roll','Maintain a 3-day learning streak','flame',30,3,'streak',2),
  ('streak_7','Week Warrior','7-day learning streak','flame',75,7,'streak',3),
  ('streak_30','Unstoppable','30-day learning streak','flame',300,30,'streak',4),
  ('xp_100','Apprentice','Earn 100 XP','zap',0,100,'xp',5),
  ('xp_500','Adept','Earn 500 XP','zap',0,500,'xp',6),
  ('xp_1000','Master','Earn 1000 XP','crown',0,1000,'xp',7),
  ('first_course','Graduate','Complete your first course','graduation-cap',100,1,'courses',8),
  ('first_quiz','Quick Mind','Pass your first quiz','brain',25,1,'quizzes',9),
  ('first_cert','Certified','Earn your first certificate','award',50,1,'certs',10),
  ('night_owl','Night Owl','Study after midnight','moon',15,1,'special',11),
  ('early_bird','Early Bird','Study before 6 AM','sunrise',15,1,'special',12)
ON CONFLICT (id) DO NOTHING;
