// src/utils/generateReportPdf.js
//
// Builds a downloadable PDF from the same verification result object
// ResultsDashboard.jsx already renders — no backend changes required.
//
// Requires: npm install jspdf jspdf-autotable

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Same status colors the app UI uses, just as RGB triples for jsPDF.
const RISK_COLORS = {
  LOW: [22, 163, 74],
  MEDIUM: [217, 119, 6],
  HIGH: [220, 38, 38],
};
const RISK_LABEL = { LOW: "PASS", MEDIUM: "REVIEW", HIGH: "FAIL" };
const INK = [15, 23, 42];       // slate-900, body text on white
const MUTED = [100, 116, 139];  // slate-500
const ACCENT = [245, 158, 11];  // amber-500
const LINE = [226, 232, 240];   // slate-200

const MARGIN = 40;

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
  const contentWidth = pageWidth - MARGIN * 2;

  const riskLevel = data.risk?.risk_level ?? "MEDIUM";
  const riskColor = RISK_COLORS[riskLevel] ?? MUTED;
  const riskLabel = RISK_LABEL[riskLevel] ?? "REVIEW";

  // ---- Repeating header + footer, drawn on every page autoTable renders ----
  const drawChrome = (pageNumber) => {
    // Header: accent tab + wordmark + verification id, on every page.
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, 6, pageHeight, "F");

    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text("SentinelID", MARGIN, 34);

    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Identity Verification Report", MARGIN, 46);

    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.text(String(verificationId || "N/A"), pageWidth - MARGIN, 34, { align: "right" });
    doc.text(String(timestamp || ""), pageWidth - MARGIN, 46, { align: "right" });

    doc.setDrawColor(...LINE);
    doc.line(MARGIN, 56, pageWidth - MARGIN, 56);

    // Footer: disclaimer + page number.
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      "Tampering and face-match scores are heuristic outputs, not statistically calibrated fraud probabilities.",
      MARGIN,
      pageHeight - 24
    );
    doc.text(`Page ${pageNumber}`, pageWidth - MARGIN, pageHeight - 24, { align: "right" });
    doc.setTextColor(...INK);
  };

  let y = 76;

  // Draws a small heading above a section table/box, with a thin accent
  // underline so sections are easy to scan without relying on table
  // borders alone.
  const sectionHeading = (text) => {
    doc.setFont(undefined, "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(text, MARGIN, y);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, y + 5, MARGIN + 24, y + 5);
    y += 16;
  };

  // ---- Verdict banner ----
  const bannerHeight = 64;
  doc.setFillColor(...riskColor);
  doc.roundedRect(MARGIN, y, contentWidth, bannerHeight, 8, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text(`${riskLabel} · ${riskLevel} RISK`, MARGIN + 18, y + 28);
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.text("Overall risk score", MARGIN + 18, y + 46);

  doc.setFont(undefined, "bold");
  doc.setFontSize(22);
  const scoreText = `${data.risk?.final_risk ?? "-"}/100`;
  doc.text(scoreText, pageWidth - MARGIN - 18, y + 40, { align: "right" });
  doc.setTextColor(...INK);
  y += bannerHeight + 24;

  // ---- Section: OCR / MRZ ----
  const mrz = data.ocr?.mrz;
  const mrzRows = mrz
    ? [
        ["Given Name", mrz.names || "-"],
        ["Surname", mrz.surname || "-"],
        ["Document Number", mrz.number || "-"],
        ["Nationality", mrz.nationality || "-"],
        ["Date of Birth", mrz.date_of_birth || "-"],
        ["Expiry Date", mrz.expiration_date || "-"],
        ["Gender", mrz.sex || "-"],
      ]
    : [["Status", "No MRZ detected on this document."]];

  sectionHeading("Identity Document — OCR / MRZ");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Field", "Value"]],
    body: mrzRows,
    theme: "striped",
    styles: { fontSize: 9, textColor: INK, cellPadding: 6, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 160, fontStyle: "bold", textColor: MUTED }, 1: { fontStyle: "normal" } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 24;

  // ---- Section: Document Authenticity ----
  const tamperRows = [
    ["Verdict", data.tamper?.verdict || "-"],
    [
      "Tampering Risk Score",
      data.tamper?.tamper_score !== undefined ? `${data.tamper.tamper_score}/100` : "-",
    ],
    ...(data.tamper?.metadata_flags?.length
      ? [["Flags", data.tamper.metadata_flags.join("; ")]]
      : []),
  ];

  sectionHeading("Document Authenticity");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Field", "Value"]],
    body: tamperRows,
    theme: "striped",
    styles: { fontSize: 9, textColor: INK, cellPadding: 6, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 160, fontStyle: "bold", textColor: MUTED }, 1: { fontStyle: "normal" } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 24;

  // ---- Section: Face Verification ----
  const faceRows = [
    ["Result", data.face ? (data.face.match ? "MATCH" : "NO MATCH") : "-"],
    ["Similarity Score", data.face?.similarity_score ? `${data.face.similarity_score}%` : "-"],
    ...(data.face?.reason ? [["Notes", data.face.reason]] : []),
  ];

  sectionHeading("Face Verification");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Field", "Value"]],
    body: faceRows,
    theme: "striped",
    styles: { fontSize: 9, textColor: INK, cellPadding: 6, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 160, fontStyle: "bold", textColor: MUTED }, 1: { fontStyle: "normal" } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 24;

  // ---- Section: Liveness (placeholder, matches LivenessCard.jsx) ----
  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 50) {
      doc.addPage();
      drawChrome(doc.internal.getNumberOfPages());
      y = 76;
    }
  };

  ensureSpace(46);
  doc.setDrawColor(...LINE);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, contentWidth, 36, 4, 4, "FD");
  doc.setFont(undefined, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("Liveness Check", MARGIN + 12, y + 15);
  doc.setFont(undefined, "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Not available — this stage isn't implemented on the backend yet.", MARGIN + 12, y + 28);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...INK);
  y += 56;

  // ---- Evidence images ----
  const addImageBlock = async (label, src, isBase64, width, height) => {
    try {
      const dataUrl = isBase64 ? `data:image/jpeg;base64,${src}` : await urlToDataUrl(src);
      return { label, dataUrl, width, height };
    } catch {
      return null;
    }
  };

  const faceImages = (
    await Promise.all([
      data.face?.doc_face_image
        ? addImageBlock("Document Face", data.face.doc_face_image, true, 140, 105)
        : null,
      data.face?.selfie_face_image
        ? addImageBlock("Selfie Face", data.face.selfie_face_image, true, 140, 105)
        : null,
    ])
  ).filter(Boolean);

  if (faceImages.length) {
    // Reserve space for the heading AND the image row together, up front —
    // otherwise it's possible to fit just the heading before a page break,
    // stranding it on the previous page from its own images.
    ensureSpace(14 + 130);
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.text("Detected Faces", MARGIN, y);
    y += 14;
    let x = MARGIN;
    faceImages.forEach((img) => {
      doc.addImage(img.dataUrl, "JPEG", x, y, img.width, img.height);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(img.label, x, y + img.height + 12);
      doc.setTextColor(...INK);
      x += img.width + 24;
    });
    y += 130;
  }

  const elaImage = data.tamper?.ela_output_path
    ? await addImageBlock("Error Level Analysis (ELA) Heatmap", data.tamper.ela_output_path, false, 220, 165)
    : null;

  if (elaImage) {
    // Same fix: reserve space for the title + image as one block instead
    // of checking each separately.
    ensureSpace(14 + elaImage.height + 16);
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.text(elaImage.label, MARGIN, y);
    y += 14;
    const isSuspicious = data.tamper?.verdict === "SUSPICIOUS";
    doc.setDrawColor(...(isSuspicious ? [220, 38, 38] : [22, 163, 74]));
    doc.setLineWidth(1.5);
    doc.rect(MARGIN, y, elaImage.width, elaImage.height);
    doc.addImage(elaImage.dataUrl, "JPEG", MARGIN, y, elaImage.width, elaImage.height);
    y += elaImage.height + 16;
  }

  doc.save(`${verificationId || "sentinelid-report"}.pdf`);
}
