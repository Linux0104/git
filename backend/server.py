from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

TEBEX_TOKEN = os.environ.get('TEBEX_PUBLIC_TOKEN', '').strip()
HEADLESS_BASE = "https://headless.tebex.io/api"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Demo data (used when no valid Tebex public token is configured)
# ---------------------------------------------------------------------------
COIN_IMG = "https://raw.githubusercontent.com/Linux0104/banner-assets/main/coins3.png"

DEMO_PACKAGES = [
    {"id": "demo-1", "name": "1.000 Lunar Coins", "coins": 1000, "price": 4.99,
     "description": "Perfekt zum Einstieg – schnell aufladen und sofort durchstarten."},
    {"id": "demo-2", "name": "2.500 Lunar Coins", "coins": 2500, "price": 9.99,
     "description": "Der beliebte Einsteiger-Boost mit extra Coins obendrauf.", "popular": True},
    {"id": "demo-3", "name": "5.000 Lunar Coins", "coins": 5000, "price": 18.99,
     "description": "Bestes Preis-Leistungs-Verhältnis für aktive Spieler.", "best_value": True},
    {"id": "demo-4", "name": "10.000 Lunar Coins", "coins": 10000, "price": 34.99,
     "description": "Für alle, die im RP-Leben richtig aufsteigen wollen."},
    {"id": "demo-5", "name": "25.000 Lunar Coins", "coins": 25000, "price": 79.99,
     "description": "Das Paket für echte High-Roller auf dem Server."},
    {"id": "demo-6", "name": "50.000 Lunar Coins", "coins": 50000, "price": 149.99,
     "description": "Maximale Power – die ultimative Coin-Reserve."},
]


def demo_store():
    packages = []
    for p in DEMO_PACKAGES:
        packages.append({
            "id": p["id"],
            "name": p["name"],
            "coins": p.get("coins"),
            "description": p["description"],
            "image": COIN_IMG,
            "price": p["price"],
            "currency": "EUR",
            "popular": p.get("popular", False),
            "best_value": p.get("best_value", False),
        })
    return {
        "demo": True,
        "webstore": {
            "name": "Lunar Coins",
            "currency": "EUR",
            "webstore_url": "",
            "platform_type": "FiveM",
        },
        "packages": packages,
    }


def _strip_html(text: Optional[str]) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def _extract_coins(name: str) -> Optional[int]:
    m = re.search(r"([\d\.,]+)", name or "")
    if not m:
        return None
    num = m.group(1).replace(".", "").replace(",", "")
    try:
        return int(num)
    except ValueError:
        return None


async def tebex_get(path: str, params: dict | None = None):
    url = f"{HEADLESS_BASE}/accounts/{TEBEX_TOKEN}{path}"
    async with httpx.AsyncClient(timeout=15, follow_redirects=False) as c:
        r = await c.get(url, params=params, headers={"Accept": "application/json"})
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Lunar Coins API"}


@api_router.get("/store")
async def get_store():
    """Returns the webstore info + flattened coin packages. Falls back to demo data."""
    if not TEBEX_TOKEN:
        return demo_store()
    try:
        data = await tebex_get("/categories", {"includePackages": 1})
        categories = data.get("data", [])
        packages = []
        seen = set()
        for cat in categories:
            for pkg in cat.get("packages", []) or []:
                pid = pkg.get("id")
                if pid in seen:
                    continue
                seen.add(pid)
                name = pkg.get("name", "")
                packages.append({
                    "id": pid,
                    "name": name,
                    "coins": _extract_coins(name),
                    "description": _strip_html(pkg.get("description")),
                    "image": pkg.get("image") or COIN_IMG,
                    "price": pkg.get("total_price", pkg.get("base_price", 0)),
                    "currency": pkg.get("currency", "EUR"),
                    "popular": False,
                    "best_value": False,
                })
        if not packages:
            logger.warning("Tebex returned no packages, using demo store")
            return demo_store()
        # try fetch webstore meta (non-fatal)
        webstore = {"name": "Lunar Coins", "currency": packages[0]["currency"],
                    "webstore_url": "", "platform_type": "FiveM"}
        try:
            ws = await tebex_get("")
            wd = ws.get("data", {})
            webstore = {
                "name": wd.get("name", "Lunar Coins"),
                "currency": wd.get("currency", "EUR"),
                "webstore_url": wd.get("webstore_url", ""),
                "platform_type": wd.get("platform_type", "FiveM"),
            }
        except Exception:
            pass
        return {"demo": False, "webstore": webstore, "packages": packages}
    except Exception as e:
        logger.warning(f"Tebex store fetch failed ({e}); serving demo store")
        return demo_store()


class BasketCreate(BaseModel):
    complete_url: str
    cancel_url: str


@api_router.post("/basket/create")
async def create_basket(body: BasketCreate):
    """Creates a Tebex basket and returns the FiveM auth URLs the player must visit."""
    if not TEBEX_TOKEN:
        return {"demo": True}
    try:
        url = f"{HEADLESS_BASE}/accounts/{TEBEX_TOKEN}/baskets"
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as c:
            r = await c.post(url, json={
                "complete_url": body.complete_url,
                "cancel_url": body.cancel_url,
                "complete_auto_redirect": True,
            }, headers={"Accept": "application/json"})
            r.raise_for_status()
            basket = r.json().get("data", {})
            ident = basket.get("ident")
            # fetch auth urls
            auth_urls = []
            try:
                a = await c.get(
                    f"{HEADLESS_BASE}/accounts/{TEBEX_TOKEN}/baskets/{ident}/auth",
                    params={"returnUrl": body.complete_url},
                    headers={"Accept": "application/json"},
                )
                a.raise_for_status()
                auth_urls = a.json()
            except Exception as ae:
                logger.warning(f"auth url fetch failed: {ae}")
            return {
                "demo": False,
                "ident": ident,
                "links": basket.get("links", {}),
                "auth_urls": auth_urls,
            }
    except Exception as e:
        logger.warning(f"basket create failed ({e}); demo mode")
        return {"demo": True}


class AddItems(BaseModel):
    ident: str
    items: List[dict]  # [{package_id, quantity}]


@api_router.post("/basket/add")
async def add_items(body: AddItems):
    """Adds packages to an (authenticated) basket and returns the checkout URL."""
    if not TEBEX_TOKEN:
        raise HTTPException(status_code=400, detail="Demo-Modus: kein gültiger Tebex Public Token konfiguriert.")
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=False) as c:
            for it in body.items:
                await c.post(
                    f"{HEADLESS_BASE}/baskets/{body.ident}/packages",
                    json={"package_id": it.get("package_id"), "quantity": it.get("quantity", 1)},
                    headers={"Accept": "application/json"},
                )
            b = await c.get(
                f"{HEADLESS_BASE}/accounts/{TEBEX_TOKEN}/baskets/{body.ident}",
                headers={"Accept": "application/json"},
            )
            b.raise_for_status()
            basket = b.json().get("data", {})
            return {"checkout_url": basket.get("links", {}).get("checkout"), "basket": basket}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"basket add failed: {e}")
        raise HTTPException(status_code=400, detail="Konnte Warenkorb nicht bei Tebex anlegen. Prüfe den Tebex Public Token.")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
