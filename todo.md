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

# Plan de implementación — Meta Ads Bulk Uploader

Adaptación del guide de 20 prompts a nuestro stack: FastAPI + Python + JSON storage + React/Vite/shadcn/ui.
Sin Next.js, sin PostgreSQL, sin Drizzle. Mismo comportamiento, distinto stack.

---

## Fase 3 — Backend (`backend/tools/meta_ads/`)

### 3.1 — Estructura de archivos y registro
- Crear `backend/tools/meta_ads/__init__.py` y `tool.py` (MetaAdsTool con id="meta_ads")
- Registrar en el sistema existente de tools (auto-discovery ya funciona)

### 3.2 — Schemas Pydantic (`schemas.py`)
- `MetaSettings`: access_token, ad_account_id, ad_account_name, page_id, page_name
- `UploadBatch`: id, name, campaign_id/name, ad_set_id/name, primary_texts[], headlines[], descriptions[], cta_type, url, display_link, launch_as_paused, enhancements_enabled, status, ads_created, ads_errored, error_log[]
- `Creative`: id, batch_id, filename, ad_name, file_type (image/video), mime_type, file_path, thumbnail_path, meta_ad_id, meta_creative_id, status, error_message

### 3.3 — Storage JSON (`storage.py`)
- `brand/meta-ads/settings.json` — token + cuenta seleccionada
- `brand/meta-ads/batches/{id}/batch.json` — metadata del batch
- `brand/meta-ads/batches/{id}/creatives.json` — lista de creativos
- `brand/meta-ads/uploads/{batch_id}/` — archivos subidos
- CRUD helpers: load_settings/save_settings, create_batch, update_batch, list_batches, get_batch, create_creative, update_creative, list_creatives

### 3.4 — Meta API client (`meta_client.py`)
Equivalente a `meta-api.ts` del guide (Prompts 5, 6, 15, 16):
- `meta_get(endpoint, token, params)` / `meta_post(endpoint, token, body)`
- `get_ad_accounts(token)` → `/me/adaccounts`
- `get_pages(token)` → `/me/accounts`
- `get_campaigns(ad_account_id, token)` → con id, name, status
- `get_ad_sets(campaign_id, token)`
- `get_ad_set_details(ad_set_id, token)` — para clonar settings
- `create_ad_set(...)` — copia settings de un ad set existente
- `upload_image(ad_account_id, token, file_bytes, filename)` → retorna image_hash (auto-convierte WebP→JPEG con Pillow)
- `upload_video(ad_account_id, token, file_bytes, filename)` → retorna video_id
- `create_ad_creative(...)` — soporta asset_feed_spec (múltiples variaciones) y object_story_spec (variación única), imagen y video
- `create_ad(ad_account_id, token, name, ad_set_id, creative_id, status)`
- Manejo de errores: extraer `error_user_msg` > `message` de respuestas Meta

### 3.5 — Router (`router.py`)
Endpoints REST equivalentes a los de Next.js:

```
# Settings
GET    /api/tools/meta_ads/settings
POST   /api/tools/meta_ads/settings
GET    /api/tools/meta_ads/accounts          # llama Meta API
GET    /api/tools/meta_ads/pages             # llama Meta API

# Meta API proxies
GET    /api/tools/meta_ads/campaigns
GET    /api/tools/meta_ads/adsets?campaign_id=X
POST   /api/tools/meta_ads/adsets            # crear/clonar ad set

# Batches
POST   /api/tools/meta_ads/batches           # crear batch
GET    /api/tools/meta_ads/batches           # listar todos (para History)
GET    /api/tools/meta_ads/batches/{id}
PUT    /api/tools/meta_ads/batches/{id}      # guardar copy, campaign, adset, opciones

# File upload
POST   /api/tools/meta_ads/upload            # multipart: batch_id + files → guarda a disco + crea creatives
PUT    /api/tools/meta_ads/creatives/{id}    # renombrar ad_name
POST   /api/tools/meta_ads/creatives/{id}/thumbnail  # subir thumbnail para video

# Launch
POST   /api/tools/meta_ads/launch/{batch_id} # sube a Meta y crea ads
```

### 3.6 — Dependencias Python
- `Pillow` para conversión WebP→JPEG (probablemente ya instalado; verificar requirements.txt)
- `python-multipart` ya está instalado (para file uploads)

---

## Fase 4 — Frontend (`frontend/src/pages/MetaAds.tsx`)

Wizard de 3 pasos + página Settings + página History. Todo con shadcn/ui.

### 4.1 — Funciones API (`api.ts`)
Agregar:
- `fetchMetaSettings` / `saveMetaSettings`
- `fetchMetaAccounts` / `fetchMetaPages`
- `fetchMetaCampaigns` / `fetchMetaAdSets` / `createMetaAdSet`
- `createBatch` / `updateBatch` / `fetchBatches` / `fetchBatch`
- `uploadCreatives(batchId, files[])` — multipart
- `updateCreativeName` / `uploadCreativeThumbnail`
- `launchBatch(batchId)`

### 4.2 — Página Settings (`MetaAdsSettings.tsx`)
- Input password para access token (muestra últimos 8 chars si ya hay token)
- Al guardar token → fetch accounts + pages automáticamente
- Select de ad account (nombre + ID + currency)
- Select de Facebook page
- Botón "Guardar"
- Equivalente al Prompt 4 del guide

### 4.3 — Wizard de upload (`MetaAds.tsx`) — 3 pasos

**Step 1 — Upload Creatives** (Prompt 8)
- Input "Batch Name" (default: "Batch {fecha}")
- Dropzone drag & drop para imágenes y videos
- Lista de archivos seleccionados con icono, nombre, tamaño, botón eliminar
- Botón "Subir" → crea batch + sube archivos → avanza al paso 2

**Step 2 — Ad Copy & URL** (Prompt 9)
- Lista de creativos subidos con ad_name editable, botón "+ Thumb" para videos
- Sección Primary Text (hasta 5 variaciones con textarea)
- Sección Headlines (hasta 5 variaciones)
- Sección Descriptions (hasta 5 variaciones)
- URL, Display link, CTA dropdown (los 16 tipos del guide)
- Validación antes de avanzar

**Step 3 — Campaign & Launch** (Prompt 10 + 11)
- Dropdown Campaign → fetch al entrar al paso
- Dropdown Ad Set + opción "Crear nuevo ad set" (clonar settings de uno existente)
- Checkbox "Launch as paused" (default ON)
- Checkbox "Enable creative enhancements" (default OFF)
- Summary card con resumen del batch
- Botón "Lanzar" → POST /launch → progress → resultado (verde/amarillo/rojo)
- Botón "Upload Another Batch" al terminar

### 4.4 — Página History (`MetaAdsHistory.tsx`) (Prompt 12)
- Lista de batches ordenados por fecha descendente
- Card por batch: nombre, campaign → ad set, timestamp, ads creados (verde), errores (rojo), badge de status
- Empty state con link al wizard

### 4.5 — Guard de configuración (Prompt 14)
- Verificar settings al cargar el wizard
- Si no hay token/ad account configurado → mostrar "Setup Required" con link a Settings

### 4.6 — Wiring en App.tsx y Sidebar.tsx
- Agregar rutas `/tools/meta_ads`, `/tools/meta_ads/settings`, `/tools/meta_ads/history`
- Megaphone icon ya está en Sidebar
- Agregar sub-navegación dentro de la page (o tabs Upload / History / Settings)

---

## Fase 5 — META-APP-SETUP.md

Guía paso a paso adaptada del Prompt 18:
1. Crear app en developers.facebook.com (tipo Business)
2. Conectar a Business Manager
3. Agregar use case "Create & manage ads"
4. Crear System User token con permisos necesarios
5. Agregar Privacy Policy URL
6. **Publicar la app** (Live mode — sin esto no crea ads)
7. Dónde pegar el token en nuestra app

---

## Orden de ejecución sugerido

1. `storage.py` + `schemas.py` (base de datos JSON)
2. `meta_client.py` (cliente Meta API — independiente)
3. `router.py` (endpoints)
4. `tool.py` + `__init__.py` (registro)
5. `api.ts` (funciones frontend)
6. `MetaAdsSettings.tsx` (Settings — más simple, buen warmup)
7. `MetaAds.tsx` Step 1 (file upload)
8. `MetaAds.tsx` Step 2 (ad copy)
9. `MetaAds.tsx` Step 3 (campaign + launch)
10. `MetaAdsHistory.tsx`
11. Wiring App.tsx + Sidebar.tsx
12. `META-APP-SETUP.md`

---

## Preguntas / notas pendientes

1. que es "Incluir reference ads como guía de estilo" en remix mode de concept ads?
2. tengo un problema no tecnico sino mas subjetivo y es que siento que el copy de los ads y de todas las tools es siempre los mismos 5 argumentos, estos es normal, deberia ser asi? que crees que puede estar causando esto? siento que el brand-dna la pasarlo en todos lados influencia mucho en las IAs y hace que siempre tengan los mismo argumentos, como crees que lo podemos arreglar? porque brand-dna debe ser simplemente es estilo, la voz , la imagen que quiere la marca, pero no debe decir los argumentos, eso debe pensarlo la IA. o no? nose quiza me estoy equivocando, no quiero que me des la razon absolutamente ni que me digas que nada que ver, quiero que lo pienses a ver como lo podemos solucionar o que crees de esto.

---


Explore existing tool conventions (concept_ads, static_ads, main.py)

Create backend/tools/meta_ads/schemas.py + storage.py

Create backend/tools/meta_ads/meta_client.py

Create backend/tools/meta_ads/router.py

Create backend/tools/meta_ads/tool.py + __init__.py

Add Meta Ads API functions to frontend api.ts

Create MetaAdsSettings.tsx

Create MetaAds.tsx wizard with 3 steps

Create MetaAdsHistory.tsx

Wire routes in App.tsx and Sidebar.tsx