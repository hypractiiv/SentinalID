import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "../ui/Icon";

const steps = [
  { label: "ICAO 9303 OCR", icon: "document", desc: "Parsing text & check digits" },
  { label: "Forensic ELA", icon: "shieldCheck", desc: "Checking pixel compression anomalies" },
  { label: "Biometric Liveness", icon: "eye", desc: "Multi-factor presentation attack detection" },
  { label: "ArcFace Match", icon: "users", desc: "512-dim facial tensor comparison" },
];

export default function ProcessingScreen({ onCancel }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8 max-w-xl mx-auto">
      {/* Animated radar badge */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-2 border-amber-500/30 animate-ping absolute" />
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 z-10">
          <Icon name="shieldCheck" className="w-8 h-8" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="font-bold text-xl text-slate-100">Executing Biometric Screening Pipeline</h2>
        <p className="text-slate-400 text-xs">
          Synchronizing multi-modal neural networks in memory · Elapsed:{" "}
          <span className="font-mono text-amber-400 font-bold">{elapsed}s</span>
        </p>
      </div>

      {/* Concurrent Pipeline Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            className="flex flex-col items-center text-center p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm"
            animate={{ opacity: [0.65, 1, 0.65], scale: [0.98, 1.01, 0.98] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.25 }}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-2">
              <Icon name={step.icon} className="w-4.5 h-4.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">{step.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-red-400 hover:border-red-800/60 hover:bg-red-950/20 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Icon name="x" className="w-3.5 h-3.5" />
          Abort In-Flight Verification
        </button>
      )}
    </div>
  );
}
