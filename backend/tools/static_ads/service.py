"""
Static Ad Service — refactored from skills/references/generate_ads.py.
Synchronous methods designed to be called via asyncio.to_thread().
"""

import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import fal_client
import requests

from backend.config import OUTPUTS_DIR

TEXT_TO_IMAGE_MODEL = "fal-ai/nano-banana-2"

COST_PER_IMAGE = {
    "0.5K": 0.06,
    "1K": 0.08,
    "2K": 0.12,
    "4K": 0.16,
}


class StaticAdService:
    def __init__(self, brand_dir: Path):
        self.brand_dir = brand_dir
        self.outputs_dir = OUTPUTS_DIR / "static_ads"
        self.outputs_dir.mkdir(exist_ok=True)

    def generate_single(
        self,
        prompt_data: dict,
        resolution: str = "2K",
        num_images: int = 4,
        output_format: str = "png",
    ) -> dict:
        """Generate images for a single prompt. Returns result dict."""
        num = prompt_data["template_number"]
        name = prompt_data["template_name"]
        folder_name = f"{num:02d}-{name}"
        template_dir = self.outputs_dir / folder_name
        template_dir.mkdir(exist_ok=True)

        start = time.time()

        arguments = {
            "prompt": prompt_data["prompt"],
            "num_images": num_images,
            "aspect_ratio": prompt_data.get("aspect_ratio", "auto"),
            "output_format": output_format,
            "resolution": resolution,
        }

        result = fal_client.subscribe(
            TEXT_TO_IMAGE_MODEL,
            arguments=arguments,
            with_logs=True,
        )

        elapsed = time.time() - start

        # Download images — use max existing version to avoid overwriting even if files were deleted
        images = result.get("images", [])
        image_files = []
        existing = list(template_dir.glob(f"{name}_v*.{output_format}"))
        versions = [int(m.group(1)) for f in existing if (m := re.search(r'_v(\d+)', f.stem))]
        next_v = max(versions, default=0) + 1
        for j, img in enumerate(images):
            filename = f"{name}_v{next_v + j}.{output_format}"
            filepath = template_dir / filename
            self._download_image(img["url"], filepath)
            image_files.append(filename)

        # Append to meta.json (preserves history across re-runs)
        meta_path = template_dir / "meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {
            "template_number": num,
            "template_name": name,
            "aspect_ratio": prompt_data.get("aspect_ratio", "auto"),
            "generations": [],
        }
        meta["generations"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "resolution": resolution,
            "prompt": prompt_data["prompt"],
            "images": image_files,
        })
        meta.update({"resolution": resolution, "prompt": prompt_data["prompt"]})
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        return {
            "folder": folder_name,
            "images": len(images),
            "image_files": image_files,
            "time": round(elapsed, 1),
        }

    def _download_image(self, url: str, output_path: Path):
        """Download an image from a URL."""
        resp = requests.get(url, stream=True, timeout=120)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

    def generate_gallery(self, prompts: list[dict], results: list) -> Path:
        """Generate an HTML gallery page."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        gallery_items = []
        for r in results:
            if hasattr(r, "status"):
                status = r.status
                folder = r.folder
                num = r.template_number
                name = r.template_name
            else:
                status = r.get("status", "")
                folder = r.get("folder", "")
                num = r.get("template_number", 0)
                name = r.get("template_name", "")

            if status != "success":
                continue

            template_dir = self.outputs_dir / folder
            if not template_dir.exists():
                continue

            image_exts = {".png", ".jpg", ".jpeg", ".webp"}
            images = sorted(
                f for f in template_dir.iterdir()
                if f.suffix.lower() in image_exts
            )
            for img in images:
                gallery_items.append({
                    "template_number": num,
                    "template_name": name,
                    "image_path": f"{folder}/{img.name}",
                    "filename": img.name,
                })

        success_count = sum(1 for r in results if (r.status if hasattr(r, "status") else r.get("status")) == "success")
        error_count = len(results) - success_count

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Jess Trading — Generated Ads</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: Inter, -apple-system, sans-serif; background: #0a0a0a; color: #fff; padding: 2rem; }}
  h1 {{ font-size: 2rem; margin-bottom: 0.25rem; }}
  .meta {{ color: #888; margin-bottom: 2rem; font-size: 0.9rem; }}
  .section-title {{ font-size: 1.25rem; color: #A5F28C; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #333; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
  .card {{ background: #1a1a1a; border-radius: 8px; overflow: hidden; transition: transform 0.2s; }}
  .card:hover {{ transform: scale(1.02); }}
  .card img {{ width: 100%; display: block; cursor: pointer; }}
  .card .label {{ padding: 0.75rem; font-size: 0.8rem; color: #aaa; }}
  .stats {{ display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; }}
  .stat {{ text-align: center; }}
  .stat .num {{ font-size: 1.5rem; font-weight: bold; color: #A5F28C; }}
  .stat .desc {{ font-size: 0.75rem; color: #888; margin-top: 0.25rem; }}
  .lightbox {{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 1000; justify-content: center; align-items: center; cursor: pointer; }}
  .lightbox.active {{ display: flex; }}
  .lightbox img {{ max-width: 90%; max-height: 90%; object-fit: contain; }}
</style>
</head>
<body>
<h1>Jess Trading</h1>
<p class="meta">Generated {timestamp}</p>
<div class="stats">
  <div class="stat"><div class="num">{len(gallery_items)}</div><div class="desc">Images</div></div>
  <div class="stat"><div class="num">{success_count}</div><div class="desc">Templates OK</div></div>
  <div class="stat"><div class="num">{error_count}</div><div class="desc">Errors</div></div>
</div>
"""

        current_template = None
        for item in gallery_items:
            if item["template_number"] != current_template:
                if current_template is not None:
                    html += "</div>\n"
                current_template = item["template_number"]
                html += f'<h2 class="section-title">#{item["template_number"]:02d} — {item["template_name"].replace("-", " ").title()}</h2>\n'
                html += '<div class="grid">\n'
            html += f'  <div class="card"><img src="{item["image_path"]}" alt="{item["template_name"]}" onclick="openLightbox(this.src)" loading="lazy"><div class="label">{item["filename"]}</div></div>\n'

        if current_template is not None:
            html += "</div>\n"

        html += """
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <img id="lightbox-img" src="" alt="">
</div>
<script>
function openLightbox(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').classList.add('active'); }
function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
</script>
</body></html>"""

        gallery_path = self.outputs_dir / "index.html"
        with open(gallery_path, "w", encoding="utf-8") as f:
            f.write(html)

        return gallery_path
