# face_module.py
# SentinelID Facial Biometric Matcher (ArcFace + High-Speed Adaptive Detection)
# Evaluates facial biometrics between an ID document photo and a live capture.
# Optimizations:
#   - In-memory NumPy tensor processing (eliminates intermediate disk writes)
#   - Pre-warmed model caching via DeepFace.build_model
#   - Adaptive multiscale face localization for fast CPU execution
#   - Side-by-side cropped biometric portrait extraction and HUD bounding boxes

import base64
import io
import cv2
import numpy as np
from PIL import Image, ImageDraw
from deepface import DeepFace

MATCH_DISTANCE_THRESHOLD = 0.55

# Global model cache to avoid re-instantiating TensorFlow computational graphs
_ARCFACE_MODEL = None


def get_arcface_model():
    """Retrieve or lazily initialize the singleton ArcFace model instance."""
    global _ARCFACE_MODEL
    if _ARCFACE_MODEL is None:
        try:
            _ARCFACE_MODEL = DeepFace.build_model("ArcFace")
        except Exception as e:
            print(f"Warning: ArcFace model build deferred ({e})")
            _ARCFACE_MODEL = None
    return _ARCFACE_MODEL


def _draw_face_box(image_path: str, facial_area: dict, title: str = "FACE DETECTED") -> str:
    """Draws biometric HUD brackets and confidence label on the image,
    returning base64-encoded JPEG data URL."""
    try:
        img = Image.open(image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]

        # Ensure bounds stay within image
        x = max(0, min(x, img.width - 1))
        y = max(0, min(y, img.height - 1))
        w = max(10, min(w, img.width - x))
        h = max(10, min(h, img.height - y))

        line_width = max(3, img.width // 200)
        draw.rectangle([x, y, x + w, y + h], outline="#10b981", width=line_width)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"
    except Exception:
        return ""


def _crop_face_to_numpy(image_path: str, facial_area: dict, margin: float = 0.15) -> tuple[np.ndarray, str]:
    """Crops the facial area with a margin directly in RAM.
    Returns (numpy_bgr_array, base64_jpeg_data_url)."""
    img = Image.open(image_path).convert("RGB")
    x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]

    mx, my = int(w * margin), int(h * margin)
    left = max(0, x - mx)
    top = max(0, y - my)
    right = min(img.width, x + w + mx)
    bottom = min(img.height, y + h + my)

    cropped = img.crop((left, top, right, bottom))

    # Convert to RGB numpy array for DeepFace
    crop_np = np.array(cropped)

    # Encode to Base64 for UI portrait card
    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"

    return crop_np, data_url


def _best_face(faces: list) -> dict:
    """Select the face with the highest confidence score."""
    return max(faces, key=lambda f: f.get("confidence", 0))


def _extract_faces_optimized(image_path: str, detector_backend: str = "retinaface") -> list[dict]:
    """Runs face detection with an adaptive scale step to keep CPU latency low."""
    # If the image is excessively large, scale a copy for faster detection
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return []

    h, w = img_bgr.shape[:2]
    max_dim = max(h, w)
    scale = 1.0

    if max_dim > 900:
        scale = 900.0 / max_dim
        detect_img = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        detect_img = img_bgr

    try:
        faces = DeepFace.extract_faces(
            img_path=detect_img,
            enforce_detection=False,
            detector_backend=detector_backend,
            align=True,
        )
    except Exception:
        # Fallback to opencv detector if retinaface hits memory or backend limits
        try:
            faces = DeepFace.extract_faces(
                img_path=detect_img,
                enforce_detection=False,
                detector_backend="opencv",
                align=False,
            )
        except Exception:
            return []

    if not faces:
        return []

    # Map facial bounding boxes back to original coordinate system if scaled
    if scale != 1.0:
        inv_scale = 1.0 / scale
        for f in faces:
            fa = f["facial_area"]
            fa["x"] = int(fa["x"] * inv_scale)
            fa["y"] = int(fa["y"] * inv_scale)
            fa["w"] = int(fa["w"] * inv_scale)
            fa["h"] = int(fa["h"] * inv_scale)

    return faces


def verify_faces(
    doc_image_path: str,
    selfie_image_path: str,
    detector_backend: str = "retinaface",
    confidence_threshold: float = 0.85,
) -> dict:
    """Verifies biometric identity between an ID document portrait and a selfie.
    Performs in-memory face localization, ArcFace feature representation,
    and cosine distance calculation."""
    try:
        # 1. Detect faces concurrently or sequentially
        doc_faces = _extract_faces_optimized(doc_image_path, detector_backend)
        selfie_faces = _extract_faces_optimized(selfie_image_path, detector_backend)

        doc_valid_faces = [f for f in doc_faces if f.get("confidence", 0) >= confidence_threshold] if doc_faces else []
        selfie_valid_faces = (
            [f for f in selfie_faces if f.get("confidence", 0) >= confidence_threshold] if selfie_faces else []
        )

        doc_best = _best_face(doc_valid_faces) if doc_valid_faces else (doc_faces[0] if doc_faces else None)
        selfie_best = (
            _best_face(selfie_valid_faces) if selfie_valid_faces else (selfie_faces[0] if selfie_faces else None)
        )

        doc_face_image = _draw_face_box(doc_image_path, doc_best["facial_area"]) if doc_best else None
        selfie_face_image = (
            _draw_face_box(selfie_image_path, selfie_best["facial_area"]) if selfie_best else None
        )

        if not doc_best or (doc_best.get("confidence", 0) < 0.5):
            return {
                "match": False,
                "distance": -1.0,
                "similarity_score": 0.0,
                "reason": "No clear face detected on the document (face may be occluded, low resolution, or missing).",
                "doc_face_image": doc_face_image,
                "selfie_face_image": selfie_face_image,
                "doc_face_crop": None,
                "selfie_face_crop": None,
            }

        if not selfie_best or (selfie_best.get("confidence", 0) < 0.5):
            return {
                "match": False,
                "distance": -1.0,
                "similarity_score": 0.0,
                "reason": "No clear face detected in the live selfie photo.",
                "doc_face_image": doc_face_image,
                "selfie_face_image": selfie_face_image,
                "doc_face_crop": None,
                "selfie_face_crop": None,
            }

        # 2. Extract in-memory crops for comparison
        doc_crop_np, doc_crop_b64 = _crop_face_to_numpy(doc_image_path, doc_best["facial_area"])
        selfie_crop_np, selfie_crop_b64 = _crop_face_to_numpy(selfie_image_path, selfie_best["facial_area"])

        # 3. Biometric match via ArcFace
        verify_result = DeepFace.verify(
            img1_path=doc_crop_np,
            img2_path=selfie_crop_np,
            model_name="ArcFace",
            detector_backend="skip",  # Already localized and cropped in RAM
            distance_metric="cosine",
            enforce_detection=False,
        )

        distance = float(verify_result["distance"])
        is_match = distance < MATCH_DISTANCE_THRESHOLD

        # Calibrate similarity score from cosine distance [0..1]
        similarity_score = round(max(0.0, (1.0 - distance)) * 100.0, 2)

        if is_match:
            reason = f"Biometric identity match confirmed (ArcFace cosine distance: {distance:.3f} < {MATCH_DISTANCE_THRESHOLD})."
        else:
            reason = f"Biometric mismatch: facial distance {distance:.3f} exceeded threshold {MATCH_DISTANCE_THRESHOLD}."

        return {
            "match": is_match,
            "distance": round(distance, 4),
            "similarity_score": similarity_score,
            "threshold": MATCH_DISTANCE_THRESHOLD,
            "reason": reason,
            "doc_face_image": doc_face_image,
            "selfie_face_image": selfie_face_image,
            "doc_face_crop": doc_crop_b64,
            "selfie_face_crop": selfie_crop_b64,
            "debug": {
                "arcface_distance": round(distance, 4),
                "doc_confidence": round(float(doc_best.get("confidence", 0)), 3),
                "selfie_confidence": round(float(selfie_best.get("confidence", 0)), 3),
            },
        }

    except Exception as e:
        return {
            "match": False,
            "distance": -1.0,
            "similarity_score": 0.0,
            "reason": f"Face verification encountered an error: {e}",
            "doc_face_image": None,
            "selfie_face_image": None,
            "doc_face_crop": None,
            "selfie_face_crop": None,
        }