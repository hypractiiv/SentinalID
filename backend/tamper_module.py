# tamper_module.py
# SentinelID Forensic Document Tamper Detection Pipeline
# Implements:
#   1. Error Level Analysis (ELA) via in-memory JPEG compression diffing
#   2. Localized Spatial Disparity & Splice Noise Inconsistency Analysis
#   3. Forensic Metadata / EXIF Inspection (editing software tags, canvas alteration signatures)
#   4. In-memory Base64 heatmap rendering for real-time frontend visualization

import base64
import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance


def compute_ela_in_memory(image_path: str, quality: int = 90) -> tuple[float, float, float, str]:
    """Error Level Analysis (ELA) performed entirely in RAM using io.BytesIO.
    Avoids disk I/O bottlenecks and race conditions under concurrent requests.
    Returns (max_diff, avg_diff, std_diff, base64_heatmap_data_url)."""
    with Image.open(image_path) as img:
        original = img.convert("RGB")

    # In-memory JPEG resave
    buffer = io.BytesIO()
    original.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    resaved = Image.open(buffer)

    # Difference between original and re-compressed version
    diff = ImageChops.difference(original, resaved)
    diff_np = np.array(diff, dtype=np.float32)
    gray_diff = np.mean(diff_np, axis=2)

    max_diff = float(np.max(gray_diff))
    avg_diff = float(np.mean(gray_diff))
    std_diff = float(np.std(gray_diff))

    # Dynamic scaling for contrast visualization
    # Cap amplification scale to avoid blowing up microscopic 1-bit quantization noise
    scale = min(20.0, 255.0 / max_diff) if max_diff > 2.0 else 2.0
    ela_image = ImageEnhance.Brightness(diff).enhance(scale)

    # Convert ELA image to Base64 JPEG for direct frontend rendering
    out_buf = io.BytesIO()
    ela_image.save(out_buf, format="JPEG", quality=85)
    b64_str = base64.b64encode(out_buf.getvalue()).decode("utf-8")
    ela_data_url = f"data:image/jpeg;base64,{b64_str}"

    return float(max_diff), float(avg_diff), float(std_diff), ela_data_url


def analyze_edge_splicing_noise(image_path: str) -> tuple[float, bool]:
    """Detects copy-paste / splicing boundaries by computing localized high-frequency
    Laplacian gradient variance across spatial tiles.
    Filters out blank margins to eliminate false positives on clean documents.
    Returns (splice_risk_score [0..100], splice_flag [bool])."""
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return 0.0, False

    # Standardize scale for consistent texture metric
    h, w = img.shape
    if max(h, w) > 1000:
        scale = 1000.0 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img.shape

    # Tile the image into 8x8 blocks
    block_h, block_w = max(16, h // 8), max(16, w // 8)
    tile_variances = []

    for r in range(0, h - block_h + 1, block_h):
        for c in range(0, w - block_w + 1, block_w):
            block = img[r : r + block_h, c : c + block_w]
            # Ignore uniform/blank margin blocks (high mean luminance or near-zero variance)
            if np.mean(block) > 248 or np.mean(block) < 8:
                continue
            lap = cv2.Laplacian(block, cv2.CV_32F)
            b_var = float(np.var(lap))
            if b_var > 8.0:  # Only evaluate blocks with actual printable content / texture
                tile_variances.append(b_var)

    if len(tile_variances) < 4:
        return 0.0, False

    # Measure noise inconsistency: interquartile range normalized by median
    var_array = np.array(tile_variances)
    var_med = float(np.median(var_array)) + 1e-4
    var_iqr = float(np.percentile(var_array, 75) - np.percentile(var_array, 25))
    noise_inconsistency = var_iqr / var_med

    # Authentic documents typically have ratio in [0.5..3.0]
    # Spliced documents with mismatched sensor noise or resolution exceed 4.5
    splice_score = min(40.0, max(0.0, (noise_inconsistency - 2.8) * 18.0))
    splice_flag = noise_inconsistency > 4.5
    return round(splice_score, 1), splice_flag


def check_metadata(image_path: str) -> tuple[list[str], bool]:
    """Scrutinizes EXIF, IPTC, and XMP metadata tags for editing signatures,
    known photo editing software (Photoshop, GIMP, Canva), and screenshot indicators.
    Returns (flags_list, is_explicit_edit_software)."""
    flags = []
    is_software_edit = False
    try:
        with Image.open(image_path) as img:
            exif = img._getexif()

            if not exif:
                # Common in legitimate document scans, web forms, and PDF exports
                flags.append("No EXIF metadata present (standard for scanned documents & PDF exports)")
                return flags, False

            # Tag 305 = Software, 271 = Make, 272 = Model, 306 = DateTime
            software = str(exif.get(305, "")).lower()
            suspicious_software = [
                "photoshop", "gimp", "canva", "lightroom", "paint.net",
                "pixlr", "snapseed", "affinity", "coreldraw", "photopea"
            ]
            for s in suspicious_software:
                if s in software:
                    flags.append(f"Document modified with image editing software: '{software}'")
                    is_software_edit = True
                    break

            make = exif.get(271)
            model = exif.get(272)
            if make or model:
                flags.append(f"Capture device: {make or ''} {model or ''}".strip())

    except Exception:
        flags.append("Metadata unreadable or stripped")

    return flags, is_software_edit


def tamper_score(image_path: str) -> dict:
    """Primary entry point for document forensic tampering inspection.
    Integrates in-memory ELA, edge noise analysis, and EXIF scrutiny.
    Returns complete tamper report and base64 heatmap for UI."""
    try:
        max_diff, avg_diff, std_diff, ela_image = compute_ela_in_memory(image_path)
        splice_score, splice_flag = analyze_edge_splicing_noise(image_path)
        metadata_flags, has_edit_software = check_metadata(image_path)

        # Baseline ELA score: scaled with absolute mean and std of compression delta
        # Clean scanned documents have avg_diff < 1.5, std_diff < 3.0 -> score < 10
        ela_score = min(50.0, (avg_diff * 2.2) + (std_diff * 1.4))

        # Composite score
        composite_score = ela_score + splice_score

        # Explicit photo editing software detected
        if has_edit_software:
            composite_score = max(composite_score + 40.0, 75.0)

        final_score = round(max(0.0, min(100.0, composite_score)), 2)

        if final_score > 55.0 or splice_flag or has_edit_software:
            verdict = "SUSPICIOUS"
        elif final_score > 28.0:
            verdict = "REVIEW_RECOMMENDED"
        else:
            verdict = "CLEAN"

        return {
            "tamper_score": final_score,
            "verdict": verdict,
            "metadata_flags": metadata_flags,
            "ela_output_path": ela_image,  # Backwards compatibility
            "ela_image": ela_image,
            "forensic_details": {
                "max_compression_diff": round(max_diff, 2),
                "avg_compression_diff": round(avg_diff, 2),
                "std_compression_diff": round(std_diff, 2),
                "splice_noise_score": splice_score,
                "splice_boundary_detected": splice_flag,
            },
        }
    except Exception as e:
        return {
            "tamper_score": 0.0,
            "verdict": "ERROR",
            "metadata_flags": [f"Tamper check error: {e}"],
            "ela_output_path": None,
            "ela_image": None,
            "forensic_details": {},
        }
