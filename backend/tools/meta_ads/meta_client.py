"""Meta Marketing API client — v22.0.

Equivalent to the guide's meta-api.ts. Handles:
- Auth/error-surfacing
- Ad account + page listing
- Campaign + ad set listing, ad set cloning
- Image upload (WebP→JPEG auto-conversion)
- Video upload
- Ad creative + ad creation (single or asset_feed_spec)
"""
from __future__ import annotations
import io
import json
from typing import Any, Optional

import requests

META_API_VERSION = "v22.0"
META_BASE = f"https://graph.facebook.com/{META_API_VERSION}"


class MetaAPIError(Exception):
    pass


CONVERTIBLE_IMAGE_EXTS = {".webp", ".bmp", ".tif", ".tiff"}
CONVERTIBLE_IMAGE_MIME_TYPES = {
    "image/webp",
    "image/bmp",
    "image/x-ms-bmp",
    "image/tiff",
}


def _stringify_error_data(error_data: Any) -> str:
    if error_data in (None, "", {}, []):
        return ""
    if isinstance(error_data, str):
        return error_data
    try:
        return json.dumps(error_data, ensure_ascii=False)
    except TypeError:
        return str(error_data)


def _extract_error(data: dict) -> str:
    err = data.get("error") or {}
    message = (
        err.get("error_user_msg")
        or err.get("message")
        or json.dumps(err)
        or "Unknown Meta API error"
    )
    details = _stringify_error_data(err.get("error_data"))
    if details and details not in message:
        return f"{message} ({details})"
    return message


def _handle(resp: requests.Response) -> dict:
    try:
        data = resp.json()
    except Exception:
        raise MetaAPIError(f"HTTP {resp.status_code}: {resp.text[:500]}")
    if resp.status_code >= 400 or "error" in data:
        raise MetaAPIError(_extract_error(data))
    return data


def meta_get(endpoint: str, token: str, params: Optional[dict] = None) -> dict:
    p = dict(params or {})
    p["access_token"] = token
    resp = requests.get(f"{META_BASE}{endpoint}", params=p, timeout=60)
    return _handle(resp)


def meta_post(
    endpoint: str,
    token: str,
    body: Optional[dict] = None,
    files: Optional[dict] = None,
) -> dict:
    data = dict(body or {})
    data["access_token"] = token
    # Serialize any nested dict/list fields for form-urlencoded delivery
    for k, v in list(data.items()):
        if isinstance(v, (dict, list)):
            data[k] = json.dumps(v)
    resp = requests.post(
        f"{META_BASE}{endpoint}",
        data=data,
        files=files,
        timeout=180,
    )
    return _handle(resp)


# ─── Accounts & Pages ────────────────────────────────────────────────────────

def get_ad_accounts(token: str) -> list[dict]:
    data = meta_get(
        "/me/adaccounts",
        token,
        {"fields": "id,account_id,name,currency,account_status"},
    )
    return data.get("data", [])


def get_pages(token: str) -> list[dict]:
    data = meta_get("/me/accounts", token, {"fields": "id,name,access_token"})
    return data.get("data", [])


# ─── Campaigns & Ad Sets ─────────────────────────────────────────────────────

def get_campaigns(ad_account_id: str, token: str) -> list[dict]:
    data = meta_get(
        f"/{ad_account_id}/campaigns",
        token,
        {
            "fields": "id,name,status,objective",
            "effective_status": '["ACTIVE","PAUSED","ARCHIVED","IN_PROCESS","WITH_ISSUES","IN_DRAFT"]',
            "limit": 500,
        },
    )
    return data.get("data", [])


def get_ad_sets(campaign_id: str, token: str) -> list[dict]:
    data = meta_get(
        f"/{campaign_id}/adsets",
        token,
        {
            "fields": "id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal",
            "limit": 500,
        },
    )
    return data.get("data", [])


AD_SET_CLONE_FIELDS = (
    "name,daily_budget,lifetime_budget,billing_event,optimization_goal,"
    "bid_strategy,bid_amount,targeting,promoted_object,destination_type,"
    "start_time,end_time,attribution_spec,pacing_type"
)


def get_ad_set_details(ad_set_id: str, token: str) -> dict:
    return meta_get(f"/{ad_set_id}", token, {"fields": AD_SET_CLONE_FIELDS})


def create_ad_set(
    ad_account_id: str,
    token: str,
    campaign_id: str,
    source_ad_set_id: str,
    name: str,
) -> dict:
    """Create a new ad set cloning the settings from an existing one."""
    source = get_ad_set_details(source_ad_set_id, token)
    body: dict[str, Any] = {
        "name": name,
        "campaign_id": campaign_id,
        "status": "PAUSED",
    }
    # Copy compatible fields
    for field in [
        "daily_budget",
        "lifetime_budget",
        "billing_event",
        "optimization_goal",
        "bid_strategy",
        "bid_amount",
        "targeting",
        "promoted_object",
        "destination_type",
        "attribution_spec",
        "pacing_type",
    ]:
        if field in source and source[field] is not None:
            body[field] = source[field]
    return meta_post(f"/{ad_account_id}/adsets", token, body)


# ─── Uploads ─────────────────────────────────────────────────────────────────

def _convert_to_jpeg(file_bytes: bytes) -> tuple[bytes, str]:
    """Convert an image buffer to JPEG bytes for Meta-compatible upload."""
    try:
        from PIL import Image
    except ImportError as exc:
        raise MetaAPIError("Pillow is required to convert this image to JPEG") from exc

    try:
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=92)
        return out.getvalue(), "image/jpeg"
    except Exception as exc:
        raise MetaAPIError("Could not convert image to JPEG before Meta upload") from exc


def upload_image(
    ad_account_id: str,
    token: str,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
) -> str:
    """Upload image, return image_hash. Converts WebP/BMP/TIFF to JPEG automatically."""
    send_bytes = file_bytes
    send_mime = mime_type
    send_name = filename
    lower_name = filename.lower()
    should_convert = mime_type in CONVERTIBLE_IMAGE_MIME_TYPES or any(
        lower_name.endswith(ext) for ext in CONVERTIBLE_IMAGE_EXTS
    )
    if should_convert:
        send_bytes, send_mime = _convert_to_jpeg(file_bytes)
        send_name = filename.rsplit(".", 1)[0] + ".jpg"

    files = {"filename": (send_name, send_bytes, send_mime)}
    data = meta_post(f"/{ad_account_id}/adimages", token, body=None, files=files)
    images = data.get("images") or {}
    if not images:
        raise MetaAPIError("No image hash returned from Meta")
    first = next(iter(images.values()))
    hash_val = first.get("hash")
    if not hash_val:
        raise MetaAPIError("Image response missing hash")
    return hash_val


def upload_video(
    ad_account_id: str,
    token: str,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
) -> str:
    """Upload video, return video_id."""
    files = {"source": (filename, file_bytes, mime_type)}
    data = meta_post(f"/{ad_account_id}/advideos", token, body=None, files=files)
    video_id = data.get("id")
    if not video_id:
        raise MetaAPIError("No video id returned from Meta")
    return video_id


def upload_video_thumbnail(
    video_id: str,
    token: str,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
) -> dict:
    """Upload a custom thumbnail for a video."""
    files = {"source": (filename, file_bytes, mime_type)}
    return meta_post(
        f"/{video_id}/thumbnails",
        token,
        body={"is_preferred": "true"},
        files=files,
    )


# ─── Creatives & Ads ─────────────────────────────────────────────────────────

def _build_link_data(
    *,
    texts: list[str],
    headlines: list[str],
    descriptions: list[str],
    url: str,
    display_link: str,
    cta_type: str,
    image_hash: Optional[str] = None,
) -> dict:
    """Construct object_story_spec.link_data for a single-variation ad."""
    data: dict[str, Any] = {
        "link": url,
        "message": (texts[0] if texts else ""),
        "call_to_action": {
            "type": cta_type,
            "value": {"link": url},
        },
    }
    if headlines:
        data["name"] = headlines[0]
    if descriptions:
        data["description"] = descriptions[0]
    if display_link:
        data["caption"] = display_link
    if image_hash:
        data["image_hash"] = image_hash
    return data


def _build_video_data(
    *,
    texts: list[str],
    headlines: list[str],
    descriptions: list[str],
    url: str,
    cta_type: str,
    video_id: str,
    image_hash: Optional[str] = None,
) -> dict:
    data: dict[str, Any] = {
        "video_id": video_id,
        "message": (texts[0] if texts else ""),
        "call_to_action": {
            "type": cta_type,
            "value": {"link": url},
        },
    }
    if headlines:
        data["title"] = headlines[0]
    if descriptions:
        data["link_description"] = descriptions[0]
    if image_hash:
        data["image_hash"] = image_hash
    return data


def _needs_asset_feed(texts, headlines, descriptions) -> bool:
    return len(texts) > 1 or len(headlines) > 1 or len(descriptions) > 1


def _asset_feed_spec_image(
    *,
    image_hash: str,
    texts: list[str],
    headlines: list[str],
    descriptions: list[str],
    url: str,
    cta_type: str,
) -> dict:
    spec: dict[str, Any] = {
        "images": [{"hash": image_hash}],
        "bodies": [{"text": t} for t in texts] or [{"text": ""}],
        "titles": [{"text": h} for h in headlines] or [{"text": ""}],
        "link_urls": [{"website_url": url}],
        "call_to_action_types": [cta_type],
        "ad_formats": ["SINGLE_IMAGE"],
    }
    if descriptions:
        spec["descriptions"] = [{"text": d} for d in descriptions]
    return spec


def _asset_feed_spec_video(
    *,
    video_id: str,
    thumbnail_url: Optional[str],
    texts: list[str],
    headlines: list[str],
    descriptions: list[str],
    url: str,
    cta_type: str,
) -> dict:
    video_entry: dict[str, Any] = {"video_id": video_id}
    if thumbnail_url:
        video_entry["thumbnail_url"] = thumbnail_url
    spec: dict[str, Any] = {
        "videos": [video_entry],
        "bodies": [{"text": t} for t in texts] or [{"text": ""}],
        "titles": [{"text": h} for h in headlines] or [{"text": ""}],
        "link_urls": [{"website_url": url}],
        "call_to_action_types": [cta_type],
        "ad_formats": ["SINGLE_VIDEO"],
    }
    if descriptions:
        spec["descriptions"] = [{"text": d} for d in descriptions]
    return spec


def create_image_ad_creative(
    ad_account_id: str,
    token: str,
    *,
    name: str,
    page_id: str,
    image_hash: str,
    primary_texts: list[str],
    headlines: list[str],
    descriptions: list[str],
    url: str,
    display_link: str,
    cta_type: str,
    enhancements_enabled: bool = False,
) -> str:
    body: dict[str, Any] = {"name": name}
    if _needs_asset_feed(primary_texts, headlines, descriptions):
        body["object_story_spec"] = {"page_id": page_id}
        body["asset_feed_spec"] = _asset_feed_spec_image(
            image_hash=image_hash,
            texts=primary_texts,
            headlines=headlines,
            descriptions=descriptions,
            url=url,
            cta_type=cta_type,
        )
    else:
        body["object_story_spec"] = {
            "page_id": page_id,
            "link_data": _build_link_data(
                texts=primary_texts,
                headlines=headlines,
                descriptions=descriptions,
                url=url,
                display_link=display_link,
                cta_type=cta_type,
                image_hash=image_hash,
            ),
        }
    if enhancements_enabled:
        body["degrees_of_freedom_spec"] = {
            "creative_features_spec": {
                "standard_enhancements": {"enroll_status": "OPT_IN"},
            }
        }
    data = meta_post(f"/{ad_account_id}/adcreatives", token, body)
    cid = data.get("id")
    if not cid:
        raise MetaAPIError("No creative id returned")
    return cid


def create_video_ad_creative(
    ad_account_id: str,
    token: str,
    *,
    name: str,
    page_id: str,
    video_id: str,
    thumbnail_url: Optional[str],
    thumbnail_hash: Optional[str],
    primary_texts: list[str],
    headlines: list[str],
    descriptions: list[str],
    url: str,
    cta_type: str,
    enhancements_enabled: bool = False,
) -> str:
    body: dict[str, Any] = {"name": name}
    if _needs_asset_feed(primary_texts, headlines, descriptions):
        body["object_story_spec"] = {"page_id": page_id}
        body["asset_feed_spec"] = _asset_feed_spec_video(
            video_id=video_id,
            thumbnail_url=thumbnail_url,
            texts=primary_texts,
            headlines=headlines,
            descriptions=descriptions,
            url=url,
            cta_type=cta_type,
        )
    else:
        body["object_story_spec"] = {
            "page_id": page_id,
            "video_data": _build_video_data(
                texts=primary_texts,
                headlines=headlines,
                descriptions=descriptions,
                url=url,
                cta_type=cta_type,
                video_id=video_id,
                image_hash=thumbnail_hash,
            ),
        }
    if enhancements_enabled:
        body["degrees_of_freedom_spec"] = {
            "creative_features_spec": {
                "standard_enhancements": {"enroll_status": "OPT_IN"},
            }
        }
    data = meta_post(f"/{ad_account_id}/adcreatives", token, body)
    cid = data.get("id")
    if not cid:
        raise MetaAPIError("No creative id returned")
    return cid


def create_ad(
    ad_account_id: str,
    token: str,
    *,
    name: str,
    ad_set_id: str,
    creative_id: str,
    status: str = "PAUSED",
) -> str:
    body = {
        "name": name,
        "adset_id": ad_set_id,
        "creative": {"creative_id": creative_id},
        "status": status,
    }
    data = meta_post(f"/{ad_account_id}/ads", token, body)
    ad_id = data.get("id")
    if not ad_id:
        raise MetaAPIError("No ad id returned")
    return ad_id
