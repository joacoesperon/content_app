"""
Background scheduler for Instagram carousels.
Avoids the Meta whitelist requirement for scheduled_publish_time
by storing posts locally and publishing them at the right time.
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from backend.config import OUTPUTS_DIR

QUEUE_FILE = OUTPUTS_DIR / "carousels" / "scheduled_queue.json"
logger = logging.getLogger(__name__)


def _load_queue() -> list[dict]:
    if not QUEUE_FILE.exists():
        return []
    try:
        return json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_queue(queue: list[dict]) -> None:
    QUEUE_FILE.write_text(json.dumps(queue, indent=2), encoding="utf-8")


def enqueue(date: str, post_slug: str, caption: str, image_paths: list[str], scheduled_unix: int) -> None:
    queue = _load_queue()
    queue = [e for e in queue if not (e["date"] == date and e["post_slug"] == post_slug)]
    queue.append({
        "date": date,
        "post_slug": post_slug,
        "caption": caption,
        "image_paths": image_paths,
        "scheduled_unix": scheduled_unix,
    })
    _save_queue(queue)


def list_queue() -> list[dict]:
    return _load_queue()


def remove_from_queue(date: str, post_slug: str) -> None:
    queue = _load_queue()
    _save_queue([e for e in queue if not (e["date"] == date and e["post_slug"] == post_slug)])


async def _process_due() -> None:
    from backend.config import TOKEN_SYSTEM_USER
    from backend.tools.carousels import instagram, service

    queue = _load_queue()
    if not queue:
        return

    now_unix = int(datetime.now(timezone.utc).timestamp())
    remaining = []

    for entry in queue:
        if entry["scheduled_unix"] > now_unix:
            remaining.append(entry)
            continue

        if not TOKEN_SYSTEM_USER:
            logger.error("TOKEN_SYSTEM_USER not set — cannot publish scheduled post")
            remaining.append(entry)
            continue

        try:
            paths = [Path(p) for p in entry["image_paths"]]
            post_id = await instagram.publish_carousel(paths, entry["caption"], TOKEN_SYSTEM_USER)
            service.record_publish(entry["date"], entry["post_slug"], post_id, None)
            logger.info("Scheduled post published: %s/%s → %s", entry["date"], entry["post_slug"], post_id)
        except Exception as exc:
            logger.error("Failed to publish %s/%s: %s", entry["date"], entry["post_slug"], exc)
            remaining.append(entry)

    if len(remaining) != len(queue):
        _save_queue(remaining)


async def run_forever() -> None:
    """Checks every 60 seconds for posts due to publish."""
    while True:
        try:
            await _process_due()
        except Exception as exc:
            logger.error("Scheduler loop error: %s", exc)
        await asyncio.sleep(60)
