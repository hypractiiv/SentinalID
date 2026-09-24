// src/utils/generateReportPdf.js
// Homeland Security & Border Control Official Inspection PDF Report Generator.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RISK_COLORS = {
  LOW: [22, 163, 74], // Green
  MEDIUM: [217, 119, 6], // Amber
  HIGH: [220, 38, 38], // Red
};
const RISK_LABEL = { LOW: "PASS", MEDIUM: "REVIEW", HIGH: "FAIL" };
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const ACCENT = [245, 158, 11];
const LINE = [226, 232, 240];
const MARGIN = 36;

async function urlToDataUrl(url) {
  if (url.startsWith("data:")) return url;
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

async function renderCase(doc, { verificationId, timestamp, data }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  const riskLevel = data.risk?.risk_level ?? "MEDIUM";
  const riskColor = RISK_COLORS[riskLevel] ?? MUTED;
  const riskLabel = RISK_LABEL[riskLevel] ?? "REVIEW";

  const drawChrome = (pageNumber) => {
    // Left border accent bar
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, 6, pageHeight, "F");

    // Header title
    doc.setFont(undefined, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text("SENTINELID · BORDER SCREENING REPORT", MARGIN, 32);

    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Government of India · Ministry of Home Affairs · SSB Checkpoint Unit", MARGIN, 44);

    doc.setFont(undefined, "bold");
    doc.setFontSize(8.5);
    doc.text(String(verificationId || "N/A"), pageWidth - MARGIN, 32, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.text(String(timestamp || ""), pageWidth - MARGIN, 44, { align: "right" });

    doc.setDrawColor(...LINE);
    doc.line(MARGIN, 52, pageWidth - MARGIN, 52);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      "CONFIDENTIAL · Authorized for Border Control & Law Enforcement Screening Operations Only.",
      MARGIN,
      pageHeight - 20
    );
    doc.text(`Page ${pageNumber}`, pageWidth - MARGIN, pageHeight - 20, { align: "right" });
    doc.setTextColor(...INK);
  };

  let y = 68;

  const sectionHeading = (text) => {
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(text, MARGIN, y);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, y + 4, MARGIN + 28, y + 4);
    y += 14;
  };

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 45) {
      doc.addPage();
      drawChrome(doc.internal.getNumberOfPages());
      y = 68;
    }
  };

  // 1. Operational Threat Verdict Banner
  const bannerHeight = 56;
  doc.setFillColor(...riskColor);
  doc.roundedRect(MARGIN, y, contentWidth, bannerHeight, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.setFontSize(15);
  doc.text(`${riskLabel} · ${riskLevel} RISK VERDICT`, MARGIN + 16, y + 24);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8.5);
  doc.text(
    `Directive: ${data.risk?.verdict_action || (riskLevel === "LOW" ? "ALLOW ENTRY" : "SECONDARY INSPECTION")}`,
    MARGIN + 16,
    y + 40
  );
  doc.setFont(undefined, "bold");
  doc.setFontSize(20);
  doc.text(`${data.risk?.final_risk ?? "-"}/100`, pageWidth - MARGIN - 16, y + 36, { align: "right" });
  doc.setTextColor(...INK);
  y += bannerHeight + 18;

  // 2. OCR / MRZ Extraction
  const mrz = data.ocr?.mrz;
  const mrzRows = mrz
    ? [
        ["Classification", data.ocr?.detected_doc_type || "Passport (ICAO 9303)"],
        ["Full Name", `${mrz.names || ""} ${mrz.surname || ""}`.trim() || "-"],
        ["Document Number", mrz.number || "-"],
        ["Nationality / Issuer", mrz.nationality || "-"],
        ["Date of Birth / Gender", `${mrz.date_of_birth || "-"} / ${mrz.sex || "-"}`],
        ["Expiration Date", mrz.expiration_date || "-"],
        ["ICAO 9303 Check Digits", mrz.checksums_passed ? "VERIFIED (4/4 Passed)" : "MISMATCH DETECTED"],
      ]
    : [
        ["Document Type", data.ocr?.detected_doc_type || "Domestic ID / Non-MRZ"],
        ["MRZ Status", "No machine readable zone detected on document."],
      ];

  sectionHeading("1. Document Credential Telemetry (ICAO 9303 / OCR)");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Attribute", "Extracted Information"]],
    body: mrzRows,
    theme: "striped",
    styles: { fontSize: 8.5, textColor: INK, cellPadding: 5, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", textColor: MUTED } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 16;

  // 3. Document Tamper & ELA Forensics
  const tamperRows = [
    ["Tamper Verdict", data.tamper?.verdict || "CLEAN"],
    ["Tampering Anomaly Score", `${data.tamper?.tamper_score ?? 0}/100`],
    [
      "Forensic Compression Diff",
      data.tamper?.forensic_details?.max_compression_diff
        ? `${data.tamper.forensic_details.max_compression_diff} px (Max) / ${data.tamper.forensic_details.avg_compression_diff} px (Avg)`
        : "Standard",
    ],
    ["Splice Noise Anomaly", `${data.tamper?.forensic_details?.splice_noise_score ?? 0}%`],
    ...(data.tamper?.metadata_flags?.length
      ? [["Metadata Alerts", data.tamper.metadata_flags.join("; ")]]
      : [["Metadata Status", "No digital image manipulation signatures detected."]]),
  ];

  sectionHeading("2. Forensic Document Tamper Analysis (ELA)");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Check", "Diagnostic Evaluation"]],
    body: tamperRows,
    theme: "striped",
    styles: { fontSize: 8.5, textColor: INK, cellPadding: 5, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", textColor: MUTED } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 16;

  // 4. Biometric Liveness & Anti-Spoof (PAD)
  const liveness = data.liveness;
  const livenessRows = liveness
    ? [
        ["Presentation Attack Verdict", liveness.verdict || (liveness.is_live ? "GENUINE_LIVE" : "SPOOF_ATTACK")],
        ["Liveness Confidence Score", `${liveness.liveness_score ?? 0}%`],
        [
          "Screen Moiré (2D FFT)",
          liveness.checks?.screen_moire?.passed ? "Passed (No display refresh grid)" : "FAILED (Screen pixel grid detected)",
        ],
        [
          "Micro-Texture & Porosity",
          liveness.checks?.micro_texture?.passed ? "Passed (Natural skin porosity)" : "FAILED (Planar / smooth photo print)",
        ],
        [
          "Chrominance Gamut",
          liveness.checks?.color_naturalness?.passed ? "Passed (Biometric skin locus)" : "FLAGGED (Unnatural gamut / blue cast)",
        ],
        [
          "3D Surface Depth",
          liveness.checks?.depth_reflectance?.passed ? "Passed (Volumetric 3D curvature)" : "FLAGGED (Planar 2D reflection)",
        ],
        ...(liveness.reason ? [["Biometric Assessment", liveness.reason]] : []),
      ]
    : [["Liveness Status", "Biometric liveness was not evaluated for this session."]];

  sectionHeading("3. Biometric Liveness & Anti-Spoof Detection (ISO/IEC 30107-3)");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Check", "Biometric Result"]],
    body: livenessRows,
    theme: "striped",
    styles: { fontSize: 8.5, textColor: INK, cellPadding: 5, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", textColor: MUTED } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 16;

  // 5. ArcFace Facial Match
  const faceRows = [
    ["Biometric Result", data.face?.match ? "BIOMETRIC MATCH CONFIRMED" : "BIOMETRIC MISMATCH"],
    ["ArcFace Similarity", `${data.face?.similarity_score ?? 0}%`],
    ["Cosine Distance", `${data.face?.distance ?? "-"} (Threshold < 0.55)`],
    ...(data.face?.reason ? [["Notes", data.face.reason]] : []),
  ];

  sectionHeading("4. ArcFace Biometric Facial Verification");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Metric", "Value"]],
    body: faceRows,
    theme: "striped",
    styles: { fontSize: 8.5, textColor: INK, cellPadding: 5, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", textColor: MUTED } },
    didDrawPage: () => drawChrome(doc.internal.getNumberOfPages()),
  });
  y = doc.lastAutoTable.finalY + 18;

  // 6. Officer Decision Block
  ensureSpace(60);
  doc.setDrawColor(...LINE);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, contentWidth, 54, 4, 4, "FD");
  doc.setFont(undefined, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text("Border Control Officer Operational Log", MARGIN + 12, y + 15);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Officer / Badge: ${data.officerBadge || "SSB-7821"}`, MARGIN + 12, y + 28);
  doc.text(`Action Logged: ${data.officerDecision || "PENDING MANUAL REVIEW"}`, MARGIN + 12, y + 40);
  if (data.officerNotes) {
    doc.text(`Notes: ${data.officerNotes}`, MARGIN + 220, y + 28);
  }
  y += 66;

  // 7. Visual Biometric Evidence
  const addImageBlock = async (label, src, width = 120, height = 90) => {
    try {
      const dataUrl = await urlToDataUrl(src);
      return { label, dataUrl, width, height };
    } catch {
      return null;
    }
  };

  const imagesToLoad = [];
  if (data.face?.doc_face_crop || data.face?.doc_face_image) {
    imagesToLoad.push(addImageBlock("ID Face Crop", data.face.doc_face_crop || data.face.doc_face_image, 110, 110));
  }
  if (data.face?.selfie_face_crop || data.face?.selfie_face_image) {
    imagesToLoad.push(addImageBlock("Selfie Face Crop", data.face.selfie_face_crop || data.face.selfie_face_image, 110, 110));
  }
  if (data.liveness?.liveness_annotated_image) {
    imagesToLoad.push(addImageBlock("Liveness HUD Scan", data.liveness.liveness_annotated_image, 140, 110));
  }
  if (data.tamper?.ela_image || data.tamper?.ela_output_path) {
    imagesToLoad.push(addImageBlock("ELA Heatmap", data.tamper.ela_image || data.tamper.ela_output_path, 140, 110));
  }

  const loadedImages = (await Promise.all(imagesToLoad)).filter(Boolean);
  if (loadedImages.length > 0) {
    ensureSpace(140);
    sectionHeading("5. Forensic Biometric Evidence Gallery");
    let imgX = MARGIN;
    loadedImages.forEach((img) => {
      if (imgX + img.width > pageWidth - MARGIN) {
        // wrap row if needed
        imgX = MARGIN;
        y += img.height + 20;
      }
      doc.addImage(img.dataUrl, "JPEG", imgX, y, img.width, img.height);
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(img.label, imgX, y + img.height + 10);
      imgX += img.width + 16;
    });
    y += 130;
  }
}

export async function buildReportDoc(cases) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  for (let i = 0; i < cases.length; i++) {
    if (i > 0) doc.addPage();
    await renderCase(doc, cases[i]);
  }
  return doc;
}

export async function generateReportPdf({ verificationId, timestamp, data }) {
  const doc = await buildReportDoc([{ verificationId, timestamp, data }]);
  doc.save(`${verificationId || "sentinelid-report"}.pdf`);
}

export async function shareReportPdf({ verificationId, timestamp, data }) {
  const doc = await buildReportDoc([{ verificationId, timestamp, data }]);
  const filename = `${verificationId || "sentinelid-report"}.pdf`;
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "SentinelID Screening Report" });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled";
    }
  }
  doc.save(filename);
  return "downloaded";
}

export async function generateBatchReportPdf(cases) {
  const doc = await buildReportDoc(cases);
  doc.save(`sentinelid-batch-report-${Date.now()}.pdf`);
}
