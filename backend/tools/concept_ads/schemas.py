from __future__ import annotations
from pydantic import BaseModel


class Format(BaseModel):
    id: str
    name: str
    description: str
    visual_rules: str
    copy_guidance: str


class BuildPromptRequest(BaseModel):
    avatar_ids: list[str]
    format_ids: list[str]
    count: int = 6
    aspect_ratio: str = "4:5"
    product_id: str = ""          # empty = use first product
    use_product_images: bool = False
    use_brand_dna: bool = True
    offer_cta: str = ""           # e.g. "Shop Now, 20% off first order"


class ParsePlanRequest(BaseModel):
    raw: str


class ConceptItem(BaseModel):
    concept_index: int
    avatar_id: str
    format_id: str
    hook: str
    angle: str
    prompt_additions: str
    aspect_ratio: str = "4:5"


class GenerateConceptsRequest(BaseModel):
    concepts: list[ConceptItem]
    resolution: str = "2K"
    num_images: int = 2
    output_format: str = "png"


class RemixRequest(BaseModel):
    reference_path: str
    instructions: str
    count: int = 2
    aspect_ratio: str = "4:5"
    resolution: str = "2K"
    output_format: str = "png"


class ConceptJobStatus(BaseModel):
    job_id: str
    status: str  # pending | running | completed | failed
    total: int = 0
    completed: int = 0
    errors: int = 0
    message: str = ""
