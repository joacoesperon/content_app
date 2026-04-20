"""JSON-based storage for Meta Ads tool."""
from __future__ import annotations
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from backend.config import BRAND_DIR

META_DIR = BRAND_DIR / "meta-ads"
SETTINGS_FILE = META_DIR / "settings.json"
BATCHES_DIR = META_DIR / "batches"
UPLOADS_DIR = META_DIR / "uploads"


def _ensure_dirs():
    META_DIR.mkdir(parents=True, exist_ok=True)
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


# ─── Settings ─────────────────────────────────────────────────────────────────

def load_settings() -> dict:
    _ensure_dirs()
    return _read_json(SETTINGS_FILE, {
        "access_token": "",
        "ad_account_id": "",
        "ad_account_name": "",
        "page_id": "",
        "page_name": "",
    })


def save_settings(updates: dict) -> dict:
    _ensure_dirs()
    current = load_settings()
    for k, v in updates.items():
        if v is not None:
            current[k] = v
    _write_json(SETTINGS_FILE, current)
    return current


# ─── Batches ──────────────────────────────────────────────────────────────────

def _batch_dir(batch_id: str) -> Path:
    return BATCHES_DIR / batch_id


def _batch_file(batch_id: str) -> Path:
    return _batch_dir(batch_id) / "batch.json"


def _creatives_file(batch_id: str) -> Path:
    return _batch_dir(batch_id) / "creatives.json"


def create_batch(name: str) -> dict:
    _ensure_dirs()
    batch_id = str(uuid.uuid4())[:12]
    batch = {
        "id": batch_id,
        "name": name,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "campaign_id": "",
        "campaign_name": "",
        "ad_set_id": "",
        "ad_set_name": "",
        "primary_texts": [],
        "headlines": [],
        "descriptions": [],
        "cta_type": "SHOP_NOW",
        "url": "",
        "display_link": "",
        "launch_as_paused": True,
        "enhancements_enabled": False,
        "status": "draft",
        "ads_created": 0,
        "ads_errored": 0,
        "error_log": [],
    }
    _batch_dir(batch_id).mkdir(parents=True, exist_ok=True)
    _write_json(_batch_file(batch_id), batch)
    _write_json(_creatives_file(batch_id), [])
    (UPLOADS_DIR / batch_id).mkdir(parents=True, exist_ok=True)
    return batch


def get_batch(batch_id: str) -> Optional[dict]:
    path = _batch_file(batch_id)
    if not path.exists():
        return None
    return _read_json(path, None)


def update_batch(batch_id: str, updates: dict) -> Optional[dict]:
    batch = get_batch(batch_id)
    if not batch:
        return None
    for k, v in updates.items():
        if v is not None:
            batch[k] = v
    _write_json(_batch_file(batch_id), batch)
    return batch


def list_batches() -> list[dict]:
    _ensure_dirs()
    result = []
    for folder in BATCHES_DIR.iterdir():
        if not folder.is_dir():
            continue
        path = folder / "batch.json"
        if path.exists():
            data = _read_json(path, None)
            if data:
                result.append(data)
    result.sort(key=lambda b: b.get("created_at", ""), reverse=True)
    return result


# ─── Creatives ────────────────────────────────────────────────────────────────

def list_creatives(batch_id: str) -> list[dict]:
    return _read_json(_creatives_file(batch_id), [])


def create_creative(
    batch_id: str,
    filename: str,
    ad_name: str,
    file_type: str,
    mime_type: str,
    file_path: str,
) -> dict:
    creative_id = str(uuid.uuid4())[:12]
    creative = {
        "id": creative_id,
        "batch_id": batch_id,
        "filename": filename,
        "ad_name": ad_name,
        "file_type": file_type,
        "mime_type": mime_type,
        "file_path": file_path,
        "thumbnail_path": "",
        "meta_ad_id": "",
        "meta_creative_id": "",
        "status": "pending",
        "error_message": "",
    }
    creatives = list_creatives(batch_id)
    creatives.append(creative)
    _write_json(_creatives_file(batch_id), creatives)
    return creative


def update_creative(batch_id: str, creative_id: str, updates: dict) -> Optional[dict]:
    creatives = list_creatives(batch_id)
    updated = None
    for c in creatives:
        if c["id"] == creative_id:
            for k, v in updates.items():
                if v is not None:
                    c[k] = v
            updated = c
            break
    if updated is None:
        return None
    _write_json(_creatives_file(batch_id), creatives)
    return updated


def find_batch_for_creative(creative_id: str) -> Optional[str]:
    """Look up the batch that contains a given creative_id."""
    for batch in list_batches():
        for c in list_creatives(batch["id"]):
            if c["id"] == creative_id:
                return batch["id"]
    return None


def uploads_dir_for(batch_id: str) -> Path:
    d = UPLOADS_DIR / batch_id
    d.mkdir(parents=True, exist_ok=True)
    return d
