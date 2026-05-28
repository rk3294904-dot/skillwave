import { toEmbedUrl } from "@/lib/embed";

export function VideoEmbed({ url, provider, title }: { url: string; provider?: string | null; title?: string }) {
  const src = toEmbedUrl(url, provider);
  if (!src) return <div className="aspect-video grid place-items-center bg-muted rounded-lg text-muted-foreground">No video</div>;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black shadow-glow">
      <iframe
        src={src}
        title={title ?? "Lesson video"}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
