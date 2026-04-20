"""Meta Ads Bulk Uploader — FastAPI router."""
from __future__ import annotations
import mimetypes
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from backend.tools.meta_ads import meta_client, storage
from backend.tools.meta_ads.schemas import (
    CreateAdSetRequest,
    CreateBatchRequest,
    LaunchResult,
    SaveSettingsRequest,
    UpdateBatchRequest,
    UpdateCreativeRequest,
)
from backend.tools.meta_ads.meta_client import MetaAPIError

router = APIRouter()


IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}


def _require_settings() -> dict:
    s = storage.load_settings()
    if not s.get("access_token") or not s.get("ad_account_id"):
        raise HTTPException(status_code=400, detail="Meta settings not configured")
    return s


def _mask_token(token: str) -> str:
    if not token:
        return ""
    if len(token) <= 8:
        return "•" * len(token)
    return "•" * (len(token) - 8) + token[-8:]


# ─── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings():
    s = storage.load_settings()
    token = s.get("access_token", "")
    return {
        **s,
        "access_token": "",  # never ship the raw token to the client
        "access_token_masked": _mask_token(token),
        "configured": bool(token and s.get("ad_account_id")),
    }


@router.post("/settings")
async def set_settings(body: SaveSettingsRequest):
    updates = body.model_dump(exclude_unset=True)
    saved = storage.save_settings(updates)
    return {
        **saved,
        "access_token": "",
        "access_token_masked": _mask_token(saved.get("access_token", "")),
        "configured": bool(saved.get("access_token") and saved.get("ad_account_id")),
    }


# ─── Meta API proxies ─────────────────────────────────────────────────────────

@router.get("/accounts")
async def list_accounts():
    s = storage.load_settings()
    token = s.get("access_token")
    if not token:
        raise HTTPException(status_code=400, detail="Access token not configured")
    try:
        return meta_client.get_ad_accounts(token)
    except MetaAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/pages")
async def list_pages():
    s = storage.load_settings()
    token = s.get("access_token")
    if not token:
        raise HTTPException(status_code=400, detail="Access token not configured")
    try:
        return meta_client.get_pages(token)
    except MetaAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/campaigns")
async def list_campaigns():
    s = _require_settings()
    try:
        return meta_client.get_campaigns(s["ad_account_id"], s["access_token"])
    except MetaAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/adsets")
async def list_ad_sets(campaign_id: str):
    s = _require_settings()
    try:
        return meta_client.get_ad_sets(campaign_id, s["access_token"])
    except MetaAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/adsets")
async def create_ad_set(body: CreateAdSetRequest):
    s = _require_settings()
    try:
        return meta_client.create_ad_set(
            s["ad_account_id"],
            s["access_token"],
            body.campaign_id,
            body.source_ad_set_id,
            body.name,
        )
    except MetaAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Batches ──────────────────────────────────────────────────────────────────

@router.post("/batches")
async def create_batch(body: CreateBatchRequest):
    return storage.create_batch(body.name)


@router.get("/batches")
async def list_batches():
    return storage.list_batches()


@router.get("/batches/{batch_id}")
async def get_batch(batch_id: str):
    batch = storage.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    creatives = storage.list_creatives(batch_id)
    return {"batch": batch, "creatives": creatives}


@router.put("/batches/{batch_id}")
async def update_batch(batch_id: str, body: UpdateBatchRequest):
    updates = body.model_dump(exclude_unset=True)
    updated = storage.update_batch(batch_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Batch not found")
    return updated


# ─── File Upload ─────────────────────────────────────────────────────────────

def _classify(filename: str, content_type: Optional[str]) -> tuple[str, str]:
    ext = Path(filename).suffix.lower()
    if ext in IMAGE_EXTS:
        return "image", content_type or mimetypes.guess_type(filename)[0] or "image/jpeg"
    if ext in VIDEO_EXTS:
        return "video", content_type or mimetypes.guess_type(filename)[0] or "video/mp4"
    raise HTTPException(status_code=422, detail=f"Unsupported file type: {ext}")


@router.post("/upload")
async def upload_creatives(
    batch_id: str = Form(...),
    files: list[UploadFile] = File(...),
):
    batch = storage.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    created = []
    upload_dir = storage.uploads_dir_for(batch_id)

    for upload in files:
        original = upload.filename or "file"
        file_type, mime_type = _classify(original, upload.content_type)
        safe_name = Path(original).name
        dest = upload_dir / safe_name
        # Avoid collisions
        counter = 1
        stem = dest.stem
        suffix = dest.suffix
        while dest.exists():
            dest = upload_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        data = await upload.read()
        dest.write_bytes(data)

        ad_name = dest.stem
        creative = storage.create_creative(
            batch_id=batch_id,
            filename=dest.name,
            ad_name=ad_name,
            file_type=file_type,
            mime_type=mime_type,
            file_path=str(dest),
        )
        created.append(creative)

    return {"creatives": created}


@router.put("/creatives/{creative_id}")
async def rename_creative(creative_id: str, body: UpdateCreativeRequest):
    batch_id = storage.find_batch_for_creative(creative_id)
    if not batch_id:
        raise HTTPException(status_code=404, detail="Creative not found")
    updated = storage.update_creative(
        batch_id, creative_id, body.model_dump(exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Creative not found")
    return updated


@router.post("/creatives/{creative_id}/thumbnail")
async def upload_creative_thumbnail(creative_id: str, file: UploadFile = File(...)):
    batch_id = storage.find_batch_for_creative(creative_id)
    if not batch_id:
        raise HTTPException(status_code=404, detail="Creative not found")

    creatives = storage.list_creatives(batch_id)
    creative = next((c for c in creatives if c["id"] == creative_id), None)
    if not creative or creative.get("file_type") != "video":
        raise HTTPException(status_code=422, detail="Thumbnails only supported for videos")

    thumb_dir = storage.uploads_dir_for(batch_id) / "thumbnails"
    thumb_dir.mkdir(parents=True, exist_ok=True)
    safe = Path(file.filename or "thumb.jpg").name
    dest = thumb_dir / f"{creative_id}_{safe}"
    dest.write_bytes(await file.read())

    updated = storage.update_creative(
        batch_id, creative_id, {"thumbnail_path": str(dest)}
    )
    return updated


# ─── Launch ──────────────────────────────────────────────────────────────────

@router.post("/launch/{batch_id}", response_model=LaunchResult)
async def launch_batch(batch_id: str):
    s = _require_settings()
    if not s.get("page_id"):
        raise HTTPException(status_code=400, detail="Facebook page not configured")

    batch = storage.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if not batch.get("ad_set_id"):
        raise HTTPException(status_code=422, detail="Batch is missing ad set selection")
    if not batch.get("url"):
        raise HTTPException(status_code=422, detail="Batch is missing destination URL")

    creatives = storage.list_creatives(batch_id)
    if not creatives:
        raise HTTPException(status_code=422, detail="Batch has no creatives")

    storage.update_batch(batch_id, {"status": "launching", "ads_created": 0, "ads_errored": 0, "error_log": []})

    token = s["access_token"]
    ad_account_id = s["ad_account_id"]
    page_id = s["page_id"]
    status = "PAUSED" if batch.get("launch_as_paused", True) else "ACTIVE"
    error_log: list[str] = []
    created_count = 0
    errored_count = 0

    for creative in creatives:
        cid = creative["id"]
        try:
            storage.update_creative(batch_id, cid, {"status": "uploading", "error_message": ""})
            file_path = Path(creative["file_path"])
            file_bytes = file_path.read_bytes()

            if creative["file_type"] == "image":
                image_hash = meta_client.upload_image(
                    ad_account_id, token, file_bytes, file_path.name, creative["mime_type"]
                )
                creative_id = meta_client.create_image_ad_creative(
                    ad_account_id,
                    token,
                    name=creative["ad_name"],
                    page_id=page_id,
                    image_hash=image_hash,
                    primary_texts=batch.get("primary_texts", []),
                    headlines=batch.get("headlines", []),
                    descriptions=batch.get("descriptions", []),
                    url=batch["url"],
                    display_link=batch.get("display_link", ""),
                    cta_type=batch.get("cta_type", "SHOP_NOW"),
                    enhancements_enabled=batch.get("enhancements_enabled", False),
                )
            else:  # video
                video_id = meta_client.upload_video(
                    ad_account_id, token, file_bytes, file_path.name, creative["mime_type"]
                )
                thumbnail_hash: Optional[str] = None
                if creative.get("thumbnail_path"):
                    thumb_path = Path(creative["thumbnail_path"])
                    if thumb_path.exists():
                        thumb_mime = mimetypes.guess_type(thumb_path.name)[0] or "image/jpeg"
                        thumbnail_hash = meta_client.upload_image(
                            ad_account_id,
                            token,
                            thumb_path.read_bytes(),
                            thumb_path.name,
                            thumb_mime,
                        )
                creative_id = meta_client.create_video_ad_creative(
                    ad_account_id,
                    token,
                    name=creative["ad_name"],
                    page_id=page_id,
                    video_id=video_id,
                    thumbnail_url=None,
                    thumbnail_hash=thumbnail_hash,
                    primary_texts=batch.get("primary_texts", []),
                    headlines=batch.get("headlines", []),
                    descriptions=batch.get("descriptions", []),
                    url=batch["url"],
                    cta_type=batch.get("cta_type", "SHOP_NOW"),
                    enhancements_enabled=batch.get("enhancements_enabled", False),
                )

            ad_id = meta_client.create_ad(
                ad_account_id,
                token,
                name=creative["ad_name"],
                ad_set_id=batch["ad_set_id"],
                creative_id=creative_id,
                status=status,
            )
            storage.update_creative(batch_id, cid, {
                "status": "ready",
                "meta_ad_id": ad_id,
                "meta_creative_id": creative_id,
            })
            created_count += 1
        except Exception as e:
            msg = str(e)
            storage.update_creative(batch_id, cid, {"status": "errored", "error_message": msg})
            error_log.append(f"{creative['ad_name']}: {msg}")
            errored_count += 1

    final_status = "completed" if errored_count == 0 else ("failed" if created_count == 0 else "completed")
    storage.update_batch(batch_id, {
        "status": final_status,
        "ads_created": created_count,
        "ads_errored": errored_count,
        "error_log": error_log,
    })

    return LaunchResult(
        batch_id=batch_id,
        status=final_status,
        ads_created=created_count,
        ads_errored=errored_count,
        error_log=error_log,
    )
