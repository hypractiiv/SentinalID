// src/utils/generateReportPdf.js
//
// Builds a downloadable PDF from the same verification result object
// ResultsDashboard.jsx already renders — no backend changes required.
// Text content (verdict, scores, MRZ fields, reasons) is drawn directly,
// so the PDF stays small and works even if image embedding fails.
//
// Requires: npm install jspdf

import jsPDF from "jspdf";

const RISK_COLORS = {
  LOW: [22, 163, 74],   // green
  MEDIUM: [217, 119, 6], // amber
  HIGH: [220, 38, 38],   // red
};

// Converts an image URL (e.g. the backend's ELA heatmap path) to a data
// URL so jsPDF can embed it. Uses fetch, not canvas, so it isn't blocked
// by canvas tainting — but it IS still a normal cross-origin fetch, so
// if the backend serves that image from a different origin than the
// frontend, the backend needs to allow it via CORS (see note below).
async function urlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateReportPdf({ verificationId, timestamp, data }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // --- Header ---
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("SentinelID — Screening Report", margin, y);
  y += 22;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100);
  doc.text(`Verification ID: ${verificationId || "N/A"}`, margin, y);
  y += 14;
  doc.text(`Generated: ${timestamp || new Date().toLocaleString()}`, margin, y);
  y += 24;
  doc.setTextColor(0);

  // --- Verdict banner ---
  const riskLevel = data.risk?.risk_level ?? "UNKNOWN";
  const [r, g, b] = RISK_COLORS[riskLevel] ?? [100, 100, 100];
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(
    `${riskLevel} RISK — Score: ${data.risk?.final_risk ?? "-"}/100`,
    margin + 14,
    y + 26
  );
  doc.setTextColor(0);
  y += 60;

  const heading = (text) => {
    ensureSpace(30);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(text, margin, y);
    y += 16;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
  };

  const row = (label, value) => {
    ensureSpace(14);
    const text = value === undefined || value === null || value === "" ? "-" : String(value);
    doc.text(String(label), margin, y);
    doc.text(text, pageWidth - margin - doc.getTextWidth(text), y);
    y += 14;
  };

  // --- OCR / MRZ ---
  heading("Identity Document — OCR / MRZ");
  const mrz = data.ocr?.mrz;
  if (mrz) {
    row("Given Name", mrz.names);
    row("Surname", mrz.surname);
    row("Document Number", mrz.number);
    row("Nationality", mrz.nationality);
    row("Date of Birth", mrz.date_of_birth);
    row("Expiry Date", mrz.expiration_date);
    row("Gender", mrz.sex);
  } else {
    ensureSpace(14);
    doc.text("No MRZ detected on this document.", margin, y);
    y += 14;
  }
  y += 10;

  // --- Tampering ---
  heading("Document Authenticity");
  row("Verdict", data.tamper?.verdict);
  row(
    "Tampering Risk Score",
    data.tamper?.tamper_score !== undefined ? `${data.tamper.tamper_score}/100` : undefined
  );
  if (data.tamper?.metadata_flags?.length) {
    ensureSpace(4);
    y += 4;
    doc.setFont(undefined, "italic");
    data.tamper.metadata_flags.forEach((flag) => {
      ensureSpace(12);
      doc.text(`• ${flag}`, margin, y);
      y += 12;
    });
    doc.setFont(undefined, "normal");
  }
  y += 10;

  // --- Face match ---
  heading("Face Verification");
  row("Result", data.face ? (data.face.match ? "MATCH" : "NO MATCH") : undefined);
  row(
    "Similarity Score",
    data.face?.similarity_score ? `${data.face.similarity_score}%` : undefined
  );
  if (data.face?.reason) {
    ensureSpace(14);
    y += 4;
    doc.setFont(undefined, "italic");
    doc.text(data.face.reason, margin, y);
    doc.setFont(undefined, "normal");
    y += 14;
  }
  y += 10;

  // --- Liveness (placeholder, matches LivenessCard.jsx) ---
  heading("Liveness Check");
  ensureSpace(14);
  doc.setTextColor(120);
  doc.text("Not available — this stage isn't implemented on the backend yet.", margin, y);
  doc.setTextColor(0);
  y += 24;

  // --- Evidence images (best-effort; silently skipped if unreachable) ---
  const addImage = async (label, src, isBase64) => {
    try {
      const dataUrl = isBase64 ? `data:image/jpeg;base64,${src}` : await urlToDataUrl(src);
      ensureSpace(160);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(label, margin, y);
      y += 10;
      doc.addImage(dataUrl, "JPEG", margin, y, 180, 135);
      y += 145;
    } catch {
      // Image unavailable (e.g. CORS-blocked or removed) — the text
      // fields above already cover the same evidence, so skip quietly.
    }
  };

  if (data.tamper?.ela_output_path) {
    await addImage("Error Level Analysis (ELA) Heatmap", data.tamper.ela_output_path, false);
  }
  if (data.face?.doc_face_image) {
    await addImage("Document Face", data.face.doc_face_image, true);
  }
  if (data.face?.selfie_face_image) {
    await addImage("Selfie Face", data.face.selfie_face_image, true);
  }

  // --- Footer disclaimer ---
  ensureSpace(30);
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    "Tampering and face-match scores are heuristic outputs, not statistically calibrated fraud probabilities.",
    margin,
    pageHeight - margin / 2
  );
  doc.setTextColor(0);

  doc.save(`${verificationId || "sentinelid-report"}.pdf`);
}
