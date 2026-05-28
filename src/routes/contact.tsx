import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — SkillWave" }] }),
  component: () => {
    const [f, setF] = useState({ name: "", email: "", msg: "" });
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-16 max-w-xl">
          <h1 className="text-3xl font-bold mb-2">Contact us</h1>
          <p className="text-muted-foreground mb-6">We'd love to hear from you.</p>
          <form className="space-y-4 rounded-xl border border-border bg-card p-6" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent — we'll reply soon."); setF({ name: "", email: "", msg: "" }); }}>
            <div><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Message</Label><Textarea required rows={5} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></div>
            <Button className="bg-gradient-primary">Send message</Button>
          </form>
        </div>
      </AppShell>
    );
  },
});
