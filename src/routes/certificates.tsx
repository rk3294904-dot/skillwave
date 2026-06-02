import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Award, Download, Linkedin, ExternalLink, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { downloadCertificatePdf, linkedInShareUrl } from "@/lib/certificate";
import { downloadShareCard } from "@/lib/share-card";
import { checkAchievements } from "@/lib/gamification";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — SkillWave" }] }),
  component: Certs,
});

function Certs() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  useEffect(() => { if (user) checkAchievements(user.id); }, [user]);
  const certs = useQuery({
    queryKey: ["my-certs", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("certificates").select("*").eq("user_id", user!.id).order("issued_at", { ascending: false })).data ?? [],
  });
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
        <p className="text-muted-foreground mb-8">Download as PDF or share directly to your LinkedIn profile.</p>
        <div className="grid gap-5 md:grid-cols-2">
          {(certs.data ?? []).map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-6 hover:border-primary/60 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center shrink-0">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.course_title}</div>
                  <div className="text-sm text-muted-foreground">Issued to {c.student_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">ID: {c.verification_id}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => downloadCertificatePdf(c)} className="bg-gradient-primary">
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={linkedInShareUrl(c)} target="_blank" rel="noreferrer">
                    <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadShareCard(c)}>
                  <Share2 className="h-3 w-3 mr-1" /> Share card
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/verify/$id" params={{ id: c.verification_id }}>
                    <ExternalLink className="h-3 w-3 mr-1" /> View
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        {certs.data?.length === 0 && <p className="text-muted-foreground text-center py-10">Finish a course to earn your first certificate.</p>}
      </div>
    </AppShell>
  );
}
