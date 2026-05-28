import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/verify/$id")({
  head: () => ({ meta: [{ title: "Verify certificate — SkillWave" }] }),
  component: Verify,
});

function Verify() {
  const { id } = Route.useParams();
  const cert = useQuery({
    queryKey: ["verify", id],
    queryFn: async () => (await supabase.from("certificates").select("*").eq("verification_id", id).maybeSingle()).data,
  });
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {cert.isLoading ? <p>Loading…</p> : cert.data ? (
          <div className="rounded-2xl border-2 border-primary/40 bg-card p-10 text-center shadow-glow bg-hero">
            <div className="inline-flex items-center gap-2 text-primary text-sm mb-4"><ShieldCheck className="h-4 w-4" /> Verified Certificate</div>
            <Award className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-sm text-muted-foreground">This certifies that</p>
            <h1 className="text-3xl font-bold mt-2">{cert.data.student_name}</h1>
            <p className="text-muted-foreground mt-4">successfully completed</p>
            <h2 className="text-xl font-semibold mt-1">{cert.data.course_title}</h2>
            <p className="text-xs text-muted-foreground mt-6">Issued {new Date(cert.data.issued_at).toLocaleDateString()} · ID {cert.data.verification_id}</p>
          </div>
        ) : (
          <div className="text-center"><h1 className="text-2xl font-bold">Certificate not found</h1><p className="text-muted-foreground mt-2">Check the verification ID and try again.</p></div>
        )}
      </div>
    </AppShell>
  );
}
