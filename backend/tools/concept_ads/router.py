import asyncio
import json
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from backend.config import BRAND_DIR, OUTPUTS_DIR
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
REF_ADS_DIR = BRAND_DIR / "reference-ads"
_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def _get_reference_ad_paths(max_refs: int = 3) -> list[str]:
    """Return up to max_refs reference ad file paths from brand/reference-ads/."""
    if not REF_ADS_DIR.exists():
        return []
    files = sorted(
        f for f in REF_ADS_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in _IMAGE_EXTS
    )
    return [str(f) for f in files[:max_refs]]


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


def _load_products() -> list[dict]:
    """Load products from brand-dna.json."""
    dna_path = BRAND_DIR / "data" / "brand-dna.json"
    if not dna_path.exists():
        return []
    data = json.loads(dna_path.read_text(encoding="utf-8"))
    # Support both old single-product and new products array
    if "products" in data:
        return data["products"]
    if "product" in data:
        p = data["product"]
        return [{"id": "main", "name": p.get("type", "Main Product"), **p}]
    return []


def _get_product(product_id: str) -> dict | None:
    """Return a specific product by id, or the first product if id is empty."""
    products = _load_products()
    if not products:
        return None
    if not product_id:
        return products[0]
    return next((p for p in products if p["id"] == product_id), products[0])


def _list_product_images(product_id: str) -> list[str]:
    """Return list of product image URLs for a given product."""
    if not product_id:
        return []
    img_dir = BRAND_DIR / "product-images" / product_id
    if not img_dir.exists():
        return []
    allowed = {".png", ".jpg", ".jpeg", ".webp"}
    return [
        f"/files/product-images/{product_id}/{f.name}"
        for f in sorted(img_dir.iterdir())
        if f.is_file() and f.suffix.lower() in allowed
    ]


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

    # Brand context (optional)
    brand_context_block = ""
    if body.use_brand_dna:
        dna_file = BRAND_DIR / "brand-dna.md"
        if dna_file.exists():
            brand_context_block = f"BRAND CONTEXT:\n{dna_file.read_text(encoding='utf-8')}\n\n"

    # Product details
    product = _get_product(body.product_id)
    product_block = ""
    if product:
        features = ", ".join(product.get("distinctive_features", []))
        product_block = (
            f"PRODUCT: {product.get('name', product.get('id', 'Main Product'))}\n"
            f"Description: {product.get('description', '')}\n"
            f"Price: {product.get('price', '')}\n"
            f"Platform: {product.get('delivery_platform', '')}\n"
            f"Key features: {features}\n\n"
        )

    # Product images note
    product_images_block = ""
    if body.use_product_images and body.product_id:
        images = _list_product_images(body.product_id)
        if images:
            product_images_block = (
                f"PRODUCT IMAGES AVAILABLE: {len(images)} images. "
                "When relevant, prompt_additions may reference 'product image overlay' or 'product mockup' as a visual element.\n\n"
            )

    # Offer/CTA
    offer_block = ""
    if body.offer_cta:
        offer_block = f"OFFER/CTA TO FEATURE: \"{body.offer_cta}\" — incorporate this into the hook or copy guidance where appropriate.\n\n"

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

    prompt = f"""You are an expert direct-response ad creative strategist and AI image prompt writer.

Your task: Generate {body.count} distinct ad concepts using the provided customer avatars and ad formats. Each concept must combine ONE avatar with ONE format and produce a complete, ready-to-use creative brief — including a full image generation prompt for an AI image model (Nano Banana / FAL).

{brand_context_block}{product_block}{product_images_block}{offer_block}AVAILABLE AVATARS:
{avatars_block}

AVAILABLE FORMATS:
{formats_block}

RULES:
- Use each avatar at least once
- Use each format at least once (distribute variety)
- Each concept must have a SPECIFIC hook — not generic, but something this exact avatar would stop scrolling for
- The angle must be emotionally or logically distinct from the other concepts
- prompt_additions must be a COMPLETE, STANDALONE image generation prompt (see instructions below)
- CRITICAL: ALL visible text, overlays, headlines, subtitles, and copy shown inside the image MUST be written in English, regardless of the language used in hook, angle, or avatar descriptions

PROMPT_ADDITIONS INSTRUCTIONS — this field is sent directly to an AI image model. It must be self-contained and rich enough to generate the image without any other context. Include ALL of the following:
1. The visual scene: environment, setting, time of day, background
2. The subject: person (age, appearance, expression, body language) or graphic layout if no person
3. The avatar's emotional state: what they're feeling in this moment — frustration, relief, excitement, confidence
4. Ad hook integration: how the hook is visually communicated — overlay text, expression, composition
5. Copywriting angle made visual: the emotion or logic of the angle translated into a specific visual moment
6. Lighting, color palette, mood, camera framing (e.g. "handheld portrait selfie angle", "dark studio with neon accent")
7. Style: photorealistic / UGC-style / graphic / typographic — be explicit
Do NOT repeat the format rules — those are layout constraints, not image content. Write the prompt as a single rich paragraph, not bullet points.

OUTPUT FORMAT — Return ONLY a valid JSON array (no markdown, no explanation):
[
  {{
    "concept_index": 1,
    "avatar_id": "exact_avatar_id",
    "format_id": "exact_format_id",
    "hook": "The specific headline or opening line that stops this avatar from scrolling",
    "angle": "1-sentence description of the emotional or logical angle being exploited",
    "prompt_additions": "Full standalone image generation prompt: subject, scene, emotional state, visual translation of the hook and angle, lighting, style, framing — everything an AI needs to generate this ad image",
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
    brand_modifier = _get_brand_modifier() if req.use_brand_modifier else ""

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

    async def emit(msg: dict):
        job.messages.append(msg)
        await queue.put(msg)

    await emit({"type": "status", "status": "running"})

    for i, concept in enumerate(req.concepts):
        c = concept.model_dump()
        avatar = avatars_map.get(c["avatar_id"], {"id": c["avatar_id"], "name": c["avatar_id"], "description": "", "pain_points": [], "language_sample": ""})
        fmt = formats_map.get(c["format_id"], {"id": c["format_id"], "name": c["format_id"], "visual_rules": "", "copy_guidance": ""})

        await emit({
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

            await emit({
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
            await emit({
                "type": "concept_error",
                "concept_index": c["concept_index"],
                "error": str(e),
            })

    job.status = "completed"
    await emit({"type": "status", "status": "completed"})
    job_queues.pop(job_id, None)


@router.get("/jobs/{job_id}", response_model=ConceptJobStatus)
async def get_job(job_id: str):
    if job_id not in jobs:
        return ConceptJobStatus(job_id=job_id, status="not_found")
    return jobs[job_id]


@router.websocket("/ws/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()

    job = jobs.get(job_id)
    if not job:
        await websocket.send_json({"type": "error", "message": "Job not found"})
        await websocket.close()
        return

    # Replay history so reconnecting clients catch up
    for msg in job.messages:
        await websocket.send_json(msg)

    # If already done, close immediately
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
        pass  # job keeps running — queue cleaned up by _run_concepts when done


# ─── Prepare existing output as remix reference ───────────────────────────────

@router.post("/prepare-reference")
async def prepare_reference(body: dict):
    """Return the full path for an existing concept output file so it can be used as a remix reference."""
    relative = body.get("relative_path", "")
    if not relative:
        raise HTTPException(status_code=422, detail="relative_path is required")
    full_path = OUTPUTS_DIR / "concept_ads" / relative
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return {"path": str(full_path), "filename": full_path.name}


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
    brand_modifier = _get_brand_modifier() if req.use_brand_modifier else ""
    ref_ad_paths = _get_reference_ad_paths() if req.use_reference_ads else []

    # Resolve product images
    product_image_paths: list[str] = []
    if req.product_id:
        prod_img_dir = BRAND_DIR / "product-images" / req.product_id
        if prod_img_dir.exists():
            product_image_paths = [
                str(f) for f in sorted(prod_img_dir.iterdir())
                if f.is_file() and f.suffix.lower() in _IMAGE_EXTS
            ][:2]  # max 2 product images

    # Resolve avatar data
    avatar_data: dict = {}
    if req.avatar_id:
        avatars = _load_avatars()
        avatar_data = next((a for a in avatars if a["id"] == req.avatar_id), {})

    asyncio.create_task(_run_remix(
        job_id, service, req, brand_modifier, ref_ad_paths,
        product_image_paths, avatar_data, queue,
    ))

    return {"job_id": job_id}


async def _run_remix(
    job_id: str,
    service: ConceptAdService,
    req: RemixRequest,
    brand_modifier: str,
    ref_ad_paths: list[str],
    product_image_paths: list[str],
    avatar_data: dict,
    queue: asyncio.Queue,
):
    job = jobs[job_id]
    job.status = "running"

    async def emit(msg: dict):
        job.messages.append(msg)
        await queue.put(msg)

    await emit({"type": "status", "status": "running"})
    await emit({"type": "progress", "message": "Uploading reference and generating remix...", "total": 1, "index": 1})

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
            ref_ad_paths=ref_ad_paths,
            product_image_paths=product_image_paths,
            avatar_data=avatar_data,
        )
        job.completed = 1
        await emit({
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
        await emit({"type": "concept_error", "concept_index": 0, "error": str(e)})

    job.status = "completed"
    await emit({"type": "status", "status": "completed"})
    job_queues.pop(job_id, None)


# ─── Outputs History ──────────────────────────────────────────────────────────

@router.get("/outputs")
async def list_outputs():
    """List all generated concept output folders."""
    outputs_dir = OUTPUTS_DIR / "concept_ads"
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


@router.delete("/outputs/{folder}")
async def delete_output(folder: str):
    """Delete a concept output folder and all its images."""
    outputs_dir = OUTPUTS_DIR / "concept_ads"
    folder_path = outputs_dir / folder
    if not folder_path.exists() or not folder_path.is_dir():
        raise HTTPException(status_code=404, detail=f"Output folder '{folder}' not found")
    shutil.rmtree(folder_path)
    return {"deleted": folder}
