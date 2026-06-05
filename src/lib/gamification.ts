import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function awardXP(userId: string, delta: number, _source = "activity") {
  await supabase.rpc("bump_user_activity", { _user_id: userId, _xp_delta: delta });
}

type Ach = {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  threshold: number | null;
  kind: string;
};

export async function checkAchievements(userId: string) {
  try {
    const [achRes, owned, stats, lessonsCount, quizPass, certCount, prof] = await Promise.all([
      supabase.from("achievements" as any).select("*"),
      supabase.from("user_achievements" as any).select("achievement_id").eq("user_id", userId),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
      supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("passed", true),
      supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("profiles").select("notify_achievement_email").eq("user_id", userId).maybeSingle(),
    ]);
    const notifyOn = ((prof.data as any)?.notify_achievement_email) !== false;
    const all = (achRes.data ?? []) as unknown as Ach[];
    const have = new Set(((owned.data ?? []) as any[]).map((r) => r.achievement_id));
    const s = stats.data as any;
    const ctx = {
      streak: s?.longest_streak ?? 0,
      xp: s?.xp ?? 0,
      lessons: lessonsCount.count ?? 0,
      quizzes: quizPass.count ?? 0,
      certs: certCount.count ?? 0,
      hour: new Date().getHours(),
    };
    const earned: Ach[] = [];
    for (const a of all) {
      if (have.has(a.id)) continue;
      const t = a.threshold ?? 1;
      let ok = false;
      switch (a.kind) {
        case "streak": ok = ctx.streak >= t; break;
        case "xp": ok = ctx.xp >= t; break;
        case "lessons": ok = ctx.lessons >= t; break;
        case "quizzes": ok = ctx.quizzes >= t; break;
        case "courses":
        case "certs": ok = ctx.certs >= t; break;
        case "special":
          if (a.id === "night_owl") ok = ctx.hour >= 0 && ctx.hour < 5;
          if (a.id === "early_bird") ok = ctx.hour >= 4 && ctx.hour < 6;
          break;
      }
      if (ok) earned.push(a);
    }
    if (!earned.length) return [];
    await supabase.from("user_achievements" as any).insert(
      earned.map((a) => ({ user_id: userId, achievement_id: a.id })),
    );
    for (const a of earned) {
      toast.success(`🏆 ${a.title}`, { description: a.description });
      if (a.xp_reward > 0) await awardXP(userId, a.xp_reward, `badge:${a.id}`);
    }
    return earned;
  } catch {
    return [];
  }
}
