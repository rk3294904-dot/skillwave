import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ShieldCheck, Download, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { downloadCertificatePdf, linkedInShareUrl } from "@/lib/certificate";

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
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {cert.isLoading ? <p>Loading…</p> : cert.data ? (
          <>
            <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 shadow-glow">
              <div className="rounded-2xl bg-[#0a0a1a] p-10 text-center">
                <div className="inline-flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-[0.2em] mb-6">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </div>
                <div className="text-cyan-300 font-bold tracking-[0.3em] text-sm">SKILLWAVE</div>
                <div className="text-xs text-muted-foreground mt-1 tracking-[0.2em]">CERTIFICATE OF COMPLETION</div>
                <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                <Award className="h-14 w-14 mx-auto text-cyan-300 mt-6" />
                <p className="text-sm text-muted-foreground mt-6">This certifies that</p>
                <h1 className="text-4xl md:text-5xl font-bold mt-3 text-white">{cert.data.student_name}</h1>
                <div className="mx-auto mt-3 h-px w-40 bg-cyan-400/60" />
                <p className="text-muted-foreground mt-6">has successfully completed</p>
                <h2 className="text-2xl md:text-3xl font-semibold mt-2 bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                  {cert.data.course_title}
                </h2>
                <p className="text-xs text-muted-foreground mt-10">
                  Issued {new Date(cert.data.issued_at).toLocaleDateString()} · ID {cert.data.verification_id}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => downloadCertificatePdf(cert.data!)} className="bg-gradient-primary">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
              <Button asChild variant="outline">
                <a href={linkedInShareUrl(cert.data!)} target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" /> Add to LinkedIn
                </a>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center"><h1 className="text-2xl font-bold">Certificate not found</h1><p className="text-muted-foreground mt-2">Check the verification ID and try again.</p></div>
        )}
      </div>
    </AppShell>
  );
}
