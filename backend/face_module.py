# face_module.py
import base64
from io import BytesIO

from deepface import DeepFace
from PIL import Image, ImageDraw

MATCH_DISTANCE_THRESHOLD = 0.55


def _draw_face_box(image_path: str, facial_area: dict) -> str:
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]
    draw.rectangle([x, y, x + w, y + h], outline="red", width=max(2, img.width // 200))
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _crop_face(image_path: str, facial_area: dict, margin: float = 0.2) -> str:
    img = Image.open(image_path).convert("RGB")
    x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]
    mx, my = int(w * margin), int(h * margin)
    left = max(0, x - mx)
    top = max(0, y - my)
    right = min(img.width, x + w + mx)
    bottom = min(img.height, y + h + my)
    cropped = img.crop((left, top, right, bottom))
    crop_path = image_path.rsplit(".", 1)[0] + "_facecrop.jpg"
    cropped.save(crop_path, format="JPEG", quality=95)
    return crop_path


def _best_face(faces: list) -> dict:
    """When multiple faces are detected, use the one with the highest confidence
    (the clearest face) instead of the largest. This prevents selecting faint watermarks."""
    return max(faces, key=lambda f: f.get("confidence", 0))


def verify_faces(
    doc_image_path: str,
    selfie_image_path: str,
    detector_backend: str = "retinaface",
    confidence_threshold: float = 0.9,
) -> dict:
    try:
        doc_faces = DeepFace.extract_faces(
            img_path=doc_image_path, enforce_detection=False, detector_backend=detector_backend
        )
        selfie_faces = DeepFace.extract_faces(
            img_path=selfie_image_path, enforce_detection=False, detector_backend=detector_backend
        )

        doc_valid_faces = [f for f in doc_faces if f["confidence"] >= confidence_threshold] if doc_faces else []
        selfie_valid_faces = (
            [f for f in selfie_faces if f["confidence"] >= confidence_threshold] if selfie_faces else []
        )

        doc_best_face = _best_face(doc_valid_faces) if doc_valid_faces else (doc_faces[0] if doc_faces else None)
        selfie_best_face = (
            _best_face(selfie_valid_faces) if selfie_valid_faces else (selfie_faces[0] if selfie_faces else None)
        )

        doc_face_image = _draw_face_box(doc_image_path, doc_best_face["facial_area"]) if doc_best_face else None
        selfie_face_image = (
            _draw_face_box(selfie_image_path, selfie_best_face["facial_area"]) if selfie_best_face else None
        )

        if not doc_valid_faces:
            return {
                "match": False, "distance": -1, "similarity_score": 0,
                "reason": f"No valid face detected in document photo (confidence < {confidence_threshold}).",
                "doc_face_image": doc_face_image, "selfie_face_image": selfie_face_image,
            }
        if not selfie_valid_faces:
            return {
                "match": False, "distance": -1, "similarity_score": 0,
                "reason": f"No valid face detected in selfie photo (confidence < {confidence_threshold}).",
                "doc_face_image": doc_face_image, "selfie_face_image": selfie_face_image,
            }

        # Crop to just the face before comparing - removes ID card text/logos/background
        doc_crop = _crop_face(doc_image_path, doc_best_face["facial_area"])
        selfie_crop = _crop_face(selfie_image_path, selfie_best_face["facial_area"])

        # Primary model only - Facenet512 removed for performance
        arcface_result = DeepFace.verify(
            img1_path=doc_crop, img2_path=selfie_crop,
            model_name="ArcFace", detector_backend="skip",  # already cropped, skip re-detection
            distance_metric="cosine",
        )

        arcface_distance = arcface_result["distance"]
        arcface_verified = arcface_result["verified"]

        is_match = arcface_distance < MATCH_DISTANCE_THRESHOLD
        similarity_score = round(max(0, (1 - arcface_distance)) * 100, 2)

        if is_match:
            reason = "Verification successful (ArcFace)."
        else:
            reason = f"Rejected: ArcFace distance {arcface_distance:.3f} did not clear threshold {MATCH_DISTANCE_THRESHOLD}."

        return {
            "match": is_match,
            "distance": round(arcface_distance, 4),
            "similarity_score": similarity_score,
            "reason": reason,
            "debug": {
                "arcface_distance": round(arcface_distance, 4),
                "arcface_verified_by_deepface_default": arcface_verified,
                "arcface_verified_by_our_threshold": arcface_distance < MATCH_DISTANCE_THRESHOLD,
            },
            "doc_face_image": doc_face_image,
            "selfie_face_image": selfie_face_image,
        }
    except ValueError as e:
        return {
            "match": False, "distance": -1, "similarity_score": 0,
            "reason": f"DeepFace verification failed: {e}",
            "doc_face_image": None, "selfie_face_image": None,
        }
    except Exception as e:
        return {
            "match": False, "distance": -1, "similarity_score": 0,
            "reason": f"Unexpected error: {e}",
            "doc_face_image": None, "selfie_face_image": None,
        }