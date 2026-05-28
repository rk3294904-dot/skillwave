import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/courses/$id")({ component: CurriculumEditor });

function CurriculumEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const data = useQuery({
    queryKey: ["curriculum", id],
    queryFn: async () => {
      const [{ data: course }, { data: mods }, { data: lessons }] = await Promise.all([
        supabase.from("courses").select("title").eq("id", id).maybeSingle(),
        supabase.from("course_modules").select("*").eq("course_id", id).order("display_order"),
        supabase.from("course_lessons").select("*").eq("course_id", id).order("display_order"),
      ]);
      return { course, modules: mods ?? [], lessons: lessons ?? [] };
    },
  });

  const addModule = useMutation({
    mutationFn: async () => {
      const title = prompt("Module title?"); if (!title) return;
      const order = (data.data?.modules.length ?? 0) + 1;
      const { error } = await supabase.from("course_modules").insert({ course_id: id, title, display_order: order });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum", id] }),
  });

  const delModule = useMutation({
    mutationFn: async (mid: string) => { const { error } = await supabase.from("course_modules").delete().eq("id", mid); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum", id] }),
  });

  const [lessonOpen, setLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [lf, setLf] = useState<any>({ title: "", description: "", video_url: "", video_provider: "youtube", duration_minutes: 0, is_preview: false, content: "", resources_json: "[]" });

  const openLesson = (moduleId: string, lesson?: any) => {
    setActiveModule(moduleId); setEditingLesson(lesson ?? null);
    setLf(lesson ? { ...lesson, resources_json: JSON.stringify(lesson.resources ?? [], null, 2) } : { title: "", description: "", video_url: "", video_provider: "youtube", duration_minutes: 0, is_preview: false, content: "", resources_json: "[]" });
    setLessonOpen(true);
  };

  const saveLesson = useMutation({
    mutationFn: async () => {
      let resources: any = [];
      try { resources = JSON.parse(lf.resources_json || "[]"); } catch { throw new Error("Invalid resources JSON"); }
      const payload: any = {
        course_id: id, module_id: activeModule,
        title: lf.title, description: lf.description, video_url: lf.video_url,
        video_provider: lf.video_provider, duration_minutes: Number(lf.duration_minutes) || 0,
        is_preview: !!lf.is_preview, content: lf.content, resources,
      };
      if (editingLesson) {
        const { error } = await supabase.from("course_lessons").update(payload).eq("id", editingLesson.id);
        if (error) throw error;
      } else {
        const order = (data.data?.lessons.filter((l) => l.module_id === activeModule).length ?? 0) + 1;
        const { error } = await supabase.from("course_lessons").insert({ ...payload, display_order: order });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); setLessonOpen(false); qc.invalidateQueries({ queryKey: ["curriculum", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delLesson = useMutation({
    mutationFn: async (lid: string) => { const { error } = await supabase.from("course_lessons").delete().eq("id", lid); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum", id] }),
  });

  return (
    <div className="space-y-4">
      <Link to="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">← Back to courses</Link>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{data.data?.course?.title} · Curriculum</h2>
        <Button onClick={() => addModule.mutate()} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" /> Add module</Button>
      </div>
      <div className="space-y-4">
        {(data.data?.modules ?? []).map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card">
            <div className="p-4 flex items-center justify-between">
              <div className="font-semibold">{m.title}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openLesson(m.id)}><Plus className="h-4 w-4 mr-1" /> Lesson</Button>
                <Button size="icon" variant="outline" onClick={() => { if (confirm("Delete module?")) delModule.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <ul className="border-t border-border divide-y divide-border">
              {(data.data?.lessons ?? []).filter((l) => l.module_id === m.id).map((l) => (
                <li key={l.id} className="p-3 flex items-center justify-between text-sm">
                  <span className="truncate">{l.title} <span className="text-muted-foreground">· {l.duration_minutes}m {l.is_preview && "· Preview"}</span></span>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openLesson(m.id, l)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete lesson?")) delLesson.mutate(l.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingLesson ? "Edit" : "New"} lesson</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={lf.title} onChange={(e) => setLf({ ...lf, title: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={lf.description ?? ""} onChange={(e) => setLf({ ...lf, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Video URL (YouTube or Google Drive)</Label><Input value={lf.video_url ?? ""} onChange={(e) => setLf({ ...lf, video_url: e.target.value })} /></div>
              <div><Label>Provider</Label>
                <Select value={lf.video_provider ?? "youtube"} onValueChange={(v) => setLf({ ...lf, video_provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (min)</Label><Input type="number" value={lf.duration_minutes ?? 0} onChange={(e) => setLf({ ...lf, duration_minutes: e.target.value })} /></div>
              <label className="flex items-end gap-2 pb-2"><Switch checked={!!lf.is_preview} onCheckedChange={(v) => setLf({ ...lf, is_preview: v })} /> Free preview</label>
            </div>
            <div><Label>Content / notes</Label><Textarea rows={4} value={lf.content ?? ""} onChange={(e) => setLf({ ...lf, content: e.target.value })} /></div>
            <div><Label>Resources JSON — [{`{"title":"Slides","url":"https://..."}`}]</Label><Textarea rows={4} value={lf.resources_json} onChange={(e) => setLf({ ...lf, resources_json: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLessonOpen(false)}>Cancel</Button><Button className="bg-gradient-primary" onClick={() => saveLesson.mutate()} disabled={saveLesson.isPending}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
