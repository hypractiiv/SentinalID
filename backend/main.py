# main.py
# SentinelID Homeland Security & Border Checkpoint Document Screening Backend
# High-Performance FastAPI Service orchestrating:
#   - P1: OCR & ICAO 9303 MRZ Checksum Extraction
#   - P2: In-Memory Forensic Error Level Analysis & Tamper Detection
#   - P3: Presentation Attack Detection & Biometric Liveness Verification
#   - P4: DeepFace ArcFace Biometric Facial Matcher
#   - Fused Threat Assessment Engine & Latency Profiling

import os
import time
import uuid
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

# Configure TensorFlow CPU thread concurrency before loading native libraries
os.environ["TF_NUM_INTEROP_THREADS"] = "2"
os.environ["TF_NUM_INTRAOP_THREADS"] = "4"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "1"

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import ocr_module
import tamper_module
import liveness_module
import face_module
from file_utils import ensure_image, cleanup_files

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Dedicated thread pool executor for CPU-bound computer vision routines
executor = ThreadPoolExecutor(max_workers=6, thread_name_prefix="sentinel_cv")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up deep learning weights and clean stale temp uploads on startup."""
    print("[SentinelID] Initializing backend services...")
    loop = asyncio.get_running_loop()
    # Pre-warm ArcFace model in background thread to avoid cold-start request penalty
    loop.run_in_executor(executor, face_module.get_arcface_model)
    yield
    print("[SentinelID] Shutting down backend services...")
    executor.shutdown(wait=False)


app = FastAPI(
    title="SentinelID Screening Platform",
    description="Automated AI Identity & Document Screening System for Land-Border Checkpoints",
    version="2.0.0",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing for modern web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def save_upload(upload_file: UploadFile) -> str:
    """Saves incoming upload stream to temporary disk location with sanitized UUID."""
    ext = os.path.splitext(upload_file.filename or "")[1].lower()
    if not ext:
        ext = ".jpg"
    save_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)
    return save_path


def _safe_run(func, *args):
    """Executes a synchronous CV pipeline safely inside executor, capturing runtime errors."""
    try:
        return func(*args)
    except Exception as e:
        return {"error": str(e), "status": "failed"}


def compute_fused_risk(ocr_res: dict, tamper_res: dict, liveness_res: dict, face_res: dict) -> dict:
    """Fuses multi-modal telemetry into a calibrated threat score and operational directive."""
    score = 0
    factors = []

    # 1. Tamper analysis
    if isinstance(tamper_res, dict):
        tamper_score = tamper_res.get("tamper_score", 0)
        verdict = tamper_res.get("verdict", "")
        if verdict == "SUSPICIOUS":
            score += 35
            factors.append("Document image tampering or editing software signatures detected")
        elif verdict == "REVIEW_RECOMMENDED":
            score += 18
            factors.append("Minor compression or noise inconsistencies detected on document")
        elif tamper_score > 30:
            score += min(20, tamper_score * 0.25)

    # 2. Biometric Liveness & Presentation Attack Detection
    if isinstance(liveness_res, dict):
        if not liveness_res.get("is_live", True):
            score += 45
            spoof_info = liveness_res.get("reason", "Presentation attack detected")
            factors.append(f"Biometric spoof detected: {spoof_info}")
        elif liveness_res.get("liveness_score", 100) < 55:
            score += 20
            factors.append("Liveness confidence is borderline (secondary check recommended)")

    # 3. Biometric Face Verification
    if isinstance(face_res, dict):
        if not face_res.get("match", False):
            score += 40
            factors.append("Facial biometrics do not match ID document portrait")
        elif face_res.get("similarity_score", 100) < 68:
            score += 15
            factors.append("Facial similarity score is marginal (< 68%)")

    # 4. OCR / MRZ Checksum verification
    if isinstance(ocr_res, dict):
        mrz = ocr_res.get("mrz")
        if mrz:
            if not mrz.get("checksums_passed", True):
                score += 25
                factors.append("ICAO 9303 MRZ cryptographic check digit validation failed")

    final_risk = min(100, max(0, round(score)))
    if final_risk > 60:
        risk_level = "HIGH"
        verdict_action = "DENY_ENTRY"
    elif final_risk > 30:
        risk_level = "MEDIUM"
        verdict_action = "SECONDARY_INSPECTION"
    else:
        risk_level = "LOW"
        verdict_action = "ALLOW"

    return {
        "final_risk": final_risk,
        "risk_level": risk_level,
        "verdict_action": verdict_action,
        "risk_factors": factors,
    }


@app.get("/")
@app.get("/health")
def health_check():
    """Health status and telemetry endpoint."""
    return {
        "service": "SentinelID Backend",
        "status": "operational",
        "version": "2.0.0",
        "active_pipelines": ["ocr", "tamper", "liveness", "face_match"],
        "models_cached": {
            "arcface": face_module._ARCFACE_MODEL is not None,
            "fast_ocr": True,
            "liveness_pad": True,
        },
    }


@app.post("/ocr/extract")
def ocr_extract(document: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    doc_raw = save_upload(document)
    doc_path = ensure_image(doc_raw)
    try:
        result = ocr_module.run_ocr_pipeline(doc_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")
    finally:
        if background_tasks:
            background_tasks.add_task(cleanup_files, doc_raw, doc_path)


@app.post("/tamper/check")
def tamper_check(document: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    doc_raw = save_upload(document)
    doc_path = ensure_image(doc_raw)
    try:
        result = tamper_module.tamper_score(doc_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tamper check failed: {e}")
    finally:
        if background_tasks:
            background_tasks.add_task(cleanup_files, doc_raw, doc_path)


@app.post("/face/verify")
def face_verify(
    document: UploadFile = File(...),
    selfie: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    doc_raw = save_upload(document)
    selfie_raw = save_upload(selfie)
    doc_path = ensure_image(doc_raw)
    selfie_path = ensure_image(selfie_raw)
    try:
        result = face_module.verify_faces(doc_path, selfie_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {e}")
    finally:
        if background_tasks:
            background_tasks.add_task(cleanup_files, doc_raw, selfie_raw, doc_path, selfie_path)


@app.post("/liveness/verify")
def liveness_verify(selfie: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Dedicated endpoint for presentation attack detection and biometric liveness."""
    selfie_raw = save_upload(selfie)
    selfie_path = ensure_image(selfie_raw)
    try:
        result = liveness_module.verify_liveness(selfie_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liveness verification failed: {e}")
    finally:
        if background_tasks:
            background_tasks.add_task(cleanup_files, selfie_raw, selfie_path)


@app.post("/verify")
async def verify(
    document: UploadFile = File(...),
    selfie: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    """The master verification endpoint. Concurrently executes OCR/MRZ, Tampering ELA,
    Biometric Liveness, and Facial Matching pipelines, fusing outputs into a unified verdict."""
    start_time = time.perf_counter()

    doc_raw = save_upload(document)
    selfie_raw = save_upload(selfie)
    doc_path = ensure_image(doc_raw)
    selfie_path = ensure_image(selfie_raw)

    loop = asyncio.get_running_loop()

    # Launch all 4 pipelines concurrently in the thread pool executor
    ocr_task = loop.run_in_executor(executor, _safe_run, ocr_module.run_ocr_pipeline, doc_path)
    tamper_task = loop.run_in_executor(executor, _safe_run, tamper_module.tamper_score, doc_path)
    liveness_task = loop.run_in_executor(executor, _safe_run, liveness_module.verify_liveness, selfie_path)
    face_task = loop.run_in_executor(executor, _safe_run, face_module.verify_faces, doc_path, selfie_path)

    ocr_res, tamper_res, liveness_res, face_res = await asyncio.gather(
        ocr_task, tamper_task, liveness_task, face_task
    )

    # Compute composite threat score
    risk_assessment = compute_fused_risk(ocr_res, tamper_res, liveness_res, face_res)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)

    # Clean up uploaded raw/temp files after response
    if background_tasks:
        background_tasks.add_task(cleanup_files, doc_raw, selfie_raw, doc_path, selfie_path)

    return {
        "ocr": ocr_res,
        "tamper": tamper_res,
        "liveness": liveness_res,
        "face": face_res,
        "risk": risk_assessment,
        "telemetry": {
            "processing_time_ms": elapsed_ms,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    }