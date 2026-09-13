// src/utils/ocrStatus.js
//
// MRZ (the machine-readable zone) only exists on passports and a subset
// of ID cards/visas — plenty of legitimate documents (many driving
// licenses, some national IDs) never have one. So "no MRZ" on its own is
// NOT a failure or a fraud signal, and data/computeRisk.js correctly
// never factors OCR/MRZ into the risk score at all (it only looks at
// tamper + face results).
//
// The problem was purely presentational: OcrFieldsCard and the History
// table were badging "no MRZ" as a hard red FAIL, which visually implied
// a risk contribution that doesn't actually exist and could mislead a
// reviewer into treating a normal non-passport document as suspicious.
// This is the single place that decides how OCR results are badged, so
// every screen agrees on it.
export function getOcrStatus(ocr) {
  if (ocr?.mrz) {
    return { tone: "PASS", label: "MRZ Verified" };
  }
  if (ocr?.raw_text) {
    // Text was extracted, just no MRZ — normal for many non-passport IDs.
    return { tone: "NEUTRAL", label: "No MRZ (non-passport)" };
  }
  // Nothing at all came back — this IS worth flagging.
  return { tone: "FAIL", label: "OCR Failed" };
}
