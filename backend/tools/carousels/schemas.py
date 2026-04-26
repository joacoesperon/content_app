from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ─── Scout briefs (input) ─────────────────────────────────────────────────────

class SlideBrief(BaseModel):
    number: int
    label: str
    prompt: str


class PostBrief(BaseModel):
    number: int
    category: str
    avatar: str
    lever: str
    caption: str
    slides: list[SlideBrief]
    hashtags: str
    rationale: str
    slug: str


class ScoutFileInfo(BaseModel):
    filename: str
    posts_count: int


# ─── Generated outputs ────────────────────────────────────────────────────────

class SlideVersion(BaseModel):
    version: int
    filename: str
    url: str
    prompt_used: str
    apply_modifier: bool
    resolution: str
    aspect_ratio: str = "4:5"
    seed: Optional[int] = None
    thinking_level: Optional[str] = None
    generated_at: str


class SlideInfo(BaseModel):
    slide_number: int
    label: str
    versions: list[SlideVersion]
    favorite_version: Optional[int] = None  # None = use latest


class GenerateSlideRequest(BaseModel):
    filename: str
    post_number: int
    slide_number: int
    prompt: str
    apply_modifier: bool = True
    resolution: str = "2K"
    aspect_ratio: str = "4:5"
    seed: Optional[int] = None
    thinking_level: Optional[str] = None  # "minimal" | "high" | None


class GenerateSlideResponse(BaseModel):
    slide_number: int
    label: str
    new_version: SlideVersion
    all_versions: list[SlideVersion]
    favorite_version: Optional[int]


class SetFavoriteRequest(BaseModel):
    date: str
    post_slug: str
    slide_number: int
    version: Optional[int]  # None = unset (use latest)


class CarouselOutput(BaseModel):
    folder: str  # "YYYY-MM-DD/post-slug"
    date: str
    post_slug: str
    post_number: Optional[int] = None
    category: str = ""
    avatar: str = ""
    lever: str = ""
    caption: str = ""
    hashtags: str = ""
    slides: list[SlideInfo]


class ModifierInfo(BaseModel):
    modifier: str


class PricingInfo(BaseModel):
    base_per_image: float  # price for 1K
    resolution_multipliers: dict[str, float]
    thinking_high_extra: float
    thinking_minimal_extra: float
    web_search_extra: float
