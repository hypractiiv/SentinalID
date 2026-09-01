export const mockResult = {
  ocr: {
    mrz: {
      type: "P",
      country: "IND",
      names: "JOHN",
      surname: "DOE",
      number: "P1234567",
      nationality: "IND",
      date_of_birth: "900101",
      expiration_date: "300101",
      sex: "M"
    },
    raw_text: "PASSPORT\nREPUBLIC OF INDIA\nJOHN DOE\n..."
  },
  tamper: {
    tamper_score: 78,
    metadata_flags: ["No EXIF data - possible screenshot/edited export"],
    verdict: "SUSPICIOUS",
    ela_output_path: "/mock-assets/ela_output.jpg"
  },
  face: {
    match: true,
    distance: 0.21,
    similarity_score: 92.4,
    reason: "Verification successful."
  },
  risk: {
    final_risk: 65,
    risk_level: "HIGH"
  }
};

export const mockFaceFailure = {
  match: false,
  distance: -1,
  similarity_score: 0,
  reason: "No valid face detected in document photo (confidence < 0.9)."
};