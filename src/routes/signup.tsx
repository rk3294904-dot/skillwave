import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — SkillWave" }] }),
  component: Signup,
});

function Signup() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start your learning journey.</p>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            const { error } = await supabase.auth.signUp({
              email, password: pw,
              options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
            });
            setBusy(false);
            if (error) toast.error(error.message);
            else { toast.success("Account created"); nav({ to: "/my-learning" }); }
          }}>
            <div><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button className="w-full bg-gradient-primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-primary">Log in</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
