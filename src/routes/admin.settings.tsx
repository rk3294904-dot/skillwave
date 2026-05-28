import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const qc = useQueryClient();
  const all = useQuery({ queryKey: ["site-settings"], queryFn: async () => (await supabase.from("settings").select("*")).data ?? [] });
  const get = (k: string) => (all.data ?? []).find((s) => s.key === k)?.value as any;
  const [site, setSite] = useState({ name: "SkillWave", tagline: "Learn in-demand skills", support_email: "support@skillwave.app", announcement: "" });
  useEffect(() => { const v = get("site"); if (v) setSite({ ...site, ...v }); /* eslint-disable-next-line */ }, [all.data]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("settings").upsert({ key: "site", value: site, updated_at: new Date().toISOString() }, { onConflict: "key" } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Site settings</h2>
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div><Label>Name</Label><Input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} /></div>
        <div><Label>Tagline</Label><Input value={site.tagline} onChange={(e) => setSite({ ...site, tagline: e.target.value })} /></div>
        <div><Label>Support email</Label><Input value={site.support_email} onChange={(e) => setSite({ ...site, support_email: e.target.value })} /></div>
        <div><Label>Site-wide announcement</Label><Textarea value={site.announcement} onChange={(e) => setSite({ ...site, announcement: e.target.value })} /></div>
        <Button className="bg-gradient-primary" onClick={() => save.mutate()}>Save</Button>
      </div>
    </div>
  );
}
