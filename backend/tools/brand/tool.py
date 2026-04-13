from fastapi import APIRouter
from backend.core.base_tool import BaseTool
from backend.tools.brand.router import router as brand_router
from backend.config import BRAND_DIR


class BrandTool(BaseTool):
    @property
    def id(self) -> str:
        return "brand"

    @property
    def name(self) -> str:
        return "Brand"

    @property
    def description(self) -> str:
        return "Manage brand identity, DNA document, and media assets."

    @property
    def icon(self) -> str:
        return "palette"

    @property
    def router(self) -> APIRouter:
        return brand_router

    async def health_check(self) -> dict:
        dna_file = BRAND_DIR / "data" / "brand-dna.json"
        if not dna_file.exists():
            return {"ready": False, "reason": "brand-dna.json not found"}
        return {"ready": True}


tool = BrandTool()
