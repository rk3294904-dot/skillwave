
-- Fix empty category slug
UPDATE public.categories SET slug = 'video-editing' WHERE slug = '' OR slug IS NULL;

-- Lesson notes (per user, per lesson, with video timestamp)
CREATE TABLE public.lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  content text NOT NULL,
  timestamp_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.lesson_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_lesson_notes_updated BEFORE UPDATE ON public.lesson_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lesson bookmarks
CREATE TABLE public.lesson_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_bookmarks TO authenticated;
GRANT ALL ON public.lesson_bookmarks TO service_role;
ALTER TABLE public.lesson_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.lesson_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lesson discussion comments
CREATE TABLE public.lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  parent_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_comments TO authenticated;
GRANT ALL ON public.lesson_comments TO service_role;
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by all" ON public.lesson_comments FOR SELECT USING (true);
CREATE POLICY "Users insert own comments" ON public.lesson_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.lesson_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.lesson_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Quizzes (one per lesson optional)
CREATE TABLE public.lesson_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE,
  course_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Quiz',
  pass_percent integer NOT NULL DEFAULT 70,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_quizzes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lesson_quizzes TO authenticated;
GRANT ALL ON public.lesson_quizzes TO service_role;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes viewable by all" ON public.lesson_quizzes FOR SELECT USING (true);
CREATE POLICY "Admins manage quizzes" ON public.lesson_quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  score_percent integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User streaks / XP
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view stats" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Users upsert own stats" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Helper to bump XP + streak atomically
CREATE OR REPLACE FUNCTION public.bump_user_activity(_user_id uuid, _xp_delta integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today date := (now() at time zone 'utc')::date;
  prev record;
  new_streak integer;
BEGIN
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
$$;
GRANT EXECUTE ON FUNCTION public.bump_user_activity(uuid, integer) TO authenticated;
