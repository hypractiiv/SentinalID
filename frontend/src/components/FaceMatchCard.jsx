export default function FaceMatchCard({ face }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Face Verification</h2>
      <p className={`font-bold ${face.match ? "text-green-400" : "text-red-400"}`}>
        {face.match ? "MATCH" : "NO MATCH"}
      </p>
      {face.similarity_score > 0 && (
        <p className="text-sm text-slate-400 mt-1">Similarity: {face.similarity_score}%</p>
      )}
      {face.reason && (
        <p className="text-xs text-slate-500 mt-2 italic">{face.reason}</p>
      )}
    </div>
  );
}