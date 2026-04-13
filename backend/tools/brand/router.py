import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from backend.config import BRAND_DIR
from backend.tools.brand import service
from backend.tools.brand.schemas import (
    BrandDna,
    BrandOverviewUpdate,
    BrandVisualSystemUpdate,
    BrandPhotographyDirectionUpdate,
    BrandProductUpdate,
    BrandAdCreativeStyleUpdate,
    BrandPromptModifierUpdate,
    MediaFile,
)

router = APIRouter()

MEDIA_TYPES = {"product-images", "reference-images"}


# ─── Brand DNA ────────────────────────────────────────────────────────────────

@router.get("/dna", response_model=BrandDna)
async def get_dna():
    try:
        return service.load_dna(BRAND_DIR)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="brand-dna.json not found")


@router.put("/dna/overview")
async def update_overview(body: BrandOverviewUpdate):
    data = service.load_dna(BRAND_DIR)
    patch = body.model_dump(exclude_none=True)
    data["overview"].update(patch)
    service.save_dna(BRAND_DIR, data)
    return data["overview"]


@router.put("/dna/visual-system")
async def update_visual_system(body: BrandVisualSystemUpdate):
    data = service.load_dna(BRAND_DIR)
    patch = body.model_dump(exclude_none=True)
    data["visual_system"].update(patch)
    service.save_dna(BRAND_DIR, data)
    return data["visual_system"]


@router.put("/dna/photography-direction")
async def update_photography_direction(body: BrandPhotographyDirectionUpdate):
    data = service.load_dna(BRAND_DIR)
    patch = body.model_dump(exclude_none=True)
    data["photography_direction"].update(patch)
    service.save_dna(BRAND_DIR, data)
    return data["photography_direction"]


@router.put("/dna/product")
async def update_product(body: BrandProductUpdate):
    data = service.load_dna(BRAND_DIR)
    patch = body.model_dump(exclude_none=True)
    data["product"].update(patch)
    service.save_dna(BRAND_DIR, data)
    return data["product"]


@router.put("/dna/ad-creative-style")
async def update_ad_creative_style(body: BrandAdCreativeStyleUpdate):
    data = service.load_dna(BRAND_DIR)
    patch = body.model_dump(exclude_none=True)
    data["ad_creative_style"].update(patch)
    service.save_dna(BRAND_DIR, data)
    return data["ad_creative_style"]


@router.put("/dna/prompt-modifier")
async def update_prompt_modifier(body: BrandPromptModifierUpdate):
    data = service.load_dna(BRAND_DIR)
    data["image_prompt_modifier"] = body.image_prompt_modifier
    service.save_dna(BRAND_DIR, data)
    return {"image_prompt_modifier": data["image_prompt_modifier"]}


# ─── Media ────────────────────────────────────────────────────────────────────

@router.get("/media", response_model=list[MediaFile])
async def list_media(type: str = "product-images"):
    if type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of: {', '.join(MEDIA_TYPES)}")
    return service.list_media(BRAND_DIR, type)


@router.post("/media")
async def upload_media(type: str = "product-images", file: UploadFile = File(...)):
    if type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of: {', '.join(MEDIA_TYPES)}")

    media_dir = BRAND_DIR / type
    media_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name if file.filename else "upload"
    dest = media_dir / safe_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"filename": safe_name, "type": type, "url": f"/files/{type}/{safe_name}"}


@router.delete("/media/{media_type}/{filename}")
async def delete_media(media_type: str, filename: str):
    if media_type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of: {', '.join(MEDIA_TYPES)}")
    try:
        service.delete_media(BRAND_DIR, media_type, filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"{filename} not found")
    return {"deleted": filename}
