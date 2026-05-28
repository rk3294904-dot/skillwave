import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      return (profs ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.user_id).map((r) => r.role) }));
    },
  });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Users</h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {(users.data ?? []).map((u: any) => (
          <div key={u.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{u.display_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <div className="flex gap-1 text-xs">
              {u.roles.map((r: string) => <span key={r} className={`px-2 py-0.5 rounded ${r === "admin" ? "bg-gradient-primary text-primary-foreground" : "bg-secondary"}`}>{r}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
