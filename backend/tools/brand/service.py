from __future__ import annotations
import json
from pathlib import Path


DNA_FILE = None  # set at import time by router


def _dna_path(brand_dir: Path) -> Path:
    return brand_dir / "data" / "brand-dna.json"


def _md_path(brand_dir: Path) -> Path:
    return brand_dir / "brand-dna.md"


def load_dna(brand_dir: Path) -> dict:
    path = _dna_path(brand_dir)
    if not path.exists():
        raise FileNotFoundError("brand-dna.json not found")
    return json.loads(path.read_text(encoding="utf-8"))


def save_dna(brand_dir: Path, data: dict) -> None:
    path = _dna_path(brand_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    _regenerate_md(brand_dir, data)


def _regenerate_md(brand_dir: Path, data: dict) -> None:
    """Regenerate the human-readable brand-dna.md from the JSON."""
    ov = data.get("overview", {})
    vs = data.get("visual_system", {})
    ph = data.get("photography_direction", {})
    pr = data.get("product", {})
    ac = data.get("ad_creative_style", {})
    modifier = data.get("image_prompt_modifier", "")

    voice = ", ".join(ov.get("voice_adjectives", []))
    features = ", ".join(pr.get("distinctive_features", []))

    md = f"""BRAND DNA DOCUMENT
==================

BRAND OVERVIEW
Name: {ov.get('name', '')}
Tagline: "{ov.get('tagline', '')}"
Design Agency: {ov.get('design_agency', '')}
Voice Adjectives: {voice}
Positioning: {ov.get('positioning', '')}
Competitive Differentiation: {ov.get('competitive_differentiation', '')}

VISUAL SYSTEM
Primary Font: {vs.get('primary_font', '')}
Secondary Font: {vs.get('secondary_font', '')}
Primary Color: {vs.get('primary_color', '')}
Secondary Color: {vs.get('secondary_color', '')}
Accent Color: {vs.get('accent_color', '')}
Background Colors: {vs.get('background_colors', '')}
Text Colors: {vs.get('text_colors', '')}
CTA Color and Style: {vs.get('cta_style', '')}

PHOTOGRAPHY DIRECTION
Lighting: {ph.get('lighting', '')}
Color Grading: {ph.get('color_grading', '')}
Composition: {ph.get('composition', '')}
Subject Matter: {ph.get('subject_matter', '')}
Props and Surfaces: {ph.get('props_and_surfaces', '')}
Mood: {ph.get('mood', '')}

PRODUCT DETAILS
Product Type: {pr.get('type', '')}
Product Description: {pr.get('description', '')}
Price: {pr.get('price', '')}
Delivery Platform: {pr.get('delivery_platform', '')}
Distinctive Features: {features}
Product Ecosystem: {pr.get('ecosystem', '')}

AD CREATIVE STYLE
Typical formats: {ac.get('typical_formats', '')}
Text overlay style: {ac.get('text_overlay_style', '')}
Photo vs illustration: {ac.get('photo_vs_illustration', '')}
UGC usage: {ac.get('ugc_usage', '')}
Offer presentation: {ac.get('offer_presentation', '')}

IMAGE GENERATION PROMPT MODIFIER
{modifier}
"""
    _md_path(brand_dir).write_text(md, encoding="utf-8")


def list_media(brand_dir: Path, media_type: str) -> list[dict]:
    media_dir = brand_dir / media_type
    if not media_dir.exists():
        return []
    allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov"}
    files = []
    for f in sorted(media_dir.iterdir()):
        if f.is_file() and f.suffix.lower() in allowed:
            files.append({
                "filename": f.name,
                "type": media_type,
                "url": f"/files/{media_type}/{f.name}",
            })
    return files


def delete_media(brand_dir: Path, media_type: str, filename: str) -> None:
    path = brand_dir / media_type / filename
    if not path.exists():
        raise FileNotFoundError(f"{filename} not found")
    # Safety: ensure we stay within the brand dir
    path.resolve().relative_to(brand_dir.resolve())
    path.unlink()
