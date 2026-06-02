import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — SkillWave" }] }),
  component: Leaderboard,
});

type Row = { user_id: string; xp: number; streak: number; display_name: string | null; avatar_url: string | null };

function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "week">("week");

  const lb = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async (): Promise<Row[]> => {
      if (tab === "all") {
        const { data: stats } = await supabase.from("user_stats").select("user_id,xp,current_streak").order("xp", { ascending: false }).limit(50);
        const ids = (stats ?? []).map((s) => s.user_id);
        const { data: profs } = ids.length ? await supabase.from("profiles").select("user_id,display_name,avatar_url").in("user_id", ids) : { data: [] };
        const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
        return (stats ?? []).map((s) => ({
          user_id: s.user_id, xp: s.xp, streak: s.current_streak,
          display_name: map.get(s.user_id)?.display_name ?? null,
          avatar_url: map.get(s.user_id)?.avatar_url ?? null,
        }));
      }
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: events } = await supabase.from("xp_events" as any).select("user_id,delta").gte("created_at", since);
      const agg = new Map<string, number>();
      for (const e of (events ?? []) as any[]) agg.set(e.user_id, (agg.get(e.user_id) ?? 0) + (e.delta ?? 0));
      const ids = Array.from(agg.keys());
      if (!ids.length) return [];
      const [{ data: profs }, { data: stats }] = await Promise.all([
        supabase.from("profiles").select("user_id,display_name,avatar_url").in("user_id", ids),
        supabase.from("user_stats").select("user_id,current_streak").in("user_id", ids),
      ]);
      const pm = new Map((profs ?? []).map((p) => [p.user_id, p]));
      const sm = new Map((stats ?? []).map((s) => [s.user_id, s]));
      return ids
        .map((id) => ({
          user_id: id, xp: agg.get(id)!,
          streak: sm.get(id)?.current_streak ?? 0,
          display_name: pm.get(id)?.display_name ?? null,
          avatar_url: pm.get(id)?.avatar_url ?? null,
        }))
        .sort((a, b) => b.xp - a.xp).slice(0, 50);
    },
  });

  const rows = lb.data ?? [];
  const myRank = rows.findIndex((r) => r.user_id === user?.id);

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center"><Trophy className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top learners by XP</p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1 mb-5">
          {(["week", "all"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "week" ? "This week" : "All-time"}
            </button>
          ))}
        </div>

        {myRank >= 0 && (
          <div className="mb-4 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm flex items-center justify-between">
            <span>Your rank: <strong>#{myRank + 1}</strong></span>
            <span className="flex items-center gap-1 text-cyan-300"><Zap className="h-3.5 w-3.5" />{rows[myRank].xp} XP</span>
          </div>
        )}

        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.user_id} className={`flex items-center gap-3 rounded-xl border border-border p-3 ${r.user_id === user?.id ? "bg-primary/5 border-primary/40" : "bg-card"}`}>
              <div className={`h-8 w-8 rounded-lg grid place-items-center text-sm font-bold shrink-0
                ${i === 0 ? "bg-amber-400/20 text-amber-300" : i === 1 ? "bg-zinc-400/20 text-zinc-300" : i === 2 ? "bg-orange-400/20 text-orange-300" : "bg-muted text-muted-foreground"}`}>
                {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground overflow-hidden shrink-0">
                {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> : (r.display_name ?? "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.display_name ?? "Anonymous"}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1 text-orange-400"><Flame className="h-3 w-3" />{r.streak}d</span>
                </div>
              </div>
              <div className="text-right font-bold text-cyan-300">{r.xp.toLocaleString()} <span className="text-[10px] uppercase text-muted-foreground">XP</span></div>
            </li>
          ))}
          {rows.length === 0 && <p className="text-center text-muted-foreground py-8">No data yet — be the first to earn XP!</p>}
        </ol>
      </div>
    </AppShell>
  );
}
