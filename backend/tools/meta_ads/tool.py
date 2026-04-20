from backend.core.base_tool import BaseTool
from backend.tools.meta_ads import storage
from backend.tools.meta_ads.router import router as meta_ads_router


class MetaAdsTool(BaseTool):
    @property
    def id(self) -> str:
        return "meta_ads"

    @property
    def name(self) -> str:
        return "Meta Ads"

    @property
    def description(self) -> str:
        return "Bulk upload and launch Meta (Facebook/Instagram) ads from images and videos"

    @property
    def icon(self) -> str:
        return "megaphone"

    @property
    def router(self):
        return meta_ads_router

    async def health_check(self) -> dict:
        s = storage.load_settings()
        configured = bool(s.get("access_token") and s.get("ad_account_id"))
        return {
            "ready": configured,
            "token_set": bool(s.get("access_token")),
            "ad_account_set": bool(s.get("ad_account_id")),
            "page_set": bool(s.get("page_id")),
        }


tool = MetaAdsTool()
