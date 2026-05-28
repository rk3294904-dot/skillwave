import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/my-learning")({
  head: () => ({ meta: [{ title: "My Learning — SkillWave" }] }),
  component: MyLearning,
});

function MyLearning() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  const enrollments = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("enrollments").select("*, courses(*)").eq("user_id", user!.id).order("enrolled_at", { ascending: false })).data ?? [],
  });
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">My Learning</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(enrollments.data ?? []).map((e) => {
            const c = (e as any).courses;
            if (!c) return null;
            return (
              <div key={e.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {c.thumbnail_url && <img src={c.thumbnail_url} alt={c.title} className="aspect-video object-cover w-full" />}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold line-clamp-2">{c.title}</h3>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Progress · {e.progress_percent}%</div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-primary" style={{ width: `${e.progress_percent}%` }} /></div>
                  </div>
                  <Button asChild className="w-full bg-gradient-primary">
                    <Link to="/learn/$courseId" params={{ courseId: c.id }}>{e.progress_percent > 0 ? "Continue" : "Start"} learning</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {enrollments.data?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">You haven't enrolled in anything yet.</p>
            <Button asChild className="bg-gradient-primary"><Link to="/courses">Browse courses</Link></Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
