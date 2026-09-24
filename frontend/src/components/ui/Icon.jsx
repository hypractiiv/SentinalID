// src/components/ui/Icon.jsx
// Lightweight inline SVG icon set optimized for SentinelID.

const PATHS = {
  upload: "M12 16V4m0 0L7 9m5-5l5 5M5 20h14",
  camera:
    "M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM12 17a4 4 0 100-8 4 4 0 000 8z",
  document:
    "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM13 3v5h5M9 13h6M9 17h6M9 9h2",
  shieldCheck:
    "M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3zM9 12l2 2 4-4",
  alertTriangle: "M12 3l9 16H3L12 3zM12 9v4M12 16.5h.01",
  checkCircle: "M12 3a9 9 0 100 18 9 9 0 000-18zM8.5 12.5l2.5 2.5 4.5-5",
  x: "M6 6l12 12M18 6L6 18",
  chevronRight: "M9 6l6 6-6 6",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3.5 3.5",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35",
  filter: "M4 5h16M7 12h10M10 19h4",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
  share: "M8.5 12.5l7-5m-7 7l7 5M6 12a2 2 0 100-4 2 2 0 000 4zM18 6a2 2 0 100-4 2 2 0 000 4zM18 22a2 2 0 100-4 2 2 0 000 4z",
  printer:
    "M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6v-7z",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 21v-1a5 5 0 015-5h2a5 5 0 015 5v1M17 11a3 3 0 100-6M21 21v-1a5 5 0 00-4-4.9",
  activity: "M3 12h4l2 8 4-16 2 8h6",
  server: "M4 4h16v6H4V4zM4 14h16v6H4v-6zM8 7h.01M8 17h.01",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z",
  layoutGrid: "M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z",
  history: "M3 12a9 9 0 109-9 9 9 0 00-9 9zM3 12h4M12 7v5l3 3",
  copy: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3",
  check: "M5 13l4 4L19 7",
  refreshCw: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  zoomIn: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  sparkles: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  userCheck: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM16 11l2 2 4-4",
  userX: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM17 8l5 5M22 8l-5 5",
  fileText: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  cpu: "M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
};

export default function Icon({ name, className = "w-4 h-4", strokeWidth = 1.8 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
