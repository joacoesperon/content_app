# Static Ad Generator — Workflow

Genera 40+ imágenes de static ads listas para producción usando Nano Banana 2 via FAL API. El workflow completo tiene 3 fases: construir el Brand DNA, generar los prompts, y generar las imágenes desde la app.

---

## Requisitos previos

- FAL API key configurada en `.env` → `FAL_KEY=tu-key`
- Instalar dependencias: `uv pip install -r backend/requirements.txt`
- Iniciar la app: `./run.sh` → abrir `http://localhost:5173`

---

## Phase 1 — Brand DNA

**Cuándo hacerlo:** Una sola vez, o cuando la identidad de marca cambie significativamente.

**Qué es:** Un documento que describe la identidad visual y verbal completa de la marca. La IA lo usa como contexto para generar prompts on-brand.

**Cómo hacerlo:** Pedirle a Claude Code que construya el `brand/brand-dna.md`. Darle:
- Nombre de la marca y URL del sitio
- Cualquier guía de marca existente (colores, tipografía, voz, tono)
- Descripción del producto y su contexto visual

Claude investigará el sitio, extraerá la identidad visual, y generará el documento con este formato:

```
BRAND OVERVIEW       → nombre, tagline, voz, posicionamiento
VISUAL SYSTEM        → fuentes, colores hex, estilo de CTAs
PHOTOGRAPHY DIRECTION → iluminación, color grading, composición, mood
PRODUCT DETAILS      → descripción visual del producto
AD CREATIVE STYLE    → formatos típicos, uso de texto, estilo UGC
IMAGE GENERATION PROMPT MODIFIER → párrafo de 50-75 palabras que se
                                   prepende a cada prompt generado
```

El **Image Generation Prompt Modifier** es lo más importante: es el "ADN visual" comprimido que hace que todos los ads tengan coherencia de marca.

> Para Jess Trading: el `brand/brand-dna.md` ya está creado. Solo necesita re-hacerse si cambia la identidad visual de la marca.

---

## Phase 2 — Generación de prompts

**Cuándo hacerlo:** Antes de cada run de generación, o cuando cambie el producto/oferta.

**Qué es:** Claude lee el `brand-dna.md` y las 40 plantillas de `skills/references/template-prompts.md`, rellena todos los `[PLACEHOLDERS]` con detalles específicos de la marca, y genera el `brand/prompts.json`.

**Cómo hacerlo:** Pedirle a Claude Code:

```
Lee brand/brand-dna.md y skills/references/template-prompts.md,
y genera brand/prompts.json con los 40 prompts rellenos para Jess Trading.
Producto: Gold Trading Bot (XAUUSD EA para MetaTrader 5). Precio: $147.
```

Claude produce un JSON con esta estructura por cada template:

```json
{
  "template_number": 1,
  "template_name": "headline",
  "prompt": "Premium fintech aesthetic on Carbon Black... [prompt completo]",
  "aspect_ratio": "4:5",
  "needs_product_images": false,
  "notes": "..."
}
```

> Tip: antes de generar, revisá los prompts del JSON a mano. El copy generado por Claude es funcional pero genérico — mejora con frases reales de clientes o reviews.

---

## Phase 3 — Generación de imágenes (desde la app)

**Cuándo hacerlo:** Una vez que `brand/prompts.json` existe.

**Cómo hacerlo:** Desde la app en `http://localhost:5173`:

1. Ir a **Static Ad Generator** en el sidebar
2. Seleccionar los templates a generar (o dejar todos seleccionados)
3. Elegir resolución:
   - `1K` → test rápido y barato
   - `2K` → producción (default recomendado)
   - `4K` → hero assets
4. Elegir imágenes por template (1 para test, 4 para producción)
5. Ver el costo estimado y hacer click en **Generate**
6. El progreso aparece en tiempo real — las imágenes se van mostrando a medida que se generan
7. Las imágenes quedan guardadas en `brand/outputs/` y se pueden ver en **Gallery**

### Costos de referencia

| Resolución | Por imagen | 1 template × 4 imgs | 40 templates × 4 imgs |
|------------|-----------|--------------------|-----------------------|
| 1K         | $0.08     | $0.32              | $12.80                |
| 2K         | $0.12     | $0.48              | $19.20                |
| 4K         | $0.16     | $0.64              | $25.60                |

---

## Flujos típicos

**Primera vez (setup completo):**
1. Crear `brand-dna.md` con Claude Code (Phase 1) — ya hecho
2. Pedir a Claude Code que genere `brand/prompts.json` (Phase 2)
3. Poner la FAL Key en `.env`
4. Abrir la app y generar → empezar con 1-3 templates en 1K para probar

**Run de producción:**
1. Verificar que `brand/prompts.json` esté actualizado
2. Seleccionar todos los templates, resolución 2K, 4 imágenes
3. Costo estimado: ~$19

**Nuevo producto o nueva oferta:**
1. Saltear Phase 1 (brand-dna.md no cambia)
2. Pedir a Claude Code que regenere `prompts.json` con los nuevos detalles del producto
3. Generar desde la app

**Iterar sobre templates específicos:**
1. En la app, seleccionar solo los templates que querés refinar
2. Ajustar el copy en `prompts.json` a mano si hace falta
3. Regenerar solo esos templates

---

---
name: static-ad-generator
description: Generate production-ready static ad images for any brand using Claude + Nano Banana 2. End-to-end workflow from brand research → prompt generation → image generation via FAL API. Trigger on requests to create static ads, generate ad creatives, build ad images, or when user mentions Nano Banana, Higgsfield, FAL, or static ad generation. Also trigger when user drops a brand name + URL and asks for ad creatives.
---

# Static Ad Generator (Claude Code + Nano Banana 2)

Generate 40+ production-ready static ad images for any brand — from brand research to finished creatives — entirely inside Claude Code.

## Overview

This skill replaces the manual Claude → Higgsfield workflow with a fully automated pipeline:
1. **Brand Research** → Claude builds a Brand DNA document via web search
2. **Prompt Generation** → Claude fills 40 template prompts with brand-specific details
3. **Image Generation** → Python script fires prompts to Nano Banana 2 via FAL API

No Higgsfield needed. No copy-pasting prompts. One command, 40+ ads.

---

## Prerequisites

- **FAL API key** set as environment variable: `export FAL_KEY="your-key-here"`
- **Python packages**: `requests` (for FAL REST API calls)
- **Product images** dropped in the brand folder before running

---

## Folder Structure

brand/
├── product-images/          # Drop product PNGs/JPGs here before running
│   ├── product-front.png
│   ├── product-angle.png
│   └── ...
├── brand-dna.md             # Generated by Phase 1
├── prompts.json             # Generated by Phase 2
├── generate_ads.py          # Image generation script (Phase 3)
└── outputs/                 # Generated images organized by template
    ├── 01-headline/
    │   ├── headline_v1.png
    │   └── prompt.txt
    ├── 02-offer-promotion/
    │   └── ...
    └── ...

---

## Phase 1: Brand Research & DNA Generation

When the user provides a brand name and URL, execute the Brand Research prompt below. Use web search extensively to gather real data.

### Brand Research System Prompt

Role: Act as a Senior Brand Strategist conducting a full reverse-engineering of the target brand's visual and verbal identity.

Objective: Create a comprehensive Brand DNA document that will be used to write highly specific AI image generation prompts. Every detail matters because the output will be fed into an image model that needs exact specifications.

RESEARCH STEPS:

1. EXTERNAL RESEARCH (use web search for each):
   - Design credits: Search for "who designed [Brand] branding", "[Brand] design agency case study", "[Brand] rebrand"
   - Public brand assets: Search for "[Brand] brand guidelines pdf", "[Brand] press kit", "[Brand] media kit", "[Brand] style guide"
   - Typography: Search for "[Brand] font", "[Brand] typeface", "what font does [Brand] use"
   - Colors: Search for "[Brand] brand colors", "[Brand] hex codes", "[Brand] color palette"
   - Packaging: Search for "[Brand] packaging design", "[Brand] unboxing", "[Brand] product photography"
   - Advertising: Search "[Brand] Meta Ad Library" for current ad creative styles
   - Press and positioning: Search for "[Brand] brand story", "[Brand] founding story", "[Brand] mission"

2. ON-SITE ANALYSIS (fetch and analyze the brand URL):
   - Voice and Tone: Read hero copy, About page, and product descriptions. Give 5 distinct adjectives.
   - Photography Style: Describe lighting, color grading, composition, and subject matter.
   - Typography on site: Headline weight, body weight, letter-spacing, distinctive treatments.
   - Color application: Primary vs accent usage. Background colors. CTA color.
   - Layout density: Airy or dense? Grid-based or organic?
   - Packaging details: Physical appearance (materials, colors, shape, label placement, textures, translucency, matte vs gloss).

3. COMPETITIVE CONTEXT:
   - Search for 2-3 direct competitors and note visual differentiation.

4. OUTPUT FORMAT:

BRAND DNA DOCUMENT
==================
BRAND OVERVIEW
Name / Tagline / Design Agency / Voice Adjectives [5] / Positioning / Competitive Differentiation

VISUAL SYSTEM
Primary Font / Secondary Font / Primary Color [hex] / Secondary Color [hex] / Accent Color [hex] / Background Colors / CTA Color and Style

PHOTOGRAPHY DIRECTION
Lighting / Color Grading / Composition / Subject Matter / Props and Surfaces / Mood

PRODUCT DETAILS
Physical Description / Label-Logo Placement / Distinctive Features / Packaging System

AD CREATIVE STYLE
Typical formats / Text overlay style / Photo vs illustration / UGC usage / Offer presentation

IMAGE GENERATION PROMPT MODIFIER
Write a single 50-75 word paragraph to prepend to any image prompt to match this brand's visual identity. Include exact colors, font descriptions, photography direction, and mood.

Save output as: brand/brand-dna.md

---

## Phase 2: Prompt Generation

After the Brand DNA is complete, generate brand-specific prompts from the 40 templates.

### Prompt Generation System Prompt

Take the 40 template prompts from the reference file and fill them in with detail specifically for [BRAND NAME] that aligns with the Brand DNA document, especially the Image Generation Prompt Modifier and the Ad Creative Style section.

For each template:
1. Replace all [BRACKETED PLACEHOLDERS] with brand-specific details
2. Prepend the Image Generation Prompt Modifier from the Brand DNA
3. Set the correct aspect_ratio based on the template (most are 1:1 or 4:5 or 9:16)
4. Set needs_product_images to false for all templates (digital product, no physical product images)
5. Include the product name and any specific product details provided

Output as a JSON file with this structure:
{
  "brand": "Brand Name",
  "product": "Specific Product Name",
  "generated_at": "ISO timestamp",
  "prompts": [
    {
      "template_number": 1,
      "template_name": "headline",
      "prompt": "Full completed prompt text ready for Nano Banana 2...",
      "aspect_ratio": "4:5",
      "needs_product_images": false,
      "notes": "Any generation notes or copy that should be refined"
    }
  ]
}

Reference file for templates: See references/template-prompts.md

Save output as: brand/prompts.json

---

## Phase 3: Image Generation via FAL API

Run the Python generation script to fire all prompts to Nano Banana 2.

### How to Execute

cd brand
python generate_ads.py

Or generate specific templates only:

python generate_ads.py --templates 1,7,13,15

### Script Behavior

The generate_ads.py script (see references/generate_ads.py):

1. Reads prompts.json from the brand folder
2. For each prompt: calls fal-ai/nano-banana-2 (text-to-image) — all templates use text-to-image since the product is digital (no physical product images)
3. Downloads generated images to outputs/{template-number}-{template-name}/
4. Saves the prompt text alongside each image as prompt.txt
5. Generates an index.html gallery showing all generated ads

### FAL API Details

Text-to-Image endpoint: fal-ai/nano-banana-2
- Input: prompt, aspect_ratio, num_images, output_format, resolution
- Aspect ratios: auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
- Resolution options: 0.5K, 1K, 2K, 4K (default: 1K)

Edit/Image-Reference endpoint: fal-ai/nano-banana-2/edit
- Input: same as above + image_urls (array of URLs, up to 14)
- Product images must be uploaded to FAL storage first or be publicly accessible URLs

---

## User Interaction Flow

### Full Run (user says "generate ads")

1. Check that brand/brand-dna.md exists (run Phase 1 first if not)
2. Run Phase 1 (if needed) → Phase 2 → Phase 3 sequentially
3. Present the output gallery

### Selective Generation (user says "just generate templates 1, 7, 13")

1. Confirm brand/prompts.json exists
2. Run Phase 3 with --templates filter

### Re-run with New Product (user says "now do it for [different product]")

1. Skip Phase 1 (Brand DNA already exists)
2. Re-run Phase 2 with new product details
3. Run Phase 3

---

## Key Technical Notes

- This is a digital product (trading bot EA for MetaTrader 5) — there are no physical product images. All templates use text-to-image generation exclusively.
- Aspect ratios matter for ad placement. 1:1 for feed, 4:5 for feed (more real estate), 9:16 for stories/reels. The templates specify the correct ratio.
- Resolution: Default is 2K for production-quality output. Use 1K for faster test runs, 4K for hero assets.
- Images per prompt: 4 images generated per prompt by default, giving you options to pick the best output. A full 40-template run = 160 images.
- Cost: ~$0.12 per image at 2K (1.5x the 1K rate). A full 40-template run at 4 images each = ~$19.20. Use --templates to generate selectively and control cost.
- Copy refinement: The generated copy from Phase 2 is functional but generic. For best results, mine customer reviews (via Apify scraping) and inject real customer language before running Phase 3
