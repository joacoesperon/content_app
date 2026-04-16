from pydantic import BaseModel
from datetime import datetime


class GenerateRequest(BaseModel):
    templates: list[int] | None = None
    resolution: str = "2K"
    num_images: int = 4
    output_format: str = "png"


class TemplateResult(BaseModel):
    template_number: int
    template_name: str
    folder: str
    images: int
    status: str
    time: float


class GenerateJobStatus(BaseModel):
    job_id: str
    status: str  # queued, running, completed, failed
    total_templates: int
    completed_templates: int
    current_template: str | None = None
    results: list[TemplateResult] = []
    started_at: datetime | None = None
    estimated_cost: float = 0.0
    messages: list[dict] = []  # full message history for reconnection


class TemplateInfo(BaseModel):
    number: int
    name: str
    description: str
    aspect_ratio: str


class PromptInfo(BaseModel):
    template_number: int
    template_name: str
    prompt: str
    aspect_ratio: str
    needs_product_images: bool
    notes: str = ""


class OutputFolder(BaseModel):
    folder: str
    template_number: int
    template_name: str
    images: list[str]
