import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/categories/")({
  head: () => ({ meta: [{ title: "Categories — SkillWave" }] }),
  component: () => {
    const cats = useQuery({ queryKey: ["all-categories"], queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data ?? [] });
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Categories</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(cats.data ?? []).map((c) => (
              <Link key={c.id} to="/categories/$slug" params={{ slug: c.slug }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/60 hover:shadow-glow transition-all">
                <div className="text-3xl mb-3">{c.icon ?? "📚"}</div>
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{c.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
    );
  },
});
