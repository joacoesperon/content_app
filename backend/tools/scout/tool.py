from fastapi import APIRouter

from backend.core.base_tool import BaseTool
from backend.tools.scout.router import router as scout_router
from backend.config import BRAND_DIR, ANTHROPIC_API_KEY


class ScoutTool(BaseTool):
    @property
    def id(self) -> str:
        return "scout"

    @property
    def name(self) -> str:
        return "Scout"

    @property
    def description(self) -> str:
        return "Estratega de contenido orgánico — genera briefs de posts para Instagram con IA."

    @property
    def icon(self) -> str:
        return "bot"

    @property
    def router(self) -> APIRouter:
        return scout_router

    async def health_check(self) -> dict:
        if not ANTHROPIC_API_KEY:
            return {"ready": False, "reason": "ANTHROPIC_API_KEY no configurado en .env"}
        avatars_file = BRAND_DIR / "data" / "avatars.json"
        if not avatars_file.exists():
            return {"ready": False, "reason": "avatars.json no encontrado"}
        brand_dna = BRAND_DIR / "brand-dna.md"
        if not brand_dna.exists():
            return {"ready": False, "reason": "brand-dna.md no encontrado"}
        return {"ready": True}


tool = ScoutTool()
