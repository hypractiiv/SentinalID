# main.py
# Phase 2 backend: wraps P1's OCR module, P2's tampering module, and P4's
# face module into one FastAPI server with a single combined endpoint.

import os
import shutil
import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import ocr_module
import tamper_module
import face_module
from file_utils import ensure_image

app = FastAPI(title="SentinelID Backend")

# Lets the Phase 3 frontend (running on a different port, e.g. Vite's
# localhost:5173) call this server from the browser. Without this, the
# browser blocks the request with a CORS error even though everything is
# running on your own machine. Once you know your real frontend URL you
# can replace "*" with that exact URL for a bit more safety.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload(upload_file: UploadFile) -> str:
    """Save an incoming file to disk under a random name (so two people
    uploading 'passport.jpg' at the same time don't overwrite each other)
    and return the path. All three AI modules expect a file path, not raw
    bytes, so every endpoint below starts by calling this."""
    ext = os.path.splitext(upload_file.filename)[1]
    save_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)
    return save_path


@app.get("/")
def read_root():
    return {"message": "SentinelID backend is running"}


@app.post("/ocr/extract")
def ocr_extract(document: UploadFile = File(...)):
    """Runs just P1's OCR/MRZ pipeline on one uploaded image (or PDF).
    Useful for testing P1's module on its own from the /docs page."""
    path = ensure_image(save_upload(document))
    try:
        return ocr_module.run_ocr_pipeline(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")


@app.post("/tamper/check")
def tamper_check(document: UploadFile = File(...)):
    """Runs just P2's tampering pipeline on one uploaded image (or PDF).
    Useful for testing P2's module on its own from the /docs page."""
    path = ensure_image(save_upload(document))
    try:
        return tamper_module.tamper_score(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tamper check failed: {e}")


@app.post("/face/verify")
def face_verify(document: UploadFile = File(...), selfie: UploadFile = File(...)):
    """Runs just P4's face verification between a document photo and a
    selfie. Either can be a PDF or an image. Useful for testing P4's module
    on its own from the /docs page."""
    doc_path = ensure_image(save_upload(document))
    selfie_path = ensure_image(save_upload(selfie))
    try:
        return face_module.verify_faces(doc_path, selfie_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {e}")


@app.post("/verify")
def verify(document: UploadFile = File(...), selfie: UploadFile = File(...)):
    """The real endpoint the Phase 3 frontend will call. Takes a document
    (image or PDF) and a selfie, runs all three AI modules, and returns one
    combined JSON result — this is the object the frontend swaps in for
    mockData.js."""
    doc_path = ensure_image(save_upload(document))
    selfie_path = ensure_image(save_upload(selfie))

    ocr_result = {"error": None}
    tamper_result = {"error": None}
    face_result = {"error": None}

    try:
        ocr_result = ocr_module.run_ocr_pipeline(doc_path)
    except Exception as e:
        ocr_result = {"error": str(e)}

    try:
        tamper_result = tamper_module.tamper_score(doc_path)
    except Exception as e:
        tamper_result = {"error": str(e)}

    try:
        face_result = face_module.verify_faces(doc_path, selfie_path)
    except Exception as e:
        face_result = {"error": str(e)}

    return {
        "ocr": ocr_result,
        "tamper": tamper_result,
        "face": face_result,
    }
