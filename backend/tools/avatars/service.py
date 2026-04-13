from __future__ import annotations
import json
from pathlib import Path


def _avatars_path(brand_dir: Path) -> Path:
    return brand_dir / "data" / "avatars.json"


def load_avatars(brand_dir: Path) -> list[dict]:
    path = _avatars_path(brand_dir)
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save_avatars(brand_dir: Path, avatars: list[dict]) -> None:
    path = _avatars_path(brand_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(avatars, ensure_ascii=False, indent=2), encoding="utf-8")
