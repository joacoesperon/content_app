from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from backend.tools.carousels import service
from backend.tools.carousels.parser import Post
from backend.tools.carousels.schemas import (
    CarouselOutput,
    GenerateSlideRequest,
    GenerateSlideResponse,
    ModifierInfo,
    PostBrief,
    PricingInfo,
    ScoutFileInfo,
    SetFavoriteRequest,
    SlideBrief,
    SlideInfo,
    SlideVersion,
)

router = APIRouter()


def _post_to_brief(post: Post) -> PostBrief:
    return PostBrief(
        number=post.number,
        category=post.category,
        avatar=post.avatar,
        lever=post.lever,
        caption=post.caption,
        slides=[SlideBrief(number=s.number, label=s.label, prompt=s.prompt) for s in post.slides],
        hashtags=post.hashtags,
        rationale=post.rationale,
        slug=post.slug,
    )


# ─── Scout file discovery ─────────────────────────────────────────────────────

@router.get("/scout-files", response_model=list[ScoutFileInfo])
async def get_scout_files():
    return service.list_scout_files()


@router.get("/scout-files/{filename}", response_model=list[PostBrief])
async def get_scout_file_posts(filename: str):
    try:
        posts = service.load_posts(filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Scout file not found: {filename}")
    return [_post_to_brief(p) for p in posts]


# ─── Brand modifier + pricing ────────────────────────────────────────────────

@router.get("/modifier", response_model=ModifierInfo)
async def get_modifier():
    return ModifierInfo(modifier=service.get_modifier())


@router.get("/pricing", response_model=PricingInfo)
async def get_pricing():
    return service.pricing_info()


# ─── Generation ───────────────────────────────────────────────────────────────

@router.post("/generate-slide", response_model=GenerateSlideResponse)
async def generate_slide(body: GenerateSlideRequest):
    """Generate a new version of a slide (appends to version list)."""
    posts = service.load_posts(body.filename)
    post = next((p for p in posts if p.number == body.post_number), None)
    if not post:
        raise HTTPException(
            status_code=404,
            detail=f"Post {body.post_number} not found in {body.filename}",
        )
    slide = next((s for s in post.slides if s.number == body.slide_number), None)
    label = slide.label if slide else f"Slide {body.slide_number}"

    # validate resolution + aspect_ratio + thinking_level
    if body.resolution not in service.RESOLUTION_MULTIPLIERS:
        raise HTTPException(status_code=400, detail=f"Invalid resolution: {body.resolution}")
    if body.aspect_ratio not in service.ALLOWED_ASPECT_RATIOS:
        raise HTTPException(status_code=400, detail=f"Invalid aspect_ratio: {body.aspect_ratio}")
    if body.thinking_level not in (None, "minimal", "high"):
        raise HTTPException(status_code=400, detail=f"Invalid thinking_level: {body.thinking_level}")

    try:
        image_bytes, prompt_used = await asyncio.to_thread(
            service.generate_slide_image,
            body.prompt,
            body.apply_modifier,
            body.resolution,
            body.aspect_ratio,
            body.seed,
            body.thinking_level,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FAL generation failed: {e}")

    result = service.save_generated_slide(
        body.filename,
        post,
        body.slide_number,
        label,
        image_bytes,
        prompt_used,
        body.apply_modifier,
        body.resolution,
        body.aspect_ratio,
        body.seed,
        body.thinking_level,
    )
    return GenerateSlideResponse(
        slide_number=result["slide_number"],
        label=result["label"],
        new_version=SlideVersion(**result["new_version"]),
        all_versions=[SlideVersion(**v) for v in result["all_versions"]],
        favorite_version=result["favorite_version"],
    )


@router.post("/set-favorite", response_model=SlideInfo)
async def set_favorite(body: SetFavoriteRequest):
    try:
        entry = service.set_favorite_version(
            body.date, body.post_slug, body.slide_number, body.version
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    versions = service._hydrate_slide_urls(body.date, body.post_slug, entry)
    return SlideInfo(
        slide_number=body.slide_number,
        label=entry.get("label", ""),
        versions=[SlideVersion(**v) for v in versions],
        favorite_version=entry.get("favorite_version"),
    )


# ─── History / outputs ────────────────────────────────────────────────────────

@router.get("/outputs", response_model=list[CarouselOutput])
async def list_outputs():
    return service.list_generated_carousels()


@router.get("/outputs/{date}/{slug}", response_model=CarouselOutput)
async def get_output(date: str, slug: str):
    data = service.get_carousel(date, slug)
    if not data:
        raise HTTPException(status_code=404, detail="Carousel not found")
    return data


@router.get("/outputs/{date}/{slug}/zip")
async def download_zip(date: str, slug: str):
    try:
        data, name = service.build_zip(f"{date}/{slug}")
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(
        content=data,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


@router.delete("/outputs/{date}/{slug}")
async def delete_output(date: str, slug: str):
    try:
        service.delete_carousel(f"{date}/{slug}")
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"deleted": f"{date}/{slug}"}
