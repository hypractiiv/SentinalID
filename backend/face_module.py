# face_module.py
# This is P4's face verification logic, copied out of their Colab notebook.
#
# Kept as-is: verify_faces() — the pre-check for a confident face in each
# image, then DeepFace.verify() for the actual match.
#
# Dropped: highlight_face() and detect_multiple_faces() — those were visual
# sanity-check helpers for P4 to eyeball results inside the notebook
# (drawing boxes, showing crops with matplotlib). They don't do anything
# useful in an API response, so they're not included here. If the frontend
# ever wants bounding boxes drawn on the image, that logic can be lifted
# from P4's notebook (cells 9 and 11) and added back in.

from deepface import DeepFace


def verify_faces(
    doc_image_path: str,
    selfie_image_path: str,
    detector_backend: str = "retinaface",
    confidence_threshold: float = 0.9,
) -> dict:
    """Compare the face in an ID document photo against a selfie/live photo.
    Returns match (bool), distance (lower = more similar), and a 0-100
    similarity_score, or a reason string explaining why it couldn't verify."""
    try:
        doc_faces = DeepFace.extract_faces(
            img_path=doc_image_path, enforce_detection=False, detector_backend=detector_backend
        )
        selfie_faces = DeepFace.extract_faces(
            img_path=selfie_image_path, enforce_detection=False, detector_backend=detector_backend
        )

        doc_has_valid_face = any(f["confidence"] >= confidence_threshold for f in doc_faces) if doc_faces else False
        selfie_has_valid_face = (
            any(f["confidence"] >= confidence_threshold for f in selfie_faces) if selfie_faces else False
        )

        if not doc_has_valid_face:
            return {
                "match": False,
                "distance": -1,
                "similarity_score": 0,
                "reason": f"No valid face detected in document photo (confidence < {confidence_threshold}).",
            }

        if not selfie_has_valid_face:
            return {
                "match": False,
                "distance": -1,
                "similarity_score": 0,
                "reason": f"No valid face detected in selfie photo (confidence < {confidence_threshold}).",
            }

        result = DeepFace.verify(
            img1_path=doc_image_path,
            img2_path=selfie_image_path,
            model_name="ArcFace",
            detector_backend=detector_backend,
            enforce_detection=True,
        )

        return {
            "match": result["verified"],
            "distance": round(result["distance"], 4),
            "similarity_score": round((1 - result["distance"]) * 100, 2),
            "reason": "Verification successful.",
        }
    except ValueError as e:
        return {"match": False, "distance": -1, "similarity_score": 0, "reason": f"DeepFace verification failed: {e}"}
    except Exception as e:
        return {"match": False, "distance": -1, "similarity_score": 0, "reason": f"Unexpected error: {e}"}
