#!/usr/bin/env python3
"""Generate per-product images via OpenAI Images API. Requires OPENAI_API_KEY env var."""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "images" / "products"

PRODUCT_PROMPTS: dict[str, str] = {
    "prod_001": "stainless steel insulated vacuum water bottle 1 liter, matte silver, sports flask",
    "prod_002": "small glass skincare serum bottle 30ml with dropper, golden liquid, cosmetics",
    "prod_003": "white pump bottle facial gel cleanser 150ml, Korean skincare style",
    "prod_006": "navy blue men's cotton polo t-shirt folded flat, classic fit",
    "prod_007": "beige women's oversized linen t-shirt dress, casual summer fashion",
    "prod_008": "pack of two colorful graphic print cotton crew neck t-shirts",
    "prod_011": "iPhone silicone phone case clear with colored bumper, MagSafe ring",
    "prod_012": "smartphone tempered glass screen protector 2-pack retail box",
    "prod_013": "brown faux leather Samsung phone case slim with card slot",
    "prod_016": "frozen halal chicken nuggets 1kg bag, grocery packaging, Southeast Asia style",
    "prod_017": "Indomie instant fried noodles 5-pack bundle, bright red yellow packaging",
    "prod_018": "chocolate chip cookies in clear plastic jar 400g, snack groceries",
    "prod_019": "matte ruby red lipstick tube open showing bullet, luxury makeup",
    "prod_020": "vitamin C brightening face serum dropper bottle 30ml, skincare",
    "prod_021": "herbal ginseng repair shampoo bottle 400ml, green botanical label",
}

CATEGORY_PROMPTS: dict[str, str] = {
    "bottle": "assorted drink bottles and containers, water bottle serum bottle detergent bottle collage",
    "tshirt": "folded cotton t-shirts polo shirt and casual tees fashion flat lay",
    "phone_case": "smartphone cases and screen protectors accessories flat lay",
    "food_groceries": "Southeast Asian groceries: instant noodles chicken nuggets cookies snacks flat lay",
    "beauty_personal_care": "beauty products lipstick serum shampoo skincare flat lay",
}

STYLE = (
    "Professional ecommerce product photo. Single product centered on pure white background. "
    "Soft studio lighting, sharp focus, realistic, no text, no watermark, no people, no hands."
)


def generate_image(prompt: str, size: str = "1024x1024") -> bytes:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY is not set")

    body = json.dumps(
        {
            "model": "gpt-image-1",
            "prompt": f"{STYLE} {prompt}",
            "n": 1,
            "size": size,
        }
    ).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.load(resp)

    item = payload["data"][0]
    if "b64_json" in item:
        return base64.b64decode(item["b64_json"])

    image_url = item["url"]
    with urllib.request.urlopen(image_url, timeout=60) as resp:
        return resp.read()


def save_image(name: str, prompt: str) -> str:
    out_path = OUT_DIR / f"{name}.jpg"
    if out_path.exists() and out_path.stat().st_size > 100_000:
        return f"skip {name}"

    for attempt in range(3):
        try:
            data = generate_image(prompt)
            out_path.write_bytes(data)
            return f"ok {name} ({len(data)} bytes)"
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            if attempt == 2:
                raise RuntimeError(f"{name} failed: {exc.code} {detail}") from exc
            time.sleep(2 ** attempt)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    return f"fail {name}"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jobs: list[tuple[str, str]] = [
        *[(pid, prompt) for pid, prompt in PRODUCT_PROMPTS.items()],
        *[(cat, prompt) for cat, prompt in CATEGORY_PROMPTS.items()],
    ]

    print(f"Generating {len(jobs)} images into {OUT_DIR}")
    results: list[str] = []

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(save_image, name, prompt): name for name, prompt in jobs}
        for future in as_completed(futures):
            name = futures[future]
            try:
                msg = future.result()
                results.append(msg)
                print(msg)
            except Exception as exc:
                print(f"error {name}: {exc}", file=sys.stderr)

    failed = [r for r in results if r.startswith("error") or r.startswith("fail")]
    if len(results) < len(jobs) or failed:
        raise SystemExit(1)
    print("done")


if __name__ == "__main__":
    main()
