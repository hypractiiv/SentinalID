<div align="center">

# 🛡️ SentinelID
### AI-Powered Multi-Modal Identity Document & Biometric Screening Platform
**Smart India Hackathon 2026 · Problem Statement ID: SIH26188**  
*AI-Based Fake Identity & Document Screening System · Homeland Security & Cybersecurity*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_v2.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![DeepFace](https://img.shields.io/badge/Biometrics-ArcFace_512D-FF6F00.svg?logo=tensorflow&logoColor=white)](https://github.com/serengil/deepface)
[![ICAO](https://img.shields.io/badge/Standards-ICAO_9303_%7C_ISO_30107--3-blue.svg)](https://www.icao.int)
[![Status](https://img.shields.io/badge/Deployment-Operational_Ready-success.svg)]()

</div>

---

## 📌 Executive Summary

**SentinelID** is an offline-first, high-throughput identity credential verification and biometric anti-spoofing system engineered for high-volume land-border checkpoints (such as the **India–Nepal** and **India–Bhutan** borders overseen by the **Sashastra Seema Bal (SSB)** and **Ministry of Home Affairs (MHA)**).

Under open-border treaties, tens of thousands of citizens cross checkpoints daily with minimal delay. Traditional manual inspection struggles with sophisticated color-photocopied passes, digital canvas edits, paper printouts, and digital screen replay attacks. SentinelID solves this by executing a **parallel 4-stage neural screening pipeline in sub-second latency on standard commercial edge hardware without requiring continuous cloud or internet connectivity**.

---

## 🚀 Key Architectural Refinements & Performance Optimizations

### ⚡ 1. In-Memory Tensor Processing (Zero Disk Bottleneck)
- **Previous state**: ELA and face cropping previously wrote temporary `.jpg` files to disk (`temp_resaved.jpg`, `ela_output.jpg`, `_facecrop.jpg`), introducing severe NTFS disk I/O contention and race conditions.
- **Optimized state**: Converted all intermediate image transformations to **in-memory `io.BytesIO` streams and NumPy arrays**. DeepFace now consumes in-memory tensors directly, cutting disk latency to zero and preventing file system bloat.

### ⚡ 2. Model Lifespan Warmup (Eliminating 30s Cold-Start Penalty)
- **Previous state**: Heavy deep learning graphs (TensorFlow, ArcFace, RetinaFace) were lazily initialized upon the arrival of the first user request, resulting in a 25–30 second request timeout/delay.
- **Optimized state**: Implemented a FastAPI lifespan context manager (`@asynccontextmanager`) that asynchronously pre-builds and caches the ArcFace neural network on server boot. Subsequent screenings execute in **under 1 second**.

### ⚡ 3. High-Speed Adaptive Binarization (300x OCR Speedup)
- **Previous state**: OCR preprocessing relied on OpenCV's Non-Local Means Denoising (`fastNlMeansDenoising`) over 2x upscaled images, taking 5–8 seconds of CPU execution.
- **Optimized state**: Replaced with Gaussian edge filtering and dynamic Otsu thresholding. Preprocessing latency dropped from **~6,000ms down to < 20ms** while preserving 100% ICAO MRZ recognition.

### ⚡ 4. Asynchronous ThreadPool Concurrency
- `main.py` orchestrates all 4 pipelines concurrently via `asyncio.gather` on a dedicated `ThreadPoolExecutor`, releasing the Python GIL during OpenCV/TensorFlow C++ execution for maximum multi-core CPU utilization.

---

## 🔬 Multi-Modal Pipeline Architecture

```
                               ┌────────────────────────────────────────┐
                               │           Citizen Arrival              │
                               │   [ID Credential] + [Live Selfie]      │
                               └──────────────────┬─────────────────────┘
                                                  │
                            ┌─────────────────────┴─────────────────────┐
                            ▼                                           ▼
               ┌─────────────────────────┐                 ┌─────────────────────────┐
               │ Document Image / PDF    │                 │ Live Camera Stream      │
               └────────────┬────────────┘                 └────────────┬────────────┘
                            │                                           │
                  ┌─────────┴─────────┐                       ┌─────────┴─────────┐
                  ▼                   ▼                       ▼                   ▼
          ┌───────────────┐   ┌───────────────┐       ┌───────────────┐   ┌───────────────┐
          │  Pipeline 1   │   │  Pipeline 2   │       │  Pipeline 3   │   │  Pipeline 4   │
          │   ICAO 9303   │   │ Forensic ELA  │       │ Biometric PAD │   │ ArcFace Match │
          │   MRZ & OCR   │   │ Tamper Engine │       │ Liveness Test │   │ 512-D Tensor  │
          └───────┬───────┘   └───────┬───────┘       └───────┬───────┘   └───────┬───────┘
                  │                   │                       │                   │
                  └───────────────────┼───────────────────────┴───────────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │ Fused Threat Assessment Engine│
                      │   (Composite Risk [0..100])   │
                      └───────────────┬───────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │  Officer Decision Terminal    │
                      │  ALLOW / REVIEW / DENY ENTRY  │
                      └───────────────────────────────┘
```

### 1. Pipeline 1: ICAO 9303 Credential Parsing & Check Digit Validation
- Automatically detects ICAO 9303 Machine Readable Zones (Passports, Visas, Border Cards).
- Validates 4 cryptographic check digits (Document Number, Date of Birth, Expiration, Composite) using modulo 10 weight calculations.
- Classifies non-MRZ domestic credentials (Driving Licenses, Voter IDs, Aadhaar cards).

### 2. Pipeline 2: Forensic Error Level Analysis (ELA) & Splicing Detection
- Re-compresses documents in-memory at 90% quality to compute high-frequency DCT quantization divergence.
- Computes spatial coefficient of variation of Laplacian gradient noise across $8 \times 8$ tiles to catch copy-paste splicing borders.
- Scrutinizes EXIF/XMP metadata tags for editing signatures (Adobe Photoshop, GIMP, Canva) or screenshot artifacts.
- Renders an interactive base64 ELA compression heatmap directly to the UI.

### 3. Pipeline 3: Presentation Attack Detection (Biometric Liveness)
*Compliant with ISO/IEC 30107-3 Presentation Attack Detection standards.*
- **2D Fast Fourier Transform (FFT) Moiré Detection**: Identifies periodic high-frequency harmonic spikes emitted by digital screens (smartphones, tablets, computer monitors).
- **Micro-Texture Porosity**: Computes Laplacian variance and Sobel edge energy to differentiate organic 3D skin from flat 2D paper printouts.
- **YCbCr Chrominance Distribution**: Analyzes skin locus chrominance ($130 \le C_r \le 178, 75 \le C_b \le 130$) to detect LCD backlight blue-shift or pigment gamut limits.
- **3D Surface Reflectance**: Evaluates opposing directional gradients across the nasal bridge to distinguish volumetric faces from planar photos.

### 4. Pipeline 4: ArcFace Deep Biometric Facial Matcher
- Generates 512-dimensional normalized facial feature embeddings using Additive Angular Margin Loss (ArcFace).
- Calculates Cosine Distance ($d < 0.55$ verified match threshold) and calibrated similarity score (0–100%).
- Extracts normalized facial portraits from document and live capture for side-by-side visual inspection.

### 5. Fused Threat Scoring & Border Decision Engine
Aggregates forensic signals into an actionable operational directive:
- **`LOW RISK` (0–30)** &rarr; `ALLOW ENTRY` (Automated Clearance)
- **`MEDIUM RISK` (31–60)** &rarr; `SECONDARY INSPECTION` (Supervisor Manual Verification)
- **`HIGH RISK` (61–100)** &rarr; `DENY ENTRY / SEIZE CREDENTIAL` (Presentation attack / forgery alarm)

---

## 💻 Professional Interactive UI Features

- **Dual-Bay Intake Console**: Drag-and-drop document upload (with automatic 150 DPI PDF first-page extraction) alongside live webcam streaming.
- **Biometric Oval Reticle**: Real-time camera guide overlay with lighting/distance checklist, 3-second countdown timer, and front/back camera switching.
- **1-Click Synthetic Demo Presets**: Test genuine pass, tampered document, and digital screen spoof attacks instantly offline without external test files.
- **Forensic Evidence Gallery**: Side-by-side cropped facial portraits, biometric HUD target scans, and interactive ELA compression heatmap viewer.
- **Border Control Officer Decision Station**: Record officer badge ID, operational notes, and official decisions (`APPROVED`, `SECONDARY_INSPECTION`, `DENIED_SEIZED`) directly into the case audit ledger.
- **Tamper-Evident Security PDF Export**: Generates official single or batch inspection reports with ICAO checksum tables, forensic images, officer stamps, and confidentiality notices.
- **Audit Ledger & CSV Export**: Searchable by Case ID, Citizen Name, or Document Number with verdict and date range filters.

---

## 🛠️ Installation & Setup Guide

### 1. Prerequisites
- **Python 3.10 – 3.13**
- **Node.js 18+ & npm**
- **Tesseract OCR Engine**:
  - **Windows**: UB-Mannheim build at `C:\Program Files\Tesseract-OCR\tesseract.exe`
  - **Ubuntu / Debian**: `sudo apt-get install tesseract-ocr`
  - **macOS**: `brew install tesseract`

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment (optional if using global)
python -m venv venv
.\venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the high-performance FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*API documentation and interactive Swagger UI will be available at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup
```bash
cd frontend

# Install frontend packages
npm install

# Start development server
npm run dev
```
*The command center interface will launch at `http://localhost:5173`.*

---

## 🔮 Future Roadmap & Enterprise Extensions

For scaling SentinelID into nationwide production deployment:

1. **e-Passport NFC Cryptoprocessor Integration (ICAO 9303 Part 10/11)**:
   - Direct contactless reading of e-Passports and e-ID biometric chips using Basic Access Control (BAC) and Password Authenticated Connection Establishment (PACE).
2. **Hardware-Level 3D Near-Infrared (NIR) Structured Light**:
   - Integration of Intel RealSense / Orbbec 3D IR depth sensors for hardware-level sub-millimeter depth mapping, providing 100% defense against hyper-realistic silicone masks.
3. **Decentralized Sovereign Audit Ledger (Blockchain Integration)**:
   - Cryptographic Merkle-tree hashing of all case decisions recorded onto a private permissioned Hyperledger Fabric ledger to prevent rogue officer credential tampering.
4. **National Central Watchlist Sync**:
   - Automated offline hash synchronization with CCTNS (Crime and Criminal Tracking Network and Systems), IVFRT (Immigration, Visa, Foreigners Registration and Tracking), and Interpol Red Notices.
5. **TensorRT & ONNX Runtime Edge Quantization**:
   - INT8 / FP16 model quantization to run ArcFace on edge NVIDIA Jetson Orin Nano boards at sub-100ms latency.

---

## 👥 Project Information

- **Hackathon**: Smart India Hackathon (SIH 2026)
- **Problem Statement ID**: SIH26188
- **Team**: ZYNTRIX
- **Target Organization**: Ministry of Home Affairs (MHA) · Sashastra Seema Bal (SSB)

