import json

from fastapi import APIRouter, HTTPException

from backend.config import BRAND_DIR
from backend.tools.avatars import service
from backend.tools.avatars.schemas import (
    Avatar,
    AvatarCreate,
    AvatarUpdate,
    BuildAvatarPromptRequest,
    ParseAvatarsRequest,
)

router = APIRouter()


# ─── CRUD ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[Avatar])
async def list_avatars():
    return service.load_avatars(BRAND_DIR)


@router.post("/", response_model=Avatar)
async def create_avatar(body: AvatarCreate):
    avatars = service.load_avatars(BRAND_DIR)
    if any(a["id"] == body.id for a in avatars):
        raise HTTPException(status_code=409, detail=f"Avatar '{body.id}' already exists")
    avatars.append(body.model_dump())
    service.save_avatars(BRAND_DIR, avatars)
    return body


@router.put("/{avatar_id}", response_model=Avatar)
async def update_avatar(avatar_id: str, body: AvatarUpdate):
    avatars = service.load_avatars(BRAND_DIR)
    for i, a in enumerate(avatars):
        if a["id"] == avatar_id:
            patch = body.model_dump(exclude_none=True)
            avatars[i] = {**a, **patch}
            service.save_avatars(BRAND_DIR, avatars)
            return Avatar(**avatars[i])
    raise HTTPException(status_code=404, detail=f"Avatar '{avatar_id}' not found")


@router.delete("/{avatar_id}")
async def delete_avatar(avatar_id: str):
    avatars = service.load_avatars(BRAND_DIR)
    new_list = [a for a in avatars if a["id"] != avatar_id]
    if len(new_list) == len(avatars):
        raise HTTPException(status_code=404, detail=f"Avatar '{avatar_id}' not found")
    service.save_avatars(BRAND_DIR, new_list)
    return {"deleted": avatar_id}


# ─── AI Assist ───────────────────────────────────────────────────────────────

@router.post("/build-prompt")
async def build_avatar_prompt(body: BuildAvatarPromptRequest):
    """Build a deep-research prompt for Claude to generate customer avatar profiles."""
    dna_file = BRAND_DIR / "brand-dna.md"
    brand_context = ""
    if dna_file.exists():
        brand_context = dna_file.read_text(encoding="utf-8")[:3000]

    product = body.product or "Gold Trading Bot (XAUUSD EA for MetaTrader 5) — $147 lifetime"
    extra_context = f"\nAdditional context: {body.context}" if body.context else ""

    prompt = f"""You are a direct-response marketing strategist specializing in customer avatar research.

Your task: Analyze the product below and identify 5-6 distinct customer avatar archetypes. Each avatar should represent a real, specific type of person who would buy this product.

PRODUCT: {product}{extra_context}

BRAND CONTEXT:
{brand_context}

For each avatar, research and define:
- Their specific situation and daily reality
- What they've already tried and why it failed
- The exact language they use to describe their problem
- Their primary objections to buying
- Their core motivation (what they're really buying)

OUTPUT FORMAT — Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {{
    "id": "short_slug_no_spaces",
    "name": "Avatar Name (2-3 words)",
    "description": "1-2 sentences describing their specific situation and identity",
    "pain_points": ["specific pain 1", "specific pain 2", "specific pain 3"],
    "motivations": ["what they really want 1", "what they really want 2"],
    "objections": ["objection 1", "objection 2"],
    "language_sample": "A quote in their own words — how they'd describe their problem to a friend"
  }}
]

Be specific and concrete. Avoid generic marketing language. Each avatar must be meaningfully different from the others."""

    return {"prompt": prompt, "char_count": len(prompt)}


@router.post("/parse")
async def parse_avatars(body: ParseAvatarsRequest):
    """Validate and parse the avatar JSON pasted from Claude."""
    raw = body.raw.strip()

    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {e}")

    if not isinstance(data, list):
        raise HTTPException(status_code=422, detail="Expected a JSON array of avatars")

    required = {"id", "name", "description"}
    parsed = []
    for i, item in enumerate(data):
        missing = required - set(item.keys())
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Avatar at index {i} missing fields: {', '.join(missing)}"
            )
        parsed.append({
            "id": item["id"],
            "name": item["name"],
            "description": item["description"],
            "pain_points": item.get("pain_points", []),
            "motivations": item.get("motivations", []),
            "objections": item.get("objections", []),
            "language_sample": item.get("language_sample", ""),
        })

    return {"avatars": parsed, "count": len(parsed)}
