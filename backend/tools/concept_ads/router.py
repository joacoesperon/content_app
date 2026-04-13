import asyncio
import json
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from backend.config import BRAND_DIR
from backend.tools.concept_ads.schemas import (
    BuildPromptRequest,
    ConceptItem,
    ConceptJobStatus,
    Format,
    GenerateConceptsRequest,
    ParsePlanRequest,
    RemixRequest,
)
from backend.tools.concept_ads.service import ConceptAdService

from fastapi import WebSocket, WebSocketDisconnect

router = APIRouter()

# In-memory job store
jobs: dict[str, ConceptJobStatus] = {}
job_queues: dict[str, asyncio.Queue] = {}

AVATARS_FILE = BRAND_DIR / "data" / "avatars.json"
FORMATS_FILE = Path(__file__).parent / "formats.json"
REFERENCE_DIR = BRAND_DIR / "reference-images"


def _load_avatars() -> list[dict]:
    if not AVATARS_FILE.exists():
        return []
    return json.loads(AVATARS_FILE.read_text(encoding="utf-8"))


def _load_formats() -> list[dict]:
    return json.loads(FORMATS_FILE.read_text(encoding="utf-8"))


def _get_brand_modifier() -> str:
    dna_file = BRAND_DIR / "brand-dna.md"
    if not dna_file.exists():
        return ""
    content = dna_file.read_text(encoding="utf-8")
    marker = "IMAGE GENERATION PROMPT MODIFIER"
    idx = content.find(marker)
    if idx == -1:
        return ""
    after = content[idx + len(marker):].strip()
    lines = []
    for line in after.splitlines():
        if line.startswith("---") or (line.startswith("#") and lines):
            break
        lines.append(line)
    return "\n".join(lines).strip()


# ─── Avatars (read-only — managed by Avatars tool) ───────────────────────────

@router.get("/avatars")
async def list_avatars():
    return _load_avatars()


# ─── Formats (read-only) ─────────────────────────────────────────────────────

@router.get("/formats", response_model=list[Format])
async def list_formats():
    return _load_formats()


# ─── Manual Planner — Concept Plan ───────────────────────────────────────────

@router.post("/build-prompt")
async def build_concept_prompt(body: BuildPromptRequest):
    """Build a concept planning prompt for Claude based on selected avatars and formats."""
    avatars_all = {a["id"]: a for a in _load_avatars()}
    formats_all = {f["id"]: f for f in _load_formats()}

    selected_avatars = [avatars_all[aid] for aid in body.avatar_ids if aid in avatars_all]
    selected_formats = [formats_all[fid] for fid in body.format_ids if fid in formats_all]

    if not selected_avatars:
        raise HTTPException(status_code=422, detail="No valid avatar IDs provided")
    if not selected_formats:
        raise HTTPException(status_code=422, detail="No valid format IDs provided")

    dna_file = BRAND_DIR / "brand-dna.md"
    brand_context = ""
    if dna_file.exists():
        brand_context = dna_file.read_text(encoding="utf-8")[:3000]

    avatars_block = "\n\n".join(
        f"AVATAR: {a['name']} (id: {a['id']})\n"
        f"Description: {a['description']}\n"
        f"Pain points: {', '.join(a.get('pain_points', []))}\n"
        f"Language sample: {a.get('language_sample', '')}"
        for a in selected_avatars
    )

    formats_block = "\n\n".join(
        f"FORMAT: {f['name']} (id: {f['id']})\n"
        f"Description: {f['description']}\n"
        f"Visual rules: {f['visual_rules']}\n"
        f"Copy guidance: {f['copy_guidance']}"
        for f in selected_formats
    )

    prompt = f"""You are an expert direct-response ad creative strategist.

Your task: Generate {body.count} distinct ad concepts for the brand below, using the provided customer avatars and ad formats.

Each concept must combine ONE avatar with ONE format and produce a specific, actionable creative brief.

BRAND CONTEXT:
{brand_context}

AVAILABLE AVATARS:
{avatars_block}

AVAILABLE FORMATS:
{formats_block}

RULES:
- Use each avatar at least once
- Use each format at least once (distribute variety)
- Each concept must have a SPECIFIC hook — not generic, but something this exact avatar would stop scrolling for
- The angle must be emotionally or logically distinct from the other concepts
- prompt_additions should describe the specific visual scene, NOT repeat the format rules

OUTPUT FORMAT — Return ONLY a valid JSON array (no markdown, no explanation):
[
  {{
    "concept_index": 1,
    "avatar_id": "exact_avatar_id",
    "format_id": "exact_format_id",
    "hook": "The specific headline or opening line that stops this avatar from scrolling",
    "angle": "1-sentence description of the emotional or logical angle being exploited",
    "prompt_additions": "Specific visual details for the image: scene, lighting, props, subject, mood",
    "aspect_ratio": "{body.aspect_ratio}"
  }}
]

Generate exactly {body.count} concepts."""

    return {"prompt": prompt, "char_count": len(prompt)}


@router.post("/parse-plan")
async def parse_plan(body: ParsePlanRequest):
    """Validate and parse the concept plan JSON pasted from Claude."""
    raw = body.raw.strip()

    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {e}")

    if not isinstance(data, list):
        raise HTTPException(status_code=422, detail="Expected a JSON array of concepts")

    required = {"concept_index", "avatar_id", "format_id", "hook", "angle", "prompt_additions"}
    parsed = []
    for i, item in enumerate(data):
        missing = required - set(item.keys())
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Concept at index {i} missing fields: {', '.join(missing)}"
            )
        parsed.append(ConceptItem(**{
            "concept_index": item["concept_index"],
            "avatar_id": item["avatar_id"],
            "format_id": item["format_id"],
            "hook": item["hook"],
            "angle": item["angle"],
            "prompt_additions": item["prompt_additions"],
            "aspect_ratio": item.get("aspect_ratio", "4:5"),
        }).model_dump())

    return {"concepts": parsed, "count": len(parsed)}


# ─── Concepts Generation ──────────────────────────────────────────────────────

@router.post("/generate")
async def start_generate(req: GenerateConceptsRequest):
    """Start a concept image generation job."""
    job_id = str(uuid.uuid4())[:8]
    queue: asyncio.Queue = asyncio.Queue()
    job_queues[job_id] = queue

    job = ConceptJobStatus(
        job_id=job_id,
        status="queued",
        total=len(req.concepts),
    )
    jobs[job_id] = job

    service = ConceptAdService(BRAND_DIR)
    avatars_map = {a["id"]: a for a in _load_avatars()}
    formats_map = {f["id"]: f for f in _load_formats()}
    brand_modifier = _get_brand_modifier()

    asyncio.create_task(
        _run_concepts(job_id, service, req, avatars_map, formats_map, brand_modifier, queue)
    )

    return {"job_id": job_id, "total": len(req.concepts)}


async def _run_concepts(
    job_id: str,
    service: ConceptAdService,
    req: GenerateConceptsRequest,
    avatars_map: dict,
    formats_map: dict,
    brand_modifier: str,
    queue: asyncio.Queue,
):
    job = jobs[job_id]
    job.status = "running"
    await queue.put({"type": "status", "status": "running"})

    for i, concept in enumerate(req.concepts):
        c = concept.model_dump()
        avatar = avatars_map.get(c["avatar_id"], {"id": c["avatar_id"], "name": c["avatar_id"], "description": "", "pain_points": [], "language_sample": ""})
        fmt = formats_map.get(c["format_id"], {"id": c["format_id"], "name": c["format_id"], "visual_rules": "", "copy_guidance": ""})

        await queue.put({
            "type": "progress",
            "concept_index": c["concept_index"],
            "avatar_id": c["avatar_id"],
            "format_id": c["format_id"],
            "index": i + 1,
            "total": len(req.concepts),
            "message": f"Generating concept #{c['concept_index']} — {fmt.get('name', c['format_id'])} × {avatar.get('name', c['avatar_id'])}...",
        })

        try:
            result = await asyncio.to_thread(
                service.generate_concept,
                c,
                fmt,
                avatar,
                brand_modifier,
                resolution=req.resolution,
                num_images=req.num_images,
                output_format=req.output_format,
            )
            job.completed += 1

            await queue.put({
                "type": "concept_done",
                "concept_index": c["concept_index"],
                "avatar_id": c["avatar_id"],
                "format_id": c["format_id"],
                "folder": result["folder"],
                "images": result["image_files"],
                "time": result["time"],
            })

        except Exception as e:
            job.errors += 1
            await queue.put({
                "type": "concept_error",
                "concept_index": c["concept_index"],
                "error": str(e),
            })

    job.status = "completed"
    await queue.put({"type": "status", "status": "completed"})


@router.get("/jobs/{job_id}", response_model=ConceptJobStatus)
async def get_job(job_id: str):
    if job_id not in jobs:
        return ConceptJobStatus(job_id=job_id, status="not_found")
    return jobs[job_id]


@router.websocket("/ws/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    queue = job_queues.get(job_id)
    if not queue:
        await websocket.send_json({"type": "error", "message": "Job not found"})
        await websocket.close()
        return
    try:
        while True:
            msg = await queue.get()
            await websocket.send_json(msg)
            if msg.get("type") == "status" and msg.get("status") in ("completed", "failed"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        job_queues.pop(job_id, None)


# ─── Remix Mode ───────────────────────────────────────────────────────────────

@router.post("/upload-reference")
async def upload_reference(file: UploadFile = File(...)):
    """Upload a reference image for Remix Mode."""
    REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename).name if file.filename else "reference.png"
    dest = REFERENCE_DIR / safe_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"path": str(dest), "filename": safe_name}


@router.post("/remix")
async def start_remix(req: RemixRequest):
    """Start a Remix Mode generation job."""
    ref_path = Path(req.reference_path)
    if not ref_path.exists():
        raise HTTPException(status_code=404, detail="Reference image not found")

    job_id = str(uuid.uuid4())[:8]
    queue: asyncio.Queue = asyncio.Queue()
    job_queues[job_id] = queue

    job = ConceptJobStatus(job_id=job_id, status="queued", total=1)
    jobs[job_id] = job

    service = ConceptAdService(BRAND_DIR)
    brand_modifier = _get_brand_modifier()

    asyncio.create_task(_run_remix(job_id, service, req, brand_modifier, queue))

    return {"job_id": job_id}


async def _run_remix(
    job_id: str,
    service: ConceptAdService,
    req: RemixRequest,
    brand_modifier: str,
    queue: asyncio.Queue,
):
    job = jobs[job_id]
    job.status = "running"
    await queue.put({"type": "status", "status": "running"})
    await queue.put({"type": "progress", "message": "Uploading reference and generating remix...", "total": 1, "index": 1})

    try:
        result = await asyncio.to_thread(
            service.generate_remix,
            req.reference_path,
            req.instructions,
            brand_modifier,
            aspect_ratio=req.aspect_ratio,
            num_images=req.count,
            resolution=req.resolution,
            output_format=req.output_format,
        )
        job.completed = 1
        await queue.put({
            "type": "concept_done",
            "concept_index": 0,
            "avatar_id": "remix",
            "format_id": "remix",
            "folder": result["folder"],
            "images": result["image_files"],
            "time": result["time"],
        })
    except Exception as e:
        job.errors = 1
        await queue.put({"type": "concept_error", "concept_index": 0, "error": str(e)})

    job.status = "completed"
    await queue.put({"type": "status", "status": "completed"})


# ─── Outputs History ──────────────────────────────────────────────────────────

@router.get("/outputs")
async def list_outputs():
    """List all generated concept output folders."""
    outputs_dir = BRAND_DIR / "concept-outputs"
    if not outputs_dir.exists():
        return []

    image_exts = {".png", ".jpg", ".jpeg", ".webp"}
    result = []

    for folder in sorted(outputs_dir.iterdir()):
        if not folder.is_dir():
            continue
        images = sorted(f.name for f in folder.iterdir() if f.suffix.lower() in image_exts)
        if not images:
            continue
        meta = {}
        meta_file = folder / "meta.json"
        if meta_file.exists():
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        result.append({
            "folder": folder.name,
            "images": images,
            "meta": meta,
        })

    return result
