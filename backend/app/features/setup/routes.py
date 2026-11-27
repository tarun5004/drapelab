import os
from typing import Literal

from fastapi import APIRouter

router = APIRouter(prefix="/api")
Provider = Literal["sample", "fashn", "gemini"]
KEY_VARIABLES = {"fashn": "FASHN_API_KEY", "gemini": "GEMINI_API_KEY"}


def provider_key(provider: Provider, supplied: str | None = None) -> str:
    variable = KEY_VARIABLES.get(provider)
    return (supplied or (os.getenv(variable, "") if variable else "")).strip()


@router.get("/providers")
def providers():
    return {"configured": {name: bool(provider_key(name)) for name in KEY_VARIABLES}}
