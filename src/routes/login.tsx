import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — SkillWave" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Log in to continue learning.</p>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
            setBusy(false);
            if (error) toast.error(error.message); else { toast.success("Signed in"); nav({ to: "/my-learning" }); }
          }}>
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button className="w-full bg-gradient-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground flex justify-between">
            <Link to="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
            <Link to="/signup" className="hover:text-foreground">Create account</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
