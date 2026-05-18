from fastapi import APIRouter

from backend.core.base_tool import BaseTool
from backend.tools.director.router import router as director_router
from backend.config import BRAND_DIR, ANTHROPIC_API_KEY


class DirectorTool(BaseTool):
    @property
    def id(self) -> str:
        return "director"

    @property
    def name(self) -> str:
        return "Director"

    @property
    def description(self) -> str:
        return "Reel scriptwriter — generates Instagram Reel scripts with the JT mascot."

    @property
    def icon(self) -> str:
        return "clapperboard"

    @property
    def router(self) -> APIRouter:
        return director_router

    async def health_check(self) -> dict:
        if not ANTHROPIC_API_KEY:
            return {"ready": False, "reason": "ANTHROPIC_API_KEY not set in .env"}
        avatars_file = BRAND_DIR / "data" / "avatars.json"
        if not avatars_file.exists():
            return {"ready": False, "reason": "avatars.json not found"}
        mascot = BRAND_DIR / "data" / "mascot.json"
        if not mascot.exists():
            return {"ready": False, "reason": "mascot.json not found — set up the mascot in Brand Tool"}
        director_prompt = BRAND_DIR / "director-prompt.md"
        if not director_prompt.exists():
            return {"ready": False, "reason": "director-prompt.md not found — create it in the Brand tool"}
        return {"ready": True}


tool = DirectorTool()
