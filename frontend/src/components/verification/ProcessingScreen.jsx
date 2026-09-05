import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "../ui/Icon";

// Reflects the pipeline order the backend is meant to run in
// (OCR -> tampering -> liveness -> face match -> verdict). The backend
// currently returns ocr/tamper/face in a single response rather than
// streaming per-stage progress, so every "available" step pulses
// together rather than lighting up sequentially — that would imply a
// precision about backend timing we don't actually have. Liveness is
// shown as unavailable since P3 isn't implemented yet (see LivenessCard.jsx).
const steps = [
  { label: "OCR + MRZ", icon: "document", available: true },
  { label: "Tampering", icon: "shieldCheck", available: true },
  { label: "Liveness", icon: "eye", available: false },
  { label: "Face Match", icon: "users", available: true },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);
  return reduced;
}

export default function ProcessingScreen({ onCancel }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-10 max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="font-semibold text-lg">Running verification pipeline</h2>
        <p className="text-slate-500 text-sm mt-1">This usually takes a few seconds.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-start w-full">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 w-20">
              {reducedMotion || !step.available ? (
                <div
                  className={`w-11 h-11 rounded-full border-2 flex items-center justify-center ${
                    step.available
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-slate-700 border-dashed bg-slate-800 text-slate-600"
                  }`}
                >
                  <Icon name={step.icon} className="w-5 h-5" />
                </div>
              ) : (
                <motion.div
                  className="w-11 h-11 rounded-full border-2 border-amber-500 bg-amber-500/10 text-amber-400 flex items-center justify-center"
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1, 0.96] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.15 }}
                >
                  <Icon name={step.icon} className="w-5 h-5" />
                </motion.div>
              )}
              <p
                className={`text-[11px] text-center leading-tight ${
                  step.available ? "text-slate-400" : "text-slate-600 italic"
                }`}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && <div className="h-0.5 flex-1 bg-slate-700 -mt-8" />}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 -mt-4">Liveness isn't available on the backend yet</p>

      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800 hover:bg-red-950/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Icon name="x" className="w-4 h-4" />
          Cancel Verification
        </button>
      )}
    </div>
  );
}
