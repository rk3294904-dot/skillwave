/** Convert YouTube or Google Drive URLs to embeddable iframe URLs. */
export function toEmbedUrl(url: string, provider?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();

  // YouTube
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  if (provider === "youtube" && /^[\w-]{6,}$/.test(u)) return `https://www.youtube.com/embed/${u}?rel=0`;

  // Google Drive
  const gd = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ?? u.match(/[?&]id=([\w-]+)/);
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;

  // Already an embed
  if (/\/embed\//.test(u) || /\/preview/.test(u)) return u;
  return u;
}

export function isPdfUrl(u: string) {
  return /\.pdf($|\?)/i.test(u) || /drive\.google\.com\/file/.test(u);
}
