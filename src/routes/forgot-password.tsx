import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — SkillWave" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [recovery, setRecovery] = useState(false);
  useEffect(() => { if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setRecovery(true); }, []);
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="rounded-xl border border-border bg-card p-8">
          {recovery ? (
            <>
              <h1 className="text-2xl font-bold mb-4">Set a new password</h1>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const { error } = await supabase.auth.updateUser({ password: newPw });
                if (error) toast.error(error.message); else { toast.success("Password updated"); window.location.href = "/login"; }
              }}>
                <div><Label>New password</Label><Input type="password" minLength={6} required value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
                <Button className="w-full bg-gradient-primary">Update password</Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">Reset password</h1>
              <p className="text-sm text-muted-foreground mb-6">We'll email you a recovery link.</p>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/forgot-password" });
                if (error) toast.error(error.message); else toast.success("Check your email");
              }}>
                <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button className="w-full bg-gradient-primary">Send link</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
