from backend.config import BRAND_DIR, FAL_KEY
from backend.core.base_tool import BaseTool
from backend.tools.concept_ads.router import router as concept_ads_router


class ConceptAdsTool(BaseTool):
    @property
    def id(self) -> str:
        return "concept_ads"

    @property
    def name(self) -> str:
        return "Concept Ads"

    @property
    def description(self) -> str:
        return "Generate angle-driven ad creatives by avatar × format, with AI concept planning via claude.ai"

    @property
    def icon(self) -> str:
        return "lightbulb"

    @property
    def router(self):
        return concept_ads_router

    async def health_check(self) -> dict:
        has_key = bool(FAL_KEY and FAL_KEY != "tu-key-aqui")
        has_dna = (BRAND_DIR / "brand-dna.md").exists()
        has_avatars = (BRAND_DIR / "data" / "avatars.json").exists()

        return {
            "ready": has_key and has_dna,
            "fal_key_set": has_key,
            "brand_dna_exists": has_dna,
            "avatars_exist": has_avatars,
        }


tool = ConceptAdsTool()
