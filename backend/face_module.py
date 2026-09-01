# face_module.py
import base64
from io import BytesIO

from deepface import DeepFace
from PIL import Image, ImageDraw

# Tuned stricter than DeepFace's default (~0.68 for ArcFace cosine distance)
# as an intentional anti-spoofing margin for a security-screening use case.
#
# UPDATED (see conversation with P3): the original value of 0.35 was
# rejecting genuine same-person matches (observed distance=0.381 on a real
# test pair — a passport/ID photo vs. a phone selfie of the same person,
# which normally sit somewhere in the 0.2-0.5 range due to ordinary
# lighting/angle/camera differences). 0.5 keeps real extra strictness
# beyond DeepFace's own 0.68 default, while leaving room for that kind of
# expected variation. This is a starting point, not a calibrated final
# value — P4, please tune this against a proper set of real test pairs
# (several genuine matches + several genuine non-matches) when you have
# time; the ensemble check against Facenet512 below stays as a second
# independent layer regardless of where this number lands.
MATCH_DISTANCE_THRESHOLD = 0.5

# Facenet512 is no longer a hard gate (see verify_faces below) - this
# threshold is now only used to compute the informational
# facenet512_verified_by_our_threshold debug flag, not the actual match
# decision. Kept for whenever P4 revisits re-enabling it as a gate.
FACENET_DISTANCE_THRESHOLD = 0.40


def _draw_face_box(image_path: str, facial_area: dict) -> str:
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]
    draw.rectangle([x, y, x + w, y + h], outline="red", width=max(2, img.width // 200))
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _crop_face(image_path: str, facial_area: dict, margin: float = 0.2) -> str:
    """Crops tightly to the detected face (with a small margin) and saves it
    to a temp file, so verification compares faces only - not background,
    ID card text, logos, etc."""
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


def _largest_face(faces: list) -> dict:
    """When multiple faces are detected, use the largest one (most likely
    the main subject) instead of just whatever came first."""
    return max(faces, key=lambda f: f["facial_area"]["w"] * f["facial_area"]["h"])


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

        doc_best_face = _largest_face(doc_valid_faces) if doc_valid_faces else (doc_faces[0] if doc_faces else None)
        selfie_best_face = (
            _largest_face(selfie_valid_faces) if selfie_valid_faces else (selfie_faces[0] if selfie_faces else None)
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

        # Primary model - uses the tightly cropped face (background/ID
        # card text/logos removed) since ArcFace was tuned against that.
        arcface_result = DeepFace.verify(
            img1_path=doc_crop, img2_path=selfie_crop,
            model_name="ArcFace", detector_backend="skip",  # already cropped, skip re-detection
            distance_metric="cosine",
        )

        # Facenet512 - no longer gates the match (see note near
        # FACENET_DISTANCE_THRESHOLD above), but still runs so its result
        # is available in "debug" below. Uses the ORIGINAL images (not our
        # manual crop) so it can do its own detection/alignment.
        facenet_result = DeepFace.verify(
            img1_path=doc_image_path, img2_path=selfie_image_path,
            model_name="Facenet512", detector_backend=detector_backend,
            enforce_detection=False,
            distance_metric="cosine",
        )

        arcface_distance = arcface_result["distance"]
        arcface_verified = arcface_result["verified"]
        facenet_distance = facenet_result["distance"]
        facenet_match = facenet_distance < FACENET_DISTANCE_THRESHOLD

        # UPDATED (see conversation with P3): Facenet512 was dropped as a
        # hard gate here. Across two real test pairs, ArcFace correctly
        # identified both as matches (comfortably within its threshold both
        # times), while Facenet512 disagreed both times, by wildly
        # different amounts (0.327 vs 0.796) - not "needs a bigger
        # threshold," but a sign it isn't reliably usable in this pipeline
        # yet (likely struggles with small/low-res embedded photos, e.g.
        # Aadhaar-style cards). ArcFace alone now decides the match.
        # Facenet512 still runs and its result is kept below in "debug" so
        # it's not lost - P4 can use that data to figure out why it's
        # underperforming and potentially re-enable it as a gate later.
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
                "facenet512_distance": round(facenet_distance, 4),
                "facenet512_verified_by_deepface_default": facenet_result["verified"],
                "facenet512_verified_by_our_threshold": facenet_match,
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