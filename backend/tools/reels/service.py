"""
Reels service — turn Director scripts into Instagram-ready vertical videos.

Pipeline per scene:
    1. fal-ai/nano-banana-pro/edit  (mascot refs + scene prompt) → scene_NN.png
    2. fal-ai/veo3-fast/image-to-video  (scene image + dialogue + animation) → scene_NN.mp4

Then ffmpeg concat all scene MP4s → final.mp4

meta.json schema (per reel):
{
  "reel_number": 1, "category": "...", "avatar": "...", "lever": "...",
  "concept": "...", "voice_direction": "...", "hashtags": "...",
  "scenes": {
    "1": {
      "favorite_version": 2 | null,
      "versions": [
        {
          "version": 1,
          "image_filename": "scene_01_v1.png",
          "video_filename": "scene_01_v1.mp4",
          "setting": "...", "expression": "smug", "tone_id": "deadpan",
          "dialogue": "...", "animation_hint": "...",
          "image_prompt_used": "...", "video_prompt_used": "...",
          "refs_used": ["base.png", "smug.png"],
          "aspect_ratio": "9:16",
          "generated_at": "..."
        }
      ]
    }
  }
}
"""
from __future__ import annotations

import json
import re
import subprocess
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

import fal_client
import requests

from backend.config import BRAND_DIR, OUTPUTS_DIR
from backend.tools.brand.service import load_mascot, list_mascot_refs
from backend.tools.reels.parser import Reel, parse_director_file

REELS_DIR = OUTPUTS_DIR / "reels"
DIRECTOR_DIR = OUTPUTS_DIR / "director"

IMAGE_EDIT_MODEL = "fal-ai/nano-banana-2/edit"
VIDEO_MODEL = "fal-ai/veo3.1/fast/image-to-video"
VEO_VALID_ASPECTS = {"auto", "16:9", "9:16"}

# ─── Pricing (approximate, kept in sync with FAL docs) ───────────────────────

IMAGE_PER_SCENE = 0.08  # nano-banana-2/edit at 1K resolution = $0.08
VIDEO_PER_SCENE = 1.20  # Veo 3.1 Fast 8s ~$1.20 each
PER_REEL_3 = (IMAGE_PER_SCENE + VIDEO_PER_SCENE) * 3
PER_REEL_4 = (IMAGE_PER_SCENE + VIDEO_PER_SCENE) * 4


def pricing_info() -> dict:
    return {
        "image_per_scene": IMAGE_PER_SCENE,
        "video_per_scene": VIDEO_PER_SCENE,
        "estimated_per_reel_3_scenes": round(PER_REEL_3, 2),
        "estimated_per_reel_4_scenes": round(PER_REEL_4, 2),
    }


# ─── Director file access ────────────────────────────────────────────────────

def list_director_files() -> list[dict]:
    if not DIRECTOR_DIR.exists():
        return []
    out = []
    for f in sorted(DIRECTOR_DIR.glob("*.md"), reverse=True):
        try:
            count = len(parse_director_file(f))
        except Exception:
            count = 0
        out.append({"filename": f.name, "reels_count": count})
    return out


def load_reels(filename: str) -> list[Reel]:
    return parse_director_file(DIRECTOR_DIR / filename)


# ─── Mascot reference resolution ─────────────────────────────────────────────

def resolve_ref(expression: str, override_filename: Optional[str] = None) -> Path:
    """
    Pick a SINGLE mascot reference image to use as the base for /edit.

    Priority:
      1. If `override_filename` is given and exists on disk, use that.
      2. Else, if a ref is tagged with the requested expression, use it.
      3. Else, use the favorite (is_base=True).
      4. Else, use the alphabetically first ref.
    """
    refs = list_mascot_refs(BRAND_DIR)
    if not refs:
        raise RuntimeError("No mascot references uploaded. Add at least one in Brand Tool → Mascot.")

    mdir = BRAND_DIR / "mascot"

    if override_filename:
        target = mdir / override_filename
        if target.exists() and any(r["filename"] == override_filename for r in refs):
            return target
        # fall through if invalid

    expr = (expression or "").strip().lower()
    expr_match = next(
        (r for r in refs if (r.get("tag") or "").strip().lower() == expr),
        None,
    )
    base_match = next((r for r in refs if r.get("is_base")), None)
    chosen = expr_match or base_match or refs[0]
    return mdir / chosen["filename"]


# ─── FAL pipeline ─────────────────────────────────────────────────────────────

def _build_image_prompt(scene_setting: str, expression: str, extra: str = "") -> str:
    """
    For nano-banana-2/edit, the character comes from the reference image.
    The prompt should describe ONLY the scene + expression — never redescribe
    the character's body (or contradict the reference).
    """
    bits = [
        "Use the character from the reference image. Preserve every visual feature "
        "of the character exactly as shown — body shape, color, proportions, face, "
        "any limbs or accessories present in the reference. Do not add or remove features."
    ]
    if expression:
        bits.append(f"The character's expression in this scene is {expression}.")
    if scene_setting:
        bits.append(f"Place the character into this scene: {scene_setting.strip()}")
    bits.append(
        "Cinematic framing. The character is clearly visible and the focal point of the frame. "
        "By default, the character faces the camera with mouth and face visible (ready for lip-sync). "
        "Soft Pixar-style lighting consistent with the scene's described mood. "
        "Diegetic in-scene text (sticky notes, screens, signs) is allowed if part of the setting."
    )
    if extra.strip():
        bits.append(extra.strip())
    return " ".join(b for b in bits if b)


def _build_video_prompt(dialogue: str, animation_hint: str, tone_id: str, tones_meta: list[dict]) -> str:
    tone_desc = next(
        (t.get("label", "") + " — " + t.get("use_when", "") for t in tones_meta if t.get("id") == tone_id),
        tone_id or "",
    )
    bits = []
    if animation_hint:
        bits.append(animation_hint.strip())
    if dialogue:
        bits.append(f"The character speaks the line: \"{dialogue.strip()}\"")
    if tone_desc:
        bits.append(f"Voice tone: {tone_desc}")
    bits.append(
        "Lip-sync is critical: the character's mouth movements must clearly match the spoken dialogue. "
        "Subtle natural body movement. The character remains the focal point. "
        "Do NOT add subtitles, captions, lower-third text, watermarks, or any text overlay on top of the video. "
        "Existing in-scene text already in the starting image (signs, screens, sticky notes) must be preserved. "
        "9:16 vertical."
    )
    return " ".join(bits)


VEO_NEGATIVE_PROMPT = (
    "subtitles, captions, on-screen text overlay, lower thirds, hardcoded text, "
    "watermark, logo overlay, burned-in text, closed captions, title cards"
)


# ─── Preview helpers (return the prompt text without calling FAL) ────────────

def preview_image_prompt(setting: str, expression: str, extra: str = "") -> str:
    return _build_image_prompt(setting, expression, extra)


def preview_video_prompt(dialogue: str, animation_hint: str, tone_id: str) -> str:
    _, tones = get_mascot_context()
    return _build_video_prompt(dialogue, animation_hint, tone_id, tones)


def generate_scene_image(
    primary_ref: Path,
    image_prompt: str,
    aspect_ratio: str,
) -> tuple[bytes, list[str]]:
    """Call nano-banana/edit with a SINGLE mascot ref + scene prompt. Returns (png_bytes, ref_filenames_used)."""
    primary_url = fal_client.upload_file(str(primary_ref))
    image_urls = [primary_url]

    result = fal_client.subscribe(
        IMAGE_EDIT_MODEL,
        arguments={
            "prompt": image_prompt,
            "image_urls": image_urls,
            "num_images": 1,
            "aspect_ratio": aspect_ratio,
            "output_format": "png",
            "resolution": "1K",
        },
        with_logs=False,
    )
    images = result.get("images", [])
    if not images:
        raise RuntimeError(f"FAL {IMAGE_EDIT_MODEL} returned no images")
    url = images[0]["url"]
    png = requests.get(url, timeout=60).content
    return png, [primary_ref.name]


def generate_scene_video(
    scene_image_path: Path,
    video_prompt: str,
    aspect_ratio: str = "9:16",
    auto_fix: bool = True,
) -> bytes:
    """Call veo3.1 fast image-to-video with the generated scene image as start frame."""
    image_url = fal_client.upload_file(str(scene_image_path))
    # Veo 3.1 Fast only accepts auto / 16:9 / 9:16. Default odd values to 9:16 (reel format).
    veo_aspect = aspect_ratio if aspect_ratio in VEO_VALID_ASPECTS else "9:16"
    arguments = {
        "image_url": image_url,
        "prompt": video_prompt,
        "negative_prompt": VEO_NEGATIVE_PROMPT,
        "duration": "8s",
        "aspect_ratio": veo_aspect,
        "resolution": "720p",
        "generate_audio": True,
        "auto_fix": auto_fix,
    }
    result = fal_client.subscribe(VIDEO_MODEL, arguments=arguments, with_logs=False)
    video = result.get("video") or (result.get("videos", [{}])[0] if result.get("videos") else None)
    if not video or not video.get("url"):
        raise RuntimeError(f"FAL Veo returned no video. Result keys: {list(result.keys())}")
    mp4 = requests.get(video["url"], timeout=300).content
    return mp4


# ─── Output folder + meta ────────────────────────────────────────────────────

def _date_from_filename(filename: str) -> str:
    m = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
    return m.group(1) if m else datetime.now().strftime("%Y-%m-%d")


def _reel_dir(filename: str, reel: Reel) -> Path:
    date_str = _date_from_filename(filename)
    d = REELS_DIR / date_str / reel.slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def _target_dir(date: str, reel_slug: str) -> Path:
    return REELS_DIR / date / reel_slug


def _meta_path(reel_dir: Path) -> Path:
    return reel_dir / "meta.json"


def _load_or_init_meta(reel_dir: Path, reel: Optional[Reel] = None) -> dict:
    p = _meta_path(reel_dir)
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
    if reel is None:
        return {"scenes": {}}
    return {
        "reel_number": reel.number,
        "category": reel.category,
        "avatar": reel.avatar,
        "lever": reel.lever,
        "concept": reel.concept,
        "caption": getattr(reel, "caption", ""),
        "voice_direction": reel.voice_direction,
        "hashtags": reel.hashtags,
        "rationale": reel.rationale,
        "scenes": {},
    }


def _save_meta(reel_dir: Path, meta: dict) -> None:
    _meta_path(reel_dir).write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _next_version(scene_entry: dict) -> int:
    versions = scene_entry.get("versions", [])
    if not versions:
        return 1
    return max(v.get("version", 0) for v in versions) + 1


def _scene_url(date: str, reel_slug: str, filename: str) -> str:
    return f"/outputs/reels/{date}/{reel_slug}/{filename}"


def save_image_only_version(
    filename: str,
    reel: Reel,
    scene_number: int,
    image_bytes: bytes,
    image_prompt_used: str,
    refs_used: list[str],
    setting: str,
    expression: str,
    aspect_ratio: str,
) -> dict:
    """Create a NEW version with image only (no video yet)."""
    reel_dir = _reel_dir(filename, reel)
    meta = _load_or_init_meta(reel_dir, reel)
    key = str(scene_number)
    scene_entry = meta["scenes"].get(key) or {"favorite_version": None, "versions": []}

    ver = _next_version(scene_entry)
    img_name = f"scene_{scene_number:02d}_v{ver}.png"
    (reel_dir / img_name).write_bytes(image_bytes)

    date_str = _date_from_filename(filename)
    new_version = {
        "version": ver,
        "image_filename": img_name,
        "image_url": _scene_url(date_str, reel.slug, img_name),
        "video_filename": None,
        "video_url": None,
        "setting": setting,
        "expression": expression,
        "tone_id": "",
        "dialogue": "",
        "animation_hint": "",
        "image_prompt_used": image_prompt_used,
        "video_prompt_used": "",
        "refs_used": refs_used,
        "aspect_ratio": aspect_ratio,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    scene_entry["versions"].append(new_version)
    meta["scenes"][key] = scene_entry
    _save_meta(reel_dir, meta)
    return {
        "scene_number": scene_number,
        "new_version": new_version,
        "all_versions": scene_entry["versions"],
        "favorite_version": scene_entry.get("favorite_version"),
    }


def add_video_to_version(
    date: str,
    reel_slug: str,
    scene_number: int,
    version: int,
    video_bytes: bytes,
    video_prompt_used: str,
    tone_id: str,
    dialogue: str,
    animation_hint: str,
) -> dict:
    """Attach (or replace) a video on an existing image-only version."""
    reel_dir = _target_dir(date, reel_slug)
    if not reel_dir.exists():
        raise FileNotFoundError(f"Reel folder not found: {date}/{reel_slug}")
    meta = _load_or_init_meta(reel_dir)
    key = str(scene_number)
    scene_entry = meta.get("scenes", {}).get(key)
    if not scene_entry:
        raise FileNotFoundError(f"Scene {scene_number} not found")
    target_version = next(
        (v for v in scene_entry.get("versions", []) if v.get("version") == version),
        None,
    )
    if not target_version:
        raise FileNotFoundError(f"Version {version} not found")

    vid_name = f"scene_{scene_number:02d}_v{version}.mp4"
    (reel_dir / vid_name).write_bytes(video_bytes)
    target_version["video_filename"] = vid_name
    target_version["video_url"] = _scene_url(date, reel_slug, vid_name)
    target_version["video_prompt_used"] = video_prompt_used
    target_version["tone_id"] = tone_id
    target_version["dialogue"] = dialogue
    target_version["animation_hint"] = animation_hint
    target_version["video_generated_at"] = datetime.utcnow().isoformat() + "Z"
    _save_meta(reel_dir, meta)
    return {
        "scene_number": scene_number,
        "new_version": target_version,
        "all_versions": scene_entry["versions"],
        "favorite_version": scene_entry.get("favorite_version"),
    }


def set_favorite_version(date: str, reel_slug: str, scene_number: int, version: Optional[int]) -> dict:
    reel_dir = _target_dir(date, reel_slug)
    if not reel_dir.exists():
        raise FileNotFoundError(f"Reel folder not found: {date}/{reel_slug}")
    meta = _load_or_init_meta(reel_dir)
    key = str(scene_number)
    entry = meta.get("scenes", {}).get(key)
    if not entry:
        raise FileNotFoundError(f"Scene {scene_number} not generated yet")
    if version is not None:
        existing = {v.get("version") for v in entry.get("versions", [])}
        if version not in existing:
            raise ValueError(f"Version {version} does not exist")
    entry["favorite_version"] = version
    _save_meta(reel_dir, meta)
    return entry


# ─── Listing ──────────────────────────────────────────────────────────────────

def _hydrate_scene_urls(date: str, reel_slug: str, entry: dict) -> list[dict]:
    versions = []
    for v in entry.get("versions", []):
        v_copy = dict(v)
        if v_copy.get("image_filename"):
            v_copy["image_url"] = _scene_url(date, reel_slug, v_copy["image_filename"])
        if v_copy.get("video_filename"):
            v_copy["video_url"] = _scene_url(date, reel_slug, v_copy["video_filename"])
        versions.append(v_copy)
    return versions


def _final_url_if_exists(date: str, reel_slug: str) -> Optional[str]:
    target = _target_dir(date, reel_slug)
    final = target / "final.mp4"
    if final.exists():
        return _scene_url(date, reel_slug, "final.mp4")
    return None


def get_reel_output(date: str, reel_slug: str) -> Optional[dict]:
    reel_dir = _target_dir(date, reel_slug)
    if not reel_dir.exists():
        return None
    if not _meta_path(reel_dir).exists():
        return None
    meta = _load_or_init_meta(reel_dir)
    scenes = []
    for num_str, entry in sorted(meta.get("scenes", {}).items(), key=lambda x: int(x[0])):
        versions = _hydrate_scene_urls(date, reel_slug, entry)
        scenes.append({
            "scene_number": int(num_str),
            "versions": versions,
            "favorite_version": entry.get("favorite_version"),
        })
    return {
        "folder": f"{date}/{reel_slug}",
        "date": date,
        "reel_slug": reel_slug,
        "reel_number": meta.get("reel_number"),
        "category": meta.get("category", ""),
        "avatar": meta.get("avatar", ""),
        "lever": meta.get("lever", ""),
        "concept": meta.get("concept", ""),
        "caption": meta.get("caption", ""),
        "voice_direction": meta.get("voice_direction", ""),
        "hashtags": meta.get("hashtags", ""),
        "scenes": scenes,
        "final_url": _final_url_if_exists(date, reel_slug),
    }


def list_generated_reels() -> list[dict]:
    if not REELS_DIR.exists():
        return []
    result = []
    for date_dir in sorted(REELS_DIR.iterdir(), reverse=True):
        if not date_dir.is_dir():
            continue
        for reel_dir in sorted(date_dir.iterdir()):
            if not reel_dir.is_dir():
                continue
            data = get_reel_output(date_dir.name, reel_dir.name)
            if data:
                result.append(data)
    return result


# ─── ffmpeg final assembly ────────────────────────────────────────────────────

def _pick_version(entry: dict, require_video: bool = False) -> Optional[dict]:
    versions = entry.get("versions", [])
    if not versions:
        return None
    if require_video:
        videos = [v for v in versions if v.get("video_filename")]
        if not videos:
            return None
        fav = entry.get("favorite_version")
        if fav is not None:
            for v in videos:
                if v.get("version") == fav:
                    return v
        return videos[-1]
    fav = entry.get("favorite_version")
    if fav is not None:
        for v in versions:
            if v.get("version") == fav:
                return v
    return versions[-1]


def render_final(date: str, reel_slug: str) -> str:
    """Concat scene MP4s (favorite or latest of each scene) into final.mp4."""
    reel_dir = _target_dir(date, reel_slug)
    if not reel_dir.exists():
        raise FileNotFoundError(f"Reel folder not found: {date}/{reel_slug}")
    meta = _load_or_init_meta(reel_dir)

    # collect chosen scene videos in scene-number order
    chosen: list[Path] = []
    for num_str, entry in sorted(meta.get("scenes", {}).items(), key=lambda x: int(x[0])):
        picked = _pick_version(entry, require_video=True)
        if not picked or not picked.get("video_filename"):
            continue
        path = reel_dir / picked["video_filename"]
        if not path.exists():
            continue
        chosen.append(path)

    if not chosen:
        raise RuntimeError("No scene videos available for final render")

    # write a concat list file in a temp dir
    with tempfile.TemporaryDirectory() as tmp:
        list_path = Path(tmp) / "list.txt"
        with open(list_path, "w") as f:
            for p in chosen:
                f.write(f"file '{p.resolve()}'\n")
        out_path = reel_dir / "final.mp4"
        # use concat demuxer; -c copy fails if codecs differ — re-encode for safety
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(list_path),
            "-c:v", "libx264", "-preset", "veryfast",
            "-c:a", "aac", "-b:a", "192k",
            "-r", "30", "-pix_fmt", "yuv420p",
            str(out_path),
        ]
        if shutil.which("ffmpeg") is None:
            raise RuntimeError("ffmpeg not found in PATH. Install with `brew install ffmpeg`.")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {result.stderr[-500:]}")
    return _scene_url(date, reel_slug, "final.mp4")


# ─── Mascot helpers exposed ──────────────────────────────────────────────────

def get_mascot_context() -> tuple[str, list[dict]]:
    """Return (visual_description, tones_list) from mascot.json."""
    data = load_mascot(BRAND_DIR)
    return data.get("visual_description", ""), data.get("tones", [])


# ─── Pipeline orchestrator ──────────────────────────────────────────────────

def generate_scene_image_step(
    filename: str,
    reel: Reel,
    scene_number: int,
    setting: str,
    expression: str,
    aspect_ratio: str,
    extra_image_prompt: str = "",
    ref_filename: Optional[str] = None,
    prompt_override: Optional[str] = None,
) -> dict:
    """Step 1: generate the still image only. Saves a new image-only version.
    If prompt_override is provided, it bypasses the auto-built prompt entirely."""
    primary_ref = resolve_ref(expression, ref_filename)
    image_prompt = (prompt_override or "").strip() or _build_image_prompt(
        setting, expression, extra_image_prompt
    )

    img_bytes, refs_used = generate_scene_image(primary_ref, image_prompt, aspect_ratio)
    return save_image_only_version(
        filename, reel, scene_number,
        img_bytes, image_prompt, refs_used,
        setting, expression, aspect_ratio,
    )


def animate_scene_version_step(
    date: str,
    reel_slug: str,
    scene_number: int,
    version: int,
    dialogue: str,
    animation_hint: str,
    tone_id: str,
    aspect_ratio: str,
    prompt_override: Optional[str] = None,
    auto_fix: bool = True,
) -> dict:
    """Step 2: animate an existing image version. Reads scene_NN_vM.png from disk and calls Veo i2v.
    If prompt_override is provided, it bypasses the auto-built prompt entirely."""
    reel_dir = _target_dir(date, reel_slug)
    meta = _load_or_init_meta(reel_dir)
    key = str(scene_number)
    scene_entry = meta.get("scenes", {}).get(key)
    if not scene_entry:
        raise FileNotFoundError(f"Scene {scene_number} not found")
    target_version = next(
        (v for v in scene_entry.get("versions", []) if v.get("version") == version),
        None,
    )
    if not target_version or not target_version.get("image_filename"):
        raise FileNotFoundError(f"Version {version} has no image to animate")
    img_path = reel_dir / target_version["image_filename"]
    if not img_path.exists():
        raise FileNotFoundError(f"Image file missing: {img_path.name}")

    _, tones = get_mascot_context()
    video_prompt = (prompt_override or "").strip() or _build_video_prompt(
        dialogue, animation_hint, tone_id, tones
    )
    vid_bytes = generate_scene_video(img_path, video_prompt, aspect_ratio, auto_fix=auto_fix)

    return add_video_to_version(
        date, reel_slug, scene_number, version,
        vid_bytes, video_prompt, tone_id, dialogue, animation_hint,
    )


def delete_reel(date: str, reel_slug: str) -> None:
    target = _target_dir(date, reel_slug)
    if not target.exists():
        raise FileNotFoundError(f"Reel folder not found: {date}/{reel_slug}")
    shutil.rmtree(target)
