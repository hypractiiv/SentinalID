import { motion } from "framer-motion";

// Reflects the pipeline order the backend is meant to run in
// (OCR -> tampering -> liveness -> face match -> verdict). The backend
// currently returns ocr/tamper/face in a single response rather than
// streaming per-stage progress, so this is a paced visual sequence timed
// to roughly match how long each stage tends to take — not a live feed
// from the server. Liveness is marked unavailable since P3 isn't
// implemented yet (see LivenessCard.jsx).
const steps = [
  { label: "Extracting text (OCR + MRZ)", available: true },
  { label: "Scanning for tampering", available: true },
  { label: "Checking liveness", available: false },
  { label: "Verifying face match", available: true },
];

export default function ProcessingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative w-72 h-1 bg-slate-700 rounded overflow-hidden">
        <motion.div
          className="absolute h-full w-1/3 bg-amber-500 rounded"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        />
      </div>
      <div className="text-center space-y-2">
        {steps.map((step, i) => (
          <motion.p
            key={step.label}
            className={`text-sm ${step.available ? "text-slate-400" : "text-slate-600 italic"}`}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.3 }}
          >
            {step.label}
            {!step.available && " (not yet available)"}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
