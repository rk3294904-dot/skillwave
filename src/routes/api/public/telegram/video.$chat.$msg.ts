import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return _sb;
}

export const Route = createFileRoute("/api/public/telegram/video/$chat/$msg")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const chatNum = Number(params.chat);
        const msgNum = Number(params.msg);
        if (!Number.isFinite(chatNum) || !Number.isFinite(msgNum)) {
          return new Response("Bad params", { status: 400 });
        }

        // Try both raw and -100-prefixed chat IDs (channels)
        const candidates = chatNum < 0 ? [chatNum] : [chatNum, Number(`-100${chatNum}`)];
        let row: any = null;
        for (const c of candidates) {
          const r = await sb()
            .from("telegram_videos")
            .select("file_id, mime_type")
            .eq("chat_id", c)
            .eq("message_id", msgNum)
            .maybeSingle();
          if (r.data) { row = r.data; break; }
        }
        if (!row) {
          return new Response(
            "Video not found. Make sure the bot is an admin in the channel and the post was made AFTER the bot was added.",
            { status: 404 },
          );
        }

        const key = process.env.TELEGRAM_API_KEY;
        const lov = process.env.LOVABLE_API_KEY;
        if (!key || !lov) return new Response("Telegram not configured", { status: 500 });

        // 1. getFile -> file_path
        const fileRes = await fetch(`${GATEWAY}/getFile`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lov}`,
            "X-Connection-Api-Key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ file_id: row.file_id }),
        });
        const fileData: any = await fileRes.json().catch(() => ({}));
        if (!fileRes.ok || !fileData?.result?.file_path) {
          return new Response(`getFile failed: ${JSON.stringify(fileData)}`, { status: 502 });
        }

        // 2. Stream via gateway /file/<path>, forwarding Range header
        const range = request.headers.get("range") ?? undefined;
        const dlRes = await fetch(`${GATEWAY}/file/${fileData.result.file_path}`, {
          headers: {
            Authorization: `Bearer ${lov}`,
            "X-Connection-Api-Key": key,
            ...(range ? { Range: range } : {}),
          },
        });
        if (!dlRes.ok && dlRes.status !== 206) {
          return new Response(`Download failed: ${dlRes.status}`, { status: 502 });
        }

        const headers = new Headers();
        headers.set("Content-Type", row.mime_type ?? dlRes.headers.get("content-type") ?? "video/mp4");
        const cl = dlRes.headers.get("content-length");
        if (cl) headers.set("Content-Length", cl);
        const cr = dlRes.headers.get("content-range");
        if (cr) headers.set("Content-Range", cr);
        headers.set("Accept-Ranges", "bytes");
        headers.set("Cache-Control", "private, max-age=300");

        return new Response(dlRes.body, { status: dlRes.status, headers });
      },
    },
  },
});
