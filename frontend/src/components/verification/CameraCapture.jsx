import { useEffect, useRef, useState } from "react";

// Simple getUserMedia-based selfie capture. No new dependency — just the
// native browser camera API. Falls back gracefully to file upload if
// permission is denied or no camera is available.
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access isn't supported in this browser.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => setError(`Couldn't access the camera (${err.message}).`));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  };

  if (error) {
    return (
      <div className="text-center text-sm text-red-400 p-6 border-2 border-dashed border-slate-600 rounded-xl">
        <p>{error}</p>
        <button
          onClick={onClose}
          className="mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          Use file upload instead
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-600 rounded-xl">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded-lg w-full max-w-[240px] aspect-[4/3] object-cover bg-slate-900"
      />
      <div className="flex gap-3">
        <button
          onClick={handleCapture}
          className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Capture
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-100 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
