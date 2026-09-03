# main.py
# Phase 2 backend: wraps P1's OCR module, P2's tampering module, and P4's
# face module into one FastAPI server with a single combined endpoint.

import os

# Limit TensorFlow thread usage to prevent CPU thrashing during concurrent tasks
os.environ["TF_NUM_INTEROP_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "2"

import shutil
import uuid
import asyncio

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import ocr_module
import tamper_module
import face_module
from file_utils import ensure_image

app = FastAPI(title="SentinelID Backend")

# Lets the Phase 3 frontend (running on a different port, e.g. Vite's
# localhost:5173) call this server from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload(upload_file: UploadFile) -> str:
    ext = os.path.splitext(upload_file.filename)[1]
    save_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)
    return save_path


def _safe_run(func, *args):
    """Helper to catch synchronous errors inside the executor."""
    try:
        return func(*args)
    except Exception as e:
        return {"error": str(e)}


@app.get("/")
def read_root():
    return {"message": "SentinelID backend is running"}


@app.post("/ocr/extract")
def ocr_extract(document: UploadFile = File(...)):
    path = ensure_image(save_upload(document))
    try:
        return ocr_module.run_ocr_pipeline(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")


@app.post("/tamper/check")
def tamper_check(document: UploadFile = File(...)):
    path = ensure_image(save_upload(document))
    try:
        return tamper_module.tamper_score(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tamper check failed: {e}")


@app.post("/face/verify")
def face_verify(document: UploadFile = File(...), selfie: UploadFile = File(...)):
    doc_path = ensure_image(save_upload(document))
    selfie_path = ensure_image(save_upload(selfie))
    try:
        return face_module.verify_faces(doc_path, selfie_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {e}")


@app.post("/verify")
async def verify(document: UploadFile = File(...), selfie: UploadFile = File(...)):
    doc_path = ensure_image(save_upload(document))
    selfie_path = ensure_image(save_upload(selfie))

    loop = asyncio.get_running_loop()

    # Offload blocking CPU-bound AI tasks to separate threads
    ocr_task = loop.run_in_executor(None, _safe_run, ocr_module.run_ocr_pipeline, doc_path)
    tamper_task = loop.run_in_executor(None, _safe_run, tamper_module.tamper_score, doc_path)
    face_task = loop.run_in_executor(None, _safe_run, face_module.verify_faces, doc_path, selfie_path)

    ocr_result, tamper_result, face_result = await asyncio.gather(
        ocr_task, tamper_task, face_task
    )

    return {
        "ocr": ocr_result,
        "tamper": tamper_result,
        "face": face_result,
    }