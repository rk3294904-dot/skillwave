import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillWave — Master in-demand skills" },
      { name: "description", content: "Premium video courses, real projects, and certificates. Start learning today on SkillWave." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["featured-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*")
        .eq("is_published", true).eq("is_featured", true).limit(6);
      return data ?? [];
    },
  });
  const popular = useQuery({
    queryKey: ["popular-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*")
        .eq("is_published", true).order("enrollment_count", { ascending: false }).limit(8);
      return data ?? [];
    },
  });
  const categories = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("display_order").limit(8);
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <section className="relative bg-hero">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-primary" /> New courses every week
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Ride the wave of <span className="bg-gradient-primary bg-clip-text text-transparent">skills</span> that matter.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Hand-crafted video courses, hands-on projects, and verifiable certificates — built for the next generation of builders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
                <Link to="/courses">Browse courses <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline"><Link to="/categories">Explore categories</Link></Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { icon: Trophy, label: "Verified certificates" },
                { icon: Zap, label: "Project-based learning" },
                { icon: Sparkles, label: "Lifetime access" },
              ].map(({ icon: I, label }) => (
                <div key={label} className="flex flex-col items-center text-center text-xs text-muted-foreground gap-2">
                  <I className="h-5 w-5 text-primary" />{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Featured courses</h2>
          <Link to="/courses" className="text-sm text-primary hover:underline">See all</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(featured.data ?? []).map((c) => <CourseCard key={c.id} course={c} />)}
          {featured.data?.length === 0 && <p className="text-muted-foreground">No featured courses yet.</p>}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Browse by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(categories.data ?? []).map((cat) => (
            <Link key={cat.id} to="/categories/$slug" params={{ slug: cat.slug }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/60 hover:shadow-glow transition-all">
              <div className="text-2xl mb-2">{cat.icon ?? "📚"}</div>
              <div className="font-semibold">{cat.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{cat.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Most popular</h2>
          <Link to="/courses" className="text-sm text-primary hover:underline">See all</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(popular.data ?? []).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>
    </AppShell>
  );
}
