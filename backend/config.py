from pathlib import Path
from dotenv import load_dotenv
import os

# Project root is the parent of backend/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load .env from project root
load_dotenv(PROJECT_ROOT / ".env")

BRAND_DIR = PROJECT_ROOT / "brand"
SKILLS_DIR = PROJECT_ROOT / "skills"
TEMPLATES_FILE = SKILLS_DIR / "references" / "template-prompts.md"

FAL_KEY = os.environ.get("FAL_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Ensure brand directories exist
BRAND_DIR.mkdir(exist_ok=True)
(BRAND_DIR / "product-images").mkdir(exist_ok=True)
(BRAND_DIR / "outputs").mkdir(exist_ok=True)
(BRAND_DIR / "scout-output").mkdir(exist_ok=True)

