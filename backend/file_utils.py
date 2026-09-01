# file_utils.py
# Small shared helper used by main.py. None of the three AI modules
# (ocr_module, tamper_module, face_module) know how to open a PDF — they
# all expect a plain image file (jpg/png). P4's original notebook handled
# this by converting an uploaded PDF to a PNG before doing anything else
# with it, so we do the same thing here, once, in one place, so every
# endpoint gets it for free.

import os
import fitz  # PyMuPDF


def ensure_image(file_path: str) -> str:
    """If file_path is a PDF, converts its first page to a PNG sitting next
    to it and returns the PNG's path. If it's already an image, returns the
    original path unchanged. Only the first page is used — fine for ID
    documents, which are almost always a single page/side per file."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext != ".pdf":
        return file_path

    doc = fitz.open(file_path)
    page = doc.load_page(0)
    pix = page.get_pixmap()
    image_path = file_path.rsplit(".", 1)[0] + ".png"
    pix.save(image_path)
    doc.close()
    return image_path