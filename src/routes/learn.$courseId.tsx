import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, FileText, Award, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { VideoEmbed } from "@/components/VideoEmbed";
import { Button } from "@/components/ui/button";
import { toEmbedUrl } from "@/lib/embed";

export const Route = createFileRoute("/learn/$courseId")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: typeof s.lesson === "string" ? s.lesson : undefined }),
  component: LearnPage,
});

function LearnPage() {
  const { courseId } = Route.useParams();
  const { lesson: lessonParam } = Route.useSearch();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<string | null>(lessonParam ?? null);
  const autoIssuedRef = useRef(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);

  const course = useQuery({
    queryKey: ["learn-course", courseId],
    queryFn: async () => (await supabase.from("courses").select("*").eq("id", courseId).maybeSingle()).data,
  });
  const data = useQuery({
    queryKey: ["learn-data", courseId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: mods }, { data: lessons }, { data: enroll }, { data: progress }] = await Promise.all([
        supabase.from("course_modules").select("*").eq("course_id", courseId).order("display_order"),
        supabase.from("course_lessons").select("*").eq("course_id", courseId).order("display_order"),
        supabase.from("enrollments").select("*").eq("course_id", courseId).eq("user_id", user!.id).maybeSingle(),
        supabase.from("lesson_progress").select("*").eq("course_id", courseId).eq("user_id", user!.id),
      ]);
      return { modules: mods ?? [], lessons: lessons ?? [], enrollment: enroll, progress: progress ?? [] };
    },
  });
  const cert = useQuery({
    queryKey: ["learn-cert", courseId, user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("certificates").select("id").eq("course_id", courseId).eq("user_id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (!activeLesson && data.data?.lessons.length) {
      setActiveLesson(data.data.enrollment?.last_lesson_id ?? data.data.lessons[0].id);
    }
  }, [data.data, activeLesson]);

  const lesson = data.data?.lessons.find((l) => l.id === activeLesson);
  const completedIds = new Set((data.data?.progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id));
  const total = data.data?.lessons.length ?? 0;
  const done = completedIds.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const lecturesComplete = !!(course.data as any)?.lectures_complete;

  const markDone = useMutation({
    mutationFn: async () => {
      if (!lesson || !user) return;
      await supabase.from("lesson_progress").upsert({
        user_id: user.id, course_id: courseId, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" } as any);
      await supabase.from("enrollments").update({
        progress_percent: total ? Math.round(((done + 1) / total) * 100) : 0,
        last_lesson_id: lesson.id,
        completed_at: done + 1 >= total ? new Date().toISOString() : null,
      }).eq("user_id", user.id).eq("course_id", courseId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["learn-data"] }); toast.success("Progress saved"); },
  });

  const issueCert = useMutation({
    mutationFn: async (opts?: { silent?: boolean }) => {
      if (!user || !course.data) return { silent: opts?.silent };
      // idempotent guard
      const { data: existing } = await supabase.from("certificates").select("id").eq("course_id", course.data.id).eq("user_id", user.id).maybeSingle();
      if (existing) return { silent: opts?.silent, already: true };
      const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
      const { error } = await supabase.from("certificates").insert({
        user_id: user.id, course_id: course.data.id,
        course_title: course.data.title,
        student_name: prof?.display_name ?? user.email ?? "Student",
      });
      if (error) throw error;
      return { silent: opts?.silent };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["learn-cert"] });
      if (res?.silent) {
        if (!res.already) toast.success("🎉 Course completed — certificate issued!");
      } else {
        toast.success("Certificate issued!");
        nav({ to: "/certificates" });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-issue certificate when student finishes all lessons AND admin has marked lectures complete
  useEffect(() => {
    if (autoIssuedRef.current) return;
    if (!user || !course.data || cert.isLoading) return;
    if (pct >= 100 && lecturesComplete && !cert.data) {
      autoIssuedRef.current = true;
      issueCert.mutate({ silent: true });
    }
  }, [pct, lecturesComplete, cert.data, cert.isLoading, user, course.data]);

  if (loading || data.isLoading) return <AppShell><div className="p-10">Loading…</div></AppShell>;

  const resources = (lesson?.resources as Array<{ title: string; url: string }> | null) ?? [];

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <button onClick={() => history.back()} className="text-sm text-muted-foreground hover:text-foreground">← Back to course</button>
          <h1 className="text-2xl font-bold">{lesson?.title ?? course.data?.title}</h1>
          {lesson?.video_url ? (
            <VideoEmbed url={lesson.video_url} provider={lesson.video_provider} title={lesson.title} />
          ) : (
            <div className="aspect-video rounded-lg bg-muted grid place-items-center text-muted-foreground">Select a lesson</div>
          )}
          {lesson?.content && <div className="prose prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-line">{lesson.content}</div>}
          {resources.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Resources</div>
              <div className="space-y-3">
                {resources.map((r, i) => {
                  const embed = toEmbedUrl(r.url);
                  return (
                    <div key={i}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{r.title}</a>
                      {embed && /preview|embed/.test(embed) && (
                        <iframe src={embed} className="w-full h-[500px] rounded-md border border-border mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => markDone.mutate()} disabled={!lesson || completedIds.has(lesson.id)}>
              {lesson && completedIds.has(lesson.id) ? "Completed" : "Mark as complete"}
            </Button>
            {pct >= 100 && cert.data && (
              <Button variant="outline" onClick={() => nav({ to: "/certificates" })}>
                <Award className="h-4 w-4 mr-1" /> View certificate
              </Button>
            )}
            {pct >= 100 && !cert.data && lecturesComplete && (
              <Button variant="outline" onClick={() => issueCert.mutate(undefined)} disabled={issueCert.isPending}>
                <Award className="h-4 w-4 mr-1" /> Get certificate
              </Button>
            )}
            {pct >= 100 && !lecturesComplete && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Certificate unlocks once admin marks all lectures uploaded.
              </div>
            )}
          </div>
        </div>
        <aside className="rounded-xl border border-border bg-card p-4 space-y-3 h-fit lg:sticky lg:top-20">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Progress · {pct}%</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {data.data?.modules.map((m) => (
              <div key={m.id}>
                <div className="text-xs uppercase text-muted-foreground mb-1">{m.title}</div>
                <ul className="space-y-1">
                  {data.data!.lessons.filter((l) => l.module_id === m.id).map((l) => {
                    const isDone = completedIds.has(l.id);
                    const isActive = l.id === activeLesson;
                    return (
                      <li key={l.id}>
                        <button onClick={() => setActiveLesson(l.id)}
                          className={`w-full text-left px-2 py-2 rounded-md text-sm flex items-center gap-2 ${isActive ? "bg-accent" : "hover:bg-accent/50"}`}>
                          {isDone ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                          <span className="truncate flex-1">{l.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
