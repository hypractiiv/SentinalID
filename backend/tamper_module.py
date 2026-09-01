# tamper_module.py
# This is P2's tampering-detection logic, copied out of their Colab notebook.
#
# P2's notebook actually had two versions of a "run everything" function
# (tamper_score and analyze_image_tampering) — they're almost identical,
# the only difference is analyze_image_tampering also tries to `display()`
# the ELA image, which only works inside a notebook. On a server there's
# no notebook to display anything in, so we keep tamper_score (the one
# P2's own notebook comment labels "the function to export to your
# teammates for Phase 2 backend wiring").
#
# Video handling (check_video_tampering / extract_document_from_video) was
# in the notebook as an optional stretch section. It's not wired into the
# API yet — image tampering is the MVP. Ping P2 if/when video upload
# actually needs to be supported and we can add a /tamper/video endpoint.

import os
from PIL import Image, ImageChops, ImageEnhance


def compute_ela(image_path: str, quality: int = 90):
    """Error Level Analysis: re-save the image at a known JPEG quality and
    diff it against the original. Regions edited after the fact tend to
    show up brighter in that diff, because they weren't compressed at the
    same generation as the rest of the photo."""
    file_extension = os.path.splitext(image_path)[1].lower()
    if file_extension in [".tif", ".tiff"]:
        print(f"Note: ELA is meant for JPEGs — '{image_path}' (TIFF) will be converted first.")

    original = Image.open(image_path).convert("RGB")
    original.save("temp_resaved.jpg", quality=quality)
    resaved = Image.open("temp_resaved.jpg")
    diff = ImageChops.difference(original, resaved)
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    scale = 255.0 / max_diff if max_diff != 0 else 1
    ela_image = ImageEnhance.Brightness(diff).enhance(scale)
    ela_image.save("ela_output.jpg")
    return ela_image, max_diff


def check_metadata(image_path: str) -> list:
    """Flag images with no EXIF data — a common (not definitive) sign that
    an image was screenshotted or re-exported rather than a straight
    camera/scan capture."""
    img = Image.open(image_path)
    exif = img._getexif()
    flags = []
    if exif is None:
        flags.append("No EXIF data - possible screenshot/edited export")
    return flags


def tamper_score(image_path: str) -> dict:
    """The main entry point main.py will call. Combines the ELA score and
    the metadata flags into one verdict."""
    ela_img, max_diff = compute_ela(image_path)
    metadata_flags = check_metadata(image_path)
    score = min(max_diff / 100 * 100, 100)
    verdict = "SUSPICIOUS" if score > 40 or metadata_flags else "CLEAN"
    return {
        "tamper_score": round(score, 2),
        "metadata_flags": metadata_flags,
        "verdict": verdict,
    }
