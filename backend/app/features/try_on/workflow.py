from pathlib import Path
from typing import TypedDict
from uuid import uuid4

import httpx
from langgraph.graph import END, START, StateGraph

from backend.app.features.try_on.images import normalize_image
from backend.app.features.try_on.providers import ImageInputs, fashn, gemini, sample
from backend.app.features.try_on.schemas import Shot


class State(TypedDict, total=False):
    shot: Shot
    images: ImageInputs
    key: str
    directory: Path
    output: bytes
    prediction: str | None
    result_id: str


def render(state: State):
    provider = state["shot"].provider
    if provider == "sample":
        output, prediction = sample(state["shot"])
    else:
        adapter = fashn if provider == "fashn" else gemini
        with httpx.Client(timeout=105) as client:
            output, prediction = adapter(client, state["key"], state["shot"], state["images"])
    return {"output": output, "prediction": prediction}


def save(state: State):
    identifier = uuid4().hex
    path = state["directory"] / f"{identifier}.webp"

    path.write_bytes(normalize_image(state["output"], format="WEBP"))
    return {"result_id": identifier}


builder = StateGraph(State)
builder.add_node("render", render)
builder.add_node("save", save)
builder.add_edge(START, "render")
builder.add_edge("render", "save")
builder.add_edge("save", END)
workflow = builder.compile()
