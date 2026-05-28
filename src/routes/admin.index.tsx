import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Overview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [c, e, u, cert] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
      ]);
      return { courses: c.count ?? 0, enrollments: e.count ?? 0, users: u.count ?? 0, certs: cert.count ?? 0 };
    },
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Courses" value={stats.data?.courses ?? 0} />
      <Stat label="Enrollments" value={stats.data?.enrollments ?? 0} />
      <Stat label="Users" value={stats.data?.users ?? 0} />
      <Stat label="Certificates" value={stats.data?.certs ?? 0} />
    </div>
  );
}
