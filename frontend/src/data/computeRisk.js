// src/data/computeRisk.js
// Client-side fallback & validation risk fusion engine.

export function computeRisk(apiResult) {
  if (!apiResult) {
    return { final_risk: 0, risk_level: "LOW", verdict_action: "ALLOW", risk_factors: [] };
  }

  // If backend already computed calibrated fused risk, use it
  if (apiResult.risk && typeof apiResult.risk.final_risk === "number") {
    return apiResult.risk;
  }

  const { tamper, face, liveness, ocr } = apiResult;
  let score = 0;
  const factors = [];

  // 1. Tampering analysis
  if (tamper) {
    if (tamper.verdict === "SUSPICIOUS") {
      score += 35;
      factors.push("Document image tampering or editing software signatures detected");
    } else if (tamper.verdict === "REVIEW_RECOMMENDED") {
      score += 18;
      factors.push("Minor compression or noise inconsistencies detected on document");
    } else if (tamper.tamper_score > 30) {
      score += Math.round(tamper.tamper_score * 0.25);
    }
  }

  // 2. Biometric Liveness & Presentation Attack Detection
  if (liveness) {
    if (!liveness.is_live) {
      score += 45;
      factors.push(`Biometric presentation attack detected: ${liveness.reason || "Liveness check failed"}`);
    } else if (liveness.liveness_score < 55) {
      score += 20;
      factors.push("Biometric liveness confidence is borderline");
    }
  }

  // 3. Face verification
  if (face) {
    if (!face.match) {
      score += 40;
      factors.push("Facial biometrics do not match ID document portrait");
    } else if (face.similarity_score < 68) {
      score += 15;
      factors.push("Facial similarity is marginal (< 68%)");
    }
  }

  // 4. ICAO 9303 Checksums
  if (ocr?.mrz && ocr.mrz.checksums_passed === false) {
    score += 25;
    factors.push("ICAO 9303 MRZ cryptographic check digit validation failed");
  }

  const final_risk = Math.min(100, Math.max(0, Math.round(score)));
  const risk_level = final_risk > 60 ? "HIGH" : final_risk > 30 ? "MEDIUM" : "LOW";
  const verdict_action =
    final_risk > 60 ? "DENY_ENTRY" : final_risk > 30 ? "SECONDARY_INSPECTION" : "ALLOW";

  return { final_risk, risk_level, verdict_action, risk_factors: factors };
}
