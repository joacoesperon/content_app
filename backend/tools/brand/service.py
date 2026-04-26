from __future__ import annotations
import json
from pathlib import Path


def _dna_path(brand_dir: Path) -> Path:
    return brand_dir / "data" / "brand-dna.json"


def _md_path(brand_dir: Path) -> Path:
    return brand_dir / "brand-dna.md"


def _style_md_path(brand_dir: Path) -> Path:
    return brand_dir / "brand-style.md"


def load_dna(brand_dir: Path) -> dict:
    path = _dna_path(brand_dir)
    if not path.exists():
        raise FileNotFoundError("brand-dna.json not found")
    data = json.loads(path.read_text(encoding="utf-8"))

    # Migrate: legacy single "product" → "products" array
    if "products" not in data and "product" in data:
        old = data.pop("product")
        data["products"] = [{
            "id": "main_product",
            "name": old.get("type", "Main Product"),
            "description": old.get("description", ""),
            "price": old.get("price", ""),
            "delivery_platform": old.get("delivery_platform", ""),
            "distinctive_features": old.get("distinctive_features", []),
            "ecosystem": old.get("ecosystem", ""),
        }]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        _regenerate_md(brand_dir, data)

    return data


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
    products = data.get("products", [])
    ac = data.get("ad_creative_style", {})
    modifier = data.get("image_prompt_modifier", "")

    voice = ", ".join(ov.get("voice_adjectives", []))

    # Build products block
    products_block = ""
    for i, pr in enumerate(products):
        features = ", ".join(pr.get("distinctive_features", []))
        label = f"Product {i + 1}: {pr.get('name', pr.get('id', ''))}"
        products_block += f"""
{label}
  Description: {pr.get('description', '')}
  Price: {pr.get('price', '')}
  Delivery Platform: {pr.get('delivery_platform', '')}
  Distinctive Features: {features}
  Product Ecosystem: {pr.get('ecosystem', '')}
"""

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
{products_block.strip()}

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
    _regenerate_style_md(brand_dir, data)


def _regenerate_style_md(brand_dir: Path, data: dict) -> None:
    """Generate brand-style.md — voice/visual/photography only, no sales arguments.
    Used by Scout so it has brand aesthetic context without product positioning bias."""
    ov = data.get("overview", {})
    vs = data.get("visual_system", {})
    ph = data.get("photography_direction", {})
    modifier = data.get("image_prompt_modifier", "")

    voice = ", ".join(ov.get("voice_adjectives", []))

    md = f"""BRAND STYLE GUIDE
=================
(Voice, visual identity, and image generation context only.
Does NOT include product details, pricing, or sales arguments.)

BRAND VOICE
Name: {ov.get('name', '')}
Voice Adjectives: {voice}

VISUAL SYSTEM
Primary Font: {vs.get('primary_font', '')}
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
Mood: {ph.get('mood', '')}
"""
    _style_md_path(brand_dir).write_text(md, encoding="utf-8")


def load_content_mix(brand_dir: Path) -> str:
    path = brand_dir / "content-mix.md"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def save_content_mix(brand_dir: Path, content: str) -> None:
    path = brand_dir / "content-mix.md"
    path.write_text(content, encoding="utf-8")


# ─── Reels Mix ────────────────────────────────────────────────────────────────

def load_reels_mix(brand_dir: Path) -> str:
    path = brand_dir / "reels-mix.md"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def save_reels_mix(brand_dir: Path, content: str) -> None:
    path = brand_dir / "reels-mix.md"
    path.write_text(content, encoding="utf-8")


# ─── Mascot ───────────────────────────────────────────────────────────────────

def _mascot_json_path(brand_dir: Path) -> Path:
    return brand_dir / "data" / "mascot.json"


def _mascot_dir(brand_dir: Path) -> Path:
    d = brand_dir / "mascot"
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_mascot(brand_dir: Path) -> dict:
    path = _mascot_json_path(brand_dir)
    if not path.exists():
        return {
            "name": "",
            "visual_description": "",
            "tones": [],
            "expressions": [],
            "catchphrases": [],
            "references": [],
        }
    return json.loads(path.read_text(encoding="utf-8"))


def save_mascot(brand_dir: Path, data: dict) -> None:
    path = _mascot_json_path(brand_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def list_mascot_refs(brand_dir: Path) -> list[dict]:
    """Hydrate references from disk: filename + url + tag (from mascot.json)."""
    mdir = _mascot_dir(brand_dir)
    data = load_mascot(brand_dir)
    refs_meta = {r["filename"]: r for r in data.get("references", [])}
    allowed = {".png", ".jpg", ".jpeg", ".webp"}
    out = []
    if mdir.exists():
        for f in sorted(mdir.iterdir()):
            if not f.is_file() or f.suffix.lower() not in allowed:
                continue
            meta = refs_meta.get(f.name, {})
            out.append({
                "filename": f.name,
                "url": f"/files/mascot/{f.name}",
                "tag": meta.get("tag", ""),
                "is_base": meta.get("is_base", False),
            })
    return out


def add_mascot_ref(brand_dir: Path, filename: str, tag: str = "", is_base: bool = False) -> None:
    """Update mascot.json references list. Does not touch disk."""
    data = load_mascot(brand_dir)
    refs = data.get("references", [])
    refs = [r for r in refs if r.get("filename") != filename]
    if is_base:
        for r in refs:
            r["is_base"] = False
    refs.append({"filename": filename, "tag": tag, "is_base": is_base})
    data["references"] = refs
    save_mascot(brand_dir, data)


def update_mascot_ref(brand_dir: Path, filename: str, tag: str | None = None, is_base: bool | None = None) -> None:
    data = load_mascot(brand_dir)
    refs = data.get("references", [])
    for r in refs:
        if r.get("filename") == filename:
            if tag is not None:
                r["tag"] = tag
            if is_base is not None:
                if is_base:
                    for other in refs:
                        other["is_base"] = False
                r["is_base"] = is_base
            break
    data["references"] = refs
    save_mascot(brand_dir, data)


def delete_mascot_ref(brand_dir: Path, filename: str) -> None:
    mdir = _mascot_dir(brand_dir)
    target = mdir / filename
    if target.exists():
        target.unlink()
    data = load_mascot(brand_dir)
    data["references"] = [r for r in data.get("references", []) if r.get("filename") != filename]
    save_mascot(brand_dir, data)


def list_media(brand_dir: Path, media_type: str, product_id: str = "") -> list[dict]:
    if media_type == "product-images" and product_id:
        media_dir = brand_dir / "product-images" / product_id
    else:
        media_dir = brand_dir / media_type
    if not media_dir.exists():
        return []
    allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov"}
    files = []
    for f in sorted(media_dir.iterdir()):
        if f.is_file() and f.suffix.lower() in allowed:
            if media_type == "product-images" and product_id:
                url = f"/files/product-images/{product_id}/{f.name}"
            else:
                url = f"/files/{media_type}/{f.name}"
            files.append({"filename": f.name, "type": media_type, "url": url})
    return files


def delete_media(brand_dir: Path, media_type: str, filename: str, product_id: str = "") -> None:
    if media_type == "product-images" and product_id:
        path = brand_dir / "product-images" / product_id / filename
    else:
        path = brand_dir / media_type / filename
    if not path.exists():
        raise FileNotFoundError(f"{filename} not found")
    path.resolve().relative_to(brand_dir.resolve())
    path.unlink()
