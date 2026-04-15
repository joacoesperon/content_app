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
        brand_context = dna_file.read_text(encoding="utf-8")

    product_override = f"\nPRODUCT FOCUS (override): {body.product}" if body.product else ""
    extra_context = f"\nAdditional context: {body.context}" if body.context else ""

    prompt = f"""You are a direct-response marketing strategist specializing in customer avatar research and Facebook/Instagram ad creative strategy.

Your task: Produce a deep research report on the target audience for this brand. Identify 10 distinct customer avatar archetypes who would buy this product. Each avatar must represent a real, specific type of person — not a demographic abstraction.

BRAND CONTEXT (includes product details, visual system, and ad style):
{brand_context}{product_override}{extra_context}

For each avatar, deeply research and define:
1. **Who they are** — their specific situation, daily reality, identity
2. **Pain points** — what they struggle with right now (be concrete, not generic)
3. **Desires** — what they actually want (the transformation they're seeking)
4. **Why they BUY** — their core motivation, the emotional trigger that pushes them to purchase
5. **Why they DON'T buy** — specific objections and fears that hold them back
6. **Language they use** — the exact words, phrases, and expressions they use to describe their problem (not marketing-speak — their actual language)
7. **Facebook/Instagram ad angles** — 2-3 specific angles that would stop this avatar mid-scroll; what hook, message, or creative direction would resonate most with them given their pain points and desires

OUTPUT FORMAT — Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {{
    "id": "short_slug_no_spaces",
    "name": "Avatar Name (2-3 words)",
    "description": "1-2 sentences describing their specific situation and identity",
    "pain_points": ["specific pain 1", "specific pain 2", "specific pain 3"],
    "desires": ["what they truly want 1", "what they truly want 2"],
    "motivations": ["core buying motivation 1", "core buying motivation 2"],
    "objections": ["specific objection/fear 1", "specific objection/fear 2"],
    "language_sample": "A quote in their own words — exactly how they'd describe their situation to a friend",
    "ad_angles": [
      "Angle 1: specific hook or creative direction that would resonate with this avatar",
      "Angle 2: different angle exploiting a different pain point or desire",
      "Angle 3: a contrarian or curiosity-based angle for this avatar"
    ]
  }}
]

Rules:
- Be specific and concrete — avoid generic marketing language
- Each avatar must be meaningfully different from the others
- The language_sample must sound like a real person, not a marketer
- Ad angles must be specific enough to brief a creative team, not vague directions
- Generate exactly 10 avatars"""

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
            "desires": item.get("desires", []),
            "motivations": item.get("motivations", []),
            "objections": item.get("objections", []),
            "language_sample": item.get("language_sample", ""),
            "ad_angles": item.get("ad_angles", []),
        })

    return {"avatars": parsed, "count": len(parsed)}
