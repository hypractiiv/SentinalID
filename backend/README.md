# Phase 2 — continuing from Step 8

**Update:** PDF upload support was added after the initial version of this
backend. If you already have this folder set up and are just pulling in
the new `file_utils.py` + updated `main.py`, re-run
`pip install -r requirements.txt` once to pick up the new `PyMuPDF`
dependency, then restart `uvicorn`.

Where the walkthrough left off: you had a "Hello World" FastAPI server running
with one endpoint (`/`). This picks up at **Step 9** — wiring in the three
real AI modules.

## What's in this folder

```
backend/
  main.py            <- the FastAPI server + all endpoints (Step 9-11 below)
  ocr_module.py       <- P1's OCR/MRZ code, copied out of their notebook
  tamper_module.py    <- P2's tampering-detection code, copied out of their notebook
  face_module.py       <- P4's face verification code, copied out of their notebook
  file_utils.py         <- converts an uploaded PDF's first page to PNG, so
                            the modules above (which only understand images)
                            can handle a PDF upload too
  requirements.txt     <- everything you need to pip install
  uploads/              <- uploaded images get saved here temporarily
```

Each `_module.py` file is that person's notebook logic with the Colab-only
parts stripped out (things like `files.upload()` or `cv2_imshow()`, which
only work inside a Colab notebook, not on a real server). The actual
algorithms weren't changed — same functions, same behavior.

## Step 9 — Install the extra dependencies

You already have `fastapi`, `uvicorn`, and `python-multipart` from Step 4.
Now install everything the three AI modules need:

```bash
pip install -r requirements.txt
```

This will take a few minutes — `deepface` in particular pulls in TensorFlow.

One extra thing P1's module needs that isn't a Python package: Tesseract
itself has to be installed on your machine (P1's notebook did this with
`apt-get install tesseract-ocr`, which only works because Colab *is* an
Ubuntu machine). On your own laptop:

- **Mac:** `brew install tesseract`
- **Ubuntu/Debian:** `sudo apt-get install tesseract-ocr`
- **Windows:** install from the [UB-Mannheim Tesseract build](https://github.com/UB-Mannheim/tesseract/wiki), then make sure it's on your PATH

## Step 10 — Replace main.py

The `main.py` in this folder replaces the one-endpoint version from Step 5.
It now has:

| Endpoint | What it does |
|---|---|
| `GET /` | same health-check message as before |
| `POST /ocr/extract` | runs just P1's OCR module on one uploaded image |
| `POST /tamper/check` | runs just P2's tampering module on one uploaded image |
| `POST /face/verify` | runs just P4's face module on a document photo + selfie |
| `POST /verify` | **the real one** — runs all three and returns one combined result |

The first three exist so each of P1/P2/P4 can test *their own* module in
isolation without needing the others working yet. `/verify` is the endpoint
Phase 3 (the frontend) will actually call.

## Step 11 — Run it

Same command as before:

```bash
uvicorn main:app --reload
```

Then go to `http://127.0.0.1:8000/docs`. You should now see five endpoints
listed instead of one. Click on `POST /verify`, hit "Try it out", upload a
document image and a selfie image, and hit "Execute" — you'll get back a
JSON response that looks like this:

```json
{
  "ocr": { "mrz": { ... }, "raw_text": "..." },
  "tamper": { "tamper_score": 12.5, "metadata_flags": [], "verdict": "CLEAN" },
  "face": { "match": true, "distance": 0.31, "similarity_score": 69.0, "reason": "Verification successful." }
}
```

That JSON shape is what Phase 3 will receive once it swaps `mockData.js`
for a real `fetch("http://127.0.0.1:8000/verify", ...)` call.

## Known gaps / things to flag to the team

- **Video tampering checks:** P2's notebook had an optional section for
  analyzing uploaded videos. Not included here — image tampering only, which
  covers the main use case.
- **Errors are per-module, not all-or-nothing:** if, say, the face module
  throws an error, `/verify` still returns the OCR and tamper results, with
  `"error": "..."` in place of the face result. That felt safer than failing
  the whole request over one module — but worth double-checking with the team
  that's the behavior you want.
- **No risk-score fusion yet** — this backend returns the three raw results
  side by side. Combining them into one final score/verdict is P1's job per
  the phase plan; once that logic exists it can slot into `/verify` right
  before the `return`.

## Next step

Want help wiring P1's risk-fusion logic into `/verify` once it's ready, or
help testing each endpoint one at a time with real sample images first?