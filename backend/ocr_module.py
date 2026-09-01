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

# Windows doesn't reliably pick up Tesseract from PATH even after installing
# it, so we point pytesseract straight at the .exe. This only matters on
# Windows — comment this line out (or leave it, it's harmless) on Mac/Linux,
# where `apt-get install tesseract-ocr` / `brew install tesseract` already
# puts it somewhere Python can find automatically.
#
# If you installed Tesseract somewhere other than the default location,
# update this path to match.
import platform
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_text(image_path: str) -> str:
    """Run plain OCR over the whole image and return the raw text found."""
    img = Image.open(image_path)
    return pytesseract.image_to_string(img)


from datetime import datetime


def _format_mrz_date(yyMMdd: str, future_leaning: bool) -> str:
    """MRZ dates are encoded as YYMMDD with no century — e.g. "000911" for
    11 September 2000. The century has to be guessed, and birth dates vs.
    expiry dates guess in opposite directions: a birth date should land in
    the past (so 00 becomes 2000, not some future year), while an expiry
    date should lean toward the future (a passport isn't issued already
    expired). Returns a readable "11 Sep 2000" string, or the original raw
    value unchanged if it doesn't look like a valid MRZ date."""
    if not yyMMdd or len(yyMMdd) != 6 or not yyMMdd.isdigit():
        return yyMMdd

    yy, mm, dd = int(yyMMdd[0:2]), int(yyMMdd[2:4]), int(yyMMdd[4:6])
    current_year = datetime.now().year
    this_century = (current_year // 100) * 100 + yy

    if future_leaning:
        year = this_century if this_century >= current_year else this_century + 100
    else:
        year = this_century if this_century <= current_year else this_century - 100

    try:
        return datetime(year, mm, dd).strftime("%d %b %Y")
    except ValueError:
        # Not a real calendar date - likely an OCR misread. Return the raw
        # value rather than silently guessing at a "fixed" date.
        return yyMMdd


def _strip_padding_artifacts(value: str) -> str:
    """passporteye's OCR occasionally misreads one of the MRZ's '<' filler
    characters as an actual letter (most often 'K') instead of correctly
    reading '<' — likely a stroke-shape mixup at low resolution, since '<'
    and 'K' look fairly similar. Since real '<' characters are already
    turned into spaces above, a misread shows up as one or more short
    trailing tokens made of a single repeated letter, e.g.
    "LANA K KKKKKKKKKKKK" instead of just "LANA". No real name ends in a
    run of the same letter repeated like that, so trailing tokens which are
    just one character repeated are stripped as OCR artifacts, not name
    data. Always keeps at least the first token, even in the unlikely case
    it also matches this pattern."""
    tokens = value.split()
    while len(tokens) > 1 and len(set(tokens[-1])) == 1:
        tokens.pop()
    return " ".join(tokens)


def _clean_mrz_dict(mrz_dict: dict) -> dict:
    """passporteye returns MRZ fields exactly as they appear in the raw MRZ
    text — which is fixed-width and padded with '<' filler characters (part
    of the MRZ spec, not an OCR error). E.g. an 8-character passport number
    in a 9-character field comes back as "X6248911<". This strips that
    padding so the values are clean for display. Also turns '<' separators
    between multiple given names into spaces (harmless no-op for fields
    that don't have any, like dates or sex), converts the raw YYMMDD date
    fields into a readable format, and strips leftover padding-misread
    artifacts from the name fields (see _strip_padding_artifacts above)."""
    cleaned = {}
    for key, value in mrz_dict.items():
        if isinstance(value, str):
            cleaned[key] = value.replace("<", " ").strip()
        else:
            cleaned[key] = value

    if cleaned.get("date_of_birth"):
        cleaned["date_of_birth"] = _format_mrz_date(cleaned["date_of_birth"], future_leaning=False)
    if cleaned.get("expiration_date"):
        cleaned["expiration_date"] = _format_mrz_date(cleaned["expiration_date"], future_leaning=True)
    if cleaned.get("names"):
        cleaned["names"] = _strip_padding_artifacts(cleaned["names"])
    if cleaned.get("surname"):
        cleaned["surname"] = _strip_padding_artifacts(cleaned["surname"])

    return cleaned


def extract_mrz(image_path: str):
    """Try to find and parse a Machine Readable Zone (the two/three lines of
    text at the bottom of a passport). Returns None if no MRZ is found."""
    mrz = read_mrz(image_path)
    return _clean_mrz_dict(mrz.to_dict()) if mrz else None


def preprocess(image_path: str) -> str:
    """Upscale, denoise, and threshold the image — used as a fallback when
    the first MRZ read is missing or looks unreliable, since MRZ detection
    is picky about image quality. Returns the path to the cleaned-up image."""
    img = cv2.imread(image_path)
    img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    # Derived from the input filename (not a fixed name) so two people
    # uploading at the same time don't overwrite each other's preprocessed
    # file mid-request.
    save_path = image_path.rsplit(".", 1)[0] + "_preprocessed.jpg"
    cv2.imwrite(save_path, thresh)
    return save_path


# passporteye scores its own MRZ read from 0-100 based on how many of the
# MRZ's built-in check digits actually validated (valid_number,
# valid_date_of_birth, valid_composite, etc. rolled into one number). A
# read can "succeed" (return a dict, not None) while still being garbage —
# e.g. a busy watermark or a redaction box sitting across the MRZ strip can
# make passporteye confidently misread characters rather than fail outright.
# Below this score, we don't trust the first read and retry against the
# cleaned-up (denoised/thresholded) image instead. This is a starting
# threshold, not a precisely calibrated one — adjust if it retries too
# eagerly (slows down clean reads) or not eagerly enough (keeps bad data).
MRZ_CONFIDENCE_THRESHOLD = 60


def run_ocr_pipeline(image_path: str) -> dict:
    """The main entry point main.py will call. Tries a direct MRZ read
    first; if that's missing OR looks low-confidence (see
    MRZ_CONFIDENCE_THRESHOLD above), preprocesses the image and tries
    again, keeping whichever result scored higher. Always also returns the
    raw OCR text as a bonus/fallback for the frontend."""
    mrz_data = extract_mrz(image_path)
    confidence = mrz_data.get("valid_score", 0) if mrz_data else 0

    if mrz_data is None or confidence < MRZ_CONFIDENCE_THRESHOLD:
        prep_path = preprocess(image_path)
        retry_data = extract_mrz(prep_path)
        retry_confidence = retry_data.get("valid_score", 0) if retry_data else 0
        # Only switch to the retry if it's actually at least as good -
        # preprocessing doesn't always help, so don't downgrade a decent
        # first read with a worse retry.
        if retry_data is not None and retry_confidence >= confidence:
            mrz_data = retry_data

    raw_text = extract_text(image_path)
    return {"mrz": mrz_data, "raw_text": raw_text}