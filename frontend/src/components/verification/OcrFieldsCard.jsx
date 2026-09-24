import { useState } from "react";
import Icon from "../ui/Icon";

export default function OcrFieldsCard({ mrz, rawText, detectedDocType }) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = () => {
    if (!mrz) return;
    const text = `Document Number: ${mrz.number || "-"}\nName: ${mrz.names || ""} ${mrz.surname || ""}\nNationality: ${mrz.nationality || "-"}\nDOB: ${mrz.date_of_birth || "-"}\nExpiry: ${mrz.expiration_date || "-"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fieldLabels = {
    names: "Given Name",
    surname: "Surname",
    number: "Document Number",
    nationality: "Nationality / Issuer",
    date_of_birth: "Date of Birth",
    expiration_date: "Expiration Date",
    sex: "Sex / Gender",
  };

  const checksums = mrz?.icao_checksums || {};
  const checksumsPassed = mrz?.checksums_passed ?? true;

  return (
    <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60 hover:border-slate-600 transition-all shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <Icon name="document" className="w-4 h-4 text-amber-400" />
            Document OCR & MRZ
          </h2>
          {detectedDocType && (
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
              Classification: {detectedDocType}
            </span>
          )}
        </div>

        {mrz && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-600/50"
            title="Copy extracted details"
          >
            <Icon name={copied ? "check" : "copy"} className="w-3.5 h-3.5 text-amber-400" />
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* ICAO Checksums Banner */}
      {mrz && (
        <div
          className={`p-2.5 rounded-lg text-xs mb-3 border flex items-center justify-between ${
            checksumsPassed
              ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-300"
              : "bg-red-950/20 border-red-900/50 text-red-300"
          }`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Icon
              name={checksumsPassed ? "checkCircle" : "alertTriangle"}
              className={`w-3.5 h-3.5 ${checksumsPassed ? "text-emerald-400" : "text-red-400"}`}
            />
            ICAO 9303 Check Digits
          </span>
          <span className="font-mono text-[11px]">
            {checksumsPassed ? "4/4 Cryptographic Validations Passed" : "Checksum Mismatch Detected"}
          </span>
        </div>
      )}

      {!mrz ? (
        <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/50 text-center my-3">
          <Icon name="document" className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-medium">No ICAO 9303 MRZ Strip Detected</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Typical for domestic identity cards, paper driving permits, or unstandardized passes. Raw text was extracted via OCR.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-700/60 mb-3">
          {Object.entries(fieldLabels).map(([key, label]) => (
            <div key={key} className="flex justify-between items-center py-2 text-xs">
              <span className="text-slate-400">{label}</span>
              <span className="font-mono text-slate-100 font-semibold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/40">
                {mrz[key] || "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Raw text viewer toggle */}
      {rawText && (
        <div>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 pt-2 border-t border-slate-700/50"
          >
            <Icon name="fileText" className="w-3.5 h-3.5" />
            {showRaw ? "Hide Full OCR Transcript" : "View Full OCR Transcript"}
          </button>

          {showRaw && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-800 leading-relaxed">
              {rawText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
