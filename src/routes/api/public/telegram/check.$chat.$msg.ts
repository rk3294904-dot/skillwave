import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return _sb;
}

export const Route = createFileRoute("/api/public/telegram/check/$chat/$msg")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const chatNum = Number(params.chat);
        const msgNum = Number(params.msg);
        if (!Number.isFinite(chatNum) || !Number.isFinite(msgNum)) {
          return Response.json({ found: false, error: "Bad params" }, { status: 400 });
        }
        const candidates = chatNum < 0 ? [chatNum] : [chatNum, Number(`-100${chatNum}`)];
        for (const c of candidates) {
          const r = await sb()
            .from("telegram_videos")
            .select("duration, width, height, mime_type, caption")
            .eq("chat_id", c)
            .eq("message_id", msgNum)
            .maybeSingle();
          if (r.data) return Response.json({ found: true, ...r.data });
        }
        return Response.json({ found: false });
      },
    },
  },
});
