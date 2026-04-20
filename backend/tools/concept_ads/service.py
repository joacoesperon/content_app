"""
Concept Ad Service — FAL generation for Concepts Mode and Remix Mode.
Synchronous methods designed to be called via asyncio.to_thread().
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import fal_client
import requests

TEXT_TO_IMAGE_MODEL = "fal-ai/nano-banana-2"
IMAGE_EDIT_MODEL = "fal-ai/nano-banana-2/edit"

COST_PER_IMAGE = {
    "0.5K": 0.06,
    "1K": 0.08,
    "2K": 0.12,
    "4K": 0.16,
}


class ConceptAdService:
    def __init__(self, brand_dir: Path):
        self.brand_dir = brand_dir
        self.outputs_dir = brand_dir / "concept-outputs"
        self.outputs_dir.mkdir(exist_ok=True)

    def generate_concept(
        self,
        concept: dict,
        format_data: dict,
        avatar_data: dict,
        brand_modifier: str,
        resolution: str = "2K",
        num_images: int = 2,
        output_format: str = "png",
    ) -> dict:
        """Generate images for a single concept. Returns result dict."""
        idx = concept["concept_index"]
        avatar_id = concept["avatar_id"]
        format_id = concept["format_id"]
        hook = concept.get("hook", "")
        angle = concept.get("angle", "")
        prompt_additions = concept.get("prompt_additions", "")
        aspect_ratio = concept.get("aspect_ratio", "4:5")

        folder_name = f"{idx:02d}-{format_id}-{avatar_id}"
        concept_dir = self.outputs_dir / folder_name
        concept_dir.mkdir(exist_ok=True)

        # Compose full prompt
        avatar_context = (
            f"Target customer: {avatar_data.get('name', avatar_id)}. "
            f"{avatar_data.get('description', '')} "
            f"Pain points: {', '.join(avatar_data.get('pain_points', []))}. "
            f"Language style: {avatar_data.get('language_sample', '')}."
        ).strip()

        modifier_block = f"{brand_modifier}\n\n" if brand_modifier else ""
        full_prompt = (
            f"{modifier_block}"
            f"FORMAT: {format_data.get('name', format_id)}. "
            f"Visual rules: {format_data.get('visual_rules', '')} "
            f"Copy guidance: {format_data.get('copy_guidance', '')}\n\n"
            f"AVATAR CONTEXT: {avatar_context}\n\n"
            f"HOOK: {hook}\n"
            f"ANGLE: {angle}\n\n"
            f"ADDITIONAL: {prompt_additions}\n\n"
            f"IMPORTANT: If the concept includes a person, generate a completely original individual "
            f"who embodies the avatar archetype described above. Do not replicate any specific "
            f"person's face, identity, or likeness.\n\n"
            f"CRITICAL: Any text, overlays, headlines, or copy visible inside the image MUST be in English."
        ).strip()

        start = time.time()

        result = fal_client.subscribe(
            TEXT_TO_IMAGE_MODEL,
            arguments={
                "prompt": full_prompt,
                "num_images": num_images,
                "aspect_ratio": aspect_ratio,
                "output_format": output_format,
                "resolution": resolution,
            },
            with_logs=True,
        )

        elapsed = time.time() - start
        images = result.get("images", [])

        # Number from existing files to avoid overwriting
        existing = list(concept_dir.glob(f"image_v*.{output_format}"))
        next_v = len(existing) + 1
        image_files = []
        for j, img in enumerate(images):
            filename = f"image_v{next_v + j}.{output_format}"
            self._download_image(img["url"], concept_dir / filename)
            image_files.append(filename)

        # Append to meta.json (preserves history across re-runs)
        meta_path = concept_dir / "meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {
            "concept_index": idx,
            "avatar_id": avatar_id,
            "avatar_name": avatar_data.get("name", avatar_id),
            "format_id": format_id,
            "format_name": format_data.get("name", format_id),
            "aspect_ratio": aspect_ratio,
            "generations": [],
        }
        meta["generations"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hook": hook,
            "angle": angle,
            "resolution": resolution,
            "prompt": full_prompt,
            "images": image_files,
        })
        # Keep top-level hook/angle/resolution pointing to the latest run for display
        meta.update({"hook": hook, "angle": angle, "resolution": resolution, "prompt": full_prompt})
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        return {
            "folder": folder_name,
            "images": len(images),
            "image_files": image_files,
            "time": round(elapsed, 1),
        }

    def generate_remix(
        self,
        reference_path: str,
        instructions: str,
        brand_modifier: str,
        aspect_ratio: str = "4:5",
        num_images: int = 2,
        resolution: str = "2K",
        output_format: str = "png",
        ref_ad_paths: list[str] | None = None,
        product_image_paths: list[str] | None = None,
        avatar_data: dict | None = None,
    ) -> dict:
        """Generate remix images using a reference image via FAL edit endpoint."""
        ref_file = Path(reference_path)

        # Upload main reference to FAL storage
        ref_url = fal_client.upload_file(str(ref_file))

        # Upload product images (passed as additional image inputs to FAL)
        product_urls: list[str] = []
        for path in (product_image_paths or []):
            try:
                product_urls.append(fal_client.upload_file(path))
            except Exception:
                pass

        # Upload brand reference ads as additional style inputs
        ref_ad_urls: list[str] = []
        for path in (ref_ad_paths or []):
            try:
                ref_ad_urls.append(fal_client.upload_file(path))
            except Exception:
                pass

        # Order: [reference ad, product images, brand reference ads]
        all_image_urls = [ref_url] + product_urls + ref_ad_urls

        modifier_block = f"{brand_modifier}\n\n" if brand_modifier else ""

        # Avatar context block
        avatar_block = ""
        if avatar_data:
            avatar_block = (
                f"\nTARGET AUDIENCE: {avatar_data.get('name', '')}. "
                f"{avatar_data.get('description', '')} "
                f"Pain points: {', '.join(avatar_data.get('pain_points', []))}. "
                f"Desires: {', '.join(avatar_data.get('desires', []))}. "
                f"Language style: {avatar_data.get('language_sample', '')}.\n"
            )

        product_note = (
            " The product image(s) provided must be featured prominently in the ad."
        ) if product_urls else ""

        ref_ads_note = (
            " The additional brand reference images show the brand's existing ad style — "
            "use them as a soft visual style guide."
        ) if ref_ad_urls else ""

        full_prompt = (
            f"{modifier_block}"
            f"Replicate the visual style, composition, and mood of the first reference image.{product_note}{ref_ads_note}"
            f"{avatar_block}\n"
            f"{instructions}\n\n"
            f"IMPORTANT: If the reference image contains a person, do NOT copy their face, "
            f"age, ethnicity, or identity. Instead, cast a completely different individual "
            f"who plays the same role (e.g. same archetype: 'young trader at desk', "
            f"'confident professional', etc.) but with entirely different appearance."
        ).strip()

        idx = int(time.time()) % 100000
        folder_name = f"remix-{idx}"
        remix_dir = self.outputs_dir / folder_name
        remix_dir.mkdir(exist_ok=True)

        start = time.time()

        result = fal_client.subscribe(
            IMAGE_EDIT_MODEL,
            arguments={
                "prompt": full_prompt,
                "image_urls": all_image_urls,
                "num_images": num_images,
                "aspect_ratio": aspect_ratio,
                "output_format": output_format,
                "resolution": resolution,
            },
            with_logs=True,
        )

        elapsed = time.time() - start
        images = result.get("images", [])

        existing = list(remix_dir.glob(f"image_v*.{output_format}"))
        next_v = len(existing) + 1
        image_files = []
        for j, img in enumerate(images):
            filename = f"image_v{next_v + j}.{output_format}"
            self._download_image(img["url"], remix_dir / filename)
            image_files.append(filename)

        meta_path = remix_dir / "meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {
            "type": "remix",
            "reference": ref_file.name,
            "avatar_id": (avatar_data or {}).get("id", ""),
            "avatar_name": (avatar_data or {}).get("name", ""),
            "generations": [],
        }
        meta["generations"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "instructions": instructions,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "prompt": full_prompt,
            "reference_ads_used": len(ref_ad_urls),
            "product_images_used": len(product_urls),
            "images": image_files,
        })
        meta.update({"instructions": instructions, "aspect_ratio": aspect_ratio, "resolution": resolution, "prompt": full_prompt})
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        return {
            "folder": folder_name,
            "images": len(images),
            "image_files": image_files,
            "time": round(elapsed, 1),
        }

    def _download_image(self, url: str, output_path: Path):
        resp = requests.get(url, stream=True, timeout=120)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
