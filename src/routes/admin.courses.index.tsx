import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/courses/")({ component: AdminCourses });

const empty = {
  title: "", slug: "", short_description: "", description: "",
  thumbnail_url: "", category_id: "", difficulty: "beginner" as const,
  price: 0, duration_minutes: 0, instructor_name: "",
  is_published: false, is_featured: false, is_popular: false,
  lectures_complete: false, skills: [] as string[],
};

function AdminCourses() {
  const qc = useQueryClient();
  const courses = useQuery({ queryKey: ["admin-courses"], queryFn: async () => (await supabase.from("courses").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [] });
  const cats = useQuery({ queryKey: ["admin-cats"], queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data ?? [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [skillsTxt, setSkillsTxt] = useState("");

  const startCreate = () => { setEditing(null); setForm(empty); setSkillsTxt(""); setOpen(true); };
  const startEdit = (c: any) => {
    setEditing(c); setForm({ ...c, category_id: c.category_id ?? "" });
    setSkillsTxt((c.skills ?? []).join(", ")); setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category_id: form.category_id || null, skills: skillsTxt.split(",").map((s: string) => s.trim()).filter(Boolean) };
      if (editing) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Courses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> New course</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} course</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              </div>
              <div><Label>Short description</Label><Input value={form.short_description ?? ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url ?? ""} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes ?? 0} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                <div><Label>Instructor</Label><Input value={form.instructor_name ?? ""} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} /></div>
              </div>
              <div><Label>Skills (comma-separated)</Label><Input value={skillsTxt} onChange={(e) => setSkillsTxt(e.target.value)} /></div>
              <div className="flex flex-wrap gap-6 pt-2 text-sm">
                <label className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /> Published</label>
                <label className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Featured</label>
                <label className="flex items-center gap-2"><Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} /> Popular</label>
                <label className="flex items-center gap-2"><Switch checked={!!form.lectures_complete} onCheckedChange={(v) => setForm({ ...form, lectures_complete: v })} /> All lectures uploaded</label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-gradient-primary" onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Save" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {(courses.data ?? []).map((c: any) => (
          <div key={c.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{c.title}</div>
              <div className="text-xs text-muted-foreground">{c.categories?.name ?? "—"} · {c.is_published ? "Published" : "Draft"} · {c.enrollment_count} enrolled</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button asChild size="sm" variant="outline"><Link to="/admin/courses/$id" params={{ id: c.id }}>Curriculum</Link></Button>
              <Button size="icon" variant="outline" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => { if (confirm("Delete this course?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {courses.data?.length === 0 && <div className="p-6 text-center text-muted-foreground">No courses yet.</div>}
      </div>
    </div>
  );
}
