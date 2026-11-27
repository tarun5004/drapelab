from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from backend.app.features.setup.routes import router as setup_router
from backend.app.features.try_on.routes import router as try_on_router
from backend.app.settings import FRONTEND

app = FastAPI(title="DrapeLab")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "[::1]"])
app.include_router(setup_router)
app.include_router(try_on_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
