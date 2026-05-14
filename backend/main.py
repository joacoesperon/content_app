from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import BRAND_DIR, OUTPUTS_DIR
from backend.core.registry import ToolRegistry


app = FastAPI(title="Jess Trading Content App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve brand assets (product images, reference ads, etc.)
app.mount("/files", StaticFiles(directory=str(BRAND_DIR)), name="brand_files")
# Serve tool outputs (generated images, scout briefs, etc.)
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="tool_outputs")

# Discover and register all tools
registry = ToolRegistry()
registry.discover_tools()
for t in registry.tools:
    app.include_router(t.router, prefix=f"/api/tools/{t.id}", tags=[t.name])


@app.get("/api/tools")
async def list_tools():
    return await registry.list_tools()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/test-instagram")
async def test_instagram(body: dict):
    """
    Test endpoint: publishes prueba.png as a carousel (image duplicated) via Make.com webhook
    or directly to Instagram. Pass {"mode": "direct"} for instant, {"mode": "make"} for webhook.
    """
    import asyncio
    from pathlib import Path
    from backend.config import TOKEN_SYSTEM_USER, MAKE_WEBHOOK_URL
    from backend.tools.carousels import instagram
    from fastapi import HTTPException

    mode = body.get("mode", "direct")
    caption = body.get("caption", "prueba")
    prueba = Path("/home/jesperon/content_app/prueba.png")

    if not prueba.exists():
        raise HTTPException(status_code=404, detail="prueba.png not found")
    if not TOKEN_SYSTEM_USER:
        raise HTTPException(status_code=500, detail="TOKEN_SYSTEM_USER not configured")

    if mode == "direct":
        # Instant publish: prueba.png × 2 as carousel
        try:
            post_id = await instagram.publish_carousel([prueba, prueba], caption, TOKEN_SYSTEM_USER)
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))
        return {"ok": True, "post_id": post_id, "mode": "direct"}

    elif mode == "make":
        # Scheduled via Make.com webhook with scheduled_at = now (fires immediately in scenario B)
        import time, requests as _req
        if not MAKE_WEBHOOK_URL:
            raise HTTPException(status_code=500, detail="MAKE_WEBHOOK_URL not configured")
        # Upload image × 2 to FAL, create item containers
        public_urls = await asyncio.gather(*[instagram._upload_image(prueba), instagram._upload_image(prueba)])
        container_ids = []
        for url in public_urls:
            cid = await instagram._create_item_container(url, TOKEN_SYSTEM_USER)
            container_ids.append(cid)
        payload = {
            "post_slug": f"test_{int(time.time())}",
            "post_type": "carousel",
            "caption": caption,
            "image_urls": ",".join(container_ids),
            "video_url": "",
            "scheduled_at": str(int(time.time()) - 10),  # 10s ago → fires instantly in scenario B
        }
        def _send():
            _req.post(MAKE_WEBHOOK_URL, json=payload, timeout=10).raise_for_status()
        await asyncio.to_thread(_send)
        return {"ok": True, "post_id": "sent_to_make", "mode": "make", "payload": payload}

    raise HTTPException(status_code=400, detail="mode must be 'direct' or 'make'")
