from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


# ─── Settings ─────────────────────────────────────────────────────────────────

class MetaSettings(BaseModel):
    access_token: str = ""
    ad_account_id: str = ""
    ad_account_name: str = ""
    page_id: str = ""
    page_name: str = ""


class SaveSettingsRequest(BaseModel):
    access_token: Optional[str] = None
    ad_account_id: Optional[str] = None
    ad_account_name: Optional[str] = None
    page_id: Optional[str] = None
    page_name: Optional[str] = None


# ─── Batches ──────────────────────────────────────────────────────────────────

class UploadBatch(BaseModel):
    id: str
    name: str
    created_at: str
    campaign_id: str = ""
    campaign_name: str = ""
    ad_set_id: str = ""
    ad_set_name: str = ""
    primary_texts: list[str] = Field(default_factory=list)
    headlines: list[str] = Field(default_factory=list)
    descriptions: list[str] = Field(default_factory=list)
    cta_type: str = "SHOP_NOW"
    url: str = ""
    display_link: str = ""
    launch_as_paused: bool = True
    enhancements_enabled: bool = False
    status: str = "draft"  # draft | uploading | complete | error
    ads_created: int = 0
    ads_errored: int = 0
    error_log: list[str] = Field(default_factory=list)


class CreateBatchRequest(BaseModel):
    name: str


class UpdateBatchRequest(BaseModel):
    name: Optional[str] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    ad_set_id: Optional[str] = None
    ad_set_name: Optional[str] = None
    primary_texts: Optional[list[str]] = None
    headlines: Optional[list[str]] = None
    descriptions: Optional[list[str]] = None
    cta_type: Optional[str] = None
    url: Optional[str] = None
    display_link: Optional[str] = None
    launch_as_paused: Optional[bool] = None
    enhancements_enabled: Optional[bool] = None


# ─── Creatives ────────────────────────────────────────────────────────────────

class Creative(BaseModel):
    id: str
    batch_id: str
    filename: str
    ad_name: str
    file_type: str  # "image" | "video"
    mime_type: str
    file_path: str
    file_size: int = 0
    thumbnail_path: str = ""
    meta_ad_id: str = ""
    meta_creative_id: str = ""
    status: str = "pending"  # pending | uploading | created | error
    error_message: str = ""
    created_at: str = ""


class UpdateCreativeRequest(BaseModel):
    ad_name: Optional[str] = None


# ─── Ad Set Creation ──────────────────────────────────────────────────────────

class CreateAdSetRequest(BaseModel):
    campaign_id: str
    source_ad_set_id: str  # clone settings from this ad set
    name: str


# ─── Launch ───────────────────────────────────────────────────────────────────

class LaunchResult(BaseModel):
    batch_id: str
    status: str
    ads_created: int
    ads_errored: int
    error_log: list[str] = Field(default_factory=list)
