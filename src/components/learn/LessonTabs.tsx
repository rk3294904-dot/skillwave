import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, MessageCircle, NotebookPen, Brain, Trash2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAchievements } from "@/lib/gamification";

type Props = { courseId: string; lessonId: string; userId: string };

export function LessonTabs({ courseId, lessonId, userId }: Props) {
  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="notes"><NotebookPen className="h-4 w-4 mr-1" /> Notes</TabsTrigger>
        <TabsTrigger value="bookmark"><Bookmark className="h-4 w-4 mr-1" /> Save</TabsTrigger>
        <TabsTrigger value="discuss"><MessageCircle className="h-4 w-4 mr-1" /> Q&A</TabsTrigger>
        <TabsTrigger value="quiz"><Brain className="h-4 w-4 mr-1" /> Quiz</TabsTrigger>
      </TabsList>
      <TabsContent value="notes"><NotesTab {...{ courseId, lessonId, userId }} /></TabsContent>
      <TabsContent value="bookmark"><BookmarkTab {...{ courseId, lessonId, userId }} /></TabsContent>
      <TabsContent value="discuss"><DiscussTab {...{ courseId, lessonId, userId }} /></TabsContent>
      <TabsContent value="quiz"><QuizTab {...{ courseId, lessonId, userId }} /></TabsContent>
    </Tabs>
  );
}

function NotesTab({ courseId, lessonId, userId }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [ts, setTs] = useState(0);
  const notes = useQuery({
    queryKey: ["notes", lessonId, userId],
    queryFn: async () => (await supabase.from("lesson_notes").select("*").eq("lesson_id", lessonId).eq("user_id", userId).order("timestamp_seconds")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const { error } = await supabase.from("lesson_notes").insert({ user_id: userId, course_id: courseId, lesson_id: lessonId, content: text, timestamp_seconds: ts });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); setTs(0); qc.invalidateQueries({ queryKey: ["notes", lessonId] }); toast.success("Note added"); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lesson_notes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", lessonId] }),
  });
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="space-y-3 pt-3">
      <div className="flex gap-2">
        <Input className="w-24" type="number" placeholder="0" value={ts || ""} onChange={(e) => setTs(Number(e.target.value) || 0)} title="Timestamp (seconds)" />
        <Textarea rows={2} placeholder="Write a note for this lesson…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => add.mutate()} disabled={!text.trim()}>Add</Button>
      </div>
      <div className="space-y-2">
        {(notes.data ?? []).map((n) => (
          <div key={n.id} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
            <span className="text-xs font-mono text-cyan-400 shrink-0 mt-0.5">{fmt(n.timestamp_seconds ?? 0)}</span>
            <p className="text-sm flex-1 whitespace-pre-wrap">{n.content}</p>
            <button onClick={() => del.mutate(n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {notes.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>}
      </div>
    </div>
  );
}

function BookmarkTab({ courseId, lessonId, userId }: Props) {
  const qc = useQueryClient();
  const bm = useQuery({
    queryKey: ["bm", lessonId, userId],
    queryFn: async () => (await supabase.from("lesson_bookmarks").select("id").eq("user_id", userId).eq("lesson_id", lessonId).maybeSingle()).data,
  });
  const toggle = useMutation({
    mutationFn: async () => {
      if (bm.data) await supabase.from("lesson_bookmarks").delete().eq("id", bm.data.id);
      else await supabase.from("lesson_bookmarks").insert({ user_id: userId, course_id: courseId, lesson_id: lessonId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bm", lessonId] }),
  });
  return (
    <div className="pt-4 text-center space-y-3">
      <p className="text-sm text-muted-foreground">{bm.data ? "Saved to your bookmarks." : "Save this lesson to revisit it later from your profile."}</p>
      <Button onClick={() => toggle.mutate()} variant={bm.data ? "outline" : "default"} className={!bm.data ? "bg-gradient-primary" : ""}>
        {bm.data ? <><BookmarkCheck className="h-4 w-4 mr-1" /> Saved · Remove</> : <><Bookmark className="h-4 w-4 mr-1" /> Bookmark lesson</>}
      </Button>
    </div>
  );
}

function DiscussTab({ courseId, lessonId, userId }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const comments = useQuery({
    queryKey: ["comments", lessonId],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_comments").select("*").eq("lesson_id", lessonId).order("created_at", { ascending: false });
      const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const { data: profs } = ids.length ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids) : { data: [] as any[] };
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      return (data ?? []).map((c) => ({ ...c, profile: map.get(c.user_id) }));
    },
  });
  const post = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const { error } = await supabase.from("lesson_comments").insert({ user_id: userId, course_id: courseId, lesson_id: lessonId, content: text });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["comments", lessonId] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lesson_comments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", lessonId] }),
  });
  return (
    <div className="space-y-3 pt-3">
      <div className="flex gap-2">
        <Textarea rows={2} placeholder="Ask a question or share an insight…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => post.mutate()} disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-2">
        {(comments.data ?? []).map((c: any) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">{c.profile?.display_name ?? "Student"}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
            {c.user_id === userId && (
              <button onClick={() => del.mutate(c.id)} className="text-xs text-muted-foreground hover:text-destructive mt-2">Delete</button>
            )}
          </div>
        ))}
        {comments.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Be the first to start the discussion.</p>}
      </div>
    </div>
  );
}

type Question = { q: string; options: string[]; answer: number };

function QuizTab({ courseId, lessonId, userId }: Props) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const quiz = useQuery({
    queryKey: ["quiz", lessonId],
    queryFn: async () => (await supabase.from("lesson_quizzes").select("*").eq("lesson_id", lessonId).maybeSingle()).data,
  });
  const lastAttempt = useQuery({
    queryKey: ["quiz-attempt", lessonId, userId],
    queryFn: async () => (await supabase.from("quiz_attempts").select("*").eq("lesson_id", lessonId).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!quiz.data) return;
      const qs = (quiz.data.questions as unknown as Question[]) ?? [];
      let correct = 0;
      qs.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
      const score = qs.length ? Math.round((correct / qs.length) * 100) : 0;
      const passed = score >= (quiz.data.pass_percent ?? 70);
      const { error } = await supabase.from("quiz_attempts").insert({
        user_id: userId, quiz_id: quiz.data.id, lesson_id: lessonId,
        score_percent: score, passed, answers: answers as any,
      });
      if (error) throw error;
      if (passed) await supabase.rpc("bump_user_activity", { _user_id: userId, _xp_delta: 25 });
      return { score, passed };
    },
    onSuccess: (r) => {
      if (!r) return;
      setResult(r);
      qc.invalidateQueries({ queryKey: ["quiz-attempt", lessonId] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      r.passed ? toast.success(`Passed! +25 XP`) : toast.error(`Score ${r.score}% — try again`);
      if (r.passed) checkAchievements(userId);
    },
  });
  const questions = (quiz.data?.questions as unknown as Question[]) ?? [];
  if (!quiz.data) return <p className="pt-6 text-sm text-muted-foreground text-center">No quiz for this lesson.</p>;
  if (questions.length === 0) return <p className="pt-6 text-sm text-muted-foreground text-center">Quiz coming soon.</p>;
  return (
    <div className="pt-3 space-y-4">
      {lastAttempt.data && !result && (
        <div className="text-xs text-muted-foreground">Last attempt: {lastAttempt.data.score_percent}% {lastAttempt.data.passed ? "· Passed ✓" : ""}</div>
      )}
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="font-medium mb-3">{i + 1}. {q.q}</div>
          <div className="space-y-2">
            {q.options.map((o, j) => (
              <label key={j} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm border ${answers[i] === j ? "border-primary bg-accent" : "border-border hover:bg-accent/40"}`}>
                <input type="radio" name={`q-${i}`} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} className="accent-primary" />
                {o}
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button onClick={() => submit.mutate()} disabled={Object.keys(answers).length !== questions.length || submit.isPending} className="bg-gradient-primary">
        Submit quiz
      </Button>
      {result && (
        <div className={`p-3 rounded-md text-sm ${result.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
          You scored {result.score}% — {result.passed ? "Passed 🎉" : `Need ${quiz.data.pass_percent}% to pass`}
        </div>
      )}
    </div>
  );
}
