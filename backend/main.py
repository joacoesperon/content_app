from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import BRAND_DIR
from backend.core.registry import ToolRegistry

app = FastAPI(title="Jess Trading Content App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve brand files (outputs, images, etc.)
app.mount("/files", StaticFiles(directory=str(BRAND_DIR)), name="brand_files")

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
