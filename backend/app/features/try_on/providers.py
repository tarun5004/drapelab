import base64
import time
from typing import TypedDict

import httpx

from backend.app.features.try_on.schemas import Shot, shot_instructions
from backend.app.settings import FRONTEND, GEMINI_MODEL


class ProviderError(Exception):
    pass


class ImageInputs(TypedDict):
    garment: bytes
    model: bytes
    pose: bytes | None


def data_uri(image: bytes) -> str:
    return "data:image/jpeg;base64," + base64.b64encode(image).decode("ascii")


def fashn(client: httpx.Client, key: str, shot: Shot, images: ImageInputs) -> tuple[bytes, str]:
    headers = {"Authorization": f"Bearer {key}"}
    inputs = {
        "product_image": data_uri(images["garment"]),
        "face_reference": data_uri(images["model"]),
        "face_reference_mode": "match_base",
        "prompt": shot_instructions(shot),
        "aspect_ratio": shot.crop,
        "resolution": "1k",
        "generation_mode": "fast",
        "num_images": 1,
        "return_base64": True,
    }
    if images["pose"]:
        inputs["image_prompt"] = data_uri(images["pose"])
    url = "https://api.fashn.ai/v1"
    submitted = client.post(f"{url}/run", headers=headers, json={"model_name": "product-to-model", "inputs": inputs})
    submitted.raise_for_status()
    prediction = submitted.json().get("id")
    if not prediction:
        raise ProviderError("FASHN did not return a prediction ID.")
    deadline = time.monotonic() + 100
    while time.monotonic() < deadline:
        status = client.get(f"{url}/status/{prediction}", headers=headers)
        status.raise_for_status()
        result = status.json()
        if result["status"] == "completed":
            output = result.get("output") or []
            if output and output[0].startswith("data:image/"):
                return base64.b64decode(output[0].split(",", 1)[1], validate=True), prediction
            raise ProviderError("FASHN returned no downloadable image.")
        if result["status"] in {"failed", "canceled", "cancelled"}:
            raise ProviderError(f"FASHN generation failed. Prediction ID: {prediction}")
        time.sleep(2)
    raise ProviderError(f"FASHN did not finish in time. Check prediction {prediction} before retrying.")


def gemini(client: httpx.Client, key: str, shot: Shot, images: ImageInputs) -> tuple[bytes, str | None]:
    parts = [{"text": shot_instructions(shot)}]
    for role, image in images.items():
        if image:
            parts.extend([
                {"text": f"{role.title()} reference:"},
                {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(image).decode("ascii")}},
            ])
    response = client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
        headers={"x-goog-api-key": key},
        json={
            "contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": shot.crop}},
        },
    )
    response.raise_for_status()
    result = response.json()
    for candidate in result.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if part.get("inlineData", {}).get("data"):
                return base64.b64decode(part["inlineData"]["data"], validate=True), result.get("responseId")
    raise ProviderError("Gemini returned no image. Check the references or provider limits.")


def sample(shot: Shot) -> tuple[bytes, None]:
    files = {"front": "cam-front.webp", "back": "cam-back.webp", "detail": "f-coat-detail.webp"}
    return (FRONTEND / "assets" / files.get(shot.angle, "cam-side.webp")).read_bytes(), None
