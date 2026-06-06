import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { backfillTelegramRange } from "@/lib/telegram-backfill.functions";

export const Route = createFileRoute("/admin/telegram")({
  head: () => ({ meta: [{ title: "Telegram — Admin" }] }),
  component: TelegramAdmin,
});

function TelegramAdmin() {
  const [chat, setChat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deleteCopies, setDeleteCopies] = useState(true);
  const [log, setLog] = useState<{ msg: number; status: string; error?: string }[]>([]);
  const [summary, setSummary] = useState<{ imported: number; total: number } | null>(null);

  const fn = useServerFn(backfillTelegramRange);
  const run = useMutation({
    mutationFn: async () => {
      const chatN = Number(chat.replace(/^-100/, ""));
      return fn({ data: { chat: chatN, from: Number(from), to: Number(to), deleteCopies } });
    },
    onSuccess: (r) => {
      setLog(r.results);
      setSummary({ imported: r.imported, total: r.total });
      toast.success(`Backfill done: ${r.imported}/${r.total} imported`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold">Telegram videos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Import older posts from a private Telegram channel. Bot must be an admin with “Post” and “Delete” rights.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-semibold">Backfill range</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Channel ID</Label>
            <Input value={chat} onChange={(e) => setChat(e.target.value)} placeholder="3714763412" />
            <p className="text-xs text-muted-foreground mt-1">The number from <code>t.me/c/&lt;id&gt;/N</code></p>
          </div>
          <div><Label>From message ID</Label><Input type="number" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="1" /></div>
          <div><Label>To message ID</Label><Input type="number" value={to} onChange={(e) => setTo(e.target.value)} placeholder="50" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={deleteCopies} onCheckedChange={setDeleteCopies} />
          Delete duplicate copies from channel after import (recommended)
        </label>
        <div className="flex items-center gap-3">
          <Button className="bg-gradient-primary" onClick={() => run.mutate()} disabled={run.isPending || !chat || !from || !to}>
            {run.isPending ? "Importing…" : "Start backfill"}
          </Button>
          {summary && (
            <span className="text-sm text-muted-foreground">
              Imported {summary.imported} of {summary.total}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          How it works: the bot uses <code>copyMessage</code> to clone each post in the channel (silently),
          captures the file via webhook, stores it under the original message id, then deletes the copy.
          Max 500 messages per run. Posts without a video are skipped.
        </p>
      </div>

      {log.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-2 text-sm">Results</h3>
          <div className="max-h-80 overflow-y-auto text-xs font-mono space-y-1">
            {log.map((r) => (
              <div key={r.msg} className={
                r.status === "ok" ? "text-green-500" :
                r.status === "skipped" ? "text-muted-foreground" : "text-red-500"
              }>
                #{r.msg} — {r.status}{r.error ? ` · ${r.error}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
