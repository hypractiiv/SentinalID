# file_utils.py
# High-performance image conversion, downscaling, and lifecycle cleanup utilities.

import os
import pymupdf  # Replaced deprecated fitz import
from PIL import Image


def ensure_image(file_path: str, max_dimension: int = 1500) -> str:
    """Converts PDF first page to PNG if necessary and ensures image dimensions
    are bounded by max_dimension to preserve AI pipeline performance.
    Returns path to the target image file."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        doc = pymupdf.open(file_path)
        page = doc.load_page(0)
        # Render at 150 DPI for sharp OCR
        pix = page.get_pixmap(dpi=150)
        image_path = file_path.rsplit(".", 1)[0] + ".png"
        pix.save(image_path)
        doc.close()
    else:
        image_path = file_path

    # Downscale in-place if excessively large
    try:
        with Image.open(image_path) as img:
            w, h = img.size
            if max(w, h) > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.BILINEAR)
                img.save(image_path)
    except Exception as e:
        print(f"Warning in image downscale ({image_path}): {e}")

    return image_path


def cleanup_files(*paths: str) -> None:
    """Safely removes temporary files from disk without raising exceptions."""
    for p in paths:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except OSError:
                pass