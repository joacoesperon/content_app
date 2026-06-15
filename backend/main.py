import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import BRAND_DIR, OUTPUTS_DIR
from backend.core.registry import ToolRegistry


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.tools.carousels.scheduler import run_forever
    task = asyncio.create_task(run_forever())
    yield
    task.cancel()


app = FastAPI(title="Jess Trading Content App", lifespan=lifespan)

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
    from pathlib import Path
    from backend.config import TOKEN_SYSTEM_USER
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

    raise HTTPException(status_code=400, detail="mode must be 'direct'")
