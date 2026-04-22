import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.config import BRAND_DIR, ANTHROPIC_API_KEY
from backend.tools.scout import service
from backend.tools.scout.schemas import ScoutRunRequest, ScoutOutputFile

router = APIRouter()


@router.post("/run")
async def run(body: ScoutRunRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY no configurado en .env",
        )

    async def generate():
        async for event in service.run_scout_stream(body.prompt, BRAND_DIR, ANTHROPIC_API_KEY):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/history", response_model=list[ScoutOutputFile])
async def get_history():
    output_dir = BRAND_DIR / "scout-output"
    if not output_dir.exists():
        return []
    files = sorted(output_dir.glob("*.md"), reverse=True)[:20]
    return [
        {"filename": f.name, "content": f.read_text(encoding="utf-8")}
        for f in files
    ]
