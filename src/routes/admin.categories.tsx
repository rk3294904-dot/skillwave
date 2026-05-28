import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

function AdminCats() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["admin-cats-all"], queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [f, setF] = useState({ name: "", slug: "", description: "", icon: "", display_order: 0 });

  const start = (c?: any) => { setEditing(c ?? null); setF(c ?? { name: "", slug: "", description: "", icon: "", display_order: 0 }); setOpen(true); };

  const save = useMutation({
    mutationFn: async () => {
      if (editing) { const { error } = await supabase.from("categories").update(f).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("categories").insert(f); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-cats-all"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats-all"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary" onClick={() => start()}><Plus className="h-4 w-4 mr-1" /> New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></div>
              <div><Label>Icon (emoji)</Label><Input value={f.icon ?? ""} onChange={(e) => setF({ ...f, icon: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div><Label>Display order</Label><Input type="number" value={f.display_order} onChange={(e) => setF({ ...f, display_order: Number(e.target.value) })} /></div>
              <Button className="bg-gradient-primary" onClick={() => save.mutate()}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {(cats.data ?? []).map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="text-xl">{c.icon ?? "📚"}</span><div><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.slug}</div></div></div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={() => start(c)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => { if (confirm("Delete?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
