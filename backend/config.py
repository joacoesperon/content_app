from pathlib import Path
from dotenv import load_dotenv
import os

# Project root is the parent of backend/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load .env from project root
load_dotenv(PROJECT_ROOT / ".env")

BRAND_DIR = PROJECT_ROOT / "brand"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
TEMPLATES_FILE = PROJECT_ROOT / "backend" / "tools" / "static_ads" / "templates.md"

FAL_KEY = os.environ.get("FAL_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Ensure directories exist
BRAND_DIR.mkdir(exist_ok=True)
(BRAND_DIR / "product-images").mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)
(OUTPUTS_DIR / "static_ads").mkdir(exist_ok=True)
(OUTPUTS_DIR / "concept_ads").mkdir(exist_ok=True)
(OUTPUTS_DIR / "scout").mkdir(exist_ok=True)
(OUTPUTS_DIR / "meta_ads").mkdir(exist_ok=True)
(OUTPUTS_DIR / "carousels").mkdir(exist_ok=True)

