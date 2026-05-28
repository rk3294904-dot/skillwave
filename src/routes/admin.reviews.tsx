import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const qc = useQueryClient();
  const reviews = useQuery({ queryKey: ["admin-reviews"], queryFn: async () => (await supabase.from("reviews").select("*, courses(title), profiles(display_name)").order("created_at", { ascending: false })).data ?? [] });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reviews").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reviews</h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {(reviews.data ?? []).map((r: any) => (
          <div key={r.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{r.profiles?.display_name ?? "User"}</span>
                <span className="text-muted-foreground">on {r.courses?.title}</span>
                <span className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
            </div>
            <Button size="icon" variant="outline" onClick={() => { if (confirm("Delete?")) del.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
