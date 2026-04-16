import asyncio
import json
import re
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.config import BRAND_DIR, TEMPLATES_FILE
from backend.tools.static_ads.schemas import (
    GenerateRequest,
    GenerateJobStatus,
    OutputFolder,
    PromptInfo,
    TemplateInfo,
    TemplateResult,
)
from backend.tools.static_ads.service import StaticAdService

router = APIRouter()

# In-memory job store (single user, no persistence needed)
jobs: dict[str, GenerateJobStatus] = {}
job_queues: dict[str, asyncio.Queue] = {}


def _parse_templates() -> list[TemplateInfo]:
    """Parse template-prompts.md to extract template names and descriptions."""
    if not TEMPLATES_FILE.exists():
        return []

    content = TEMPLATES_FILE.read_text(encoding="utf-8")
    templates = []
    # Match headers like "## **1. Headline**" or "## 13. Stat Surround"
    pattern = r"##\s+\**(\d+)\.\s*(.+?)\**\s*\n\n(.+?)(?:\n\n\*\*Template Prompt)"
    for match in re.finditer(pattern, content, re.DOTALL):
        num = int(match.group(1))
        name = match.group(2).strip().rstrip("*").strip()
        desc_line = match.group(3).strip()
        # Extract description from the tag line
        desc = re.sub(r"^🏷️\s*", "", desc_line).strip()

        # Determine aspect ratio from the template prompt that follows
        # Find the prompt text after this header
        start = match.end()
        next_header = content.find("\n## ", start)
        prompt_block = content[start:next_header] if next_header > 0 else content[start:]
        ar_match = re.search(r"(\d+:\d+)\s+aspect ratio", prompt_block)
        aspect_ratio = ar_match.group(1) if ar_match else "1:1"

        templates.append(TemplateInfo(
            number=num,
            name=name,
            description=desc,
            aspect_ratio=aspect_ratio,
        ))

    return templates


@router.get("/brand-dna")
async def get_brand_dna():
    """Read brand DNA document."""
    dna_file = BRAND_DIR / "brand-dna.md"
    if not dna_file.exists():
        return {"exists": False, "content": ""}
    return {"exists": True, "content": dna_file.read_text(encoding="utf-8")}


@router.get("/templates", response_model=list[TemplateInfo])
async def list_templates():
    """List all available ad templates."""
    return _parse_templates()


@router.get("/prompts", response_model=list[PromptInfo])
async def list_prompts():
    """List generated prompts from prompts.json."""
    prompts_file = BRAND_DIR / "prompts.json"
    if not prompts_file.exists():
        return []
    data = json.loads(prompts_file.read_text(encoding="utf-8"))
    return [PromptInfo(**p) for p in data.get("prompts", [])]


@router.post("/generate")
async def start_generation(req: GenerateRequest):
    """Start an image generation job."""
    job_id = str(uuid.uuid4())[:8]
    queue: asyncio.Queue = asyncio.Queue()
    job_queues[job_id] = queue

    # Load prompts
    prompts_file = BRAND_DIR / "prompts.json"
    if not prompts_file.exists():
        return {"error": "prompts.json not found. Run Phase 2 first."}

    data = json.loads(prompts_file.read_text(encoding="utf-8"))
    prompts = data.get("prompts", [])

    if req.templates:
        prompts = [p for p in prompts if p["template_number"] in req.templates]

    if not prompts:
        return {"error": "No prompts matched the selected templates."}

    cost_per_image = {"0.5K": 0.06, "1K": 0.08, "2K": 0.12, "4K": 0.16}
    total_images = len(prompts) * req.num_images
    estimated_cost = total_images * cost_per_image.get(req.resolution, 0.08)

    job = GenerateJobStatus(
        job_id=job_id,
        status="queued",
        total_templates=len(prompts),
        completed_templates=0,
        estimated_cost=estimated_cost,
        started_at=datetime.now(),
    )
    jobs[job_id] = job

    # Run generation in background
    service = StaticAdService(BRAND_DIR)
    asyncio.create_task(
        _run_generation(job_id, service, prompts, req, queue)
    )

    return {"job_id": job_id, "total_templates": len(prompts), "estimated_cost": estimated_cost}


async def _run_generation(
    job_id: str,
    service: StaticAdService,
    prompts: list[dict],
    req: GenerateRequest,
    queue: asyncio.Queue,
):
    """Background task that runs the image generation pipeline."""
    job = jobs[job_id]
    job.status = "running"

    async def emit(msg: dict):
        job.messages.append(msg)
        await queue.put(msg)

    await emit({"type": "status", "status": "running"})

    for i, prompt_data in enumerate(prompts):
        num = prompt_data["template_number"]
        name = prompt_data["template_name"]
        job.current_template = f"#{num:02d} — {name}"

        await emit({
            "type": "progress",
            "template_number": num,
            "template_name": name,
            "index": i + 1,
            "total": len(prompts),
            "message": f"Generating #{num:02d} — {name}...",
        })

        try:
            result = await asyncio.to_thread(
                service.generate_single,
                prompt_data,
                resolution=req.resolution,
                num_images=req.num_images,
                output_format=req.output_format,
            )

            template_result = TemplateResult(
                template_number=num,
                template_name=name,
                folder=result["folder"],
                images=result["images"],
                status="success",
                time=result["time"],
            )
            job.results.append(template_result)
            job.completed_templates = i + 1

            await emit({
                "type": "template_done",
                "template_number": num,
                "template_name": name,
                "folder": result["folder"],
                "images": result["image_files"],
                "time": result["time"],
            })

        except Exception as e:
            template_result = TemplateResult(
                template_number=num,
                template_name=name,
                folder=f"{num:02d}-{name}",
                images=0,
                status=f"error: {e}",
                time=0,
            )
            job.results.append(template_result)
            job.completed_templates = i + 1

            await emit({
                "type": "template_error",
                "template_number": num,
                "template_name": name,
                "error": str(e),
            })

    # Generate gallery
    try:
        service.generate_gallery(prompts, job.results)
    except Exception:
        pass

    job.status = "completed"
    job.current_template = None
    await emit({"type": "status", "status": "completed", "results": [r.model_dump() for r in job.results]})
    job_queues.pop(job_id, None)  # cleanup queue only after job is fully done


@router.get("/jobs/{job_id}", response_model=GenerateJobStatus)
async def get_job_status(job_id: str):
    """Poll job status."""
    if job_id not in jobs:
        return GenerateJobStatus(job_id=job_id, status="not_found", total_templates=0, completed_templates=0)
    return jobs[job_id]


@router.websocket("/ws/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time generation progress. Supports reconnection."""
    await websocket.accept()

    job = jobs.get(job_id)
    if not job:
        await websocket.send_json({"type": "error", "message": "Job not found"})
        await websocket.close()
        return

    # Replay message history so reconnecting clients catch up
    for msg in job.messages:
        await websocket.send_json(msg)

    # If job already finished, nothing more to stream
    if job.status in ("completed", "failed"):
        await websocket.close()
        return

    queue = job_queues.get(job_id)
    if not queue:
        await websocket.close()
        return

    try:
        while True:
            msg = await queue.get()
            await websocket.send_json(msg)
            if msg.get("type") == "status" and msg.get("status") in ("completed", "failed"):
                break
    except WebSocketDisconnect:
        pass  # client navigated away — don't clean up queue, job keeps running


@router.get("/outputs", response_model=list[OutputFolder])
async def list_outputs():
    """List all generated output folders with their images."""
    outputs_dir = BRAND_DIR / "outputs"
    if not outputs_dir.exists():
        return []

    result = []
    image_exts = {".png", ".jpg", ".jpeg", ".webp"}
    for folder in sorted(outputs_dir.iterdir()):
        if not folder.is_dir():
            continue
        # Parse folder name like "01-headline"
        parts = folder.name.split("-", 1)
        if len(parts) != 2 or not parts[0].isdigit():
            continue

        images = sorted(
            f.name for f in folder.iterdir() if f.suffix.lower() in image_exts
        )
        if images:
            result.append(OutputFolder(
                folder=folder.name,
                template_number=int(parts[0]),
                template_name=parts[1],
                images=images,
            ))

    return result
