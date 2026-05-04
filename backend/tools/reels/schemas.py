from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ─── Director input ───────────────────────────────────────────────────────────

class SceneBrief(BaseModel):
    number: int
    setting: str
    expression: str
    tone_id: str
    dialogue: str
    animation_hint: str


class ReelBrief(BaseModel):
    number: int
    category: str
    avatar: str
    lever: str
    concept: str
    caption: str = ""
    total_length: str
    voice_direction: str
    scenes: list[SceneBrief]
    hashtags: str
    rationale: str
    slug: str


class DirectorFileInfo(BaseModel):
    filename: str
    reels_count: int


# ─── Generated outputs ────────────────────────────────────────────────────────

class SceneVersion(BaseModel):
    version: int
    image_filename: Optional[str] = None
    image_url: Optional[str] = None
    video_filename: Optional[str] = None
    video_url: Optional[str] = None
    setting: str = ""
    expression: str = ""
    tone_id: str = ""
    dialogue: str = ""
    animation_hint: str = ""
    image_prompt_used: str = ""
    video_prompt_used: str = ""
    refs_used: list[str] = []
    aspect_ratio: str = ""
    generated_at: str = ""


class SceneInfo(BaseModel):
    scene_number: int
    versions: list[SceneVersion]
    favorite_version: Optional[int] = None


class GenerateSceneImageRequest(BaseModel):
    filename: str
    reel_number: int
    scene_number: int
    setting: str
    expression: str
    aspect_ratio: str = "9:16"
    extra_image_prompt: str = ""
    ref_filename: Optional[str] = None  # which mascot ref to use; None = auto-resolve
    prompt_override: Optional[str] = None  # if set, replaces the auto-built image prompt entirely


class AnimateSceneRequest(BaseModel):
    filename: str
    reel_number: int
    scene_number: int
    version: int
    dialogue: str
    animation_hint: str
    tone_id: str
    aspect_ratio: str = "9:16"
    prompt_override: Optional[str] = None  # if set, replaces the auto-built video prompt entirely
    auto_fix: bool = True


class PreviewImagePromptRequest(BaseModel):
    setting: str
    expression: str
    extra_image_prompt: str = ""


class PreviewVideoPromptRequest(BaseModel):
    dialogue: str
    animation_hint: str
    tone_id: str


class PreviewPromptResponse(BaseModel):
    prompt: str


class GenerateSceneResponse(BaseModel):
    scene_number: int
    new_version: SceneVersion
    all_versions: list[SceneVersion]
    favorite_version: Optional[int]


class SetFavoriteRequest(BaseModel):
    date: str
    reel_slug: str
    scene_number: int
    version: Optional[int]


class RenderFinalRequest(BaseModel):
    date: str
    reel_slug: str


class RenderFinalResponse(BaseModel):
    final_url: str
    final_filename: str


class ReelOutput(BaseModel):
    folder: str
    date: str
    reel_slug: str
    reel_number: Optional[int] = None
    category: str = ""
    avatar: str = ""
    lever: str = ""
    concept: str = ""
    caption: str = ""
    voice_direction: str = ""
    hashtags: str = ""
    scenes: list[SceneInfo]
    final_url: Optional[str] = None  # if final.mp4 has been rendered


class PricingInfo(BaseModel):
    image_per_scene: float
    video_per_scene: float
    estimated_per_reel_3_scenes: float
    estimated_per_reel_4_scenes: float
