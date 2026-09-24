export const mockResult = {
  ocr: {
    mrz: {
      type: "P",
      country: "IND",
      names: "AARAV RAJESH",
      surname: "SHARMA",
      number: "P9283741",
      nationality: "IND",
      date_of_birth: "14 Jun 1994",
      expiration_date: "28 Oct 2032",
      sex: "M",
      checksums_passed: true,
      icao_checksums: {
        valid_number: true,
        valid_date_of_birth: true,
        valid_expiration_date: true,
        valid_composite: true,
      },
    },
    raw_text: "PASSPORT\nREPUBLIC OF INDIA\nAARAV RAJESH SHARMA\nP9283741\nDOB: 14/06/1994",
    detected_doc_type: "PASSPORT (ICAO 9303)",
    has_mrz: true,
  },
  tamper: {
    tamper_score: 12.4,
    metadata_flags: [],
    verdict: "CLEAN",
    ela_output_path: "/mock-assets/ela_output.jpg",
    forensic_details: {
      max_compression_diff: 14.2,
      avg_compression_diff: 1.8,
      splice_noise_score: 8.5,
      splice_boundary_detected: false,
    },
  },
  liveness: {
    is_live: true,
    liveness_score: 93.5,
    verdict: "GENUINE_LIVE",
    reason: "Biometric liveness confirmed: natural micro-texture, 3D reflectance, and organic chrominance verified.",
    checks: {
      screen_moire: { passed: true, score: 95.0, detected: false },
      micro_texture: { passed: true, score: 92.5, laplacian_variance: 245.0 },
      color_naturalness: { passed: true, score: 94.0, skin_coverage_pct: 42.1 },
      depth_reflectance: { passed: true, score: 91.0 },
    },
    spoof_indicators: [],
    liveness_annotated_image: null,
  },
  face: {
    match: true,
    distance: 0.24,
    similarity_score: 89.2,
    threshold: 0.55,
    reason: "Biometric identity match confirmed (ArcFace cosine distance: 0.240 < 0.55).",
    doc_face_image: null,
    selfie_face_image: null,
    doc_face_crop: null,
    selfie_face_crop: null,
  },
  risk: {
    final_risk: 15,
    risk_level: "LOW",
    verdict_action: "ALLOW",
    risk_factors: [],
  },
  telemetry: {
    processing_time_ms: 785.4,
    timestamp: "2026-09-24T17:00:00Z",
  },
};

export const mockFaceFailure = {
  match: false,
  distance: -1,
  similarity_score: 0,
  reason: "No valid face detected in document photo (confidence < 0.85).",
};
