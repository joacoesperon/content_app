from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class Avatar(BaseModel):
    id: str
    name: str
    description: str
    pain_points: list[str] = []
    motivations: list[str] = []
    objections: list[str] = []
    language_sample: str = ""


class AvatarCreate(BaseModel):
    id: str
    name: str
    description: str
    pain_points: list[str] = []
    motivations: list[str] = []
    objections: list[str] = []
    language_sample: str = ""


class AvatarUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pain_points: Optional[list[str]] = None
    motivations: Optional[list[str]] = None
    objections: Optional[list[str]] = None
    language_sample: Optional[str] = None


class BuildAvatarPromptRequest(BaseModel):
    product: str = ""
    context: str = ""


class ParseAvatarsRequest(BaseModel):
    raw: str
