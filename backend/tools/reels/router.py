from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from backend.tools.reels import service
from backend.tools.reels.parser import Reel
from backend.tools.reels.schemas import (
    AnimateSceneRequest,
    DirectorFileInfo,
    GenerateSceneImageRequest,
    GenerateSceneResponse,
    PreviewImagePromptRequest,
    PreviewPromptResponse,
    PreviewVideoPromptRequest,
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
        caption=getattr(reel, "caption", ""),
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


# ─── Prompt previews (return the prompt that WOULD be sent, no FAL call) ────

@router.post("/preview-image-prompt", response_model=PreviewPromptResponse)
async def preview_image_prompt(body: PreviewImagePromptRequest):
    return PreviewPromptResponse(
        prompt=service.preview_image_prompt(body.setting, body.expression, body.extra_image_prompt)
    )


@router.post("/preview-video-prompt", response_model=PreviewPromptResponse)
async def preview_video_prompt(body: PreviewVideoPromptRequest):
    return PreviewPromptResponse(
        prompt=service.preview_video_prompt(body.dialogue, body.animation_hint, body.tone_id)
    )


# ─── Scene generation (split: image first, video on demand) ──────────────────

@router.post("/generate-scene-image", response_model=GenerateSceneResponse)
async def generate_scene_image_endpoint(body: GenerateSceneImageRequest):
    """Step 1: generate the still image for a scene. Cheap (~$0.10)."""
    reels = service.load_reels(body.filename)
    reel = next((r for r in reels if r.number == body.reel_number), None)
    if not reel:
        raise HTTPException(
            status_code=404,
            detail=f"Reel {body.reel_number} not found in {body.filename}",
        )
    try:
        result = await asyncio.to_thread(
            service.generate_scene_image_step,
            body.filename, reel, body.scene_number,
            body.setting, body.expression,
            body.aspect_ratio, body.extra_image_prompt,
            body.ref_filename, body.prompt_override,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Image generation failed: {e}")

    return GenerateSceneResponse(
        scene_number=result["scene_number"],
        new_version=SceneVersion(**result["new_version"]),
        all_versions=[SceneVersion(**v) for v in result["all_versions"]],
        favorite_version=result["favorite_version"],
    )


@router.post("/animate-scene", response_model=GenerateSceneResponse)
async def animate_scene_endpoint(body: AnimateSceneRequest):
    """Step 2: animate an existing image version with Veo 3.1 Fast i2v. Expensive (~$1.20)."""
    import traceback
    import sys

    reels = service.load_reels(body.filename)
    reel = next((r for r in reels if r.number == body.reel_number), None)
    if not reel:
        raise HTTPException(
            status_code=404,
            detail=f"Reel {body.reel_number} not found in {body.filename}",
        )
    date = service._date_from_filename(body.filename)
    try:
        result = await asyncio.to_thread(
            service.animate_scene_version_step,
            date, reel.slug, body.scene_number, body.version,
            body.dialogue, body.animation_hint, body.tone_id,
            body.aspect_ratio, body.prompt_override, body.auto_fix,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # log the full traceback so we can debug FAL errors
        print(f"\n[reels/animate-scene] FAL call failed:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=502, detail=f"Animation failed: {type(e).__name__}: {e}")

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
