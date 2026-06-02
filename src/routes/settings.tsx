import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SkillWave" }] }),
  component: Settings,
});

function Settings() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [goal, setGoal] = useState(15);
  const [saving, setSaving] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  useEffect(() => { if (typeof Notification !== "undefined") setNotifPerm(Notification.permission); }, []);

  const profile = useQuery({
    queryKey: ["profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("daily_goal_minutes").eq("user_id", user!.id).maybeSingle()).data,
  });
  useEffect(() => { if (profile.data) setGoal((profile.data as any).daily_goal_minutes ?? 15); }, [profile.data]);

  const saveGoal = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ daily_goal_minutes: goal } as any).eq("user_id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Daily XP goal updated");
  };

  const askNotif = async () => {
    if (typeof Notification === "undefined") return toast.error("Notifications not supported");
    const p = await Notification.requestPermission();
    setNotifPerm(p);
    if (p === "granted") { toast.success("Reminders enabled"); new Notification("SkillWave", { body: "We'll nudge you so you don't break your streak!" }); }
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-primary" /> Daily XP goal</div>
          <p className="text-sm text-muted-foreground">Earn this much XP every day to keep your streak alive (≈ {Math.ceil(goal / 10)} lesson{goal >= 20 ? "s" : ""}).</p>
          <div className="flex gap-2 max-w-xs">
            <Input type="number" min={5} max={500} value={goal} onChange={(e) => setGoal(Number(e.target.value) || 0)} />
            <Button onClick={saveGoal} disabled={saving} className="bg-gradient-primary">Save</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-primary" /> Learning reminders</div>
          <p className="text-sm text-muted-foreground">Get a browser notification if you haven't met your daily goal by 7pm.</p>
          {notifPerm === "granted" ? (
            <div className="text-sm text-emerald-400">✓ Reminders enabled</div>
          ) : notifPerm === "denied" ? (
            <div className="text-sm text-destructive">Blocked — enable notifications in your browser settings.</div>
          ) : (
            <Button onClick={askNotif} variant="outline">Enable reminders</Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div><div className="text-sm text-muted-foreground">Email</div><div>{user?.email}</div></div>
          <Button variant="outline" onClick={async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, { redirectTo: window.location.origin + "/forgot-password" });
            if (error) toast.error(error.message); else toast.success("Reset email sent");
          }}>Send password reset email</Button>
          <Button variant="destructive" onClick={async () => { await signOut(); nav({ to: "/" }); }}>Sign out</Button>
        </div>
      </div>
    </AppShell>
  );
}
