import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I enroll in a course?", a: "Create a free account, open any course page, and click Enroll." },
  { q: "Do I get a certificate?", a: "Yes — finish all lessons in a course and you can issue a shareable, verifiable certificate." },
  { q: "Can I learn on mobile?", a: "Absolutely. SkillWave is fully responsive with a mobile bottom navigation." },
  { q: "Are videos downloadable?", a: "Lessons stream from secure providers and aren't downloadable to protect creators." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — SkillWave" }] }),
  component: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Frequently asked questions</h1>
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card divide-y divide-border">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`} className="px-4">
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </AppShell>
  ),
});
