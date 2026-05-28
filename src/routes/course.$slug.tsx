import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Users, Clock, PlayCircle, CheckCircle2, Lock, ChevronDown, BookOpen, Award, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);

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
    onSuccess: () => { toast.success("Enrolled! Start learning now."); qc.invalidateQueries({ queryKey: ["enroll"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (course.isLoading) return <AppShell><div className="container mx-auto p-10">Loading…</div></AppShell>;
  if (!course.data) return <AppShell><div className="container mx-auto p-10">Course not found.</div></AppShell>;

  const c = course.data;
  const allLessons = modules.data?.flatMap((m) => m.lessons) ?? [];
  const totalLessons = allLessons.length;
  const totalMinutes = allLessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
  const firstPreview = allLessons.find((l) => l.is_preview && l.video_url);
  const activePreview = (previewLessonId && allLessons.find((l) => l.id === previewLessonId)) || firstPreview;
  const isEnrolled = !!enrollment.data;
  const avgRating = reviews.data?.length
    ? reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length
    : Number(c.rating ?? 0);

  const handleLessonClick = (lesson: typeof allLessons[number]) => {
    if (lesson.is_preview && lesson.video_url) {
      setPreviewLessonId(lesson.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!user) { nav({ to: "/login" }); return; }
    if (!isEnrolled) { toast.info("Enroll to access this lesson"); return; }
    nav({ to: "/learn/$courseId", params: { courseId: c.id }, search: { lesson: lesson.id } });
  };

  return (
    <AppShell>
      {/* Hero */}
      <div className="bg-hero border-b border-border">
        <div className="container mx-auto px-4 py-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <nav className="text-xs text-muted-foreground flex gap-2">
              <Link to="/courses" className="hover:text-foreground">Courses</Link>
              {(c as any).categories?.slug && (
                <>
                  <span>/</span>
                  <Link to="/categories/$slug" params={{ slug: (c as any).categories.slug }} className="hover:text-foreground">
                    {(c as any).categories.name}
                  </Link>
                </>
              )}
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{c.title}</h1>
            <p className="text-lg text-muted-foreground">{c.short_description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{avgRating.toFixed(1)} ({reviews.data?.length ?? 0} reviews)</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.enrollment_count} students</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{totalLessons} lessons</span>
              <span className="uppercase text-xs bg-secondary px-2 py-0.5 rounded">{c.difficulty}</span>
            </div>
            {c.instructor_name && <p className="text-sm text-muted-foreground">Instructor: <span className="text-foreground font-medium">{c.instructor_name}</span></p>}
          </div>
          <aside className="rounded-xl border border-border bg-card p-5 space-y-4 h-fit lg:sticky lg:top-20">
            {activePreview ? (
              <VideoEmbed url={activePreview.video_url!} provider={activePreview.video_provider} title={activePreview.title} />
            ) : c.thumbnail_url ? (
              <img src={c.thumbnail_url} alt={c.title} className="rounded-lg aspect-video object-cover w-full" />
            ) : <div className="aspect-video bg-gradient-primary rounded-lg" />}
            <div className="text-3xl font-bold">{Number(c.price ?? 0) === 0 ? "Free" : `$${c.price}`}</div>
            {isEnrolled ? (
              <Button className="w-full bg-gradient-primary" onClick={() => nav({ to: "/learn/$courseId", params: { courseId: c.id }, search: {} })}>
                <PlayCircle className="h-4 w-4 mr-1" /> Continue learning
              </Button>
            ) : (
              <Button className="w-full bg-gradient-primary" disabled={enroll.isPending} onClick={() => user ? enroll.mutate() : nav({ to: "/login" })}>
                {user ? (enroll.isPending ? "Enrolling…" : "Enroll now") : "Sign in to enroll"}
              </Button>
            )}
            <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border">
              <li className="flex items-center gap-2"><Clock className="h-3 w-3" />{Math.round(totalMinutes / 60)}h on-demand video</li>
              <li className="flex items-center gap-2"><BookOpen className="h-3 w-3" />{totalLessons} lessons across {modules.data?.length ?? 0} modules</li>
              <li className="flex items-center gap-2"><Globe className="h-3 w-3" />Lifetime access</li>
              <li className="flex items-center gap-2"><Award className="h-3 w-3" />Certificate of completion</li>
            </ul>
          </aside>
        </div>
      </div>

      {/* Content tabs */}
      <div className="container mx-auto px-4 py-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {c.skills?.length ? (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-primary" /> What you'll learn</h2>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {c.skills.map((s) => (
                  <li key={s} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-3">About this course</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{c.description || c.short_description}</p>
              </section>
              {c.instructor_name && (
                <section className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-bold mb-3">Your instructor</h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {c.instructor_name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{c.instructor_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Course instructor</div>
                    </div>
                  </div>
                </section>
              )}
            </TabsContent>

            <TabsContent value="curriculum" className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Curriculum</h2>
                <div className="text-sm text-muted-foreground">{modules.data?.length ?? 0} modules · {totalLessons} lessons</div>
              </div>
              <div className="space-y-3">
                {(modules.data ?? []).map((m, idx) => {
                  const open = openModules[m.id] ?? idx === 0;
                  return (
                    <div key={m.id} className="rounded-lg border border-border bg-card overflow-hidden">
                      <button
                        onClick={() => setOpenModules((s) => ({ ...s, [m.id]: !open }))}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/40 transition-colors"
                      >
                        <div>
                          <div className="font-semibold">{m.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.lessons.length} lessons</div>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      {open && (
                        <ul className="border-t border-border divide-y divide-border">
                          {m.lessons.map((l) => {
                            const locked = !l.is_preview && !isEnrolled;
                            return (
                              <li key={l.id}>
                                <button
                                  onClick={() => handleLessonClick(l)}
                                  className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-accent/40 transition-colors text-left"
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    {locked ? (
                                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                    <span className="truncate">{l.title}</span>
                                    {l.is_preview && (
                                      <span className="text-[10px] uppercase bg-primary/15 text-primary px-1.5 py-0.5 rounded">Preview</span>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{l.duration_minutes ?? 0}m</span>
                                </button>
                              </li>
                            );
                          })}
                          {m.lessons.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">No lessons yet.</li>}
                        </ul>
                      )}
                    </div>
                  );
                })}
                {modules.data?.length === 0 && <p className="text-sm text-muted-foreground">Curriculum coming soon.</p>}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="pt-6 space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6">
                <div className="text-5xl font-bold text-primary">{avgRating.toFixed(1)}</div>
                <div>
                  <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  ))}</div>
                  <div className="text-xs text-muted-foreground mt-1">{reviews.data?.length ?? 0} student ratings</div>
                </div>
              </div>
              {(reviews.data ?? []).map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{((r as any).profiles?.display_name ?? "S")[0]}</AvatarFallback></Avatar>
                    <span className="font-semibold">{(r as any).profiles?.display_name ?? "Student"}</span>
                    <span className="flex ml-auto">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
                </div>
              ))}
              {reviews.data?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience!</p>}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
