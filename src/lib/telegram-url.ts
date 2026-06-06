/** Parse a Telegram post link. Returns { chat, msg } or null.
 * Supports:
 *   https://t.me/c/3714763412/9         -> private channel (internal id, no -100 prefix)
 *   https://t.me/<username>/9           -> public channel (username)
 */
export type TgRef = { kind: "private"; chat: number; msg: number } | { kind: "public"; username: string; msg: number };

export function parseTelegramUrl(input: string): TgRef | null {
  if (!input) return null;
  try {
    const u = new URL(input.trim());
    if (!/(^|\.)t\.me$/.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "c" && parts.length >= 3) {
      const chat = Number(parts[1]);
      const msg = Number(parts[2]);
      if (!Number.isFinite(chat) || !Number.isFinite(msg)) return null;
      return { kind: "private", chat, msg };
    }
    if (parts.length >= 2) {
      const msg = Number(parts[1]);
      if (!Number.isFinite(msg)) return null;
      return { kind: "public", username: parts[0], msg };
    }
    return null;
  } catch {
    return null;
  }
}

export function telegramStreamUrl(input: string): string | null {
  const ref = parseTelegramUrl(input);
  if (!ref || ref.kind !== "private") return null;
  return `/api/public/telegram/video/${ref.chat}/${ref.msg}`;
}

export function telegramPublicEmbed(input: string): string | null {
  const ref = parseTelegramUrl(input);
  if (!ref || ref.kind !== "public") return null;
  return `https://t.me/${ref.username}/${ref.msg}?embed=1&userpic=true&dark=1`;
}
