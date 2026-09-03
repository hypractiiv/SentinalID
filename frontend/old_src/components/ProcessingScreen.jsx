import { motion } from "framer-motion";

const steps = ["Extracting text (OCR)", "Validating MRZ checksum", "Scanning for tampering", "Verifying face match"];

export default function ProcessingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <div className="relative w-72 h-1 bg-slate-700 rounded overflow-hidden">
        <motion.div
          className="absolute h-full w-1/3 bg-amber-500 rounded"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        />
      </div>
      <div className="text-center space-y-1">
        {steps.map((step, i) => (
          <motion.p
            key={step}
            className="text-slate-400 text-sm"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.3 }}
          >
            {step}
          </motion.p>
        ))}
      </div>
    </div>
  );
}