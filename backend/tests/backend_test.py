"""Backend API tests for Lunar Coins Tebex Store (demo mode)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env
    from pathlib import Path
    env = Path("/app/frontend/.env").read_text()
    for line in env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


# ---- /api/store ----
class TestStore:
    def test_store_returns_200_and_demo_packages(self):
        r = requests.get(f"{API}/store", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("demo") is True
        pkgs = data.get("packages", [])
        assert isinstance(pkgs, list)
        assert len(pkgs) == 6, f"expected 6 packages, got {len(pkgs)}"
        for p in pkgs:
            for k in ("id", "name", "coins", "image", "price", "currency"):
                assert k in p, f"missing key {k} in package {p}"
            assert p["currency"] == "EUR"
            assert isinstance(p["price"], (int, float)) and p["price"] > 0
        # webstore
        ws = data.get("webstore", {})
        assert ws.get("name") == "Lunar Coins"

    def test_store_ids_are_demo_prefixed(self):
        r = requests.get(f"{API}/store", timeout=20)
        ids = [p["id"] for p in r.json()["packages"]]
        assert all(str(i).startswith("demo-") for i in ids)


# ---- /api/basket/create ----
class TestBasketCreate:
    def test_basket_create_returns_demo(self):
        payload = {"complete_url": "https://example.com/?tebex_return=1", "cancel_url": "https://example.com/"}
        r = requests.post(f"{API}/basket/create", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("demo") is True

    def test_basket_create_validation_error(self):
        r = requests.post(f"{API}/basket/create", json={}, timeout=15)
        assert r.status_code in (400, 422)


# ---- /api/basket/add ----
class TestBasketAdd:
    def test_basket_add_returns_clean_400_in_demo(self):
        payload = {"ident": "fake-ident", "items": [{"package_id": "demo-1", "quantity": 1}]}
        r = requests.post(f"{API}/basket/add", json=payload, timeout=20)
        assert r.status_code == 400, f"expected 400 (demo), got {r.status_code}: {r.text}"
        # Must be JSON, not HTML gateway page
        ct = r.headers.get("content-type", "")
        assert "application/json" in ct, f"expected JSON, got {ct}"
        data = r.json()
        assert "detail" in data
        assert "Demo" in data["detail"] or "Tebex" in data["detail"]


# ---- root ----
class TestRoot:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "Lunar" in r.json().get("message", "")
