# SentinelID — AI-Powered Multi-Modal Backend Engine

This folder contains the complete, high-performance Python FastAPI microservice powering the SentinelID Border Screening Platform.

## Architecture & Pipelines

The service concurrently orchestrates four computer vision & deep learning pipelines using asynchronous thread pools:

| Pipeline | Module | Technical Core | Optimizations |
|---|---|---|---|
| **P1: Document Credential Extraction** | `ocr_module.py` | PyTesseract & PassportEye (ICAO 9303 MRZ parsing) | Fast Gaussian + Otsu binarization (< 20ms) replacing slow NLM denoising; check digit validation (DOB, number, expiry, composite). |
| **P2: Forensic Tampering Detection** | `tamper_module.py` | Multi-pass Error Level Analysis (ELA) + Edge Noise Splicing | 100% in-memory `io.BytesIO` compression diffing (zero disk I/O); returns Base64 ELA heatmap; checks software alteration metadata. |
| **P3: Presentation Attack Detection (PAD)** | `liveness_module.py` | ISO/IEC 30107-3 compliant multi-factor Biometric Liveness | 2D Fast Fourier Transform (FFT) moiré frequency detection, Laplacian micro-texture porosity, YCbCr chrominance naturalness, 3D gradient reflectance. |
| **P4: Biometric Facial Matching** | `face_module.py` | DeepFace ArcFace Biometric Embeddings | Pre-warmed model caching; multiscale face localization for fast CPU execution; in-memory NumPy tensor comparison; returns cropped portraits and HUD bounding boxes. |

---

## Unified Threat Scoring Engine (`POST /verify`)

The master `/verify` endpoint aggregates telemetry across all 4 pipelines and computes a calibrated threat score:
- **`final_risk`** (0 – 100 scale)
- **`risk_level`**: `LOW` (0–30), `MEDIUM` (31–60), `HIGH` (61–100)
- **`verdict_action`**: `ALLOW`, `SECONDARY_INSPECTION`, `DENY_ENTRY`
- **`risk_factors`**: Granular itemized forensic and biometric alerts

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` or `/health` | Service health status, active pipeline list, model cache telemetry |
| `POST` | `/ocr/extract` | Upload `document` (image or PDF) -> returns MRZ fields, ICAO check digits, and OCR text |
| `POST` | `/tamper/check` | Upload `document` (image or PDF) -> returns ELA score, verdict, and Base64 heatmap |
| `POST` | `/face/verify` | Upload `document` + `selfie` -> returns ArcFace cosine distance, similarity %, and cropped portraits |
| `POST` | `/liveness/verify`| Upload `selfie` -> returns biometric liveness score, presentation attack checks, and HUD scan |
| `POST` | `/verify` | **Master Endpoint**: Runs all 4 modules concurrently via `asyncio.gather` and returns fused risk |

---

## Local Setup & Execution

### 1. Prerequisites
- Python 3.10+ (tested through 3.13)
- Tesseract OCR:
  - **Windows**: Install from [UB-Mannheim Tesseract build](https://github.com/UB-Mannheim/tesseract/wiki) (default: `C:\Program Files\Tesseract-OCR\tesseract.exe`)
  - **Linux**: `sudo apt-get install tesseract-ocr`
  - **macOS**: `brew install tesseract`

### 2. Environment Activation & Dependencies
```bash
# In the backend directory:
pip install -r requirements.txt
```

### 3. Start the Server
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Interactive OpenAPI documentation is live at `http://127.0.0.1:8000/docs`.