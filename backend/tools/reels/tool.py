import shutil

from backend.config import FAL_KEY, OUTPUTS_DIR, BRAND_DIR
from backend.core.base_tool import BaseTool
from backend.tools.reels.router import router as reels_router


class ReelsTool(BaseTool):
    @property
    def id(self) -> str:
        return "reels"

    @property
    def name(self) -> str:
        return "Reels"

    @property
    def description(self) -> str:
        return "Turn Director scripts into 9:16 vertical video reels via nano-banana-pro/edit + Veo 3.1 Fast."

    @property
    def icon(self) -> str:
        return "film"

    @property
    def router(self):
        return reels_router

    async def health_check(self) -> dict:
        has_key = bool(FAL_KEY and FAL_KEY != "tu-key-aqui")
        if not has_key:
            return {"ready": False, "reason": "FAL_KEY not set in .env"}
        if shutil.which("ffmpeg") is None:
            return {"ready": False, "reason": "ffmpeg not in PATH (brew install ffmpeg)"}
        director_dir = OUTPUTS_DIR / "director"
        has_director = director_dir.exists() and any(director_dir.glob("*.md"))
        if not has_director:
            return {"ready": False, "reason": "No Director outputs yet — run Director first"}
        mascot_refs = (BRAND_DIR / "mascot")
        has_refs = mascot_refs.exists() and any(
            f.is_file() and f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
            for f in mascot_refs.iterdir()
        )
        if not has_refs:
            return {"ready": False, "reason": "No mascot reference images uploaded — set up in Brand Tool → Mascot"}
        return {"ready": True}


tool = ReelsTool()
