from typing import Literal

from pydantic import BaseModel

from backend.app.features.setup.routes import Provider

Angle = Literal["front", "back", "left", "right", "three-quarter", "detail"]


class Shot(BaseModel):
    provider: Provider
    angle: Angle
    pose: Literal["standing", "walking", "seated", "reference"]
    background: Literal["studio", "outdoor", "interior"]
    crop: Literal["1:1", "3:4", "4:5", "9:16"]
    model: str


def shot_instructions(shot: Shot) -> str:
    return (
        f"Create one fashion catalog photograph, {shot.angle} view, {shot.crop} aspect ratio. "
        f"Use a {shot.pose} pose and a clean {shot.background} setting. "
        "Put the referenced garment on the referenced person. Preserve color, seams, "
        "cut, print, and logo placement. A pose reference guides body position only. "
        "Return the photograph without captions or decorative text."
    )
