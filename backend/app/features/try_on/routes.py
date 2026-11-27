from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError
from pydantic import ValidationError

from backend.app.features.setup.routes import provider_key
from backend.app.features.try_on.images import normalize_image
from backend.app.features.try_on.providers import ProviderError
from backend.app.features.try_on.schemas import Shot
from backend.app.features.try_on.workflow import workflow
from backend.app.settings import DATA_DIR, FRONTEND

router = APIRouter(prefix="/api")
MODELS = {
    "Avery": "m-pk-woman.webp",
    "Jordan": "m-black-man.webp",
    "Mina": "m-asian-woman.webp",
    "Ari": "m-pk-man.webp",
    "Ellis": "m-white-woman.webp",
    "Sage": "s9-denim-woman.webp",
    "Rowan": "s8b-denim-man.webp",
    "Remy": "s6-coat-asian.webp",
}
MAX_BYTES = 12 * 1024 * 1024


def read_upload(upload: UploadFile, role: str) -> bytes:
    raw = upload.file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, f"{role} photo exceeds 12 MiB.")
    try:
        return normalize_image(raw)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, ValueError):
        raise HTTPException(422, f"{role} must be a valid JPG, PNG or WebP between 32 × 32 px and 24 megapixels.") from None


@router.get("/models")
def models():
    return [{"id": name, "image": f"/assets/{file}"} for name, file in MODELS.items()]


@router.post("/shots")
def create_shot(
    brief: Annotated[str, Form(max_length=2000)],
    garment: Annotated[UploadFile, File()],
    model_photo: Annotated[UploadFile | None, File()] = None,
    pose_photo: Annotated[UploadFile | None, File()] = None,
    drapelab_key: Annotated[str | None, Header(max_length=1024)] = None,
):
    try:
        shot = Shot.model_validate_json(brief)
    except ValidationError:
        raise HTTPException(422, "The selected shot settings are invalid.") from None
    key = provider_key(shot.provider, drapelab_key)
    if shot.provider != "sample" and not key:
        raise HTTPException(400, "Enter the selected provider's API key first.")
    if shot.model == "uploaded" and model_photo:
        model_image = read_upload(model_photo, "Model")
    elif shot.model in MODELS:
        model_image = normalize_image((FRONTEND / "assets" / MODELS[shot.model]).read_bytes())
    else:
        raise HTTPException(422, "Select a built-in model or upload a person photo.")
    if shot.pose == "reference" and not pose_photo:
        raise HTTPException(422, "Upload a pose reference for this shot.")
    images = {
        "garment": read_upload(garment, "Garment"),
        "model": model_image,
        "pose": read_upload(pose_photo, "Pose") if shot.pose == "reference" and pose_photo else None,
    }
    DATA_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        result = workflow.invoke({"shot": shot, "images": images, "key": key, "directory": DATA_DIR})
    except ProviderError as exc:
        raise HTTPException(502, str(exc)) from None
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in (401, 403):
            raise HTTPException(400, "The provider rejected this key or the selected model is unavailable for your account.") from None
        if status in (402, 429):
            raise HTTPException(429, "Check provider billing, quota or rate limits before retrying.") from None
        raise HTTPException(502, "The provider rejected the generation request.") from None
    except (httpx.RequestError, ValueError, OSError, KeyError, TypeError):
        raise HTTPException(502, "Generation could not be confirmed. Check the provider dashboard before retrying.") from None
    return {
        "image": f"/api/results/{result['result_id']}",
        "sample": shot.provider == "sample",
        "prediction": result["prediction"],
    }


@router.get("/results/{result_id}")
def get_result(result_id: UUID):
    path = DATA_DIR / f"{result_id.hex}.webp"
    if not path.is_file():
        raise HTTPException(404, "Result not found.")
    return FileResponse(path, media_type="image/webp", headers={"Cache-Control": "no-store"})
