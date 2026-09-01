# ocr_module.py
# This is P1's OCR + MRZ logic, copied out of their Colab notebook.
#
# Changed from the notebook version:
#   - Removed anything Colab-only (colab_files.upload(), cv2_imshow, midv500 download,
#     synthetic passport generator). None of that makes sense on a real server.
#   - Everything else — extract_text, extract_mrz, preprocess, run_ocr_pipeline —
#     is the same logic P1 wrote and tested.
#
# If P1 changes their pipeline later, this is the file to update. Just keep the
# function names (extract_text, extract_mrz, preprocess, run_ocr_pipeline) the
# same so main.py doesn't need to change too.

import cv2
import pytesseract
from PIL import Image
from passporteye import read_mrz


def extract_text(image_path: str) -> str:
    """Run plain OCR over the whole image and return the raw text found."""
    img = Image.open(image_path)
    return pytesseract.image_to_string(img)


def extract_mrz(image_path: str):
    """Try to find and parse a Machine Readable Zone (the two/three lines of
    text at the bottom of a passport). Returns None if no MRZ is found."""
    mrz = read_mrz(image_path)
    return mrz.to_dict() if mrz else None


def preprocess(image_path: str) -> str:
    """Upscale, denoise, and threshold the image — this is a fallback we run
    only if the first MRZ read fails, since MRZ detection is picky about
    image quality. Returns the path to the cleaned-up image."""
    img = cv2.imread(image_path)
    img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    save_path = "preprocessed_optimized.jpg"
    cv2.imwrite(save_path, thresh)
    return save_path


def run_ocr_pipeline(image_path: str) -> dict:
    """The main entry point main.py will call. Tries a direct MRZ read first;
    if that fails, preprocesses the image and tries again. Always also
    returns the raw OCR text as a bonus/fallback for the frontend."""
    mrz_data = extract_mrz(image_path)
    if mrz_data is None:
        prep_path = preprocess(image_path)
        mrz_data = extract_mrz(prep_path)
    raw_text = extract_text(image_path)
    return {"mrz": mrz_data, "raw_text": raw_text}
