import Icon from "../ui/Icon";

export default function OcrFieldsCard({ mrz }) {
  if (!mrz) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-colors">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Icon name="document" className="w-4 h-4 text-slate-400" />
          Extracted Fields
        </h2>
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <Icon name="alertTriangle" className="w-3.5 h-3.5" />
          No MRZ detected on this document.
        </p>
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
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Icon name="document" className="w-4 h-4 text-slate-400" />
        Extracted Fields
      </h2>
      {Object.entries(fieldLabels).map(([key, label]) => (
        <div key={key} className="flex justify-between text-sm py-1.5 border-b border-slate-700 last:border-0">
          <span className="text-slate-400">{label}</span>
          <span className="font-mono">{mrz[key] || "-"}</span>
        </div>
      ))}
    </div>
  );
}
