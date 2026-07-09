"""Backend API tests for Lunar Coins Tebex Store (LIVE mode with valid Tebex public token)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    from pathlib import Path
    env = Path("/app/frontend/.env").read_text()
    for line in env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

EXPECTED_COINS_PRICE = [
    (475, 4.99),
    (1000, 9.99),
    (2050, 19.99),
    (3650, 34.99),
    (5350, 49.99),
    (11000, 99.99),
    (27500, 249.99),
]


# ---- /api/store (LIVE) ----
class TestStore:
    def test_store_live_7_packages(self):
        r = requests.get(f"{API}/store", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("demo") is False, "expected LIVE mode (demo=false)"
        ws = data.get("webstore", {})
        assert ws.get("name") == "Lunar"
        pkgs = data.get("packages", [])
        assert len(pkgs) == 7, f"expected 7 real packages, got {len(pkgs)}"
        for p in pkgs:
            for k in ("id", "name", "coins", "image", "price", "currency"):
                assert k in p, f"missing key {k}"
            assert p["currency"] == "EUR"
            assert isinstance(p["price"], (int, float)) and p["price"] > 0
            # Real Tebex image URLs
            assert "dunb17ur4ymx4.cloudfront.net" in p["image"], f"expected real Tebex image, got {p['image']}"
            # ids should be numeric (real Tebex package ids)
            assert isinstance(p["id"], int)

    def test_store_coin_price_map(self):
        r = requests.get(f"{API}/store", timeout=20)
        pkgs = r.json()["packages"]
        got = sorted([(p["coins"], round(float(p["price"]), 2)) for p in pkgs], key=lambda x: x[1])
        assert got == EXPECTED_COINS_PRICE, f"coin/price mismatch: {got}"


# ---- /api/sidebar (LIVE) ----
class TestSidebar:
    def test_sidebar_modules(self):
        r = requests.get(f"{API}/sidebar", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "modules" in data
        modules = data["modules"]
        assert isinstance(modules, list) and len(modules) > 0
        types = {m.get("type") for m in modules}
        assert "top_customer" in types, f"missing top_customer module; got {types}"
        assert "recent_payments" in types, f"missing recent_payments module; got {types}"


# ---- /api/basket/create (LIVE) ----
class TestBasketCreate:
    def test_basket_create_live(self):
        payload = {"complete_url": "https://example.com/?tebex_return=1",
                   "cancel_url": "https://example.com/"}
        r = requests.post(f"{API}/basket/create", json=payload, timeout=25)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("demo") is False
        assert data.get("ident"), "missing ident"
        auth_urls = data.get("auth_urls") or []
        assert len(auth_urls) > 0, "auth_urls empty"
        first = auth_urls[0]
        assert "url" in first
        assert "tebex.io" in first["url"], f"auth url not tebex.io: {first['url']}"

    def test_basket_create_validation_error(self):
        r = requests.post(f"{API}/basket/create", json={}, timeout=15)
        assert r.status_code in (400, 422)


# ---- root ----
class TestRoot:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "Lunar" in r.json().get("message", "")
