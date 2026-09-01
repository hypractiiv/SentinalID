export default function OcrFieldsCard({ mrz }) {
  if (!mrz) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="font-semibold mb-2">Extracted Fields</h2>
        <p className="text-red-400 text-sm">No MRZ detected on this document.</p>
      </div>
    );
  }

  const fieldLabels = {
    names: "Given Name",
    surname: "Surname",
    number: "Document Number",
    nationality: "Nationality",
    date_of_birth: "Date of Birth",
    expiration_date: "Expiry Date",
    sex: "Gender",
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Extracted Fields</h2>
      {Object.entries(fieldLabels).map(([key, label]) => (
        <div key={key} className="flex justify-between text-sm py-1.5 border-b border-slate-700 last:border-0">
          <span className="text-slate-400">{label}</span>
          <span className="font-mono">{mrz[key] || "-"}</span>
        </div>
      ))}
    </div>
  );
}