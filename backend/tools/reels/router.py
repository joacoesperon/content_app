from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from backend.tools.reels import service
from backend.tools.reels.parser import Reel
from backend.tools.reels.schemas import (
    DirectorFileInfo,
    GenerateSceneRequest,
    GenerateSceneResponse,
    PricingInfo,
    ReelBrief,
    ReelOutput,
    RenderFinalRequest,
    RenderFinalResponse,
    SceneBrief,
    SceneInfo,
    SceneVersion,
    SetFavoriteRequest,
)

router = APIRouter()


def _reel_to_brief(reel: Reel) -> ReelBrief:
    return ReelBrief(
        number=reel.number,
        category=reel.category,
        avatar=reel.avatar,
        lever=reel.lever,
        concept=reel.concept,
        total_length=reel.total_length,
        voice_direction=reel.voice_direction,
        scenes=[
            SceneBrief(
                number=s.number,
                setting=s.setting,
                expression=s.expression,
                tone_id=s.tone_id,
                dialogue=s.dialogue,
                animation_hint=s.animation_hint,
            )
            for s in reel.scenes
        ],
        hashtags=reel.hashtags,
        rationale=reel.rationale,
        slug=reel.slug,
    )


# ─── Director file discovery ─────────────────────────────────────────────────

@router.get("/director-files", response_model=list[DirectorFileInfo])
async def list_director_files():
    return service.list_director_files()


@router.get("/director-files/{filename}", response_model=list[ReelBrief])
async def get_director_reels(filename: str):
    try:
        reels = service.load_reels(filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Director file not found: {filename}")
    return [_reel_to_brief(r) for r in reels]


# ─── Pricing ──────────────────────────────────────────────────────────────────

@router.get("/pricing", response_model=PricingInfo)
async def get_pricing():
    return service.pricing_info()


# ─── Scene generation ────────────────────────────────────────────────────────

@router.post("/generate-scene", response_model=GenerateSceneResponse)
async def generate_scene(body: GenerateSceneRequest):
    reels = service.load_reels(body.filename)
    reel = next((r for r in reels if r.number == body.reel_number), None)
    if not reel:
        raise HTTPException(
            status_code=404,
            detail=f"Reel {body.reel_number} not found in {body.filename}",
        )

    try:
        result = await asyncio.to_thread(
            service.generate_scene_full,
            body.filename, reel, body.scene_number,
            body.setting, body.expression, body.tone_id,
            body.dialogue, body.animation_hint,
            body.aspect_ratio, body.extra_image_prompt,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {e}")

    return GenerateSceneResponse(
        scene_number=result["scene_number"],
        new_version=SceneVersion(**result["new_version"]),
        all_versions=[SceneVersion(**v) for v in result["all_versions"]],
        favorite_version=result["favorite_version"],
    )


@router.post("/set-favorite", response_model=SceneInfo)
async def set_favorite(body: SetFavoriteRequest):
    try:
        entry = service.set_favorite_version(
            body.date, body.reel_slug, body.scene_number, body.version
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    versions = service._hydrate_scene_urls(body.date, body.reel_slug, entry)
    return SceneInfo(
        scene_number=body.scene_number,
        versions=[SceneVersion(**v) for v in versions],
        favorite_version=entry.get("favorite_version"),
    )


# ─── Final render ────────────────────────────────────────────────────────────

@router.post("/render-final", response_model=RenderFinalResponse)
async def render_final(body: RenderFinalRequest):
    try:
        url = await asyncio.to_thread(service.render_final, body.date, body.reel_slug)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Render failed: {e}")
    return RenderFinalResponse(final_url=url, final_filename="final.mp4")


# ─── Outputs ─────────────────────────────────────────────────────────────────

@router.get("/outputs", response_model=list[ReelOutput])
async def list_outputs():
    return service.list_generated_reels()


@router.get("/outputs/{date}/{slug}", response_model=ReelOutput)
async def get_output(date: str, slug: str):
    data = service.get_reel_output(date, slug)
    if not data:
        raise HTTPException(status_code=404, detail="Reel not found")
    return data


@router.delete("/outputs/{date}/{slug}")
async def delete_output(date: str, slug: str):
    try:
        service.delete_reel(date, slug)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"deleted": f"{date}/{slug}"}
