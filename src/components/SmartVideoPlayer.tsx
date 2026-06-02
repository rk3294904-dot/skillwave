import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toEmbedUrl } from "@/lib/embed";

type Props = {
  url: string;
  provider?: string | null;
  title?: string;
  userId?: string | null;
  courseId: string;
  lessonId: string;
};

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void; }
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.slice(7);
      return u.searchParams.get("v");
    }
  } catch { /* ignore */ }
  return null;
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
  });
}

export function SmartVideoPlayer({ url, provider, title, userId, courseId, lessonId }: Props) {
  const ytId = extractYouTubeId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [resumeAt, setResumeAt] = useState<number>(0);
  const [ready, setReady] = useState(false);

  // Fetch resume position
  useEffect(() => {
    if (!userId) return;
    supabase.from("lesson_playback" as any).select("position_seconds").eq("user_id", userId).eq("lesson_id", lessonId).maybeSingle()
      .then(({ data }) => setResumeAt(((data as any)?.position_seconds ?? 0) as number));
  }, [userId, lessonId]);

  // YouTube path
  useEffect(() => {
    if (!ytId || !containerRef.current) return;
    let destroyed = false;
    let saveTimer: ReturnType<typeof setInterval> | null = null;
    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: ytId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.max(0, Math.floor(resumeAt)) },
        events: {
          onReady: (e: any) => {
            setReady(true);
            if (resumeAt > 2) try { e.target.seekTo(resumeAt, true); } catch { /* ignore */ }
          },
        },
      });
    });
    saveTimer = setInterval(async () => {
      const p = playerRef.current;
      if (!p?.getCurrentTime || !userId) return;
      try {
        const pos = Math.floor(p.getCurrentTime());
        const dur = Math.floor(p.getDuration() ?? 0);
        if (pos > 0) {
          await supabase.from("lesson_playback" as any).upsert(
            { user_id: userId, course_id: courseId, lesson_id: lessonId, position_seconds: pos, duration_seconds: dur, updated_at: new Date().toISOString() },
            { onConflict: "user_id,lesson_id" } as any,
          );
        }
      } catch { /* ignore */ }
    }, 5000);

    const onKey = (e: KeyboardEvent) => {
      if (!playerRef.current?.getPlayerState) return;
      const tgt = e.target as HTMLElement;
      if (tgt && /INPUT|TEXTAREA|SELECT/.test(tgt.tagName)) return;
      const p = playerRef.current;
      switch (e.key) {
        case " ": e.preventDefault(); p.getPlayerState() === 1 ? p.pauseVideo() : p.playVideo(); break;
        case "ArrowRight": p.seekTo(p.getCurrentTime() + 5, true); break;
        case "ArrowLeft": p.seekTo(Math.max(0, p.getCurrentTime() - 5), true); break;
        case "m": case "M": p.isMuted() ? p.unMute() : p.mute(); break;
        case "f": case "F": containerRef.current?.requestFullscreen?.(); break;
        case "j": case "J": p.seekTo(Math.max(0, p.getCurrentTime() - 10), true); break;
        case "l": case "L": p.seekTo(p.getCurrentTime() + 10, true); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      destroyed = true;
      window.removeEventListener("keydown", onKey);
      if (saveTimer) clearInterval(saveTimer);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId, lessonId, userId, resumeAt]);

  if (!ytId) {
    const src = toEmbedUrl(url, provider);
    if (!src) return <div className="aspect-video grid place-items-center bg-muted rounded-lg text-muted-foreground">No video</div>;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black shadow-glow">
        <iframe src={src} title={title ?? "Lesson video"} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black shadow-glow">
        <div key={ytId} ref={containerRef} className="h-full w-full" />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{ready && resumeAt > 5 ? `Resumed at ${Math.floor(resumeAt / 60)}:${String(Math.floor(resumeAt % 60)).padStart(2, "0")}` : "Smart player · auto-resume on"}</span>
        <span className="hidden md:inline">Shortcuts: Space ⏯ · ← → 5s · J L 10s · M mute · F fullscreen</span>
      </div>
    </div>
  );
}

