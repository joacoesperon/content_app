from fastapi import APIRouter
from backend.core.base_tool import BaseTool
from backend.tools.avatars.router import router as avatars_router
from backend.config import BRAND_DIR


class AvatarsTool(BaseTool):
    @property
    def id(self) -> str:
        return "avatars"

    @property
    def name(self) -> str:
        return "Avatars"

    @property
    def description(self) -> str:
        return "Manage customer avatar profiles for the brand."

    @property
    def icon(self) -> str:
        return "users"

    @property
    def router(self) -> APIRouter:
        return avatars_router

    async def health_check(self) -> dict:
        avatars_file = BRAND_DIR / "data" / "avatars.json"
        if not avatars_file.exists():
            return {"ready": False, "reason": "avatars.json not found"}
        return {"ready": True}


tool = AvatarsTool()
