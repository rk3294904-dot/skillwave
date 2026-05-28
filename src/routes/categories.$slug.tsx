import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard } from "@/components/CourseCard";

export const Route = createFileRoute("/categories/$slug")({
  component: CatPage,
});

function CatPage() {
  const { slug } = Route.useParams();
  const cat = useQuery({
    queryKey: ["cat", slug],
    queryFn: async () => (await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()).data,
  });
  const courses = useQuery({
    queryKey: ["cat-courses", cat.data?.id],
    enabled: !!cat.data?.id,
    queryFn: async () => (await supabase.from("courses").select("*").eq("is_published", true).eq("category_id", cat.data!.id)).data ?? [],
  });
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="text-4xl mb-2">{cat.data?.icon ?? "📚"}</div>
          <h1 className="text-3xl md:text-4xl font-bold">{cat.data?.name ?? "Category"}</h1>
          <p className="text-muted-foreground mt-2">{cat.data?.description}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(courses.data ?? []).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </div>
    </AppShell>
  );
}
