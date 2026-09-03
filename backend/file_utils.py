# file_utils.py
# Small shared helper used by main.py. None of the three AI modules
# (ocr_module, tamper_module, face_module) know how to open a PDF — they
# all expect a plain image file (jpg/png). P4's original notebook handled
# this by converting an uploaded PDF to a PNG before doing anything else
# with it, so we do the same thing here, once, in one place, so every
# endpoint gets it for free.

import os
import fitz  # PyMuPDF
from PIL import Image

def ensure_image(file_path: str) -> str:
    """If file_path is a PDF, converts its first page to a PNG sitting next
    to it and returns the PNG's path. If it's already an image, returns the
    original path unchanged. Only the first page is used — fine for ID
    documents, which are almost always a single page/side per file.
    Additionally, downscales large images (max 1500px on the longest edge)
    to speed up AI processing."""
    ext = os.path.splitext(file_path)[1].lower()
    
    # 1. Convert PDF to PNG if necessary
    if ext == ".pdf":
        doc = fitz.open(file_path)
        page = doc.load_page(0)
        pix = page.get_pixmap()
        image_path = file_path.rsplit(".", 1)[0] + ".png"
        pix.save(image_path)
        doc.close()
    else:
        image_path = file_path

    # 2. Downscale large images (max 1500px on the longest edge)
    img = Image.open(image_path)
    max_size = 1500
    if max(img.width, img.height) > max_size:
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        img.save(image_path)

    return image_path