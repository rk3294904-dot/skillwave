import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { CategoryIcon } from "@/components/CategoryIcon";

export const Route = createFileRoute("/categories/")({
  head: () => ({ meta: [{ title: "Categories — SkillWave" }] }),
  component: () => {
    const cats = useQuery({ queryKey: ["all-categories"], queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data ?? [] });
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse categories</h1>
          <p className="text-muted-foreground mb-8">Pick a track and explore curated courses.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(cats.data ?? []).map((c) => (
              <Link key={c.id} to="/categories/$slug" params={{ slug: c.slug }}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/60 hover:shadow-glow transition-all">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <CategoryIcon name={c.icon} className="h-6 w-6" />
                </div>
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
    );
  },
});
