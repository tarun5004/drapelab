import base64
from io import BytesIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient
from PIL import Image

from backend.app.main import app
from backend.app.features.try_on import providers
from backend.app.features.try_on.schemas import Shot


def photo():
    data = BytesIO()
    Image.new("RGB", (64, 64), "tan").save(data, "JPEG")
    return data.getvalue()


def brief(**overrides):
    return {
        "provider": "sample", "angle": "back", "pose": "standing",
        "background": "studio", "crop": "4:5", "model": "Avery", **overrides,
    }


class StudioTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, base_url="http://localhost")
        self.addCleanup(self.client.close)
        data = TemporaryDirectory()
        self.addCleanup(data.cleanup)
        directory = patch("backend.app.features.try_on.routes.DATA_DIR", Path(data.name))
        directory.start()
        self.addCleanup(directory.stop)

    def submit(self, settings, image=None, **references):
        files = {"garment": ("shirt.jpg", photo() if image is None else image, "image/jpeg")}
        files.update({name: (name + ".jpg", value, "image/jpeg") for name, value in references.items()})
        return self.client.post("/api/shots", data={"brief": json.dumps(settings)}, files=files, headers={"X-DrapeLab": "studio"})

    def test_sample_round_trip_with_custom_model_and_pose(self):
        self.assertEqual(len(self.client.get("/api/models").json()), 8)
        self.assertEqual(self.client.get("/studio.html").status_code, 200)
        response = self.submit(brief(model="uploaded", pose="reference"), model_photo=photo(), pose_photo=photo())
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["sample"])
        image = self.client.get(response.json()["image"])
        self.assertEqual(image.headers["content-type"], "image/webp")
        self.assertGreater(len(image.content), 100)

    def test_invalid_requests_and_missing_key(self):
        self.assertEqual(self.submit(brief(), image=b"invalid").status_code, 422)
        self.assertEqual(self.submit(brief(pose="reference")).status_code, 422)
        with patch.dict("os.environ", {"FASHN_API_KEY": ""}):
            self.assertEqual(self.submit(brief(provider="fashn")).status_code, 400)

    def test_fashn_contract(self):
        raw = photo()
        calls = []

        def handler(request):
            calls.append(request)
            if request.method == "POST":
                return httpx.Response(200, json={"id": "prediction-1"})
            return httpx.Response(200, json={"status": "completed", "output": [providers.data_uri(raw)]})

        shot = Shot(**brief(provider="fashn", pose="reference"))
        with httpx.Client(transport=httpx.MockTransport(handler)) as client:
            self.assertEqual(providers.fashn(client, "fake-key", shot, {"garment": raw, "model": raw, "pose": raw}), (raw, "prediction-1"))
        payload = json.loads(calls[0].content)
        self.assertEqual(payload["model_name"], "product-to-model")
        self.assertIn("image_prompt", payload["inputs"])
        self.assertIn("back view", payload["inputs"]["prompt"])
        self.assertEqual(calls[1].url.path, "/v1/status/prediction-1")

    def test_gemini_contract(self):
        raw = photo()

        def handler(request):
            self.assertEqual(request.headers["x-goog-api-key"], "fake-key")
            payload = json.loads(request.content)
            self.assertEqual(payload["generationConfig"]["imageConfig"]["aspectRatio"], "4:5")
            self.assertEqual(sum("inline_data" in part for part in payload["contents"][0]["parts"]), 3)
            response = {"candidates": [{"content": {"parts": [{"inlineData": {"data": base64.b64encode(raw).decode()}}]}}]}
            return httpx.Response(200, json=response)

        with httpx.Client(transport=httpx.MockTransport(handler)) as client:
            self.assertEqual(providers.gemini(client, "fake-key", Shot(**brief(provider="gemini")), {"garment": raw, "model": raw, "pose": raw}), (raw, None))


if __name__ == "__main__":
    unittest.main()
