export function computeRisk({ tamper, face }) {
  let score = 0;
  if (tamper?.verdict === "SUSPICIOUS") score += 50;
  if (tamper?.tamper_score) score += tamper.tamper_score * 0.3;
  if (face && !face.match) score += 40;
  if (face?.similarity_score < 70) score += 15;

  score = Math.min(Math.round(score), 100);
  const risk_level = score > 60 ? "HIGH" : score > 30 ? "MEDIUM" : "LOW";
  return { final_risk: score, risk_level };
}