import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [shutterFlash, setShutterFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser environment.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => setError(`Camera access failed: ${err.message}`));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror image if front camera for natural selfie orientation
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(new File([blob], "live_selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  const handleCountdownTrigger = () => {
    if (countdown !== null) return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          snapPhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleFacingMode = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  if (error) {
    return (
      <div className="text-center text-xs text-red-400 p-6 border-2 border-dashed border-red-800/50 bg-red-950/20 rounded-xl space-y-3">
        <Icon name="alertTriangle" className="w-6 h-6 mx-auto text-red-400" />
        <p>{error}</p>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs hover:bg-slate-700 transition-colors"
        >
          Switch to File Upload
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-700 bg-slate-900/60 rounded-xl overflow-hidden">
      {/* Video Container with Biometric Oval Guide */}
      <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-lg overflow-hidden bg-black shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        />

        {/* Biometric Oval Guide */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
          <div className="w-44 h-60 border-2 border-dashed border-cyan-400/70 rounded-[50%] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <span className="text-[10px] text-cyan-300 font-mono tracking-wider bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-sm -mt-44">
              ALIGN FACE HERE
            </span>
          </div>
          <p className="text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-full mt-2 font-mono">
            Ensure good lighting · Remove sunglasses
          </p>
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-5xl font-black text-amber-400 animate-pulse">
            {countdown}
          </div>
        )}

        {/* Shutter Flash Effect */}
        {shutterFlash && <div className="absolute inset-0 bg-white transition-opacity duration-200" />}

        {/* Camera Flip Button */}
        <button
          onClick={toggleFacingMode}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Switch Camera"
        >
          <Icon name="refreshCw" className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={snapPhoto}
          disabled={countdown !== null}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs transition-all shadow-md shadow-amber-950/40 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Icon name="camera" className="w-3.5 h-3.5" />
          Capture Now
        </button>

        <button
          onClick={handleCountdownTrigger}
          disabled={countdown !== null}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors flex items-center gap-1"
          title="Capture with 3s timer"
        >
          <Icon name="clock" className="w-3.5 h-3.5 text-cyan-400" />
          3s Timer
        </button>

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
