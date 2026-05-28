import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Users, Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { VideoEmbed } from "@/components/VideoEmbed";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/course/$slug")({
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const course = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => (await supabase.from("courses").select("*, categories(name,slug)").eq("slug", slug).maybeSingle()).data,
  });

  const modules = useQuery({
    queryKey: ["course-modules", course.data?.id],
    enabled: !!course.data?.id,
    queryFn: async () => {
      const [{ data: mods }, { data: lessons }] = await Promise.all([
        supabase.from("course_modules").select("*").eq("course_id", course.data!.id).order("display_order"),
        supabase.from("course_lessons").select("*").eq("course_id", course.data!.id).order("display_order"),
      ]);
      return (mods ?? []).map((m) => ({ ...m, lessons: (lessons ?? []).filter((l) => l.module_id === m.id) }));
    },
  });

  const enrollment = useQuery({
    queryKey: ["enroll", course.data?.id, user?.id],
    enabled: !!course.data?.id && !!user,
    queryFn: async () => (await supabase.from("enrollments").select("*").eq("course_id", course.data!.id).eq("user_id", user!.id).maybeSingle()).data,
  });

  const reviews = useQuery({
    queryKey: ["reviews", course.data?.id],
    enabled: !!course.data?.id,
    queryFn: async () => (await supabase.from("reviews").select("*, profiles(display_name)").eq("course_id", course.data!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to enroll");
      const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: course.data!.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Enrolled!"); qc.invalidateQueries({ queryKey: ["enroll"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (course.isLoading) return <AppShell><div className="container mx-auto p-10">Loading…</div></AppShell>;
  if (!course.data) return <AppShell><div className="container mx-auto p-10">Course not found.</div></AppShell>;

  const c = course.data;
  const previewLesson = modules.data?.flatMap((m) => m.lessons).find((l) => l.is_preview && l.video_url);

  return (
    <AppShell>
      <div className="bg-hero border-b border-border">
        <div className="container mx-auto px-4 py-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground">← All courses</Link>
            <h1 className="text-3xl md:text-5xl font-bold">{c.title}</h1>
            <p className="text-lg text-muted-foreground">{c.short_description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{Number(c.rating ?? 0).toFixed(1)}</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.enrollment_count} students</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{Math.round((c.duration_minutes ?? 0) / 60)}h total</span>
              <span className="uppercase text-xs bg-secondary px-2 py-0.5 rounded">{c.difficulty}</span>
            </div>
            {c.instructor_name && <p className="text-sm text-muted-foreground">Instructor: <span className="text-foreground">{c.instructor_name}</span></p>}
          </div>
          <aside className="rounded-xl border border-border bg-card p-5 space-y-4 h-fit">
            {previewLesson ? (
              <VideoEmbed url={previewLesson.video_url!} provider={previewLesson.video_provider} />
            ) : c.thumbnail_url ? (
              <img src={c.thumbnail_url} alt={c.title} className="rounded-lg aspect-video object-cover w-full" />
            ) : <div className="aspect-video bg-gradient-primary rounded-lg" />}
            <div className="text-3xl font-bold">{Number(c.price ?? 0) === 0 ? "Free" : `$${c.price}`}</div>
            {enrollment.data ? (
              <Button className="w-full bg-gradient-primary" onClick={() => nav({ to: "/learn/$courseId", params: { courseId: c.id } })}>
                <PlayCircle className="h-4 w-4 mr-1" /> Continue learning
              </Button>
            ) : (
              <Button className="w-full bg-gradient-primary" disabled={enroll.isPending} onClick={() => user ? enroll.mutate() : nav({ to: "/login" })}>
                {user ? "Enroll now" : "Sign in to enroll"}
              </Button>
            )}
            {c.skills?.length ? (
              <div className="pt-2">
                <div className="text-xs uppercase text-muted-foreground mb-2">You'll learn</div>
                <ul className="text-sm space-y-1">
                  {c.skills.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />{s}</li>)}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-3">About this course</h2>
            <p className="text-muted-foreground whitespace-pre-line">{c.description}</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
            <div className="space-y-3">
              {(modules.data ?? []).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card">
                  <div className="p-4 font-semibold">{m.title}</div>
                  <ul className="border-t border-border divide-y divide-border">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-muted-foreground" />{l.title}</span>
                        <span className="text-xs text-muted-foreground">{l.duration_minutes ?? 0}m {l.is_preview && "· Preview"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {modules.data?.length === 0 && <p className="text-sm text-muted-foreground">Curriculum coming soon.</p>}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            <div className="space-y-4">
              {(reviews.data ?? []).map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{(r as any).profiles?.display_name ?? "Student"}</span>
                    <span className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
                </div>
              ))}
              {reviews.data?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
