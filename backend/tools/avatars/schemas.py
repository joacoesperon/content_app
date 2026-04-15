from __future__ import annotations
import re
from typing import Optional
from pydantic import BaseModel, field_validator

_VALID_ID = re.compile(r'^[a-z0-9_]+$')


class Avatar(BaseModel):
    id: str
    name: str
    description: str
    pain_points: list[str] = []
    desires: list[str] = []
    motivations: list[str] = []
    objections: list[str] = []
    language_sample: str = ""
    ad_angles: list[str] = []


class AvatarCreate(BaseModel):
    id: str
    name: str
    description: str
    pain_points: list[str] = []
    desires: list[str] = []
    motivations: list[str] = []
    objections: list[str] = []
    language_sample: str = ""
    ad_angles: list[str] = []

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v:
            raise ValueError('ID no puede estar vacío')
        if not _VALID_ID.match(v):
            raise ValueError('ID solo puede contener letras minúsculas, números y guiones bajos')
        return v


class AvatarUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pain_points: Optional[list[str]] = None
    desires: Optional[list[str]] = None
    motivations: Optional[list[str]] = None
    objections: Optional[list[str]] = None
    language_sample: Optional[str] = None
    ad_angles: Optional[list[str]] = None


class BuildAvatarPromptRequest(BaseModel):
    product: str = ""
    context: str = ""


class ParseAvatarsRequest(BaseModel):
    raw: str
