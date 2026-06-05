import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

// Schedules a 7pm browser notification if user hasn't met today's XP goal
// and has the daily-reminder preference enabled.
export function DailyGoalReminder() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const now = new Date();
    const target = new Date(); target.setHours(19, 0, 0, 0);
    let delay = target.getTime() - now.getTime();
    if (delay < 0) delay += 86400000;
    const t = setTimeout(async () => {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const [{ data: events }, { data: prof }] = await Promise.all([
        supabase.from("xp_events" as any).select("delta").eq("user_id", user.id).gte("created_at", since.toISOString()),
        supabase.from("profiles").select("daily_goal_minutes, notify_daily_reminder").eq("user_id", user.id).maybeSingle(),
      ]);
      if ((prof as any)?.notify_daily_reminder === false) return;
      const today = ((events ?? []) as any[]).reduce((s, e) => s + (e.delta ?? 0), 0);
      const goal = ((prof as any)?.daily_goal_minutes ?? 15);
      if (today < goal) {
        new Notification("Keep your streak alive! 🔥", {
          body: `You've earned ${today}/${goal} XP today. One quick lesson will do it.`,
          icon: "/favicon.svg",
        });
      }
    }, delay);
    return () => clearTimeout(t);
  }, [user]);
  return null;
}
