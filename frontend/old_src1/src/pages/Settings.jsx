import { BACKEND_URL } from "../api/verifyDocument";

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">System connectivity and session information</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Backend</h2>
        <div className="flex justify-between text-sm py-1.5 border-b border-slate-700">
          <span className="text-slate-400">Verification endpoint</span>
          <span className="font-mono text-xs">{BACKEND_URL}/verify</span>
        </div>
        <p className="text-xs text-slate-500">
          Configured in src/api/verifyDocument.js. Change BACKEND_URL there if your
          backend runs somewhere other than 127.0.0.1:8000.
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 space-y-2">
        <h2 className="font-semibold">Data handling</h2>
        <p className="text-sm text-slate-400">
          Documents and selfies are sent directly to the backend for scoring and are not
          persisted anywhere in this app. Verification history is kept in memory for the
          current session only and clears on page reload.
        </p>
      </div>
    </div>
  );
}
