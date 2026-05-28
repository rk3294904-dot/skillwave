import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SkillWave" }] }),
  component: Settings,
});

function Settings() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
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
