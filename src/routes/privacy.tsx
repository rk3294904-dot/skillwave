import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — SkillWave" }] }),
  component: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">We respect your privacy. We collect only the data we need to operate SkillWave: your email and learning progress. We never sell your data. Contact us to request deletion.</p>
      </div>
    </AppShell>
  ),
});
