"""
Carousels service — turn Scout briefs into Instagram-ready carousel slides.

meta.json schema:
{
  "post_number": 1, "category": "...", "avatar": "...", "lever": "...",
  "caption": "...", "hashtags": "...", "rationale": "...",
  "slides": {
    "1": {
      "label": "Hook",
      "favorite_version": 2 | null,
      "versions": [
        {
          "version": 1, "filename": "slide_01_v1.png", "prompt_used": "...",
          "apply_modifier": true, "resolution": "2K", "seed": null,
          "thinking_level": null, "generated_at": "..."
        },
        ...
      ]
    }
  }
}
"""
from __future__ import annotations

import io
import json
import re
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

import fal_client
import requests

from backend.config import BRAND_DIR, OUTPUTS_DIR
from backend.tools.carousels.parser import Post, parse_scout_file

CAROUSELS_DIR = OUTPUTS_DIR / "carousels"
SCOUT_DIR = OUTPUTS_DIR / "scout"
MODEL = "fal-ai/nano-banana-2"

# ─── Pricing (from FAL docs — keep in sync) ──────────────────────────────────

BASE_PRICE_PER_IMAGE = 0.08  # at 1K
RESOLUTION_MULTIPLIERS = {
    "0.5K": 0.75,
    "1K": 1.0,
    "2K": 1.5,
    "4K": 2.0,
}
THINKING_HIGH_EXTRA = 0.002
THINKING_MINIMAL_EXTRA = 0.0  # docs only mention $0.002 for high
WEB_SEARCH_EXTRA = 0.015


def pricing_info() -> dict:
    return {
        "base_per_image": BASE_PRICE_PER_IMAGE,
        "resolution_multipliers": RESOLUTION_MULTIPLIERS,
        "thinking_high_extra": THINKING_HIGH_EXTRA,
        "thinking_minimal_extra": THINKING_MINIMAL_EXTRA,
        "web_search_extra": WEB_SEARCH_EXTRA,
    }


def cost_for(resolution: str, thinking_level: Optional[str]) -> float:
    mult = RESOLUTION_MULTIPLIERS.get(resolution, 1.0)
    base = BASE_PRICE_PER_IMAGE * mult
    if thinking_level == "high":
        base += THINKING_HIGH_EXTRA
    elif thinking_level == "minimal":
        base += THINKING_MINIMAL_EXTRA
    return round(base, 4)


# ─── Scout file access ────────────────────────────────────────────────────────

def list_scout_files() -> list[dict]:
    if not SCOUT_DIR.exists():
        return []
    out = []
    for f in sorted(SCOUT_DIR.glob("*.md"), reverse=True):
        try:
            count = len(parse_scout_file(f))
        except Exception:
            count = 0
        out.append({"filename": f.name, "posts_count": count})
    return out


def load_posts(filename: str) -> list[Post]:
    path = SCOUT_DIR / filename
    return parse_scout_file(path)


# ─── Brand modifier ───────────────────────────────────────────────────────────

def get_modifier() -> str:
    dna_path = BRAND_DIR / "data" / "brand-dna.json"
    if not dna_path.exists():
        return ""
    try:
        data = json.loads(dna_path.read_text(encoding="utf-8"))
        return (data.get("image_prompt_modifier") or "").strip()
    except Exception:
        return ""


def _build_final_prompt(scene_prompt: str, apply_modifier: bool) -> str:
    scene = scene_prompt.strip()
    if not apply_modifier:
        return scene
    modifier = get_modifier()
    if not modifier:
        return scene
    return f"{modifier} {scene}"


# ─── FAL wrapper ──────────────────────────────────────────────────────────────

ALLOWED_ASPECT_RATIOS = (
    "auto", "21:9", "16:9", "3:2", "4:3", "5:4", "1:1",
    "4:5", "3:4", "2:3", "9:16", "4:1", "1:4", "8:1", "1:8",
)


def generate_slide_image(
    scene_prompt: str,
    apply_modifier: bool = True,
    resolution: str = "2K",
    aspect_ratio: str = "4:5",
    seed: Optional[int] = None,
    thinking_level: Optional[str] = None,
) -> tuple[bytes, str]:
    """Call FAL nano-banana-2. Returns (png_bytes, final_prompt_sent)."""
    full_prompt = _build_final_prompt(scene_prompt, apply_modifier)
    arguments: dict = {
        "prompt": full_prompt,
        "num_images": 1,
        "aspect_ratio": aspect_ratio,
        "output_format": "png",
        "resolution": resolution,
    }
    if seed is not None:
        arguments["seed"] = int(seed)
    if thinking_level in ("minimal", "high"):
        arguments["thinking_level"] = thinking_level

    result = fal_client.subscribe(MODEL, arguments=arguments, with_logs=False)
    images = result.get("images", [])
    if not images:
        raise RuntimeError(f"FAL returned no images for prompt: {full_prompt[:120]}...")
    url = images[0]["url"]
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    return resp.content, full_prompt


# ─── Folder + meta helpers ────────────────────────────────────────────────────

def _date_from_filename(filename: str) -> str:
    m = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
    return m.group(1) if m else datetime.now().strftime("%Y-%m-%d")


def _post_dir(filename: str, post: Post) -> Path:
    date_str = _date_from_filename(filename)
    d = CAROUSELS_DIR / date_str / post.slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def _target_dir(date: str, post_slug: str) -> Path:
    return CAROUSELS_DIR / date / post_slug


def _meta_path(post_dir: Path) -> Path:
    return post_dir / "meta.json"


def _load_or_init_meta(post_dir: Path, post: Optional[Post] = None) -> dict:
    p = _meta_path(post_dir)
    if p.exists():
        try:
            meta = json.loads(p.read_text(encoding="utf-8"))
            # migrate legacy flat-slide structure → versioned
            meta = _migrate_meta(meta)
            return meta
        except Exception:
            pass
    if post is None:
        # attempting to load meta for an unknown post — return empty shell
        return {"slides": {}}
    return {
        "post_number": post.number,
        "category": post.category,
        "avatar": post.avatar,
        "lever": post.lever,
        "caption": post.caption,
        "hashtags": post.hashtags,
        "rationale": post.rationale,
        "slides": {},
    }


def _migrate_meta(meta: dict) -> dict:
    """Legacy meta had slides[N] = {label, filename, prompt_used, apply_modifier, generated_at}.
    New meta uses slides[N] = {label, favorite_version, versions: [...]}."""
    slides = meta.get("slides", {})
    migrated = False
    for num_str, entry in list(slides.items()):
        if not isinstance(entry, dict):
            continue
        if "versions" in entry:
            continue  # already new
        if "filename" not in entry:
            continue  # malformed, skip
        slides[num_str] = {
            "label": entry.get("label", ""),
            "favorite_version": None,
            "versions": [{
                "version": 1,
                "filename": entry["filename"],
                "prompt_used": entry.get("prompt_used", ""),
                "apply_modifier": entry.get("apply_modifier", True),
                "resolution": entry.get("resolution", "2K"),
                "aspect_ratio": entry.get("aspect_ratio", "4:5"),
                "seed": entry.get("seed"),
                "thinking_level": entry.get("thinking_level"),
                "generated_at": entry.get("generated_at", ""),
            }],
        }
        migrated = True
    return meta


def _save_meta(post_dir: Path, meta: dict) -> None:
    _meta_path(post_dir).write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _next_version(slide_entry: dict) -> int:
    versions = slide_entry.get("versions", [])
    if not versions:
        return 1
    return max(v.get("version", 0) for v in versions) + 1


def _version_url(date: str, post_slug: str, filename: str) -> str:
    return f"/outputs/carousels/{date}/{post_slug}/{filename}"


# ─── Save + set-favorite ──────────────────────────────────────────────────────

def save_generated_slide(
    filename: str,
    post: Post,
    slide_number: int,
    slide_label: str,
    image_bytes: bytes,
    prompt_used: str,
    apply_modifier: bool,
    resolution: str,
    aspect_ratio: str,
    seed: Optional[int],
    thinking_level: Optional[str],
) -> dict:
    """Persist new version, return full slide entry for this slide_number."""
    post_dir = _post_dir(filename, post)
    meta = _load_or_init_meta(post_dir, post)

    key = str(slide_number)
    slide_entry = meta["slides"].get(key) or {
        "label": slide_label,
        "favorite_version": None,
        "versions": [],
    }
    # keep label fresh in case it changed
    slide_entry["label"] = slide_label

    ver_num = _next_version(slide_entry)
    saved_name = f"slide_{slide_number:02d}_v{ver_num}.png"
    (post_dir / saved_name).write_bytes(image_bytes)

    date_str = _date_from_filename(filename)
    new_version = {
        "version": ver_num,
        "filename": saved_name,
        "url": _version_url(date_str, post.slug, saved_name),
        "prompt_used": prompt_used,
        "apply_modifier": apply_modifier,
        "resolution": resolution,
        "aspect_ratio": aspect_ratio,
        "seed": seed,
        "thinking_level": thinking_level,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    slide_entry["versions"].append(new_version)
    meta["slides"][key] = slide_entry
    _save_meta(post_dir, meta)

    return {
        "slide_number": slide_number,
        "label": slide_label,
        "new_version": new_version,
        "all_versions": slide_entry["versions"],
        "favorite_version": slide_entry.get("favorite_version"),
    }


def set_favorite_version(
    date: str, post_slug: str, slide_number: int, version: Optional[int]
) -> dict:
    post_dir = _target_dir(date, post_slug)
    if not post_dir.exists():
        raise FileNotFoundError(f"Carousel folder not found: {date}/{post_slug}")
    meta = _load_or_init_meta(post_dir)
    key = str(slide_number)
    entry = meta.get("slides", {}).get(key)
    if not entry:
        raise FileNotFoundError(f"Slide {slide_number} not generated yet")
    # validate version
    if version is not None:
        existing = {v.get("version") for v in entry.get("versions", [])}
        if version not in existing:
            raise ValueError(f"Version {version} does not exist")
    entry["favorite_version"] = version
    _save_meta(post_dir, meta)
    return entry


# ─── Listing ──────────────────────────────────────────────────────────────────

def _hydrate_slide_urls(date: str, post_slug: str, entry: dict) -> list[dict]:
    versions = []
    for v in entry.get("versions", []):
        v_copy = dict(v)
        v_copy["url"] = _version_url(date, post_slug, v.get("filename", ""))
        v_copy.setdefault("aspect_ratio", "4:5")
        versions.append(v_copy)
    return versions


def list_generated_carousels() -> list[dict]:
    if not CAROUSELS_DIR.exists():
        return []
    result = []
    for date_dir in sorted(CAROUSELS_DIR.iterdir(), reverse=True):
        if not date_dir.is_dir():
            continue
        for post_dir in sorted(date_dir.iterdir()):
            if not post_dir.is_dir():
                continue
            meta_file = post_dir / "meta.json"
            if not meta_file.exists():
                continue
            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
                meta = _migrate_meta(meta)
            except Exception:
                continue
            slides_out = []
            for num_str, entry in sorted(
                meta.get("slides", {}).items(), key=lambda x: int(x[0])
            ):
                versions = _hydrate_slide_urls(date_dir.name, post_dir.name, entry)
                if not versions:
                    continue
                slides_out.append({
                    "slide_number": int(num_str),
                    "label": entry.get("label", ""),
                    "versions": versions,
                    "favorite_version": entry.get("favorite_version"),
                })
            if not slides_out:
                continue
            result.append({
                "folder": f"{date_dir.name}/{post_dir.name}",
                "date": date_dir.name,
                "post_slug": post_dir.name,
                "post_number": meta.get("post_number"),
                "category": meta.get("category", ""),
                "avatar": meta.get("avatar", ""),
                "lever": meta.get("lever", ""),
                "caption": meta.get("caption", ""),
                "hashtags": meta.get("hashtags", ""),
                "slides": slides_out,
            })
    return result


def get_carousel(date: str, post_slug: str) -> Optional[dict]:
    post_dir = _target_dir(date, post_slug)
    if not post_dir.exists():
        return None
    meta_file = post_dir / "meta.json"
    if not meta_file.exists():
        return None
    try:
        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        meta = _migrate_meta(meta)
    except Exception:
        return None
    slides_out = []
    for num_str, entry in sorted(meta.get("slides", {}).items(), key=lambda x: int(x[0])):
        versions = _hydrate_slide_urls(date, post_slug, entry)
        slides_out.append({
            "slide_number": int(num_str),
            "label": entry.get("label", ""),
            "versions": versions,
            "favorite_version": entry.get("favorite_version"),
        })
    return {
        "folder": f"{date}/{post_slug}",
        "date": date,
        "post_slug": post_slug,
        "post_number": meta.get("post_number"),
        "category": meta.get("category", ""),
        "avatar": meta.get("avatar", ""),
        "lever": meta.get("lever", ""),
        "caption": meta.get("caption", ""),
        "hashtags": meta.get("hashtags", ""),
        "slides": slides_out,
    }


# ─── ZIP ──────────────────────────────────────────────────────────────────────

def _pick_version(entry: dict) -> Optional[dict]:
    """Return the favorite version if set, else the latest."""
    versions = entry.get("versions", [])
    if not versions:
        return None
    fav = entry.get("favorite_version")
    if fav is not None:
        for v in versions:
            if v.get("version") == fav:
                return v
    return versions[-1]  # latest


def build_zip(folder: str) -> tuple[bytes, str]:
    parts = folder.split("/")
    if len(parts) != 2:
        raise ValueError("Invalid folder format")
    target = _target_dir(parts[0], parts[1])
    if not target.exists() or not target.is_dir():
        raise FileNotFoundError(f"Carousel folder not found: {folder}")
    meta = _load_or_init_meta(target)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for num_str, entry in sorted(
            meta.get("slides", {}).items(), key=lambda x: int(x[0])
        ):
            picked = _pick_version(entry)
            if not picked:
                continue
            slide_path = target / picked.get("filename", "")
            if not slide_path.exists():
                continue
            # include as slide_01.png, slide_02.png, ... (no version suffix)
            arcname = f"slide_{int(num_str):02d}.png"
            zf.write(slide_path, arcname=arcname)

        caption_txt = (meta.get("caption", "") or "").strip()
        if meta.get("hashtags"):
            caption_txt += "\n\n" + meta["hashtags"]
        if caption_txt:
            zf.writestr("caption.txt", caption_txt)
    zip_name = f"{parts[1]}.zip"
    return buf.getvalue(), zip_name


def delete_carousel(folder: str) -> None:
    import shutil
    parts = folder.split("/")
    if len(parts) != 2:
        raise ValueError("Invalid folder format")
    target = _target_dir(parts[0], parts[1])
    if not target.exists():
        raise FileNotFoundError(f"Carousel folder not found: {folder}")
    shutil.rmtree(target)
