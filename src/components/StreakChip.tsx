import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Flame, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function StreakChip() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["user-stats", user?.id],
    enabled: !!user,
    refetchOnWindowFocus: true,
    queryFn: async () =>
      (await supabase.from("user_stats").select("xp,current_streak").eq("user_id", user!.id).maybeSingle()).data,
  });
  if (!user) return null;
  const xp = stats.data?.xp ?? 0;
  const streak = stats.data?.current_streak ?? 0;
  return (
    <Link
      to="/leaderboard"
      title={`${streak}-day streak · ${xp} XP`}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold hover:border-primary/60 transition-colors"
    >
      <span className="flex items-center gap-1 text-orange-400"><Flame className="h-3.5 w-3.5" />{streak}</span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1 text-cyan-300"><Zap className="h-3.5 w-3.5" />{xp}</span>
    </Link>
  );
}
