import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — SkillWave" }] }),
  component: Profile,
});

function Profile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const [form, setForm] = useState({ display_name: "", bio: "", avatar_url: "", learning_goal: "" });
  useEffect(() => {
    if (profile.data) setForm({
      display_name: profile.data.display_name ?? "",
      bio: profile.data.bio ?? "",
      avatar_url: profile.data.avatar_url ?? "",
      learning_goal: profile.data.learning_goal ?? "",
    });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ ...form, onboarded: true }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div><Label>Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
          <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></div>
          <div><Label>Learning goal</Label><Input value={form.learning_goal} onChange={(e) => setForm({ ...form, learning_goal: e.target.value })} /></div>
          <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <Button className="bg-gradient-primary" onClick={() => save.mutate()} disabled={save.isPending}>Save changes</Button>
        </div>
      </div>
    </AppShell>
  );
}
