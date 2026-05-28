import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — SkillWave" }, { name: "description", content: "About SkillWave, our mission, and our values." }] }),
  component: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-invert">
        <h1 className="text-4xl font-bold">About SkillWave</h1>
        <p className="text-muted-foreground text-lg">We build a learning platform that meets ambitious learners where they are — with practical, project-based courses delivered by working professionals.</p>
        <h2 className="text-2xl font-semibold mt-8">Our mission</h2>
        <p className="text-muted-foreground">Make world-class skills accessible to anyone with curiosity and an internet connection.</p>
        <h2 className="text-2xl font-semibold mt-8">What makes us different</h2>
        <ul className="text-muted-foreground list-disc pl-5 space-y-1">
          <li>Hands-on courses with real-world projects</li>
          <li>Verified certificates anyone can validate</li>
          <li>Lifetime access — learn at your pace</li>
        </ul>
      </div>
    </AppShell>
  ),
});
