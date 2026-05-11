"""Instagram Graph API client for publishing carousel posts."""
from __future__ import annotations

import asyncio
from pathlib import Path

import fal_client
import requests

from backend.config import IG_USER_ID

GRAPH_API = "https://graph.facebook.com/v18.0"


def _post(url: str, params: dict) -> dict:
    res = requests.post(url, params=params, timeout=30)
    data = res.json()
    if "error" in data:
        raise ValueError(data["error"]["message"])
    return data


async def _upload_image(path: Path) -> str:
    return await asyncio.to_thread(fal_client.upload_file, str(path))


async def _create_item_container(image_url: str, token: str) -> str:
    data = await asyncio.to_thread(_post, f"{GRAPH_API}/{IG_USER_ID}/media", {
        "image_url": image_url,
        "is_carousel_item": "true",
        "access_token": token,
    })
    return data["id"]


async def _create_carousel_container(children: list[str], caption: str, token: str) -> str:
    data = await asyncio.to_thread(_post, f"{GRAPH_API}/{IG_USER_ID}/media", {
        "media_type": "CAROUSEL",
        "children": ",".join(children),
        "caption": caption,
        "access_token": token,
    })
    return data["id"]


async def _publish_container(creation_id: str, token: str) -> str:
    data = await asyncio.to_thread(_post, f"{GRAPH_API}/{IG_USER_ID}/media_publish", {
        "creation_id": creation_id,
        "access_token": token,
    })
    return data["id"]


async def publish_carousel(image_paths: list[Path], caption: str, token: str) -> str:
    """Upload images, create containers, publish. Returns Instagram post ID."""
    if len(image_paths) < 2:
        raise ValueError("Instagram carousels require at least 2 images")
    if len(image_paths) > 10:
        raise ValueError("Instagram carousels support at most 10 images")

    public_urls = await asyncio.gather(*[_upload_image(p) for p in image_paths])

    item_ids: list[str] = []
    for url in public_urls:
        item_id = await _create_item_container(url, token)
        item_ids.append(item_id)

    carousel_id = await _create_carousel_container(item_ids, caption, token)
    post_id = await _publish_container(carousel_id, token)
    return post_id
