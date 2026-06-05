import { jsPDF } from "jspdf";

export type CertificateData = {
  student_name: string;
  course_title: string;
  verification_id: string;
  issued_at: string;
};

// Advanced, premium-feel certificate. Landscape A4, layered gradients,
// guilloche-style flourishes, gold seal, dual signature lines, and a
// verification footer with the public URL.
export function downloadCertificatePdf(c: CertificateData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // --- Base: deep navy ---
  doc.setFillColor(8, 8, 22);
  doc.rect(0, 0, W, H, "F");

  // --- Subtle radial glow (faux) using concentric translucent rectangles ---
  for (let i = 0; i < 10; i++) {
    const alpha = 0.04;
    doc.setFillColor(79, 70, 229);
    doc.setGState(new (doc as any).GState({ opacity: alpha }));
    doc.roundedRect(W / 2 - 300 - i * 12, H / 2 - 200 - i * 8, 600 + i * 24, 400 + i * 16, 20, 20, "F");
  }
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // --- Gradient edge bars (top & bottom) ---
  const bars = 80;
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const r = Math.round(79 + (34 - 79) * t);
    const g = Math.round(70 + (211 - 70) * t);
    const b = Math.round(229 + (238 - 229) * t);
    doc.setFillColor(r, g, b);
    doc.rect((W / bars) * i, 0, W / bars + 1, 10, "F");
    doc.rect((W / bars) * i, H - 10, W / bars + 1, 10, "F");
  }

  // --- Double inner border (gold + cyan) ---
  doc.setDrawColor(201, 168, 76); // gold
  doc.setLineWidth(1.5);
  doc.roundedRect(30, 30, W - 60, H - 60, 16, 16, "S");
  doc.setDrawColor(34, 211, 238); // cyan
  doc.setLineWidth(0.5);
  doc.roundedRect(42, 42, W - 84, H - 84, 14, 14, "S");

  // --- Corner ornaments ---
  const corners: [number, number][] = [
    [42, 42], [W - 42, 42], [42, H - 42], [W - 42, H - 42],
  ];
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.8);
  for (const [x, y] of corners) {
    doc.circle(x, y, 8, "S");
    doc.circle(x, y, 4, "S");
  }

  // --- Brand wordmark ---
  doc.setTextColor(34, 211, 238);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SKILLWAVE", W / 2, 82, { align: "center", charSpace: 4 });

  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 80, 90, W / 2 - 20, 90);
  doc.line(W / 2 + 20, 90, W / 2 + 80, 90);
  // diamond accent
  doc.setFillColor(201, 168, 76);
  doc.triangle(W / 2 - 4, 90, W / 2 + 4, 90, W / 2, 84, "F");
  doc.triangle(W / 2 - 4, 90, W / 2 + 4, 90, W / 2, 96, "F");

  doc.setTextColor(220, 220, 235);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("CERTIFICATE OF COMPLETION", W / 2, 112, { align: "center", charSpace: 6 });

  // --- "This certifies that" ---
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(13);
  doc.setFont("helvetica", "italic");
  doc.text("This is to certify that", W / 2, 168, { align: "center" });

  // --- Student name (auto-fit) ---
  let nameSize = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameSize);
  while (doc.getTextWidth(c.student_name) > W - 180 && nameSize > 20) {
    nameSize -= 2;
    doc.setFontSize(nameSize);
  }
  doc.setTextColor(255, 255, 255);
  doc.text(c.student_name, W / 2, 222, { align: "center" });

  // gold underline under name
  const nameWidth = doc.getTextWidth(c.student_name);
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(1);
  doc.line(W / 2 - nameWidth / 2 - 8, 234, W / 2 + nameWidth / 2 + 8, 234);

  // --- Body ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(210, 210, 225);
  doc.text("has successfully completed the course", W / 2, 268, { align: "center" });

  // --- Course title (auto-fit) ---
  let courseSize = 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(courseSize);
  while (doc.getTextWidth(c.course_title) > W - 180 && courseSize > 14) {
    courseSize -= 1;
    doc.setFontSize(courseSize);
  }
  doc.setTextColor(34, 211, 238);
  doc.text(c.course_title, W / 2, 310, { align: "center" });

  // --- Gold seal (right side) ---
  const sealX = W - 130, sealY = 380;
  // outer ring
  doc.setFillColor(201, 168, 76);
  doc.circle(sealX, sealY, 38, "F");
  doc.setFillColor(241, 208, 116);
  doc.circle(sealX, sealY, 32, "F");
  doc.setFillColor(168, 138, 50);
  doc.circle(sealX, sealY, 26, "F");
  // star burst lines
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    const x1 = sealX + Math.cos(a) * 12;
    const y1 = sealY + Math.sin(a) * 12;
    const x2 = sealX + Math.cos(a) * 24;
    const y2 = sealY + Math.sin(a) * 24;
    doc.line(x1, y1, x2, y2);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CERTIFIED", sealX, sealY - 2, { align: "center" });
  doc.setFontSize(7);
  doc.text("SKILLWAVE", sealX, sealY + 8, { align: "center" });
  // ribbons
  doc.setFillColor(180, 30, 50);
  doc.triangle(sealX - 18, sealY + 30, sealX - 8, sealY + 30, sealX - 13, sealY + 56, "F");
  doc.triangle(sealX + 8, sealY + 30, sealX + 18, sealY + 30, sealX + 13, sealY + 56, "F");

  // --- Signature lines (left) ---
  const sigY = H - 110;
  doc.setDrawColor(160, 160, 180);
  doc.setLineWidth(0.6);
  doc.line(80, sigY, 230, sigY);
  doc.line(270, sigY, 420, sigY);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(13);
  doc.setTextColor(220, 220, 235);
  doc.text("SkillWave Academy", 155, sigY - 6, { align: "center" });
  doc.text("Course Instructor", 345, sigY - 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 180);
  doc.text("Director of Education", 155, sigY + 14, { align: "center" });
  doc.text("Lead Instructor", 345, sigY + 14, { align: "center" });

  // --- Footer info ---
  const issued = new Date(c.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.text(`Issued on ${issued}`, 80, H - 60);
  doc.text(`Verification ID: ${c.verification_id}`, 80, H - 46);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  doc.setTextColor(34, 211, 238);
  doc.text(`Verify at ${origin}/verify/${c.verification_id}`, W - 80, H - 46, { align: "right" });

  doc.save(`SkillWave-${c.course_title.replace(/\s+/g, "_")}.pdf`);
}

export function linkedInShareUrl(c: CertificateData) {
  const d = new Date(c.issued_at);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: c.course_title,
    organizationName: "SkillWave",
    issueYear: String(d.getFullYear()),
    issueMonth: String(d.getMonth() + 1),
    certUrl: `${origin}/verify/${c.verification_id}`,
    certId: c.verification_id,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
