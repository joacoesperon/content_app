"""
Concept Ad Service — FAL generation for Concepts Mode and Remix Mode.
Synchronous methods designed to be called via asyncio.to_thread().
"""

import json
import time
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

        full_prompt = (
            f"{brand_modifier}\n\n"
            f"FORMAT: {format_data.get('name', format_id)}. "
            f"Visual rules: {format_data.get('visual_rules', '')} "
            f"Copy guidance: {format_data.get('copy_guidance', '')}\n\n"
            f"AVATAR CONTEXT: {avatar_context}\n\n"
            f"HOOK: {hook}\n"
            f"ANGLE: {angle}\n\n"
            f"ADDITIONAL: {prompt_additions}"
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

        # Save meta.json
        meta = {
            "concept_index": idx,
            "avatar_id": avatar_id,
            "avatar_name": avatar_data.get("name", avatar_id),
            "format_id": format_id,
            "format_name": format_data.get("name", format_id),
            "hook": hook,
            "angle": angle,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "prompt": full_prompt,
        }
        with open(concept_dir / "meta.json", "w", encoding="utf-8") as f:
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
    ) -> dict:
        """Generate remix images using a reference image via FAL edit endpoint."""
        ref_file = Path(reference_path)

        # Upload reference to FAL storage
        ref_url = fal_client.upload_file(str(ref_file))

        full_prompt = (
            f"{brand_modifier}\n\n"
            f"Replicate the visual style, composition, and mood of the reference image "
            f"but apply it to Jess Trading's brand and product. "
            f"{instructions}"
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
                "image_urls": [ref_url],
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

        meta = {
            "type": "remix",
            "reference": ref_file.name,
            "instructions": instructions,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "prompt": full_prompt,
        }
        with open(remix_dir / "meta.json", "w", encoding="utf-8") as f:
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
