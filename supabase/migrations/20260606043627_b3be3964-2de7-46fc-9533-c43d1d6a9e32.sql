CREATE TABLE public.telegram_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  message_id bigint NOT NULL,
  file_id text NOT NULL,
  file_unique_id text,
  mime_type text,
  duration integer,
  width integer,
  height integer,
  file_size bigint,
  thumbnail_file_id text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chat_id, message_id)
);

GRANT SELECT ON public.telegram_videos TO authenticated, anon;
GRANT ALL ON public.telegram_videos TO service_role;

ALTER TABLE public.telegram_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read telegram videos"
  ON public.telegram_videos FOR SELECT USING (true);

CREATE TRIGGER update_telegram_videos_updated_at
  BEFORE UPDATE ON public.telegram_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_telegram_videos_lookup ON public.telegram_videos (chat_id, message_id);