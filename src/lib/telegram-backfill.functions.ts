import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function fullChatId(chat: number) {
  // URLs like t.me/c/3714763412/9 give the "internal" id. Telegram API needs -100<id>.
  return chat < 0 ? chat : Number(`-100${chat}`);
}

async function tg(method: string, body: unknown) {
  const lov = process.env.LOVABLE_API_KEY;
  const key = process.env.TELEGRAM_API_KEY;
  if (!lov || !key) throw new Error("Telegram not configured");
  const r = await fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lov}`,
      "X-Connection-Api-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const j: any = await r.json().catch(() => ({}));
  return { ok: r.ok && j?.ok !== false, status: r.status, data: j };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const backfillTelegramRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chat: number; from: number; to: number; deleteCopies?: boolean }) => d)
  .handler(async ({ data, context }) => {
    // admin check
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!roles?.some((r: any) => r.role === "admin")) {
      throw new Error("Forbidden: admin only");
    }
    if (!Number.isFinite(data.chat) || !Number.isFinite(data.from) || !Number.isFinite(data.to)) {
      throw new Error("Invalid range");
    }
    const lo = Math.min(data.from, data.to);
    const hi = Math.max(data.from, data.to);
    if (hi - lo > 500) throw new Error("Range too large (max 500)");

    const chatFull = fullChatId(data.chat);
    const sb = admin();
    const results: { msg: number; status: "ok" | "skipped" | "failed"; error?: string }[] = [];
    let imported = 0;

    for (let mid = lo; mid <= hi; mid++) {
      try {
        // Skip if already indexed
        const existing = await (sb.from("telegram_videos" as any) as any)
          .select("message_id")
          .eq("chat_id", chatFull)
          .eq("message_id", mid)
          .maybeSingle();
        if (existing.data) {
          results.push({ msg: mid, status: "skipped" });
          continue;
        }

        // copyMessage from channel back to channel, silently
        const copy = await tg("copyMessage", {
          chat_id: chatFull,
          from_chat_id: chatFull,
          message_id: mid,
          disable_notification: true,
        });
        if (!copy.ok) {
          results.push({ msg: mid, status: "failed", error: copy.data?.description ?? `HTTP ${copy.status}` });
          await sleep(250);
          continue;
        }
        const newMsgId = copy.data?.result?.message_id;
        if (!newMsgId) {
          results.push({ msg: mid, status: "failed", error: "no message_id returned" });
          continue;
        }

        // Poll DB for webhook to index the copy
        let row: any = null;
        for (let i = 0; i < 12; i++) {
          await sleep(600);
          const r = await (sb.from("telegram_videos" as any) as any)
            .select("*")
            .eq("chat_id", chatFull)
            .eq("message_id", newMsgId)
            .maybeSingle();
          if (r.data) { row = r.data; break; }
        }

        if (row) {
          // Insert a record for the ORIGINAL message_id pointing to same file
          const { error } = await (sb.from("telegram_videos" as any) as any).upsert(
            {
              chat_id: chatFull,
              message_id: mid,
              file_id: row.file_id,
              file_unique_id: row.file_unique_id,
              mime_type: row.mime_type,
              duration: row.duration,
              width: row.width,
              height: row.height,
              file_size: row.file_size,
              thumbnail_file_id: row.thumbnail_file_id,
              caption: row.caption,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "chat_id,message_id" },
          );
          if (error) {
            results.push({ msg: mid, status: "failed", error: error.message });
          } else {
            imported++;
            results.push({ msg: mid, status: "ok" });
          }
        } else {
          results.push({ msg: mid, status: "failed", error: "no video (post may not contain a video)" });
        }

        // Delete the duplicate copy
        if (data.deleteCopies !== false) {
          await tg("deleteMessage", { chat_id: chatFull, message_id: newMsgId });
          await (sb.from("telegram_videos" as any) as any)
            .delete()
            .eq("chat_id", chatFull)
            .eq("message_id", newMsgId);
        }

        // throttle to avoid Telegram rate limits
        await sleep(400);
      } catch (e: any) {
        results.push({ msg: mid, status: "failed", error: e?.message ?? String(e) });
      }
    }

    return { imported, total: hi - lo + 1, results };
  });
