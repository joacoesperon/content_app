from backend.config import FAL_KEY, OUTPUTS_DIR
from backend.core.base_tool import BaseTool
from backend.tools.carousels.router import router as carousels_router


class CarouselsTool(BaseTool):
    @property
    def id(self) -> str:
        return "carousels"

    @property
    def name(self) -> str:
        return "Carousels"

    @property
    def description(self) -> str:
        return "Turn Scout briefs into Instagram-ready carousel slides via nano-banana-2."

    @property
    def icon(self) -> str:
        return "layers"

    @property
    def router(self):
        return carousels_router

    async def health_check(self) -> dict:
        has_key = bool(FAL_KEY and FAL_KEY != "tu-key-aqui")
        scout_dir = OUTPUTS_DIR / "scout"
        has_scout = scout_dir.exists() and any(scout_dir.glob("*.md"))

        ready = has_key and has_scout
        reason = None
        if not has_key:
            reason = "FAL_KEY no configurado en .env"
        elif not has_scout:
            reason = "No hay archivos en outputs/scout/ — corré Scout primero"

        return {"ready": ready, "reason": reason} if reason else {"ready": ready}


tool = CarouselsTool()
