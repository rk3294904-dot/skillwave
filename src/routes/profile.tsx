import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BookOpen, Award, Settings as SettingsIcon, LayoutDashboard, LogOut,
  ChevronRight, Mail, Shield, Pencil, GraduationCap, Sparkles, Flame, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — SkillWave" }] }),
  component: Profile,
});

function Profile() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const stats = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ count: enrolled }, { count: certs }, { data: enrolls }] = await Promise.all([
        supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("enrollments").select("completed_at").eq("user_id", user!.id),
      ]);
      const completed = (enrolls ?? []).filter((e) => e.completed_at).length;
      return { enrolled: enrolled ?? 0, certs: certs ?? 0, completed };
    },
  });

  const userStats = useQuery({
    queryKey: ["user-stats", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_stats").select("*").eq("user_id", user!.id).maybeSingle()).data,
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
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); setEditOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const displayName = profile.data?.display_name || user?.email?.split("@")[0] || "Learner";
  const initials = displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const menuItems = [
    { to: "/my-learning", label: "My Learning", desc: "Continue where you left off", icon: BookOpen },
    { to: "/certificates", label: "Certificates", desc: "Your achievements", icon: Award },
    { to: "/settings", label: "Settings", desc: "Account & preferences", icon: SettingsIcon },
  ] as const;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Identity card */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="flex items-start gap-4 relative">
            <Avatar className="h-20 w-20 ring-2 ring-primary/30">
              {form.avatar_url && <AvatarImage src={form.avatar_url} alt={displayName} />}
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold truncate">{displayName}</h1>
                {isAdmin && <Badge className="bg-primary/15 text-primary border-primary/30"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                <Mail className="h-3 w-3" />{user?.email}
              </p>
              {profile.data?.learning_goal && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />{profile.data.learning_goal}
                </p>
              )}
            </div>
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-4"><Pencil className="h-3.5 w-3.5 mr-1" />Edit profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
                <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" /></div>
                <div><Label>Learning goal</Label><Input value={form.learning_goal} onChange={(e) => setForm({ ...form, learning_goal: e.target.value })} placeholder="e.g. Become a full-stack developer" /></div>
                <div><Label>Bio</Label><Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button className="bg-gradient-primary" onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "Enrolled", value: stats.data?.enrolled ?? 0, icon: BookOpen },
            { label: "Completed", value: stats.data?.completed ?? 0, icon: GraduationCap },
            { label: "Certificates", value: stats.data?.certs ?? 0, icon: Award },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Streak & XP */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-cyan-400/10 p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-orange-500/15 text-orange-400 grid place-items-center"><Flame className="h-5 w-5" /></div>
              <div>
                <div className="text-xl font-bold">{userStats.data?.current_streak ?? 0}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Day streak</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/15 text-cyan-300 grid place-items-center"><Zap className="h-5 w-5" /></div>
              <div>
                <div className="text-xl font-bold">{userStats.data?.xp ?? 0}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Total XP</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-fuchsia-500/15 text-fuchsia-300 grid place-items-center"><Award className="h-5 w-5" /></div>
              <div>
                <div className="text-xl font-bold">{userStats.data?.longest_streak ?? 0}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Best streak</div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {menuItems.map((item) => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground truncate">{item.desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Admin Dashboard</div>
                <div className="text-xs text-muted-foreground">Manage courses, users & content</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          )}
        </section>

        {/* Sign out */}
        <button
          onClick={async () => { await signOut(); nav({ to: "/" }); }}
          className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors p-4 flex items-center justify-center gap-2 text-destructive font-medium"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}
