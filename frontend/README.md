# SentinelID frontend — restructured

Rebuilt per the Frontend UI Implementation Blueprint's information
architecture (dashboard / verify / history / settings, with an app shell
and sidebar), while keeping:

- the same color theme (slate-900/800/700 dark shell, amber-500 accent,
  green/amber/red status colors) — no new palette introduced
- the exact same backend integration — `api/verifyDocument.js` posts to
  `POST /verify` and expects `{ ocr, tamper, face }` back, unchanged from
  the original. `data/computeRisk.js` is also unchanged.

## What changed structurally

```
src/
  api/verifyDocument.js       same /verify contract, added pingBackend()
                               for the sidebar's connectivity indicator
  data/computeRisk.js         unchanged
  data/mockData.js            unchanged (kept for reference/dev use)
  components/
    layout/
      AppShell.jsx            sidebar + navbar + content wrapper
      Sidebar.jsx             nav: Dashboard / Verify / History / Settings
      Navbar.jsx              page title + live backend status dot
    ui/
      Badge.jsx                PASS/REVIEW/FAIL/etc. pill, reused everywhere
      EmptyState.jsx
    verification/
      UploadScreen.jsx         same upload UI, now embedded in a page
      ProcessingScreen.jsx     same pipeline animation, now shows all 4
                               stages incl. liveness ("not yet available")
      ResultsDashboard.jsx     same evidence cards + a Liveness placeholder
                               card and a plain-language verdict line
      OcrFieldsCard.jsx        unchanged
      TamperHeatmapCard.jsx    same data, evidence now behind "View analysis"
      FaceMatchCard.jsx        unchanged
      RiskGauge.jsx            unchanged
      VerdictBadge.jsx         unchanged
      LivenessCard.jsx         new — placeholder for the unimplemented P3
                               stage so results don't need to reflow later
  pages/
    Dashboard.jsx              KPI cards + recent verifications (from history)
    Verify.jsx                 hosts the upload → processing → results flow
    History.jsx                full case table, click a row to reopen its report
    Settings.jsx                shows the backend endpoint + data-handling note
  App.jsx                      owns page + in-memory verification history
```

## What deliberately did NOT change

- No new API calls, response shape, or endpoint — `verifyDocument()` is
  byte-for-byte the same function.
- No color palette changes — every class is drawn from the same
  slate/amber/green/red tokens the original five components already used.
- No persistence: verification history lives in React state in `App.jsx`
  for the session only, per the blueprint's privacy guidance (documents,
  selfies, and full results are never written to localStorage).

## PDF report

`ResultsDashboard.jsx` has a "Download PDF Report" button that calls
`utils/generateReportPdf.js`. Requires:

```
npm install jspdf jspdf-autotable
```

It's built entirely from the same `data` object the cards already render
(verdict, risk score, MRZ fields, tamper score/verdict, face match/reason),
so **no backend changes are required**.

Layout:
- A repeating letterhead header (wordmark, verification ID, timestamp)
  and footer (disclaimer + page number) on every page
- A colored verdict banner (green/amber/red, matching the app's risk
  colors) with the score
- Each section (OCR/MRZ, Document Authenticity, Face Verification) as a
  proper two-column table via `jspdf-autotable`, striped rows, with a
  short accent-underlined heading above it
- A liveness placeholder box, matching `LivenessCard.jsx`
- Document face + selfie face shown side by side, and the ELA heatmap in
  a bordered box (border color follows the tamper verdict, not the
  overall risk level, so they can't visually contradict each other)
- Multi-page safe — long flag lists or evidence sections push later
  content onto a new page automatically, with the header/footer repeated

The document face, selfie face, and ELA heatmap images are embedded on a
best-effort basis — if an image can't be fetched (e.g. a CORS-blocked
cross-origin image URL), that image is silently skipped and the rest of
the PDF still generates with all the text fields intact.

Case IDs (`VER-000101`, etc.) and timestamps are now generated once, in
`pages/Verify.jsx` at the moment a result comes back, via
`utils/caseId.js` — so the same ID/timestamp shows up whether you're
looking at the just-completed report or reopening it later from History.

## Fix: verification stopped when you switched pages

Previously `pages/Verify.jsx` held its own `stage`/`result`/`error`
state. Since `App.jsx` renders pages conditionally
(`{page === "verify" && <Verify />}`), navigating to Dashboard/History/
Settings **unmounted** the Verify component — so when the backend
request finished while you were elsewhere, it tried to update state on a
component that no longer existed, and React silently dropped it. The
scan looked like it just vanished.

Fixed by lifting `verifyStage` / `verifyResult` / `verifyError` up into
`App.jsx` (which never unmounts) and making `pages/Verify.jsx` a
stateless view driven entirely by props. Now a scan keeps running (and
its result lands) no matter which page you're on, and:
- the sidebar's "Verify Identity" link shows a small pulsing dot while a
  scan is running and you're on a different page
- the navbar shows a "Verification running…" badge you can click to jump
  straight back to the results once they're ready

## Notes

- `pingBackend()` in `verifyDocument.js` is additive (a plain `GET /` with
  a try/catch, same pattern as the existing network-error handling) — it
  only feeds the sidebar's "Backend connected / unavailable" dot and never
  touches the verification request itself.
- Liveness (P3) isn't implemented on the backend, so `LivenessCard` is a
  clearly-labeled placeholder rather than fabricated data, and the risk
  score still only factors in OCR/tamper/face exactly as before.
