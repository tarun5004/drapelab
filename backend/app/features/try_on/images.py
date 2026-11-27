from io import BytesIO

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = 24_000_000


def normalize_image(raw: bytes, *, format: str = "JPEG") -> bytes:
    with Image.open(BytesIO(raw), formats=("JPEG", "PNG", "WEBP")) as source:
        if source.width * source.height > Image.MAX_IMAGE_PIXELS:
            raise ValueError("Image exceeds the pixel limit.")
        image = ImageOps.exif_transpose(source).convert("RGB")
        if min(image.size) < 32:
            raise ValueError("Image must be at least 32 × 32 pixels.")
        image.thumbnail((1600, 1600))
        output = BytesIO()
        image.save(output, format, quality=92)
        return output.getvalue()
