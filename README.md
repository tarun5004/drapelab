# DrapeLab

A local-first fashion studio. Build a shot list from garment photos, choose a model, preview the cost, and compare or download each result. The laptop runs the app and a hosted provider handles real image generation.

## Quick start

From the repository root, use Python 3.12 or newer:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

On Windows, use `py -m venv .venv` and substitute `.venv\Scripts\python.exe` for `.venv/bin/python`.

Open http://127.0.0.1:8000/studio.html. Select **Sample mode** to try the flow without an account, key, or GPU. Generated examples in this mode are prepared images. For the original static homepage demo alone, use `python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend`.

## Real generation

1. Create an API key in [FASHN](https://app.fashn.ai/) or [Google AI Studio](https://aistudio.google.com/apikey) and check provider billing.
2. Choose the same provider in Studio and enter its key in the password field. The field is kept only in the current tab. Alternatively, set `FASHN_API_KEY` or `GEMINI_API_KEY` in the backend process environment.
3. Add a front photo and optional matching back, side, or detail photos. Choose one of eight references or upload a person photo you can use. Add shots with angles, poses, backgrounds, and crops.
4. Review the provider usage note, confirm that references may be sent to the selected provider, then generate. Compare and download each result. A retry is a separate provider request.

FASHN uses Product to Model with face and optional pose references. Its credit estimate assumes fast 1K output with a face reference. Gemini uses `gemini-3.1-flash-image` by default, configurable with `DRAPELAB_GEMINI_MODEL`. Check provider pricing and availability before generating. Angle and pose requests guide the model. Results need garment-detail review, especially when a matching view is missing.

The backend binds to localhost in this setup and is intended for one user. Output images are saved to `.drapelab/` by default. Reference uploads are processed in memory and sent to the selected provider for live generation. Provider retention rules apply. No payments are collected by DrapeLab.

## Where to edit

| Change | Path |
| --- | --- |
| Homepage | `frontend/index.html` |
| Shot builder and provider form | `frontend/studio.html`, `frontend/features/studio/shoot.js` |
| Local API entry point | `backend/app/main.py` |
| Provider key configuration | `backend/app/features/setup/routes.py` |
| Shot validation and image limits | `backend/app/features/try_on/routes.py`, `schemas.py`, `images.py` |
| LangGraph workflow and API adapters | `backend/app/features/try_on/workflow.py`, `providers.py` |

Run the backend tests from the repo root with `python -m unittest discover -s tests -v` after installing the requirements. They cover sample endpoints and provider contracts using simulated responses.

The MIT license covers DrapeLab code. Modelfy example photos and bundled fonts have separate terms. Font licenses are under `frontend/assets/fonts`.
