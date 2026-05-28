import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — SkillWave" }] }),
  component: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">By using SkillWave you agree to use the platform lawfully and respect creators' content. Course access is granted on a per-account basis.</p>
      </div>
    </AppShell>
  ),
});
