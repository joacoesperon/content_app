import json
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
    BrandAdCreativeStyleUpdate,
    BrandPromptModifierUpdate,
    BrandRawUpdate,
    MediaFile,
    Product,
    ProductCreate,
    ProductUpdate,
)

router = APIRouter()

MEDIA_TYPES = {"product-images", "reference-images"}


# ─── Brand DNA (sections) ─────────────────────────────────────────────────────

@router.get("/dna", response_model=BrandDna)
async def get_dna():
    try:
        return service.load_dna(BRAND_DIR)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="brand-dna.json not found")


@router.put("/dna/overview")
async def update_overview(body: BrandOverviewUpdate):
    data = service.load_dna(BRAND_DIR)
    data["overview"].update(body.model_dump(exclude_none=True))
    service.save_dna(BRAND_DIR, data)
    return data["overview"]


@router.put("/dna/visual-system")
async def update_visual_system(body: BrandVisualSystemUpdate):
    data = service.load_dna(BRAND_DIR)
    data["visual_system"].update(body.model_dump(exclude_none=True))
    service.save_dna(BRAND_DIR, data)
    return data["visual_system"]


@router.put("/dna/photography-direction")
async def update_photography_direction(body: BrandPhotographyDirectionUpdate):
    data = service.load_dna(BRAND_DIR)
    data["photography_direction"].update(body.model_dump(exclude_none=True))
    service.save_dna(BRAND_DIR, data)
    return data["photography_direction"]


@router.put("/dna/ad-creative-style")
async def update_ad_creative_style(body: BrandAdCreativeStyleUpdate):
    data = service.load_dna(BRAND_DIR)
    data["ad_creative_style"].update(body.model_dump(exclude_none=True))
    service.save_dna(BRAND_DIR, data)
    return data["ad_creative_style"]


@router.put("/dna/prompt-modifier")
async def update_prompt_modifier(body: BrandPromptModifierUpdate):
    data = service.load_dna(BRAND_DIR)
    data["image_prompt_modifier"] = body.image_prompt_modifier
    service.save_dna(BRAND_DIR, data)
    return {"image_prompt_modifier": data["image_prompt_modifier"]}


# ─── Raw JSON (plain text edit) ───────────────────────────────────────────────

@router.get("/dna/raw")
async def get_dna_raw():
    try:
        data = service.load_dna(BRAND_DIR)
        return {"json_str": json.dumps(data, ensure_ascii=False, indent=2)}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="brand-dna.json not found")


@router.put("/dna/raw")
async def update_dna_raw(body: BrandRawUpdate):
    try:
        data = json.loads(body.json_str)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {e}")
    service.save_dna(BRAND_DIR, data)
    return {"ok": True}


# ─── Products CRUD ────────────────────────────────────────────────────────────

@router.get("/dna/products", response_model=list[Product])
async def list_products():
    data = service.load_dna(BRAND_DIR)
    return data.get("products", [])


@router.post("/dna/products", response_model=Product)
async def create_product(body: ProductCreate):
    data = service.load_dna(BRAND_DIR)
    products = data.get("products", [])
    if any(p["id"] == body.id for p in products):
        raise HTTPException(status_code=409, detail=f"Product '{body.id}' already exists")
    new_product = body.model_dump()
    products.append(new_product)
    data["products"] = products
    service.save_dna(BRAND_DIR, data)
    return new_product


@router.put("/dna/products/{product_id}", response_model=Product)
async def update_product(product_id: str, body: ProductUpdate):
    data = service.load_dna(BRAND_DIR)
    products = data.get("products", [])
    for i, p in enumerate(products):
        if p["id"] == product_id:
            products[i] = {**p, **body.model_dump(exclude_none=True)}
            data["products"] = products
            service.save_dna(BRAND_DIR, data)
            return products[i]
    raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")


@router.delete("/dna/products/{product_id}")
async def delete_product(product_id: str):
    data = service.load_dna(BRAND_DIR)
    products = data.get("products", [])
    new_list = [p for p in products if p["id"] != product_id]
    if len(new_list) == len(products):
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    data["products"] = new_list
    service.save_dna(BRAND_DIR, data)
    # Remove product images folder if it exists
    img_dir = BRAND_DIR / "product-images" / product_id
    if img_dir.exists():
        shutil.rmtree(img_dir)
    return {"deleted": product_id}


# ─── Media ────────────────────────────────────────────────────────────────────

@router.get("/media", response_model=list[MediaFile])
async def list_media(type: str = "product-images", product_id: str = ""):
    if type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of: {', '.join(MEDIA_TYPES)}")
    return service.list_media(BRAND_DIR, type, product_id)


@router.post("/media")
async def upload_media(type: str = "product-images", product_id: str = "", file: UploadFile = File(...)):
    if type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of: {', '.join(MEDIA_TYPES)}")

    if type == "product-images" and product_id:
        media_dir = BRAND_DIR / "product-images" / product_id
    else:
        media_dir = BRAND_DIR / type
    media_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name if file.filename else "upload"
    dest = media_dir / safe_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if type == "product-images" and product_id:
        url = f"/files/product-images/{product_id}/{safe_name}"
    else:
        url = f"/files/{type}/{safe_name}"

    return {"filename": safe_name, "type": type, "url": url}


@router.delete("/media/{media_type}/{filename}")
async def delete_media(media_type: str, filename: str, product_id: str = ""):
    if media_type not in MEDIA_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of: {', '.join(MEDIA_TYPES)}")
    try:
        service.delete_media(BRAND_DIR, media_type, filename, product_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"{filename} not found")
    return {"deleted": filename}


# ─── Reference Ads Library ────────────────────────────────────────────────────

REF_ADS_DIR = BRAND_DIR / "reference-ads"
REF_ADS_META = BRAND_DIR / "data" / "reference-ads.json"
_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def _load_ref_ads_meta() -> dict[str, str]:
    if not REF_ADS_META.exists():
        return {}
    return json.loads(REF_ADS_META.read_text(encoding="utf-8"))


def _save_ref_ads_meta(meta: dict[str, str]):
    REF_ADS_META.parent.mkdir(parents=True, exist_ok=True)
    REF_ADS_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


@router.get("/reference-ads")
async def list_reference_ads():
    REF_ADS_DIR.mkdir(parents=True, exist_ok=True)
    meta = _load_ref_ads_meta()
    files = sorted(
        f for f in REF_ADS_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in _IMAGE_EXTS
    )
    return [
        {"filename": f.name, "url": f"/files/reference-ads/{f.name}", "label": meta.get(f.name, "")}
        for f in files
    ]


@router.post("/reference-ads")
async def upload_reference_ad(label: str = "", file: UploadFile = File(...)):
    REF_ADS_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename).name if file.filename else "ad.png"
    dest = REF_ADS_DIR / safe_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    if label:
        meta = _load_ref_ads_meta()
        meta[safe_name] = label
        _save_ref_ads_meta(meta)
    return {"filename": safe_name, "url": f"/files/reference-ads/{safe_name}", "label": label}


@router.patch("/reference-ads/{filename}")
async def update_reference_ad_label(filename: str, body: dict):
    meta = _load_ref_ads_meta()
    meta[filename] = body.get("label", "")
    _save_ref_ads_meta(meta)
    return {"filename": filename, "label": meta[filename]}


@router.delete("/reference-ads/{filename}")
async def delete_reference_ad(filename: str):
    path = REF_ADS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{filename} not found")
    path.unlink()
    meta = _load_ref_ads_meta()
    meta.pop(filename, None)
    _save_ref_ads_meta(meta)
    return {"deleted": filename}
