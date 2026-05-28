import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "All courses — SkillWave" }, { name: "description", content: "Browse all SkillWave courses." }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data ?? [] });
  const courses = useQuery({
    queryKey: ["courses", q, diff, cat],
    queryFn: async () => {
      let qb = supabase.from("courses").select("*").eq("is_published", true);
      if (q) qb = qb.ilike("title", `%${q}%`);
      if (diff !== "all") qb = qb.eq("difficulty", diff as "beginner");
      if (cat !== "all") qb = qb.eq("category_id", cat);
      return (await qb.order("created_at", { ascending: false })).data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">All courses</h1>
        <p className="text-muted-foreground mb-8">Find your next skill.</p>
        <div className="grid gap-3 md:grid-cols-3 mb-8">
          <Input placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={diff} onValueChange={setDiff}>
            <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(courses.data ?? []).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
        {courses.data?.length === 0 && <p className="text-muted-foreground py-12 text-center">No courses match your filters.</p>}
      </div>
    </AppShell>
  );
}
