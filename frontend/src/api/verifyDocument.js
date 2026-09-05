// src/api/verifyDocument.js
//
// Same idea as mockData.js — you call one function and get back an
// object with ocr/tamper/face results — except this one actually hits
// your running backend instead of returning hardcoded fake data.
//
// Usage in a component:
//
//   import { verifyDocument } from "../api/verifyDocument";
//
//   const result = await verifyDocument(documentFile, selfieFile, signal);
//   // result looks like:
//   // { ocr: {...}, tamper: {...}, face: {...} }
//
// where documentFile and selfieFile are File objects, and `signal` is an
// optional AbortSignal (from `new AbortController()`) so callers can
// cancel an in-flight request — see App.jsx's cancelVerification().

export const BACKEND_URL = "http://127.0.0.1:8000";

/**
 * Sends a document image/PDF and a selfie image to the backend's /verify
 * endpoint and returns the combined OCR + tamper + face result.
 *
 * @param {File} documentFile - the ID document (image or PDF)
 * @param {File} selfieFile - the selfie/live photo
 * @param {AbortSignal} [signal] - optional signal to cancel the request
 * @returns {Promise<Object>} the combined result: { ocr, tamper, face }
 * @throws {Error} if the request fails or the server returns a non-2xx
 *   status. If cancelled via `signal`, the thrown error's `name` is
 *   "AbortError" — callers can check that to distinguish a deliberate
 *   cancellation from a real failure.
 */
export async function verifyDocument(documentFile, selfieFile, signal) {
  const formData = new FormData();
  formData.append("document", documentFile);
  formData.append("selfie", selfieFile);

  let response;
  try {
    response = await fetch(`${BACKEND_URL}/verify`, {
      method: "POST",
      body: formData,
      signal,
      // Don't set a Content-Type header manually — the browser sets the
      // correct multipart/form-data boundary automatically when you pass
      // a FormData body. Setting it yourself breaks the upload.
    });
  } catch (networkError) {
    // Re-throw AbortError as-is so callers can tell "cancelled" apart
    // from "actually failed" (see the catch block in App.jsx).
    if (networkError.name === "AbortError") throw networkError;
    // This branch fires if the backend isn't running at all, or CORS is
    // misconfigured — not if the backend just returns an error response.
    throw new Error(
      `Could not reach the backend at ${BACKEND_URL}. Is it running? (${networkError.message})`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend returned ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Lightweight, non-throwing connectivity check used by the UI's system
 * status indicator. Does not touch the /verify contract above.
 *
 * @returns {Promise<boolean>} true if the backend responded at all
 */
export async function pingBackend() {
  try {
    await fetch(`${BACKEND_URL}/`, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}
