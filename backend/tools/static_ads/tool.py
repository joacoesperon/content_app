import os
from pathlib import Path

from backend.config import BRAND_DIR, FAL_KEY
from backend.core.base_tool import BaseTool
from backend.tools.static_ads.router import router as static_ads_router


class StaticAdsTool(BaseTool):
    @property
    def id(self) -> str:
        return "static_ads"

    @property
    def name(self) -> str:
        return "Static Ad Generator"

    @property
    def description(self) -> str:
        return "Generate production-ready static ad images using Nano Banana 2 via FAL API"

    @property
    def icon(self) -> str:
        return "image"

    @property
    def router(self):
        return static_ads_router

    async def health_check(self) -> dict:
        has_key = bool(FAL_KEY and FAL_KEY != "tu-key-aqui")
        has_dna = (BRAND_DIR / "brand-dna.md").exists()
        has_prompts = (BRAND_DIR / "data" / "static-ads-prompts.json").exists()

        return {
            "ready": has_key and has_dna and has_prompts,
            "fal_key_set": has_key,
            "brand_dna_exists": has_dna,
            "prompts_exist": has_prompts,
        }


tool = StaticAdsTool()
