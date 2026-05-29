import { jsPDF } from "jspdf";

export type CertificateData = {
  student_name: string;
  course_title: string;
  verification_id: string;
  issued_at: string;
};

export function downloadCertificatePdf(c: CertificateData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background — deep navy
  doc.setFillColor(10, 10, 26);
  doc.rect(0, 0, W, H, "F");

  // Faux gradient bars (indigo → cyan) along edges
  const bars = 60;
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const r = Math.round(79 + (34 - 79) * t);
    const g = Math.round(70 + (211 - 70) * t);
    const b = Math.round(229 + (238 - 229) * t);
    doc.setFillColor(r, g, b);
    doc.rect((W / bars) * i, 0, W / bars + 1, 14, "F");
    doc.rect((W / bars) * i, H - 14, W / bars + 1, 14, "F");
  }

  // Inner panel border
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.2);
  doc.roundedRect(36, 36, W - 72, H - 72, 14, 14, "S");
  doc.setDrawColor(34, 211, 238);
  doc.setLineWidth(0.6);
  doc.roundedRect(46, 46, W - 92, H - 92, 12, 12, "S");

  // Brand
  doc.setTextColor(34, 211, 238);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SKILLWAVE", W / 2, 86, { align: "center" });

  doc.setTextColor(180, 180, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("CERTIFICATE OF COMPLETION", W / 2, 104, { align: "center" });

  // Decorative line
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1);
  doc.line(W / 2 - 60, 116, W / 2 + 60, 116);

  // "This certifies that"
  doc.setTextColor(220, 220, 235);
  doc.setFontSize(13);
  doc.text("This certifies that", W / 2, 168, { align: "center" });

  // Student name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(c.student_name, W / 2, 220, { align: "center" });

  // Underline name
  const nameWidth = doc.getTextWidth(c.student_name);
  doc.setDrawColor(34, 211, 238);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - nameWidth / 2, 232, W / 2 + nameWidth / 2, 232);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(200, 200, 220);
  doc.text("has successfully completed the course", W / 2, 268, { align: "center" });

  // Course title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(34, 211, 238);
  doc.text(c.course_title, W / 2, 308, { align: "center" });

  // Footer
  const issued = new Date(c.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Issued on ${issued}`, 90, H - 80);
  doc.text(`Verification ID: ${c.verification_id}`, 90, H - 64);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  doc.text(`Verify at ${origin}/verify/${c.verification_id}`, W - 90, H - 64, { align: "right" });

  // Signature line
  doc.setDrawColor(160, 160, 180);
  doc.line(W - 230, H - 90, W - 90, H - 90);
  doc.setFontSize(9);
  doc.text("SkillWave Academy", W - 160, H - 76, { align: "center" });

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
