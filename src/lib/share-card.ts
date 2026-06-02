import type { CertificateData } from "./certificate";

export async function downloadShareCard(c: CertificateData) {
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Background gradient
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a0a1a");
  g.addColorStop(0.5, "#1e1b4b");
  g.addColorStop(1, "#082f49");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Accent gradient bar
  const bar = ctx.createLinearGradient(0, 0, W, 0);
  bar.addColorStop(0, "#4f46e5"); bar.addColorStop(1, "#22d3ee");
  ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 8); ctx.fillRect(0, H - 8, W, 8);

  // Brand
  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 28px Inter, system-ui, sans-serif";
  ctx.fillText("SKILLWAVE", 64, 80);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "16px Inter, system-ui, sans-serif";
  ctx.fillText("CERTIFIED ACHIEVEMENT", 64, 108);

  // Headline
  ctx.fillStyle = "#fff";
  ctx.font = "bold 52px Inter, system-ui, sans-serif";
  wrap(ctx, `${c.student_name} just completed`, 64, 220, W - 128, 60);

  // Course
  ctx.fillStyle = "#a5f3fc";
  ctx.font = "bold 64px Inter, system-ui, sans-serif";
  wrap(ctx, c.course_title, 64, 360, W - 128, 76);

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "20px Inter, system-ui, sans-serif";
  ctx.fillText(`ID ${c.verification_id}`, 64, H - 60);
  ctx.textAlign = "right";
  ctx.fillText(`${typeof window !== "undefined" ? window.location.host : "skillwave"}/verify/${c.verification_id}`, W - 64, H - 60);

  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `SkillWave-${c.course_title.replace(/\s+/g, "_")}-share.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = ""; let yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy); line = w; yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
