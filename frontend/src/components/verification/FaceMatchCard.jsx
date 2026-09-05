import Icon from "../ui/Icon";

export default function FaceMatchCard({ face }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Icon name="users" className="w-4 h-4 text-slate-400" />
        Face Verification
      </h2>
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            face.match ? "bg-green-900" : "bg-red-900"
          }`}
        >
          <Icon
            name={face.match ? "checkCircle" : "x"}
            className={`w-4.5 h-4.5 ${face.match ? "text-green-400" : "text-red-400"}`}
          />
        </div>
        <p className={`font-bold ${face.match ? "text-green-400" : "text-red-400"}`}>
          {face.match ? "MATCH" : "NO MATCH"}
        </p>
      </div>
      {face.similarity_score > 0 && (
        <p className="text-sm text-slate-400 mt-2">Similarity: {face.similarity_score}%</p>
      )}
      {face.reason && <p className="text-xs text-slate-500 mt-2 italic">{face.reason}</p>}
    </div>
  );
}
