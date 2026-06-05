import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Target, Mail, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyAch, setNotifyAch] = useState(true);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  useEffect(() => { if (typeof Notification !== "undefined") setNotifPerm(Notification.permission); }, []);

  const profile = useQuery({
    queryKey: ["profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("daily_goal_minutes, notify_daily_reminder, notify_achievement_email").eq("user_id", user!.id).maybeSingle()).data,
  });
  useEffect(() => {
    if (profile.data) {
      const p = profile.data as any;
      setGoal(p.daily_goal_minutes ?? 15);
      setNotifyDaily(p.notify_daily_reminder ?? true);
      setNotifyAch(p.notify_achievement_email ?? true);
    }
  }, [profile.data]);

  const saveGoal = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ daily_goal_minutes: goal } as any).eq("user_id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Daily XP goal updated");
  };

  const toggleNotify = async (key: "notify_daily_reminder" | "notify_achievement_email", value: boolean) => {
    if (key === "notify_daily_reminder") setNotifyDaily(value); else setNotifyAch(value);
    const { error } = await supabase.from("profiles").update({ [key]: value } as any).eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else toast.success(value ? "Notifications enabled" : "Notifications disabled");
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

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-primary" /> Notifications</div>

          <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-sm"><Mail className="h-3.5 w-3.5 text-cyan-400" /> Daily learning reminders</div>
              <p className="text-xs text-muted-foreground mt-1">Get nudged at 7pm if you haven't hit today's XP goal.</p>
            </div>
            <Switch checked={notifyDaily} onCheckedChange={(v) => toggleNotify("notify_daily_reminder", v)} />
          </div>

          <div className="flex items-start justify-between gap-4 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-sm"><Trophy className="h-3.5 w-3.5 text-amber-400" /> Achievement unlocks</div>
              <p className="text-xs text-muted-foreground mt-1">Celebrate when you earn a new badge.</p>
            </div>
            <Switch checked={notifyAch} onCheckedChange={(v) => toggleNotify("notify_achievement_email", v)} />
          </div>

          {notifPerm === "granted" ? (
            <div className="text-xs text-emerald-400">✓ Browser notifications enabled</div>
          ) : notifPerm === "denied" ? (
            <div className="text-xs text-destructive">Browser notifications blocked — enable in your browser settings.</div>
          ) : (
            <Button onClick={askNotif} variant="outline" size="sm">Enable browser notifications</Button>
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
