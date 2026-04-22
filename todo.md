# Plan — Sistema de Generación de Contenido Orgánico

## Arquitectura
Scout es el único agente. Hace research + genera los briefs (captions + visual prompts).
Los carruseles y reels son TOOLS con revisión humana, no agentes autónomos.
La publicación en Instagram es siempre aprobada manualmente hasta que el sistema esté validado.

## Stack actual (2026-04-22)
- **Scout agente** — `backend/tools/scout/service.py`, `claude-sonnet-4-6`, `max_tokens=16000`, loop max 25 iteraciones, streaming SSE.
- **Inputs de Scout** (en este orden):
  1. `get_current_time` (tool obligatoria primera)
  2. `brand/brand-style.md` (voz + visual + photography, SIN argumentos de venta)
  3. `brand/data/avatars.json` (ignora explícitamente `ad_angles`)
  4. `brand/content-mix.md` (distribución semanal de 7 categorías + reglas duras)
  5. `brand/scout-state.json` (último avatar usado — rotación)
- **Research tools**: `reddit_search` (primaria, reddit.com JSON, sin auth) + `web_search_20250305` nativo de Anthropic (fallback, max_uses=3).
- **Output**: `brand/scout-output/YYYY-MM-DD.md` (si existe, sufija -1, -2…).
- **Tools aux**: `read_brand_file`, `write_output_file`, `write_brand_file`.

---

## Historial de runs

### Runs 1–3 (2026-04-22, primera ronda, Scout "viejo")
Problemas detectados (ahora mayormente resueltos):
1. **Scout copiaba `ad_angles` de avatars.json** — los 21 posts se reducían a ~8 ángulos únicos.
2. **brand-dna.md mezclaba estilo con argumentos de venta** — "lifetime access" aparecía 15/21 veces, "$147/$197" 7/21, "24/7" 18/21.
3. **Fechas alucinadas** — generaba contenido con fechas de 2025 aunque estamos en 2026.
4. **Brief visual inutilizable** — en español, sin número de slides, sin prompt por slide.
5. **Feed 100% de venta** — todos los posts terminaban con CTA + precio.
6. **Hashtags repetitivos** — mismo pool de 8-10 en todos los posts.

Causa raíz: Scout no creaba, rearmaba el LEGO de brand-dna + ad_angles.

### Run 4 (2026-04-22, post-Ronda 1) — `brand/scout-output/2026-04-22.md`
Mejoras notables:
- PLAN con avatar rotation, 7 categorías, 7 levers distintos ✓
- Brief visual en inglés, por-slide, con escena específica, layout, texto verbatim ✓
- Post 7 es el único con precio/CTA; posts 1–6 sin mención de producto ✓
- Post 6 usa 1 slide (brand narrative) — tamaño variable funciona ✓

Problemas residuales:
1. **Fecha alucinada persiste** — header dice "Generated: 2025-12-20" y hashtags dicen `#algotrading2025`, cuando hoy es 2026-04-22. El modelo inventa fecha desde su knowledge cutoff.
2. **Research insights débiles** — "Gold at $3,750–$4,000" (observación de precio) y "algo trading market growing per Technavio" (press-release). Ninguno es señal cultural real. `ddgs` devuelve SEO-spam, no conversaciones.
3. **Repetición temática en captions** — Posts 1, 2, 3, 5 giran todos alrededor de "el problema no es la estrategia, es la ejecución emocional". Lever distinto, argumento central igual.
4. **FAL prompts todavía mejorables** — falta validar contra imágenes reales de nano-banana-2.

---

## Ronda 1 — Refactor de inputs [x] (aplicado 2026-04-22)
- [x] `brand-style.md` generado automáticamente por Brand (solo voz/visual/photography, sin positioning ni competitive_differentiation ni image_prompt_modifier — el modifier lo agrega la Carousels Tool cuando llama a FAL)
- [x] Scout lee `brand-style.md` en lugar de `brand-dna.md`
- [x] Scout ignora `ad_angles` explícitamente en el system prompt (campo sigue existiendo para no romper UI de Avatars)
- [x] `brand/content-mix.md` creado — 7 categorías + reglas duras (posts 1–6 sin precio/CTA)
- [x] Endpoints `/brand/content-mix` GET/PUT + UI de edición en `frontend/src/pages/Brand.tsx` (`ContentMixSection`)
- [x] Brief visual reescrito: inglés, prompt por slide, escena específica, 4:5
- [x] `max_tokens` subido 8096 → 16000 (necesario para 7 posts × 4 slides)
- [x] System prompt incluye 3 ejemplos buenos (de `prompts.json`: bullet-points, us-vs-them, pull-quote-review) + 3 ejemplos malos con explicación de por qué fallan
- [x] Mención explícita de que los prompts son para `fal-ai/nano-banana-2`

## Ronda 2 — Mejorar research [x] (aplicado 2026-04-22, falta validar con un run)
- [x] Tool `get_current_time` agregada como Step 0 obligatorio (devuelve `today`, `since=today-7d`, `weekday`)
- [x] Tool `reddit_search` agregada como fuente PRIMARIA (reddit.com JSON search, sin auth, User-Agent custom, sorts: hot/top/new/relevance, timeframes: day/week/month/year/all)
- [x] `ddgs` reemplazado por `web_search_20250305` nativo de Anthropic (server tool, max_uses=3) — se mantiene como FALLBACK, no como fuente principal
- [x] Stream emite eventos `tool_call` / `tool_result` para `server_tool_use` y `web_search_tool_result` (para que la UI muestre las búsquedas nativas)
- [x] System prompt pide Claim check: cada uno de los 7 posts debe declarar su CENTRAL CLAIM en el PLAN y ser substantivamente distinto de los otros 6 (no solo lever distinto)
- [x] System prompt instruye: si no encuentra nada de los últimos 7 días, debe decirlo y NO inventar ni caer en genericidades tipo "algo trading is growing"
- [ ] **Validar con un nuevo run** — próximo paso inmediato

## Ronda 3 — Mejorar calidad de captions [ ] (después de validar Ronda 2)
Objetivo: que los captions suenen a JessTrading, no a "AI genérica".
- [ ] Agregar 3–5 captions aprobados como few-shot en el system prompt
- [ ] Prohibir explícitamente frases genéricas detectadas: "The future is automated", "while you sleep", "no coding required", "plug and play" (ya están en `content-mix.md` como clichés a evitar — reforzar en system prompt si reaparecen)
- [ ] Requerir frase de apertura original (no templates tipo "Most traders lose because…")

## Ronda 4 — Tech fixes de UX [ ] (independiente)
- [ ] Historial de tool calls visible cuando termina Scout (no solo el output final)
- [ ] No cancelar proceso al cambiar de pestaña — aplicar el patrón JobContext de static_ads
- [x] No sobreescribir mismo día — genera -1, -2, etc. (ya implementado)
- [ ] Limpiar `ddgs` de `backend/requirements.txt` (ya no se usa)

---

## Próximo paso inmediato (para continuar mañana)

1. **Correr Scout una vez** y evaluar el output nuevo en `brand/scout-output/`. Validar:
   - ¿El header tiene la fecha real (2026-04-XX)?
   - ¿Los research insights citan threads de Reddit reales con upvotes y URL?
   - ¿Los 7 posts tienen claims substantivamente distintos, o repiten el mismo argumento?
   - ¿Los hashtags ya no se repiten entre posts?
2. **Generar imágenes con nano-banana-2** a partir de los prompts visuales (manualmente en FAL por ahora, no existe Carousels Tool todavía). Evaluar si los prompts producen imágenes coherentes con la marca.
3. Con ese feedback, decidir si pasamos a Ronda 3 (captions) o si los ejemplos FAL buenos/malos del system prompt necesitan otro ajuste.

---

## Fase 1 — Carousels Tool [ ]
PRECONDICIÓN: Scout Ronda 1 validada (al menos 2 runs con output de calidad aceptable).

Tool nueva en content_app (junto a static_ads, concept_ads, scout).
Flujo:
  1. Lista los archivos de Scout (brand/scout-output/) — el usuario elige cuáles briefs materializar
  2. Para cada brief seleccionado: extrae slide prompts generados por Scout (ya en formato FAL)
  3. Genera imágenes por slide via FAL (4:5, nano-banana-2)
  4. Preview para revisión humana antes de publicar
  5. Botón "Publicar en Instagram" que sube el carrusel vía Instagram Graph API
  6. Guarda cada carrusel en brand/carousel-output/YYYY-MM-DD/{slug}/

Stack: backend/tools/carousels/ (FastAPI + FAL + Instagram API), frontend/src/pages/Carousels.tsx

## Fase 2 — Scout scheduling [ ]
Cron que ejecuta Scout automáticamente cada lunes a las 6am.
Solo implementar después de validar que la calidad del output de Scout es consistente.

## Fase 3 — Reels Tool [ ]
Mismo patrón que Carousels Tool pero para video.
Depende de que exista una video-generation tool (actualmente no existe).
Implementar después de que Fase 1 esté validada en producción.

## Lo que NO hay en el plan (decisión consciente)
- No hay "carousel agent" separado de Scout — Scout hace el research Y los briefs en una pasada
- No hay "reels agent" — es una tool con humano en el loop
- No hay publicación autónoma programada — todo pasa por aprobación manual hasta Fase 2+
- No hay multi-agente hasta que Scout falle en algo concreto y medible

---

# TODO — Content App

Meta Ads Bulk Uploader — Claude Code Prompts
Every prompt I used to vibe-code a Meta Ads Bulk Uploader from scratch. Copy these into Claude Code in order and you'll have a working app that uploads dozens of ads through Meta's API in minutes.

Stack: Next.js, React, Tailwind CSS, PostgreSQL, Drizzle ORM, Meta Marketing API v22.0

Deploy: Replit (free tier works) or run locally


Prompt 1: Project Setup
Create a new Next.js app with TypeScript and Tailwind CSS. Use the app router. Set it up with a dark theme (zinc/slate color palette). Add Drizzle ORM with PostgreSQL support. The app is called "Meta Ads Bulk Uploader" — it lets media buyers upload dozens of Facebook/Instagram ads at once through Meta's Marketing API instead of doing it one by one in Ads Manager.
Prompt 2: Database Schema
Create the database schema with Drizzle ORM. I need three tables:

1. settings — stores the user's Meta access token, selected ad account ID/name, and selected Facebook page ID/name
2. upload_batches — stores each upload session with: batch name, campaign ID/name, ad set ID/name, arrays of primary texts/headlines/descriptions, CTA type, website URL, display link, launch as paused toggle, enhancements enabled toggle, status (draft/uploading/complete/error), counts for ads created and errored, and an error log array
3. creatives — each uploaded file linked to a batch, with: file name, file type (image/video), mime type, file path, file size, thumbnail path for videos, auto-generated ad name, Meta ad ID and creative ID (filled after creation), status, and error message

Add timestamps where appropriate. Use jsonb for the array fields.
Prompt 3: App Layout with Sidebar
Create a layout with a fixed sidebar on the left. The sidebar should have the app name "Meta Ads" with "Bulk Uploader" underneath, then three nav links: Upload Ads (📤), History (📋), and Settings (⚙️). Show an active indicator on the current page. At the bottom of the sidebar show "Meta Marketing API v22.0". Use the dark zinc theme — the sidebar should be slightly darker than the main content area.
Prompt 4: Settings Page
Build the Settings page. It needs:

1. A password input field for the Meta access token. If a token is already saved, show a preview of the last 8 characters. When a new token is saved, immediately fetch and display available ad accounts and Facebook pages.
2. A dropdown to select an ad account (show name, account ID, and currency)
3. A dropdown to select a Facebook page (ads get published from this page)
4. A save button that persists everything to the database

Create API routes for:
- GET/POST /api/settings — load and save settings
- GET /api/meta/accounts — fetch ad accounts from Meta using the saved token
- GET /api/meta/pages — fetch Facebook pages the token has access to

Use the Meta Graph API v22.0 base URL. The accounts endpoint is /me/adaccounts with fields id,name,account_id,account_status,currency. The pages endpoint is /me/accounts with fields id,name.
Prompt 5: Meta API Helper Functions
Create a meta-api.ts utility file with these functions:

1. metaGet(endpoint, accessToken, params) — generic GET request to the Meta Graph API
2. metaPost(endpoint, accessToken, body) — generic POST with JSON body, includes the access token in the body. On error, extract the error_user_msg or error.message from Meta's error response.
3. getAdAccounts(accessToken) — fetch all ad accounts
4. getCampaigns(adAccountId, accessToken) — fetch campaigns for an ad account with id, name, status, objective
5. getAdSets(campaignId, accessToken) — fetch ad sets for a campaign
6. getAdSetDetails(adSetId, accessToken) — get full ad set details including targeting, billing_event, optimization_goal, bid settings, budgets, promoted_object, destination_type, attribution_spec
7. createAdSet(adAccountId, accessToken, {name, campaignId, sourceAdSetId}) — create a new ad set by copying all settings from an existing one. Set status to PAUSED.
8. uploadImageToMeta(adAccountId, accessToken, imageBuffer, fileName) — upload image using multipart form data to /{adAccountId}/adimages. Auto-convert WebP/BMP/TIFF to JPEG using sharp. Return the image hash.
9. uploadVideoToMeta(adAccountId, accessToken, videoBuffer, fileName) — upload video to /{adAccountId}/advideos. Return the video ID.
10. createAdCreative — this is the complex one. See next prompt.
11. createAd(adAccountId, accessToken, {name, adSetId, creativeId, status}) — create the actual ad
12. getPages(accessToken) — fetch Facebook pages
Prompt 6: Ad Creative Creation Logic
The createAdCreative function needs to handle two cases:

CASE 1 — Multiple text variations (more than 1 primary text, headline, or description):
Use asset_feed_spec format. Structure it with bodies, titles, descriptions arrays (each item is {text: "..."}), call_to_action_types array, link_urls array. For images, include images: [{hash}] with ad_formats: ["SINGLE_IMAGE"]. For videos, include videos: [{video_id, thumbnail_url}] with ad_formats: ["SINGLE_VIDEO"]. Wrap it in object_story_spec with just the page_id.

CASE 2 — Single text variation:
For images, use object_story_spec.link_data with image_hash, link, message (primary text), name (headline), description, call_to_action {type}, and optional caption (display link).
For videos, use object_story_spec.video_data with video_id, message, title, link_description, call_to_action {type, value: {link}}, and optional image_url for thumbnail.

Post to /{adAccountId}/adcreatives.
Prompt 7: File Upload API
Create a POST /api/upload route that:
1. Accepts multipart form data with a batchId and multiple files
2. Saves each file to an uploads/{batchId}/ directory
3. Sanitizes filenames (replace non-alphanumeric chars with underscores)
4. Detects whether each file is an image or video based on mime type
5. Auto-generates an ad name from the filename (without extension)
6. Inserts a record into the creatives table for each file
7. Returns the array of created creative records
Prompt 8: Upload Page — Step 1 (File Upload)
Build the main upload page as a 3-step wizard: "Upload Creatives" → "Ad Copy & URL" → "Campaign & Launch". Show a step indicator at the top with numbered circles — completed steps show a checkmark in green, current step is blue, future steps are gray.

Step 1:
- A text input for "Batch Name" (default to "Batch {today's date}")
- A drag-and-drop zone for images and videos. Accept image/* and video/*. Show a folder icon, "Drag & drop images or videos" text, format hints, and a "Browse Files" button.
- Below the drop zone, show the list of selected files with an icon (📹 for video, 🖼️ for image), filename, file size in MB, and a remove button
- An upload button that creates the batch via API, uploads all files, then advances to step 2
Prompt 9: Upload Page — Step 2 (Ad Copy)
Step 2 of the wizard:

Show a summary card of uploaded creatives at the top. For each creative, show the file type icon, filename, an editable ad name input, and for videos a "+ Thumb" button to upload a custom thumbnail (shows "✓ Thumb" after upload).

Below that, card sections for:
- Primary Text — textarea fields with "+ Add variation" button (up to 5). Note: "Meta rotates them automatically"
- Headlines — input fields with "+ Add variation"
- Descriptions — input fields with "+ Add variation"
- Destination & CTA — website URL (required), display link (optional), and a dropdown for CTA type with these options: LEARN_MORE, SHOP_NOW, SIGN_UP, SUBSCRIBE, GET_OFFER, ORDER_NOW, BOOK_NOW, CONTACT_US, DOWNLOAD, GET_QUOTE, APPLY_NOW, BUY_NOW, WATCH_MORE, SEE_MENU, SEND_MESSAGE, GET_STARTED

Each variation field group should have remove buttons (except when there's only one). Validate that at least one primary text, one headline, and the URL are filled before advancing.

Create API routes for:
- PUT /api/creative — update ad name
- POST /api/creative/thumbnail — upload a thumbnail for a video creative
Prompt 10: Upload Page — Step 3 (Campaign Selection)
Step 3:

Campaign dropdown — fetch campaigns from /api/meta/campaigns when this step loads. Show campaign name and status.

Ad Set section — when a campaign is selected, fetch its ad sets. Two modes:
1. "Use existing ad set" — simple dropdown
2. "Create new ad set" — toggled via a link. Shows a dropdown to pick a source ad set to copy settings from, a text input for the new name, and a create button. After creation, auto-select the new ad set and switch back to the dropdown view.

Include a note: "Dynamic Creative ad sets only allow 1 ad — use Create new ad set for bulk uploads."

Launch Options:
- Checkbox: "Launch as paused" (default checked) with note "Review in Ads Manager before activating"
- Checkbox: "Enable creative enhancements" (default unchecked) with note "Meta AI auto-adjusts your creative"

Summary card showing: number of creatives, text variation counts, CTA, URL, enhancements status, launch status.

Create the campaign and ad set API routes:
- GET /api/meta/campaigns — uses saved settings to fetch campaigns
- GET /api/meta/adsets?campaignId=X — fetch ad sets for a campaign
- POST /api/meta/adsets — create a new ad set (takes name, campaignId, sourceAdSetId)
Prompt 11: Launch Logic
Create POST /api/launch route. Given a batchId:

1. Validate everything is configured (token, ad account, page, ad set, URL, texts)
2. Fetch all creatives for the batch
3. Update batch status to "uploading"
4. For each creative:
   a. Read the file from disk
   b. Upload to Meta (image → adimages endpoint for hash, video → advideos endpoint for video ID)
   c. If it's a video with a custom thumbnail, upload that image too
   d. Create an ad creative using the uploaded media + the batch's copy settings
   e. Create the ad in the selected ad set
   f. Update the creative record with Meta IDs and "created" status
   g. On error, log it and mark the creative as "error"
5. Update batch with final counts and status ("complete" or "error" if all failed)
6. Return the results with adsCreated, adsErrored, and errorLog

Show the results on the page — green card for success, warning card if there were errors. Show error details. On success, show an "Upload Another Batch" button that resets the wizard.
Prompt 12: History Page
Build the History page. Fetch all upload batches sorted by newest first. Show each batch as a card with: batch name, campaign → ad set path, timestamp, ads created count (green), errors count (red), and a status badge (complete = green, error = red, uploading = amber, draft = gray). If no batches exist, show an empty state with a link to upload the first batch.

Create GET /api/batch to return all batches, and also add GET /api/batch/[id]/creatives to return creatives for a specific batch.
Prompt 13: Batch Management API
Add PUT /api/batch to save batch settings (campaign, ad set, copy, CTA, URL, launch options). This gets called when the user moves to step 3 and when they hit launch. Also make sure POST /api/batch creates a new batch record and returns it.
Prompt 14: Settings Check on Load
On the main upload page, check if settings are configured (token exists, ad account selected) when the page loads. If not, show a "Setup Required" message with a link to the Settings page instead of the upload wizard. This prevents users from uploading files before connecting their Meta account.
Prompt 15: WebP Auto-Conversion
In the image upload function, auto-detect if the image is WebP, BMP, or TIFF format. If so, convert it to JPEG using the sharp library before uploading to Meta. Meta doesn't accept WebP for ad images. Rename the file extension to .jpg in the upload.
Prompt 16: Error Handling Polish
Go through all API routes and make sure Meta API errors bubble up with useful messages. Meta returns errors in {error: {message, error_user_msg, error_data}}. Prefer error_user_msg when available (it's more readable), fall back to message, and append error_data if present. These error messages should make it to the UI so users can debug issues themselves.
Prompt 17: Replit Configuration
Add a .replit file and replit.nix for Replit deployment. The app should:
- Install Node.js 22 and PostgreSQL in replit.nix
- Use port 3000 for production, port 5000 for dev
- Build command: npm run build
- Run command: npm run start -- -p 3000
- Add a db:push script to package.json that runs drizzle-kit push

Make sure the README has instructions for both Replit import and local setup.
Prompt 18: Meta App Setup Guide
Create a META-APP-SETUP.md file with step-by-step instructions for setting up a Meta developer app. This is the thing most people will get stuck on. Cover:

1. Creating an app at developers.facebook.com (Business type)
2. Connecting it to a Business Manager
3. Adding the "Create & manage ads" use case
4. Creating a System User token with ads_management, ads_read, business_management, pages_show_list permissions
5. Adding a Privacy Policy URL (a Google Doc works)
6. Publishing the app (it MUST be in Live mode to create ads — this is the #1 gotcha)
7. Where to paste the token in the app

Emphasize that Development mode will NOT work for creating ads. The app must be published.
Prompt 19: README
Write a README.md for the GitHub repo. Include:
- One-line description: "Upload dozens of Facebook/Instagram ads in minutes instead of hours"
- Feature list with emoji bullets
- Quick start for both Replit and local
- Big warning about Meta app needing to be published (Live mode)
- Tech stack
- Link to Scale AI on Skool for support

Keep it clean and scannable. This is a free tool — mention that up front.
Prompt 20: Final Polish
Do a final pass on the UI:
- Make sure all loading states show spinners or "Loading..." text
- Disabled buttons should have reduced opacity and not-allowed cursor
- The step indicator should feel satisfying — green checkmarks for completed steps
- File size should show in MB with one decimal
- Timestamps in history should use toLocaleString
- Empty states should have friendly copy and obvious next actions
- The entire app should feel fast and clean on dark backgrounds


Setup Checklist
Before you run the app:

Meta Developer Account — developers.facebook.com
Create an App → Business type → Connect your Business Manager
Add "Create & manage ads" use case
System User Token with permissions: ads_management, ads_read, business_management, pages_show_list
Add a Privacy Policy URL (Google Doc is fine)
PUBLISH THE APP — This is the #1 mistake. Development mode cannot create ads.
Deploy — Import the GitHub repo into Replit or run locally with PostgreSQL
Settings page — Paste your token, select your ad account and page
Upload ads — Drag, drop, configure, launch

---

## Notas / pendientes futuros

- El copy de los ads tiende a repetir siempre los mismos 5 argumentos. Posible causa: brand-dna.md está mezclando estilo visual con argumentos de venta. Separar "voz/estilo" de "claim/argumento" en brand-dna podría darle más libertad a la IA para generar ángulos distintos.
- revisar settings de meta app, el token esta a la vista, es seguro eso? porque no se hace con .env?
---