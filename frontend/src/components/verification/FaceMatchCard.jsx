import Icon from "../ui/Icon";

export default function FaceMatchCard({ face }) {
  if (!face) return null;

  const isMatch = Boolean(face.match);
  const similarity = face.similarity_score ?? 0;
  const distance = face.distance ?? -1;
  const threshold = face.threshold ?? 0.55;

  return (
    <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60 hover:border-slate-600 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-100 flex items-center gap-2">
          <Icon name="users" className="w-4 h-4 text-emerald-400" />
          ArcFace Facial Match
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isMatch
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : "bg-red-950/80 border-red-500/50 text-red-300"
          }`}
        >
          <Icon name={isMatch ? "checkCircle" : "x"} className="w-3.5 h-3.5" />
          {isMatch ? "BIOMETRIC MATCH" : "IDENTITY MISMATCH"}
        </span>
      </div>

      {/* Side-by-side cropped portrait comparison */}
      {(face.doc_face_crop || face.selfie_face_crop) && (
        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium mb-1.5">ID Photo Biometric</span>
            {face.doc_face_crop ? (
              <img
                src={face.doc_face_crop}
                alt="Document face biometric crop"
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border-2 border-slate-600 shadow-inner"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                No Face
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium mb-1.5">Live Capture Biometric</span>
            {face.selfie_face_crop ? (
              <img
                src={face.selfie_face_crop}
                alt="Selfie face biometric crop"
                className={`w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border-2 shadow-inner ${
                  isMatch ? "border-emerald-500" : "border-red-500"
                }`}
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                No Face
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biometric metric metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
          <span className="text-[11px] text-slate-400 block">Similarity Score</span>
          <span
            className={`font-mono font-bold text-sm ${isMatch ? "text-emerald-400" : "text-red-400"}`}
          >
            {similarity}%
          </span>
        </div>
        <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
          <span className="text-[11px] text-slate-400 block">Cosine Distance</span>
          <span className="font-mono text-slate-200 font-semibold text-sm">
            {distance >= 0 ? distance : "N/A"}{" "}
            <span className="text-[10px] text-slate-500">(&lt; {threshold})</span>
          </span>
        </div>
      </div>

      {face.reason && (
        <p className="text-xs text-slate-400 bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/40 italic leading-relaxed">
          {face.reason}
        </p>
      )}
    </div>
  );
}
