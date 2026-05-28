import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { CategoryIcon } from "@/components/CategoryIcon";

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
        <div className="mb-8 flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <CategoryIcon name={cat.data?.icon} className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{cat.data?.name ?? "Category"}</h1>
            <p className="text-muted-foreground mt-2">{cat.data?.description}</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(courses.data ?? []).map((c) => <CourseCard key={c.id} course={c} />)}
          {courses.data?.length === 0 && <p className="text-muted-foreground">No courses in this category yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}
