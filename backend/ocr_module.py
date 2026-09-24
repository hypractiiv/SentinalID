# ocr_module.py
# SentinelID High-Performance OCR & ICAO 9303 Dual-Engine MRZ Extraction Pipeline
# Features:
#   1. Dual-engine MRZ detection: PassportEye primary + CLAHE-enhanced Tesseract fallback
#   2. Cryptographic ICAO 9303 7-3-1 weight check digit verification (TD1, TD2, TD3 formats)
#   3. Optical error correction (O/0, I/1, S/5, Z/2, B/8 disambiguation for numeric/alpha fields)
#   4. Dynamic line length normalization for trailing chevron truncation/merging
#   5. CLAHE adaptive histogram equalization for low-light / laminated checkpoint credentials
#   6. Robust multi-document type classification (Passports, Aadhaar, PAN, DL, Voter ID, Visas)

import os
import re
import platform
from datetime import datetime
import cv2
import numpy as np
from PIL import Image
import pytesseract
from passporteye import read_mrz

# Point pytesseract to standard binary location on Windows
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def icao_check_digit(data_str: str) -> int:
    """Computes ICAO Doc 9303 check digit using the standard [7, 3, 1] weighting sequence."""
    weights = [7, 3, 1]
    total = 0
    for i, ch in enumerate(data_str.upper()):
        if ch.isdigit():
            val = int(ch)
        elif "A" <= ch <= "Z":
            val = ord(ch) - ord("A") + 10
        elif ch == "<":
            val = 0
        else:
            val = 0
        total += val * weights[i % 3]
    return total % 10


def format_mrz_date(yyMMdd: str, is_expiry: bool = False) -> str:
    """Formats ICAO YYMMDD date into human-readable DD MMM YYYY."""
    if not yyMMdd or len(yyMMdd) != 6 or not yyMMdd.isdigit():
        return yyMMdd

    yy, mm, dd = int(yyMMdd[0:2]), int(yyMMdd[2:4]), int(yyMMdd[4:6])
    cur_year = datetime.now().year
    century = (cur_year // 100) * 100

    if is_expiry:
        year = century + yy if (century + yy) >= cur_year else century + 100 + yy
    else:
        year = century + yy if (century + yy) <= cur_year else century - 100 + yy

    try:
        return datetime(year, mm, dd).strftime("%d %b %Y")
    except ValueError:
        return yyMMdd


def _fix_digits(s: str) -> str:
    """Disambiguates letters misread by OCR in numeric MRZ fields."""
    subs = {"O": "0", "Q": "0", "D": "0", "I": "1", "L": "1", "Z": "2", "S": "5", "B": "8"}
    return "".join(subs.get(c, c) for c in s.upper())


def _fix_alpha(s: str) -> str:
    """Disambiguates digits misread by OCR in alphabetic MRZ fields."""
    subs = {"0": "O", "1": "I", "2": "Z", "5": "S", "8": "B"}
    return "".join(subs.get(c, c) for c in s.upper())


def _normalize_line_len(line: str, expected_len: int) -> str:
    """Pads or trims line to expected MRZ standard length (e.g. 44 for TD3, 30 for TD1)."""
    cleaned = line.strip().upper().replace(" ", "")
    if len(cleaned) < expected_len:
        cleaned = cleaned + "<" * (expected_len - len(cleaned))
    elif len(cleaned) > expected_len:
        cleaned = cleaned[:expected_len]
    return cleaned


def _strip_padding_artifacts(value: str) -> str:
    """Removes trailing single-character OCR misread artifacts (e.g. '<' misread as 'K' or 'X')."""
    tokens = value.split()
    while len(tokens) > 1 and len(set(tokens[-1])) == 1:
        tokens.pop()
    return " ".join(tokens)


def _clean_mrz_dict(mrz_dict: dict) -> dict:
    """Normalizes raw MRZ dictionary and adds standard formatting and checksum results."""
    cleaned = {}
    for key, value in mrz_dict.items():
        if isinstance(value, str):
            cleaned[key] = value.replace("<", " ").strip()
        else:
            cleaned[key] = value

    if cleaned.get("date_of_birth"):
        cleaned["date_of_birth"] = format_mrz_date(cleaned["date_of_birth"], is_expiry=False)
    if cleaned.get("expiration_date"):
        cleaned["expiration_date"] = format_mrz_date(cleaned["expiration_date"], is_expiry=True)
    if cleaned.get("names"):
        cleaned["names"] = _strip_padding_artifacts(cleaned["names"])
    if cleaned.get("surname"):
        cleaned["surname"] = _strip_padding_artifacts(cleaned["surname"])

    # Extract or evaluate check digit validations
    validations = {
        "valid_number": bool(mrz_dict.get("valid_number", False)),
        "valid_date_of_birth": bool(mrz_dict.get("valid_date_of_birth", False)),
        "valid_expiration_date": bool(mrz_dict.get("valid_expiration_date", False)),
        "valid_composite": bool(mrz_dict.get("valid_composite", False)),
    }
    all_valid = all(validations.values())
    cleaned["icao_checksums"] = validations
    cleaned["checksums_passed"] = all_valid

    return cleaned


def preprocess_clahe(image_path: str) -> str:
    """Adaptive CLAHE contrast enhancement for low-light, skewed, or glare-affected MRZ zones.
    Standardizes resolution and boosts black-on-white text readability."""
    img = cv2.imread(image_path)
    if img is None:
        return image_path

    h, w = img.shape[:2]
    # Scale up if image is low-resolution
    if max(h, w) < 1400:
        scale = 1400.0 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    filtered = cv2.bilateralFilter(enhanced, 5, 50, 50)

    save_path = image_path.rsplit(".", 1)[0] + "_clahe.jpg"
    cv2.imwrite(save_path, filtered)
    return save_path


def _parse_td3_lines(line1: str, line2: str) -> dict | None:
    """Parses standard 2-line ICAO Doc 9303 TD3 (Passport) MRZ strings with optical correction."""
    l1 = _normalize_line_len(line1, 44)
    l2 = _normalize_line_len(line2, 44)

    doc_type = l1[0:2].replace("<", "")
    country = _fix_alpha(l1[2:5].replace("<", ""))
    names_part = l1[5:]
    if "<<" in names_part:
        surname, given_names = names_part.split("<<", 1)
    else:
        surname, given_names = names_part, ""

    doc_num_raw = l2[0:9].replace("<", "")
    num_check = _fix_digits(l2[9:10])
    nat = _fix_alpha(l2[10:13].replace("<", ""))
    dob = _fix_digits(l2[13:19])
    dob_check = _fix_digits(l2[19:20])
    sex = l2[20:21].replace("<", "X")
    expiry = _fix_digits(l2[21:27])
    expiry_check = _fix_digits(l2[27:28])
    composite_check = _fix_digits(l2[43:44])

    # Validate check digits
    valid_num = num_check.isdigit() and (icao_check_digit(l2[0:9]) == int(num_check))
    valid_dob = dob_check.isdigit() and (icao_check_digit(dob) == int(dob_check))
    valid_exp = expiry_check.isdigit() and (icao_check_digit(expiry) == int(expiry_check))
    composite_data = l2[0:10] + l2[13:20] + l2[21:43]
    valid_comp = composite_check.isdigit() and (icao_check_digit(composite_data) == int(composite_check))

    return {
        "type": doc_type or "P",
        "country": country,
        "surname": _strip_padding_artifacts(_fix_alpha(surname.replace("<", " ")).strip()),
        "names": _strip_padding_artifacts(_fix_alpha(given_names.replace("<", " ")).strip()),
        "number": doc_num_raw,
        "nationality": nat,
        "date_of_birth": format_mrz_date(dob, is_expiry=False),
        "sex": sex,
        "expiration_date": format_mrz_date(expiry, is_expiry=True),
        "valid_number": valid_num,
        "valid_date_of_birth": valid_dob,
        "valid_expiration_date": valid_exp,
        "valid_composite": valid_comp,
        "icao_checksums": {
            "valid_number": valid_num,
            "valid_date_of_birth": valid_dob,
            "valid_expiration_date": valid_exp,
            "valid_composite": valid_comp,
        },
        "checksums_passed": valid_num and valid_dob and valid_exp and valid_comp,
        "valid_score": 100 if (valid_num and valid_dob and valid_exp) else 75,
    }


def extract_mrz_fallback_tesseract(image_path: str) -> dict | None:
    """Secondary MRZ parsing engine using localized bottom-crop OCR with ICAO regex matching.
    Provides bulletproof redundancy if PassportEye fails on unusual crops or camera angles."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None

        h, w = img.shape[:2]
        # Crop bottom 35% where MRZ is located on standard ID documents
        mrz_crop = img[int(h * 0.65) :, :]

        gray = cv2.cvtColor(mrz_crop, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Scale up crop for optimal Tesseract OCR font recognition
        scaled = cv2.resize(enhanced, None, fx=1.8, fy=1.8, interpolation=cv2.INTER_CUBIC)
        thresh = cv2.threshold(scaled, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        # Extract text with single uniform block PSM and ICAO character whitelist
        config = "--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<"
        ocr_text = pytesseract.image_to_string(thresh, config=config)

        raw_lines = [line.strip().replace(" ", "") for line in ocr_text.splitlines() if line.strip()]
        # Filter lines that look like MRZ rows (contain chevrons and length between 28 and 48)
        mrz_candidate_lines = [l for l in raw_lines if "<" in l and 28 <= len(l) <= 48]

        # Check for 2-line TD3 (approx 44 chars)
        for i in range(len(mrz_candidate_lines) - 1):
            l1, l2 = mrz_candidate_lines[i], mrz_candidate_lines[i + 1]
            if 38 <= len(l1) <= 48 and 38 <= len(l2) <= 48:
                parsed = _parse_td3_lines(l1, l2)
                if parsed:
                    return parsed

        return None
    except Exception:
        return None


def extract_mrz(image_path: str) -> dict | None:
    """Finds and parses an ICAO 9303 Machine Readable Zone using primary & fallback engines."""
    # 1. Primary engine: PassportEye
    try:
        mrz = read_mrz(image_path)
        if mrz:
            res = _clean_mrz_dict(mrz.to_dict())
            if res.get("valid_score", 0) >= 60:
                return res
    except Exception:
        pass

    # 2. Try with CLAHE enhancement
    prep_path = None
    try:
        prep_path = preprocess_clahe(image_path)
        mrz_prep = read_mrz(prep_path)
        if mrz_prep:
            res = _clean_mrz_dict(mrz_prep.to_dict())
            return res
    except Exception:
        pass
    finally:
        if prep_path and os.path.exists(prep_path) and prep_path != image_path:
            try:
                os.remove(prep_path)
            except OSError:
                pass

    # 3. Dedicated Tesseract bottom-crop fallback
    return extract_mrz_fallback_tesseract(image_path)


def extract_text(image_path: str) -> str:
    """Run full-page OCR over the document with automatic page segmentation."""
    try:
        img = Image.open(image_path)
        return pytesseract.image_to_string(img, config="--psm 3")
    except Exception as e:
        return f"[OCR text extraction error: {e}]"


def classify_document(raw_text: str, mrz_data: dict | None) -> str:
    """Intelligently classifies document category across international & Indian credentials."""
    upper_text = raw_text.upper()

    if mrz_data:
        mrz_type = str(mrz_data.get("type", "")).upper()
        if "P" in mrz_type:
            return "PASSPORT (ICAO 9303 TD3)"
        elif "I" in mrz_type or "A" in mrz_type or "C" in mrz_type:
            return "NATIONAL IDENTITY CARD (MRZ TD1/TD2)"
        elif "V" in mrz_type:
            return "VISA / RESIDENCE PERMIT"

    # Specific credential pattern detection
    if "DRIVING LICENCE" in upper_text or "DRIVER LICENSE" in upper_text or "UNION OF INDIA DRIVING" in upper_text:
        return "DRIVING LICENCE (MoRTH / MHA)"
    elif "AADHAAR" in upper_text or "UNIQUE IDENTIFICATION" in upper_text or "UIDAI" in upper_text:
        return "AADHAAR CARD (UIDAI / GOVT OF INDIA)"
    elif "INCOME TAX DEPARTMENT" in upper_text or "PERMANENT ACCOUNT NUMBER" in upper_text or "PAN CARD" in upper_text:
        return "PAN CARD (INCOME TAX DEPT)"
    elif "ELECTION COMMISSION" in upper_text or "ELECTOR PHOTO IDENTITY" in upper_text or "EPIC NO" in upper_text:
        return "VOTER IDENTITY CARD (ECI)"
    elif "PASSPORT" in upper_text or "REPUBLIC OF" in upper_text:
        return "PASSPORT / TRAVEL DOCUMENT"
    elif "IDENTITY CARD" in upper_text or "NATIONAL ID" in upper_text:
        return "NATIONAL IDENTITY CARD"

    return "OFFICIAL TRAVEL / IDENTITY CREDENTIAL"


def run_ocr_pipeline(image_path: str) -> dict:
    """Primary entry point for OCR and MRZ extraction."""
    mrz_data = extract_mrz(image_path)
    raw_text = extract_text(image_path)
    doc_type = classify_document(raw_text, mrz_data)

    return {
        "mrz": mrz_data,
        "raw_text": raw_text,
        "detected_doc_type": doc_type,
        "has_mrz": mrz_data is not None,
    }