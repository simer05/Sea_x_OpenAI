#!/usr/bin/env python3
"""Generate OpenAI images for prod_022–prod_031 noodle SKUs."""

from __future__ import annotations

import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "gen", Path(__file__).parent / "generate-product-images.py"
)
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

PROMPTS = {
    "prod_022": "Indonesian Mi Goreng instant fried noodles 5-pack red packaging halal",
    "prod_023": "halal chicken flavor cup noodles 4-pack instant noodles",
    "prod_024": "budget halal instant noodles 3-pack Philippines grocery packaging",
    "prod_025": "spicy Thai tom yum instant noodle bowl packaging",
    "prod_026": "premium Japanese style udon instant noodles 6-pack halal",
    "prod_027": "Singapore halal laksa coconut curry instant noodles 2-pack",
    "prod_028": "Malaysian halal curry mee instant noodle soup packet",
    "prod_029": "large family bulk instant noodles 12-pack carton halal",
    "prod_030": "ABC style clear soup instant noodle sachets 10-pack",
    "prod_031": "Vietnamese pho instant noodle bowl Saigon style packaging",
}

if __name__ == "__main__":
    for name, prompt in PROMPTS.items():
        print(gen.save_image(name, prompt))
