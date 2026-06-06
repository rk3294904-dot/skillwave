import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

function deriveSecret(apiKey: string) {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) {
    _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.TELEGRAM_API_KEY;
        if (!key) return new Response("Telegram not configured", { status: 500 });

        const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(got, deriveSecret(key))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json().catch(() => null);
        if (!update) return new Response("Bad request", { status: 400 });

        const msg =
          update.channel_post ??
          update.edited_channel_post ??
          update.message ??
          update.edited_message;

        const video = msg?.video ?? msg?.document;
        if (!msg?.chat?.id || typeof msg?.message_id !== "number" || !video?.file_id) {
          return Response.json({ ok: true, skipped: true });
        }

        const { error } = await (sb().from("telegram_videos" as any) as any)
          .upsert(
            {
              chat_id: msg.chat.id,
              message_id: msg.message_id,
              file_id: video.file_id,
              file_unique_id: video.file_unique_id ?? null,
              mime_type: video.mime_type ?? null,
              duration: video.duration ?? null,
              width: video.width ?? null,
              height: video.height ?? null,
              file_size: video.file_size ?? null,
              thumbnail_file_id: video.thumbnail?.file_id ?? video.thumb?.file_id ?? null,
              caption: msg.caption ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "chat_id,message_id" },
          );

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
