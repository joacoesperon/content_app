from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class BrandOverview(BaseModel):
    name: str
    tagline: str
    design_agency: str
    voice_adjectives: list[str]
    positioning: str
    competitive_differentiation: str


class BrandVisualSystem(BaseModel):
    primary_font: str
    secondary_font: str
    primary_color: str
    secondary_color: str
    accent_color: str
    background_colors: str
    text_colors: str
    cta_style: str


class BrandPhotographyDirection(BaseModel):
    lighting: str
    color_grading: str
    composition: str
    subject_matter: str
    props_and_surfaces: str
    mood: str


class Product(BaseModel):
    id: str
    name: str
    description: str
    price: str
    delivery_platform: str
    distinctive_features: list[str]
    ecosystem: str


class ProductCreate(BaseModel):
    id: str
    name: str
    description: str = ""
    price: str = ""
    delivery_platform: str = ""
    distinctive_features: list[str] = []
    ecosystem: str = ""


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    delivery_platform: Optional[str] = None
    distinctive_features: Optional[list[str]] = None
    ecosystem: Optional[str] = None


class BrandAdCreativeStyle(BaseModel):
    typical_formats: str
    text_overlay_style: str
    photo_vs_illustration: str
    ugc_usage: str
    offer_presentation: str


class BrandDna(BaseModel):
    overview: BrandOverview
    visual_system: BrandVisualSystem
    photography_direction: BrandPhotographyDirection
    products: list[Product]
    ad_creative_style: BrandAdCreativeStyle
    image_prompt_modifier: str


# Partial update models (all fields optional)

class BrandOverviewUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    design_agency: Optional[str] = None
    voice_adjectives: Optional[list[str]] = None
    positioning: Optional[str] = None
    competitive_differentiation: Optional[str] = None


class BrandVisualSystemUpdate(BaseModel):
    primary_font: Optional[str] = None
    secondary_font: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_colors: Optional[str] = None
    text_colors: Optional[str] = None
    cta_style: Optional[str] = None


class BrandPhotographyDirectionUpdate(BaseModel):
    lighting: Optional[str] = None
    color_grading: Optional[str] = None
    composition: Optional[str] = None
    subject_matter: Optional[str] = None
    props_and_surfaces: Optional[str] = None
    mood: Optional[str] = None


class BrandAdCreativeStyleUpdate(BaseModel):
    typical_formats: Optional[str] = None
    text_overlay_style: Optional[str] = None
    photo_vs_illustration: Optional[str] = None
    ugc_usage: Optional[str] = None
    offer_presentation: Optional[str] = None


class BrandPromptModifierUpdate(BaseModel):
    image_prompt_modifier: str


class BrandRawUpdate(BaseModel):
    json_str: str


class MediaFile(BaseModel):
    filename: str
    type: str
    url: str
