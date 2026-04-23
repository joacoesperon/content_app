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

1. crear la primer campaña de meta
2. revisar si puedo seleccionar la campaña en la meta ads tool(ya con eso quedaria lista, quedaria ver si funciona toda completa)
3. descargar devuelta el nano banana + claude code SKILL.md y reescribirlo para que se entienda lo que se tiene que hacer
4. hacer scout + carrousel tool + para hacer reels