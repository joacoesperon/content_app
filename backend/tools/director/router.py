import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.config import BRAND_DIR, ANTHROPIC_API_KEY, OUTPUTS_DIR
from backend.tools.director import service
from backend.tools.director.schemas import DirectorRunRequest, DirectorOutputFile

router = APIRouter()


@router.post("/run")
async def run(body: DirectorRunRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY not set in .env",
        )

    async def generate():
        async for event in service.run_director_stream(body.prompt, BRAND_DIR, ANTHROPIC_API_KEY):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/history", response_model=list[DirectorOutputFile])
async def get_history():
    output_dir = OUTPUTS_DIR / "director"
    if not output_dir.exists():
        return []
    files = sorted(output_dir.glob("*.md"), reverse=True)[:20]
    return [
        {"filename": f.name, "content": f.read_text(encoding="utf-8")}
        for f in files
    ]
