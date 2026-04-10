#!/usr/bin/env python3
"""
Static Ad Generator — FAL API Image Generation Script
=====================================================
Generates production-ready static ad images from prompts.json
using Nano Banana 2 via the FAL API.

Usage:
    cd brand
    python generate_ads.py                        # All templates
    python generate_ads.py --templates 1,7,13,15  # Specific templates
    python generate_ads.py --dry-run              # Preview without generating
    python generate_ads.py --resolution 1K        # Faster test run
    python generate_ads.py --num-images 1         # Single image per prompt (cheap test)

Requirements:
    pip install fal-client requests python-dotenv
    FAL_KEY set in .env file at project root
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
except ImportError:
    print("Error: python-dotenv not installed. Run: pip install python-dotenv")
    sys.exit(1)

try:
    import fal_client
except ImportError:
    print("Error: fal-client not installed. Run: pip install fal-client")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Error: requests not installed. Run: pip install requests")
    sys.exit(1)

# Load .env from project root (walk up from brand folder to find it)
def _find_and_load_env():
    """Search for .env starting from cwd, walking up to project root."""
    current = Path.cwd()
    for _ in range(10):
        env_file = current / ".env"
        if env_file.exists():
            load_dotenv(env_file)
            return
        parent = current.parent
        if parent == current:
            break
        current = parent

_find_and_load_env()


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TEXT_TO_IMAGE_MODEL = "fal-ai/nano-banana-2"
EDIT_MODEL = "fal-ai/nano-banana-2/edit"

DEFAULT_NUM_IMAGES = 4
DEFAULT_RESOLUTION = "2K"
DEFAULT_OUTPUT_FORMAT = "png"

COST_PER_IMAGE = {
    "0.5K": 0.06,
    "1K": 0.08,
    "2K": 0.12,
    "4K": 0.16,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_prompts(brand_dir: Path, template_filter: str | None = None) -> dict:
    """Load prompts.json and optionally filter by template numbers."""
    prompts_file = brand_dir / "prompts.json"
    if not prompts_file.exists():
        print(f"Error: {prompts_file} not found.")
        print("Run Phase 2 (Prompt Generation) first.")
        sys.exit(1)

    with open(prompts_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    if template_filter:
        filter_nums = set(int(n.strip()) for n in template_filter.split(","))
        data["prompts"] = [
            p for p in data["prompts"] if p["template_number"] in filter_nums
        ]
        if not data["prompts"]:
            print(f"Error: No prompts matched template numbers {filter_nums}")
            sys.exit(1)

    return data


def upload_product_images(brand_dir: Path) -> list[str]:
    """Upload local product images to FAL storage, return public URLs."""
    images_dir = brand_dir / "product-images"
    if not images_dir.exists():
        return []

    extensions = {".png", ".jpg", ".jpeg", ".webp"}
    image_files = sorted(
        f for f in images_dir.iterdir()
        if f.suffix.lower() in extensions
    )

    if not image_files:
        return []

    print(f"\nUploading {len(image_files)} product image(s) to FAL storage...")
    urls = []
    for img_path in image_files:
        print(f"  Uploading {img_path.name}...", end=" ", flush=True)
        try:
            url = fal_client.upload_file(str(img_path))
            urls.append(url)
            print(f"OK")
        except Exception as e:
            print(f"FAILED ({e})")

    if urls:
        print(f"  {len(urls)} image(s) uploaded successfully.\n")
    return urls


def generate_image(
    prompt_data: dict,
    product_image_urls: list[str],
    resolution: str,
    num_images: int,
    output_format: str,
) -> dict:
    """Send a single prompt to Nano Banana 2 and return the result."""

    def on_queue_update(update):
        if isinstance(update, fal_client.InProgress):
            for log in update.logs:
                print(f"    {log['message']}")

    arguments = {
        "prompt": prompt_data["prompt"],
        "num_images": num_images,
        "aspect_ratio": prompt_data.get("aspect_ratio", "auto"),
        "output_format": output_format,
        "resolution": resolution,
    }

    # Choose endpoint based on whether product images are needed & available
    use_edit = prompt_data.get("needs_product_images", False) and product_image_urls
    if use_edit:
        model = EDIT_MODEL
        arguments["image_urls"] = product_image_urls
    else:
        model = TEXT_TO_IMAGE_MODEL

    result = fal_client.subscribe(
        model,
        arguments=arguments,
        with_logs=True,
        on_queue_update=on_queue_update,
    )

    return result, model


def download_image(url: str, output_path: Path):
    """Download an image from a URL to a local file."""
    resp = requests.get(url, stream=True, timeout=120)
    resp.raise_for_status()
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)


def generate_gallery(brand_dir: Path, brand_data: dict, results: list[dict]):
    """Generate an HTML gallery page showing all generated images."""
    outputs_dir = brand_dir / "outputs"
    brand_name = brand_data.get("brand", "Unknown Brand")
    product_name = brand_data.get("product", "")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Collect all image entries
    gallery_items = []
    for r in results:
        if r["status"] != "success":
            continue
        template_dir = outputs_dir / r["folder"]
        if not template_dir.exists():
            continue
        images = sorted(
            f for f in template_dir.iterdir()
            if f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
        )
        for img in images:
            gallery_items.append({
                "template_number": r["template"],
                "template_name": r["name"],
                "image_path": f"{r['folder']}/{img.name}",
                "filename": img.name,
            })

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{brand_name} — Generated Ads</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; padding: 2rem; }}
  h1 {{ font-size: 2rem; margin-bottom: 0.25rem; }}
  .meta {{ color: #888; margin-bottom: 2rem; font-size: 0.9rem; }}
  .section-title {{ font-size: 1.25rem; color: #ccc; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #333; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
  .card {{ background: #1a1a1a; border-radius: 8px; overflow: hidden; transition: transform 0.2s; }}
  .card:hover {{ transform: scale(1.02); }}
  .card img {{ width: 100%; display: block; cursor: pointer; }}
  .card .label {{ padding: 0.75rem; font-size: 0.8rem; color: #aaa; }}
  .stats {{ display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; }}
  .stat {{ text-align: center; }}
  .stat .num {{ font-size: 1.5rem; font-weight: bold; color: #4ade80; }}
  .stat .desc {{ font-size: 0.75rem; color: #888; margin-top: 0.25rem; }}
  .error {{ color: #f87171; }}
  /* Lightbox */
  .lightbox {{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 1000; justify-content: center; align-items: center; cursor: pointer; }}
  .lightbox.active {{ display: flex; }}
  .lightbox img {{ max-width: 90%; max-height: 90%; object-fit: contain; }}
</style>
</head>
<body>

<h1>{brand_name}</h1>
<p class="meta">{product_name} &mdash; Generated {timestamp}</p>

<div class="stats">
  <div class="stat">
    <div class="num">{len(gallery_items)}</div>
    <div class="desc">Images</div>
  </div>
  <div class="stat">
    <div class="num">{sum(1 for r in results if r['status'] == 'success')}</div>
    <div class="desc">Templates OK</div>
  </div>
  <div class="stat">
    <div class="num">{sum(1 for r in results if r['status'] != 'success')}</div>
    <div class="desc">Errors</div>
  </div>
</div>
"""

    # Group by template
    current_template = None
    for item in gallery_items:
        if item["template_number"] != current_template:
            if current_template is not None:
                html += "</div>\n"
            current_template = item["template_number"]
            html += f'<h2 class="section-title">#{item["template_number"]:02d} — {item["template_name"].replace("-", " ").title()}</h2>\n'
            html += '<div class="grid">\n'

        html += f"""  <div class="card">
    <img src="{item['image_path']}" alt="{item['template_name']}" onclick="openLightbox(this.src)" loading="lazy">
    <div class="label">{item['filename']}</div>
  </div>\n"""

    if current_template is not None:
        html += "</div>\n"

    # Error section
    errors = [r for r in results if r["status"] != "success"]
    if errors:
        html += '<h2 class="section-title error">Errors</h2>\n<ul>\n'
        for e in errors:
            html += f'  <li class="error">#{e["template"]:02d} {e["name"]}: {e["status"]}</li>\n'
        html += "</ul>\n"

    html += """
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <img id="lightbox-img" src="" alt="">
</div>

<script>
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
</script>

</body>
</html>"""

    gallery_path = outputs_dir / "index.html"
    with open(gallery_path, "w", encoding="utf-8") as f:
        f.write(html)

    return gallery_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate static ads via Nano Banana 2 (FAL API)"
    )
    parser.add_argument(
        "--templates",
        type=str,
        default=None,
        help="Comma-separated template numbers to generate (e.g., 1,7,13,15)",
    )
    parser.add_argument(
        "--resolution",
        type=str,
        default=DEFAULT_RESOLUTION,
        choices=["0.5K", "1K", "2K", "4K"],
        help=f"Image resolution (default: {DEFAULT_RESOLUTION})",
    )
    parser.add_argument(
        "--num-images",
        type=int,
        default=DEFAULT_NUM_IMAGES,
        choices=[1, 2, 3, 4],
        help=f"Images per prompt (default: {DEFAULT_NUM_IMAGES})",
    )
    parser.add_argument(
        "--output-format",
        type=str,
        default=DEFAULT_OUTPUT_FORMAT,
        choices=["png", "jpeg", "webp"],
        help=f"Image format (default: {DEFAULT_OUTPUT_FORMAT})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be generated without calling the API",
    )
    args = parser.parse_args()

    # --- Verify FAL API key ---
    if not os.environ.get("FAL_KEY"):
        print("Error: FAL_KEY environment variable not set.")
        print("Set it with: export FAL_KEY='your-key-here'")
        sys.exit(1)

    brand_dir = Path.cwd()

    # --- Load prompts ---
    data = load_prompts(brand_dir, args.templates)
    prompts = data["prompts"]

    total_images = len(prompts) * args.num_images
    cost = total_images * COST_PER_IMAGE.get(args.resolution, 0.08)

    print(f"\n{'=' * 60}")
    print(f"  Static Ad Generator")
    print(f"  Brand:      {data.get('brand', 'Unknown')}")
    print(f"  Product:    {data.get('product', 'N/A')}")
    print(f"  Templates:  {len(prompts)}")
    print(f"  Images:     {args.num_images} per prompt = {total_images} total")
    print(f"  Resolution: {args.resolution}")
    print(f"  Format:     {args.output_format}")
    print(f"  Est. cost:  ~${cost:.2f}")
    print(f"{'=' * 60}")

    # --- Dry run ---
    if args.dry_run:
        print("\n  DRY RUN — no API calls will be made.\n")
        for p in prompts:
            mode = "EDIT" if p.get("needs_product_images") else "T2I"
            print(f"  [{p['template_number']:02d}] {p['template_name']:<35} {mode:<5} {p.get('aspect_ratio', 'auto')}")
        print(f"\n  Total: {len(prompts)} prompts, {total_images} images, ~${cost:.2f}")
        return

    # --- Upload product images (once) ---
    product_urls = []
    needs_product = any(p.get("needs_product_images") for p in prompts)
    if needs_product:
        product_urls = upload_product_images(brand_dir)
        if not product_urls:
            print("Warning: Some templates need product images but none were found")
            print("         in product-images/. Those templates will use text-to-image.\n")

    # --- Generate images ---
    outputs_dir = brand_dir / "outputs"
    outputs_dir.mkdir(exist_ok=True)

    results = []
    total_start = time.time()

    for i, prompt in enumerate(prompts):
        num = prompt["template_number"]
        name = prompt["template_name"]
        folder_name = f"{num:02d}-{name}"
        template_dir = outputs_dir / folder_name
        template_dir.mkdir(exist_ok=True)

        use_edit = prompt.get("needs_product_images", False) and product_urls
        mode_label = "EDIT (with product images)" if use_edit else "TEXT-TO-IMAGE"

        print(f"\n[{i + 1}/{len(prompts)}] #{num:02d} — {name}")
        print(f"  Mode:   {mode_label}")
        print(f"  Aspect: {prompt.get('aspect_ratio', 'auto')}")

        start = time.time()
        try:
            result, model_used = generate_image(
                prompt, product_urls, args.resolution, args.num_images, args.output_format
            )
            elapsed = time.time() - start

            # Save prompt text
            with open(template_dir / "prompt.txt", "w", encoding="utf-8") as f:
                f.write(prompt["prompt"])
                f.write(f"\n\n---\nModel: {model_used}\n")
                f.write(f"Aspect ratio: {prompt.get('aspect_ratio', 'auto')}\n")
                f.write(f"Resolution: {args.resolution}\n")

            # Download images
            images = result.get("images", [])
            for j, img in enumerate(images):
                ext = args.output_format
                filename = f"{name}_v{j + 1}.{ext}"
                filepath = template_dir / filename
                print(f"  Downloading {filename}...", end=" ", flush=True)
                download_image(img["url"], filepath)
                print("OK")

            results.append({
                "template": num,
                "name": name,
                "folder": folder_name,
                "images": len(images),
                "status": "success",
                "time": round(elapsed, 1),
            })
            print(f"  Done — {len(images)} images in {elapsed:.1f}s")

        except Exception as e:
            elapsed = time.time() - start
            print(f"  ERROR: {e}")
            results.append({
                "template": num,
                "name": name,
                "folder": folder_name,
                "images": 0,
                "status": f"error: {e}",
                "time": round(elapsed, 1),
            })

    # --- Generate gallery ---
    total_elapsed = time.time() - total_start
    gallery_path = generate_gallery(brand_dir, data, results)

    # --- Summary ---
    success = [r for r in results if r["status"] == "success"]
    errors = [r for r in results if r["status"] != "success"]
    total_downloaded = sum(r["images"] for r in success)

    print(f"\n{'=' * 60}")
    print(f"  COMPLETE")
    print(f"  Generated: {total_downloaded} images from {len(success)} templates")
    if errors:
        print(f"  Errors:    {len(errors)} templates failed")
        for e in errors:
            print(f"             #{e['template']:02d} {e['name']}: {e['status']}")
    print(f"  Time:      {total_elapsed:.0f}s")
    print(f"  Gallery:   {gallery_path}")
    print(f"  Output:    {outputs_dir}/")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
