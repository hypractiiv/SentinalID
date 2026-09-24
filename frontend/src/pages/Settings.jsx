import { useState, useEffect } from "react";
import { getBackendUrl, setBackendUrl, pingBackend, DEFAULT_BACKEND_URL } from "../api/verifyDocument";
import Icon from "../components/ui/Icon";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const [url, setUrl] = useState(getBackendUrl());
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [stationName, setStationName] = useState(
    () => localStorage.getItem("sentinel_station_name") || "Raxaul Integrated Checkpost · SSB Unit 14"
  );
  const [officerName, setOfficerName] = useState(
    () => localStorage.getItem("sentinel_officer_name") || "Insp. Vikramaditya Singh"
  );
  const [officerBadge, setOfficerBadge] = useState(
    () => localStorage.getItem("sentinel_officer_badge") || "SSB-7821"
  );
  const [sensitivity, setSensitivity] = useState(
    () => localStorage.getItem("sentinel_sensitivity") || "strict"
  );
  const { addToast } = useToast();

  const handleTestConnection = async () => {
    setTesting(true);
    setBackendUrl(url.trim());
    try {
      const res = await pingBackend();
      setPingResult(res);
      if (res.ok) {
        addToast(`Backend operational (${res.latencyMs}ms latency).`, "success");
      } else {
        addToast("Backend unreachable. Check host and port.", "error");
      }
    } catch {
      setPingResult({ ok: false, latencyMs: 0 });
      addToast("Failed to reach server.", "error");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem("sentinel_station_name", stationName);
    localStorage.setItem("sentinel_officer_name", officerName);
    localStorage.setItem("sentinel_officer_badge", officerBadge);
    localStorage.setItem("sentinel_sensitivity", sensitivity);
    setBackendUrl(url.trim());
    addToast("Terminal configuration saved successfully.", "success");
  };

  const handleResetDefaults = () => {
    setUrl(DEFAULT_BACKEND_URL);
    setBackendUrl(DEFAULT_BACKEND_URL);
    setSensitivity("strict");
    addToast("Settings restored to defaults.", "info");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Checkpoint Terminal Settings</h1>
        <p className="text-slate-400 text-xs mt-1">
          Configure local neural network services, station telemetry, and operational profiles
        </p>
      </div>

      {/* Backend Connectivity */}
      <div className="bg-slate-800/90 rounded-2xl p-6 space-y-4 border border-slate-700/60 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-200">
            <Icon name="server" className="w-4 h-4 text-emerald-400" />
            AI Screening Microservice Endpoint
          </h2>
          {pingResult && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 ${
                pingResult.ok
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/60 border border-red-500/40 text-red-300"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${pingResult.ok ? "bg-emerald-400" : "bg-red-400"}`} />
              {pingResult.ok ? `Online (${pingResult.latencyMs}ms)` : "Offline"}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Verification API Base URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
            >
              <Icon name="refreshCw" className={`w-3.5 h-3.5 text-amber-400 ${testing ? "animate-spin" : ""}`} />
              {testing ? "Testing…" : "Test Ping"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Default: <code className="text-slate-400 font-mono">http://127.0.0.1:8000</code>. Modify if hosting on a LAN border node or edge server.
          </p>
        </div>
      </div>

      {/* Border Control Terminal Profile */}
      <div className="bg-slate-800/90 rounded-2xl p-6 space-y-4 border border-slate-700/60 shadow-sm">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-200">
          <Icon name="shieldCheck" className="w-4 h-4 text-amber-400" />
          Checkpoint Station Profile
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Station / Integrated Checkpost (ICP)
            </label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Officer In-Charge Name
            </label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Officer Badge ID
            </label>
            <input
              type="text"
              value={officerBadge}
              onChange={(e) => setOfficerBadge(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Screening Sensitivity Profile
            </label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="strict">Strict (Border Control & Immigration)</option>
              <option value="balanced">Balanced (Standard Identity KYC)</option>
              <option value="fast">High-Throughput (Fast Lane)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSaveProfile}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            Save Configuration
          </button>

          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Restore Defaults
          </button>
        </div>
      </div>

      {/* Privacy and Data Protection Notice */}
      <div className="bg-slate-800/90 rounded-2xl p-6 space-y-2 border border-slate-700/60 shadow-sm">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-200">
          <Icon name="lock" className="w-4 h-4 text-cyan-400" />
          Data Governance & Sovereign Ephemerality
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          In compliance with National Data Security guidelines, raw biometric documents and live facial captures are processed ephemerally in RAM on the local checkpoint node. No biometric payload is stored or transmitted externally. Audit records are maintained in local terminal memory for the duration of the operational shift.
        </p>
      </div>
    </div>
  );
}
