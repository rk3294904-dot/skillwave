import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ShieldCheck, Download, Linkedin, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { downloadCertificatePdf, linkedInShareUrl } from "@/lib/certificate";
import { downloadShareCard } from "@/lib/share-card";

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
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 max-w-3xl">
        {cert.isLoading ? <p>Loading…</p> : cert.data ? (
          <>
            <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 shadow-glow">
              <div className="relative overflow-hidden rounded-2xl bg-[#0a0a1a] px-4 sm:px-8 md:px-12 py-8 sm:py-12 text-center">
                {/* decorative corners */}
                <div className="pointer-events-none absolute inset-3 sm:inset-5 rounded-xl border border-cyan-400/20" />
                <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 text-cyan-300 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4 sm:mb-6 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5">
                    <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" /> Verified Authentic
                  </div>
                  <div className="text-cyan-300 font-bold tracking-[0.3em] text-xs sm:text-sm">SKILLWAVE</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 tracking-[0.2em]">CERTIFICATE OF COMPLETION</div>
                  <div className="mx-auto mt-3 h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

                  <div className="relative mx-auto mt-6 sm:mt-8 h-16 w-16 sm:h-20 sm:w-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 blur-md opacity-60" />
                    <div className="relative h-full w-full rounded-full bg-gradient-to-br from-amber-300 to-orange-500 grid place-items-center shadow-lg">
                      <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground mt-5 sm:mt-6">This certifies that</p>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mt-2 sm:mt-3 text-white break-words leading-tight">{cert.data.student_name}</h1>
                  <div className="mx-auto mt-3 h-px w-24 sm:w-40 bg-cyan-400/60" />
                  <p className="text-xs sm:text-base text-muted-foreground mt-5 sm:mt-6">has successfully completed the course</p>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold mt-2 bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent break-words leading-snug">
                    {cert.data.course_title}
                  </h2>

                  <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-6 text-left max-w-md mx-auto">
                    <div>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">Issued</div>
                      <div className="text-xs sm:text-sm text-white font-medium">{new Date(cert.data.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">Verification ID</div>
                      <div className="text-xs sm:text-sm text-white font-mono break-all">{cert.data.verification_id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
              <Button size="sm" onClick={() => downloadCertificatePdf(cert.data!)} className="bg-gradient-primary">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
              <Button size="sm" asChild variant="outline">
                <a href={linkedInShareUrl(cert.data!)} target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" /> Add to LinkedIn
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadShareCard(cert.data!)}>
                <Share2 className="h-4 w-4 mr-2" /> Share card
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
