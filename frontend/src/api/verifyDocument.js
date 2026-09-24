// src/api/verifyDocument.js
// High-performance API client for SentinelID screening service.

export const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export function getBackendUrl() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sentinelid_backend_url") || DEFAULT_BACKEND_URL;
  }
  return DEFAULT_BACKEND_URL;
}

export function setBackendUrl(url) {
  if (typeof window !== "undefined") {
    localStorage.setItem("sentinelid_backend_url", url);
  }
}

/**
 * Sends a document image/PDF and selfie to the backend's /verify endpoint.
 * Returns combined OCR, Tamper, Liveness, Face, Risk, and Telemetry result.
 *
 * @param {File|Blob} documentFile
 * @param {File|Blob} selfieFile
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function verifyDocument(documentFile, selfieFile, signal) {
  const backendUrl = getBackendUrl();
  const formData = new FormData();
  formData.append("document", documentFile);
  formData.append("selfie", selfieFile);

  const t0 = performance.now();
  let response;

  try {
    response = await fetch(`${backendUrl}/verify`, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (networkError) {
    if (networkError.name === "AbortError") throw networkError;
    throw new Error(
      `Could not reach the SentinelID backend at ${backendUrl}. Ensure the uvicorn server is running on port 8000.`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Screening service error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const clientLatencyMs = Math.round(performance.now() - t0);

  // Attach client-side latency profiling if telemetry exists
  if (!data.telemetry) {
    data.telemetry = {};
  }
  data.telemetry.client_roundtrip_ms = clientLatencyMs;

  return data;
}

/**
 * Standalone liveness verification endpoint call.
 *
 * @param {File|Blob} selfieFile
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function verifyLivenessOnly(selfieFile, signal) {
  const backendUrl = getBackendUrl();
  const formData = new FormData();
  formData.append("selfie", selfieFile);

  let response;
  try {
    response = await fetch(`${backendUrl}/liveness/verify`, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (networkError) {
    if (networkError.name === "AbortError") throw networkError;
    throw new Error(`Could not reach backend at ${backendUrl}: ${networkError.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Liveness service error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Health check & latency test.
 *
 * @returns {Promise<{ ok: boolean, latencyMs: number, info: Object|null }>}
 */
export async function pingBackend() {
  const backendUrl = getBackendUrl();
  const t0 = performance.now();
  try {
    const res = await fetch(`${backendUrl}/health`, { method: "GET" });
    const latencyMs = Math.round(performance.now() - t0);
    if (res.ok) {
      const info = await res.json();
      return { ok: true, latencyMs, info };
    }
    return { ok: false, latencyMs, info: null };
  } catch {
    return { ok: false, latencyMs: 0, info: null };
  }
}
