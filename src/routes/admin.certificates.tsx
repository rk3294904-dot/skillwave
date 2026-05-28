import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/certificates")({ component: AdminCerts });

function AdminCerts() {
  const qc = useQueryClient();
  const certs = useQuery({ queryKey: ["admin-certs"], queryFn: async () => (await supabase.from("certificates").select("*").order("issued_at", { ascending: false })).data ?? [] });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("certificates").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Revoked"); qc.invalidateQueries({ queryKey: ["admin-certs"] }); },
  });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Certificates</h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {(certs.data ?? []).map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{c.course_title}</div>
              <div className="text-xs text-muted-foreground truncate">{c.student_name} · {c.verification_id}</div>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/verify/$id" params={{ id: c.verification_id }}>View</Link></Button>
              <Button size="icon" variant="outline" onClick={() => { if (confirm("Revoke?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
