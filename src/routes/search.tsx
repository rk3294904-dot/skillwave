import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — SkillWave" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const res = useQuery({
    queryKey: ["search", q],
    enabled: q.length > 1,
    queryFn: async () => (await supabase.from("courses").select("*").eq("is_published", true)
      .or(`title.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`).limit(50)).data ?? [],
  });
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses, skills, topics…" className="pl-10 h-12" />
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(res.data ?? []).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
        {q.length > 1 && res.data?.length === 0 && <p className="text-muted-foreground mt-8 text-center">No results.</p>}
      </div>
    </AppShell>
  );
}
