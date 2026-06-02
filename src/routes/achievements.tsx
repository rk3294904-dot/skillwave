import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Award, Flame, Zap, GraduationCap, Brain, Crown, Trophy, Moon, Sunrise, Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { checkAchievements } from "@/lib/gamification";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — SkillWave" }] }),
  component: Achievements,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy, flame: Flame, zap: Zap, crown: Crown,
  "graduation-cap": GraduationCap, brain: Brain, award: Award,
  moon: Moon, sunrise: Sunrise, footprints: Footprints,
};

function Achievements() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  useEffect(() => { if (user) checkAchievements(user.id); }, [user]);

  const all = useQuery({
    queryKey: ["all-achievements"],
    queryFn: async () => (await supabase.from("achievements" as any).select("*").order("display_order")).data ?? [],
  });
  const mine = useQuery({
    queryKey: ["my-achievements", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_achievements" as any).select("*").eq("user_id", user!.id)).data ?? [],
  });
  const unlocked = new Map((mine.data as any[] ?? []).map((m) => [m.achievement_id, m.unlocked_at]));

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground mb-6">Unlock badges as you learn. {unlocked.size} / {(all.data ?? []).length} earned.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(all.data as any[] ?? []).map((a) => {
            const Icon = ICONS[a.icon] ?? Trophy;
            const has = unlocked.has(a.id);
            return (
              <div key={a.id} className={`rounded-xl border p-4 transition-all ${has ? "border-primary/50 bg-gradient-to-br from-primary/10 to-cyan-400/5" : "border-border bg-card opacity-60"}`}>
                <div className={`h-10 w-10 rounded-lg grid place-items-center mb-3 ${has ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
                {a.xp_reward > 0 && <div className="text-[11px] text-cyan-300 mt-2 font-medium">+{a.xp_reward} XP reward</div>}
                {has && <div className="text-[10px] uppercase tracking-wide text-emerald-400 mt-1">Unlocked</div>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
