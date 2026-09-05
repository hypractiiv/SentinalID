# SentinelID frontend

Frontend for the SentinelID identity-verification demo, built around the
existing backend contract (`POST /verify` → `{ ocr, tamper, face }`) with
no backend changes required anywhere below unless explicitly noted.

## Install

```
npm install
npm install jspdf jspdf-autotable
```

Everything else (React, Tailwind v4, framer-motion) should already be in
your `package.json` from the original project.

## Structure

```
src/
  api/verifyDocument.js       POST /verify — now accepts an optional
                               AbortSignal for cancellation; pingBackend()
                               for the navbar's connectivity indicator
  data/computeRisk.js          risk-scoring logic, unchanged
  context/ToastContext.jsx     app-wide toast notifications (React context,
                               no extra dependency)
  utils/
    caseId.js                  VER-000101-style ID generator
    generateReportPdf.js       PDF report builder: single download, share
                               sheet, and multi-case batch reports all
                               share one core renderer
  components/
    layout/                    AppShell, Sidebar, Navbar — app-wide chrome,
                               screen-reader stage announcer, print:hidden
                               on nav so printed reports don't include it
    ui/                        Badge, EmptyState — small reusable pieces
    dashboard/
      VerdictBarChart.jsx       lightweight CSS bar chart, no charting lib
    verification/
      UploadScreen.jsx          drag-and-drop, client-side file validation,
                               image previews, webcam capture toggle
      CameraCapture.jsx         getUserMedia-based selfie capture
      ProcessingScreen.jsx      respects prefers-reduced-motion; Cancel button
      ResultsDashboard.jsx      Download PDF / Share / Print buttons
      OcrFieldsCard.jsx, TamperHeatmapCard.jsx, FaceMatchCard.jsx,
      RiskGauge.jsx, VerdictBadge.jsx, LivenessCard.jsx   unchanged
  pages/
    Dashboard.jsx               KPIs + verdict distribution chart + recent list
    Verify.jsx                  stateless; driven by props from App.jsx
    History.jsx                 search / verdict / date filters, CSV export,
                               multi-select batch PDF download
    Settings.jsx                backend endpoint + data-handling note
  App.jsx                       owns page routing, verification state
                               (files/stage/result/error), and history
```

## What's new in this round, and why

**Bug fix — verification surviving page switches.** `App.jsx` now owns
`documentFile`, `selfieFile`, `verifyStage`, `verifyResult`, and
`verifyError` instead of `pages/Verify.jsx` holding them locally. Since
`Verify` unmounts whenever you navigate elsewhere but `App` never does,
a scan started on the Verify page now keeps running and lands correctly
even if you switch to Dashboard/History in the meantime. The sidebar
shows a pulsing dot and the navbar shows a "Verification running…" badge
(click to jump back) while this is happening.

**Retry without re-picking files.** Because the files now live in
`App.jsx`, a failed scan leaves them in place — the upload screen shows
an error banner with a "Try Again" button that resubmits immediately.

**Cancel a running scan.** `verifyDocument()` accepts an `AbortSignal`;
`App.jsx` wires up an `AbortController` per request, and
`ProcessingScreen` has a "Cancel verification" button.

**File validation + drag-and-drop + previews.** `UploadScreen.jsx` now
validates type (`image/jpeg|png|webp`, plus PDF for the document) and
size (10MB cap) client-side, accepts drag-and-drop onto either dropzone,
and shows an image preview once a file is selected (or a generic icon
for PDFs).

**Webcam selfie capture.** A small "Upload / Use Camera" toggle next to
the selfie dropzone opens `CameraCapture.jsx` (plain `getUserMedia`, no
new dependency) so you can take the selfie directly instead of needing a
pre-existing file.

**Toast notifications.** `ToastContext.jsx` (wrapping the whole app in
`main.jsx`) surfaces network errors, cancellations, and successful scans
as dismissable toasts, in addition to the inline error banner on the
upload screen.

**Reduced motion.** `ProcessingScreen` checks
`prefers-reduced-motion` and swaps the pulsing/sliding `framer-motion`
animations for a static equivalent when it's set.

**Accessibility.** A visually-hidden `aria-live` region in `AppShell`
announces stage changes ("Verification in progress." / "complete." /
failure text) for screen readers, and every interactive element
(buttons, dropzones, checkboxes) has a visible `focus-visible` ring.

**Print support.** `index.css` adds a `@media print` block that flips
the dark theme to print-friendly colors, and everything print-irrelevant
(sidebar, navbar, action buttons, toasts) is hidden via Tailwind's
built-in `print:hidden`. The "Print" button on the results page just
calls `window.print()`.

**PDF report: Share button + batch reports.** `generateReportPdf.js` was
refactored around one shared `buildReportDoc(cases)` core:
- `generateReportPdf(...)` — same single-case download as before
- `shareReportPdf(...)` — offers the PDF through the OS share sheet via
  the Web Share API when the browser supports sharing files, falling
  back to a plain download otherwise
- `generateBatchReportPdf(cases)` — combines several verification cases
  (selected via checkboxes in History) into one PDF, one case per page(s)

**History: filters, search, CSV export.** Search by verification ID,
filter by verdict and by date range (today / last 7 days / all time),
export the currently-filtered rows as CSV (pure client-side `Blob`, no
library), and select multiple rows via checkboxes to generate a combined
PDF report for just those cases.

**Dashboard: verdict distribution chart.** A small CSS/div bar chart
(no charting library added) showing the Passed/Review/Failed split for
the session, next to the existing KPI cards and recent-cases table.

## Refinements — visual polish, interactivity, spacing

**Icon set.** `components/ui/Icon.jsx` — a small hand-picked set of inline
SVG icons (no new dependency) now used across nav, buttons, cards, and
empty states instead of relying on plain text alone.

**Pulsing status dots, as asked.** The navbar's backend status dot now
pulses while `connected` (and while `checking`), and stays a steady red
when `unavailable` — a steady dot reads as "stopped/alert", a pulsing one
reads as "actively live". The amber "verification running" dot (sidebar
+ navbar badge) already pulsed and still does.

**Cancel Verification is now a real button.** `ProcessingScreen.jsx`'s
cancel action was a plain text link; it's now a bordered button with an
icon, matching the rest of the button styling in the app.

**Less dead space:**
- `UploadScreen.jsx` is now wrapped in a bordered card with numbered
  steps ("1. Identity document", "2. Selfie"), tighter dropzones, and a
  full-width submit button — it reads as a form rather than a loose
  scatter of elements.
- `ProcessingScreen.jsx` replaced the plain pulsing text list with an
  actual icon-based stepper (connected circles), which uses the
  horizontal space instead of a narrow centered column.
- `Dashboard.jsx` gained a "Pipeline Stages" side panel next to the
  verdict distribution chart, and icons on every KPI card, so the wide
  desktop layout isn't just four numbers and a table.
- `ResultsDashboard.jsx` now packs cards into a 3-column grid on large
  screens (was a sparser 2-column layout), with an icon badge in the
  verdict banner and icons on every card header and action button.

**Hover/interactive feedback.** Cards across Dashboard, Settings, and the
evidence cards on the results page now have a subtle border-brighten (and
KPI cards a slight lift) on hover, plus every button/link has a visible
`focus-visible` ring for keyboard users — extending the accessibility
pass from the previous round.

None of this touches the backend, the color palette (still slate/amber/
green/red), or the data flow — it's presentation-layer only.

## What deliberately still hasn't changed

- No new API calls or response shape — `verifyDocument()`'s contract is
  the same `{ ocr, tamper, face }`, just with an optional cancellation
  signal added.
- No color palette changes — every new component still draws from the
  same slate/amber/green/red tokens.
- No persistence — verification history and all of the above still live
  in React state for the session only; nothing is written to
  localStorage, per the blueprint's privacy guidance.
