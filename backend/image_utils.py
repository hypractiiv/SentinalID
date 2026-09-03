# backend/utils/image_utils.py
import os
from PIL import Image

MAX_DIMENSION = 1500  # long edge, in pixels


def downscale_image(image_path: str, max_dimension: int = MAX_DIMENSION) -> str:
    """Resizes an image so its longest edge is at most max_dimension,
    preserving aspect ratio. Skips resizing if already smaller.
    Returns the path to use going forward (may be the same path, or a
    new '_resized' file)."""
    img = Image.open(image_path)
    width, height = img.size
    longest_edge = max(width, height)

    if longest_edge <= max_dimension:
        return image_path  # already small enough, no work needed

    scale = max_dimension / longest_edge
    new_size = (int(width * scale), int(height * scale))
    resized = img.convert("RGB").resize(new_size, Image.LANCZOS)

    base, ext = os.path.splitext(image_path)
    resized_path = f"{base}_resized.jpg"
    resized.save(resized_path, format="JPEG", quality=90)
    return resized_path