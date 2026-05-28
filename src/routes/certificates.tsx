import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — SkillWave" }] }),
  component: Certs,
});

function Certs() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  const certs = useQuery({
    queryKey: ["my-certs", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("certificates").select("*").eq("user_id", user!.id).order("issued_at", { ascending: false })).data ?? [],
  });
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">My Certificates</h1>
        <div className="grid gap-5 md:grid-cols-2">
          {(certs.data ?? []).map((c) => (
            <Link key={c.id} to="/verify/$id" params={{ id: c.verification_id }}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/60 hover:shadow-glow transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-primary grid place-items-center"><Award className="h-6 w-6 text-primary-foreground" /></div>
                <div>
                  <div className="font-semibold">{c.course_title}</div>
                  <div className="text-sm text-muted-foreground">Issued to {c.student_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">ID: {c.verification_id}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {certs.data?.length === 0 && <p className="text-muted-foreground text-center py-10">Finish a course to earn your first certificate.</p>}
      </div>
    </AppShell>
  );
}
