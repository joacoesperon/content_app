# Plan — Sistema de Generación de Contenido Orgánico

> **Última actualización:** 2026-04-26
> **Estado:** Reels stack construido (Director + Reels Tool). Listo para
> generar el primer batch de reels en paralelo a postear los carruseles.

---

## 🟢 AHORA — Vos (manual, sin código)

### Carruseles
- [ ] Generar los 7 carruseles del run `outputs/scout/2026-04-24.md` con Carousels Tool
- [ ] Subir los ZIPs manualmente a Instagram

### Reels (track paralelo)
- [ ] Brand Tool → Mascot: generar PNG base con AI (botón "Generate base with AI") o subir tu propia imagen
- [ ] (Opcional) Subir referencias adicionales de la vela con tags por expresión (smug, panicked, etc.)
- [ ] Revisar/ajustar `reels-mix.md` y `mascot.json` en Brand Tool
- [ ] Correr Director → outputs/director/YYYY-MM-DD.md (3 scripts)
- [ ] Reels Tool: generar las 3 reels (≈$13 total a 3 escenas c/u)
- [ ] Subir manualmente a Instagram, agregar captions/música en CapCut

### Después
- [ ] Esperar 7 días con carruseles + reels publicados
- [ ] Volver al checkpoint con engagement real

**No iterar Scout, Carousels, Director ni Reels hasta el checkpoint.**

---

## 📅 CHECKPOINT — ~2026-05-08 (cuando pasen los 7 días)

Volvé a este archivo y respondé estas preguntas con datos en mano:

1. ¿Posteaste los 7? Si no → **no avances**, terminá de postear primero.
2. ¿Qué post tuvo más saves/shares? ¿Qué tenía distinto (tema, formato, lever)?
3. ¿Qué post no enganchó? ¿Fue el copy, el visual o el ángulo?
4. ¿Sumaste followers? ¿Cuántos? ¿Qué post los trajo?
5. ¿Hubo algún DM o comentario que pida más info / menciones el bot?

Con esas respuestas, elegí **una** acción de la lista de abajo. No varias.

---

## 🎯 PRÓXIMOS PASOS — En orden de impacto probable

Cada uno es un workstream independiente. Atacar de a uno, según lo que diga la data del checkpoint.

### A1. Diversidad visual en Scout (si el feed se ve "AI-generated")
Regla en `content-mix.md`: "Al menos 2 de los 7 posts por batch deben usar fotografía
(personas, manos, pantallas, escritorios) en lugar de tipografía + data viz."
Fuerza a Scout a usar el `photography_direction` que ya está en `brand-style.md`.

### A2. Calidad de captions (si el copy se sintió genérico en algún post)
- Agregar 3–5 captions aprobados como few-shot en el system prompt de Scout
- Reforzar prohibición de clichés ya listados en `content-mix.md` ("The future is automated", "while you sleep", "no coding required", "plug and play")
- Requerir frase de apertura original (no templates tipo "Most traders lose because…")

### A3. Reviewer agent (si Scout produce repetición clara entre posts)
Patrón Evaluator-Optimizer (guia_agents.md Parte 2). Segundo call a Claude después
de Scout que audita y reescribe si:
- 4+ posts comparten tesis core
- Algún post 1-6 tiene producto/CTA que debería ser solo post 7
- Los insights de Reddit no aparecen en los captions, solo en `Rationale`

Único caso que justifica un segundo agente según la guía: roles claros (crear vs evaluar), pipeline definido, fallas auditables.

### A4. ~~Reels Tool~~ — completada 2026-04-26
Director agent + Reels Tool construidos. Pipeline funciona: Director script →
nano-banana-pro/edit (mascot refs + scene) → Veo 3.1 Fast i2v → ffmpeg concat → final.mp4.

### A5. Cron semanal de Scout (cuando confíes en la calidad sin revisar)
Cron lunes 6am que dispara Scout y guarda el output. Solo implementar cuando 3+ runs
seguidos den output que postearías sin tocar.

### Polish de Scout (bajo, hacelo si te molesta)
- [ ] Historial de tool calls visible cuando termina Scout (no solo el output)
- [ ] JobContext para Scout (mismo patrón que ya hicimos para Carousels) — no perder el run al cambiar de pestaña
- [ ] Limpiar `ddgs` de `backend/requirements.txt` (ya no se usa)

---

## 📣 Track paralelo: Meta Ads (no depende de orgánico)

- [ ] Crear primera campaña de Meta
- [ ] Verificar que la Meta Ads Tool deja seleccionar esa campaña y subir ads
- [ ] Reescribir SKILL.md de nano-banana + claude code para Static Ads (claridad de instrucciones)

Avanza independiente de lo orgánico — son tracks separados.

---

## 🚫 Decisiones conscientes (no revertir sin discutir)

- **Scout es UN solo agente**, hace research y briefs en una pasada. No hay "Carousel Agent" separado.
- **Carousels y Reels son TOOLS con humano en el loop**, no agentes autónomos.
- **No hay publicación automática a IG** hasta que A5 esté validado. Subida manual.
- **Sin Instagram Graph API** — la deferimos a propósito (requiere Business + Page + aprobación Meta).
- **Testimonios ficticios en Posts de Social Proof**: OK, los mantenemos. Decisión tomada 2026-04-25.
- **No multi-agente hasta que Scout falle en algo concreto y medible.**

---

## 🏗 Stack actual (referencia rápida)

### Scout
- `backend/tools/scout/service.py` — `claude-sonnet-4-6`, `max_tokens=16000`, max 25 iteraciones, streaming SSE
- **Inputs (en orden):**
  1. `get_current_time` (tool obligatoria primera)
  2. `brand/brand-style.md` (voz + visual + photography, SIN argumentos de venta)
  3. `brand/data/avatars.json` (ignora `ad_angles` explícitamente)
  4. `brand/content-mix.md` (distribución de 7 categorías + reglas duras)
  5. `brand/data/scout-state.json` (rotación de avatar)
- **Tools de research:** `reddit_search` (primaria, sin auth) + `web_search_20250305` nativo de Anthropic (fallback, max 3)
- **Tools aux:** `read_brand_file`, `write_output_file`, `write_brand_file`
- **Output:** `outputs/scout/YYYY-MM-DD.md` (sufija -1, -2 si existe)

### Carousels Tool (cerrada 2026-04-25)
- **Backend:** `backend/tools/carousels/` — parser MD, FAL wrapper (`fal-ai/nano-banana-2`), versionado por slide, ZIP builder, set-favorite
- **Frontend:** `frontend/src/pages/Carousels.tsx` con `CarouselJobsContext` (sobrevive cambio de pestaña)
- **Features:** prompt editable + Reset to Scout original, resolución/aspect/thinking/seed individuales + masters, modifier toggle individual + master, navegación entre versiones con flechas, thumbnails, estrella favorita, costo en vivo, Generate all con confirmación, History tab
- **Output:** `outputs/carousels/YYYY-MM-DD/{post-slug}/slide_NN_vM.png` + `meta.json`
- **Decisión:** sin Instagram Graph API. Download ZIP → upload manual.

### Director (cerrado 2026-04-26)
- **Backend:** `backend/tools/director/service.py` — `claude-sonnet-4-6`, max_tokens=16000, agente independiente (separate research)
- **Inputs:** `mascot.json`, `avatars.json`, `reels-mix.md`, `brand-style.md`, `data/director-state.json`
- **Tools de research:** `reddit_search`, `web_search_20250305` nativo, `get_current_time`
- **Output:** `outputs/director/YYYY-MM-DD.md` con N reel scripts (uno por entrada en reels-mix.md)
- **Frontend:** `frontend/src/pages/Director.tsx` (clon de Scout) — SSE stream, history
- **Sidebar icon:** clapperboard

### Reels Tool (cerrada 2026-04-26)
- **Backend:** `backend/tools/reels/` — parser MD del Director, pipeline 2-pasos (image edit + video i2v + ffmpeg concat), versionado por escena, set-favorite, render-final
- **Modelos FAL:** `fal-ai/nano-banana-pro/edit` (refs del mascot + scene prompt) → `fal-ai/veo3-fast/image-to-video` (i2v 8s con audio TTS de Veo)
- **Frontend:** `frontend/src/pages/Reels.tsx` con `ReelJobsContext` (sobrevive cambio de pestaña; Veo tarda 2-3 min por escena)
- **Features:** scene editor con setting/expression/tone/dialogue/animation hint, aspect ratio, extra prompt, navegación entre versiones, estrella favorita, render-final via ffmpeg, History con preview de videos
- **Output:** `outputs/reels/YYYY-MM-DD/{reel-slug}/scene_NN_vM.{png,mp4}` + `final.mp4` + `meta.json`
- **Costo:** ~$1.30/escena, $3.90 reel de 3 escenas, $5.20 reel de 4 escenas
- **Brand Tool integration:** sección Mascot (subir/generar refs con tags por expresión) + sección Reels Mix (editor del .md)

### Otras tools existentes
- **Static Ads Tool** — generación de ads estáticos via FAL para Meta
- **Concept Ads Tool** — ads con producto + referencias
- **Meta Ads Tool** — bulk uploader a Meta (track paralelo)
- **Brand Tool** — edita brand-dna.json + content-mix.md + reference media
- **Avatars Tool** — edita avatars.json

---

## 📜 Historial de runs de Scout

### Runs 1–3 (2026-04-22, Scout "viejo")
Problemas críticos: copiaba `ad_angles`, brand-dna mezclaba estilo con argumentos de venta, fechas alucinadas, brief visual en español, feed 100% de venta, hashtags repetitivos. **Causa raíz:** Scout no creaba, rearmaba el LEGO.

### Run 4 (2026-04-22, post-Ronda 1) — `outputs/scout/2026-04-22.md`
Mejoras: PLAN con avatar rotation + 7 levers diferentes, brief visual en inglés por slide, posts 1-6 sin precio/CTA, número de slides variable.
Residuales: fecha alucinada (header decía 2025), research débil (TradingEconomics, no Reddit), repetición temática en 4/7 posts.

### Run 5 (2026-04-23, post-Ronda 2 con Reddit) — `outputs/scout/2026-04-23.md`
Mejoras: get_current_time funcionando (fecha correcta). Reddit empezó a dar señal real.

### Run 6 (2026-04-24, Reddit completamente integrado) — `outputs/scout/2026-04-24.md`
**Estado actual.** Research cita threads reales con upvotes (119, 156, 32). Posts 1, 2, 5, 6 todavía circulan la tesis "ejecución > estrategia" con framings distintos pero el Claim check pasa. Captions notablemente más humanos. Post 4 con 1 slide funcionó. Listo para postear.

---

## ✅ Log de lo que hicimos (consolidado)

**Ronda 1 — Refactor de inputs de Scout (2026-04-22):**
brand-style.md generado por Brand sin argumentos de venta · Scout ignora ad_angles · content-mix.md con 7 categorías + reglas duras · brief visual en inglés con prompt por slide · max_tokens 16000 · ejemplos buenos/malos de FAL en system prompt · mención explícita de nano-banana-2.

**Ronda 2 — Mejorar research (2026-04-22, validada 2026-04-24):**
get_current_time obligatoria · reddit_search como fuente primaria · web_search_20250305 nativo de Anthropic · Claim check en el PLAN · prohibición de inventar research.

**Carousels Tool completa (2026-04-25):**
Parser MD · versionado por slide con favoritas · 4 controles configurables (resolución, aspect ratio, thinking level, seed) individual + master · modifier toggle individual + master · UI con flechas y thumbnails · costo en vivo · Generate all con confirmación · JobContext que sobrevive cambio de pestaña · History tab · Reset to Scout original.

**Tech fixes varios:**
No sobreescribir output del mismo día (sufija -1, -2) · Endpoints `/brand/content-mix` GET/PUT con UI · Brand-style separado de brand-dna · Scout state migrado a `data/scout-state.json` · Meta-ads settings migrado a `data/meta-ads-settings.json` · Vite proxy `/outputs` agregado para que Gallery cargue imágenes.

**Reels stack (2026-04-26):**
`brand/data/mascot.json` con visual_description + 5 tones + 5 expressions + catchphrases · `brand/reels-mix.md` con distribución 3 reels/semana + reglas duras · `brand/mascot/` directorio para refs de la vela con tags por expresión · Endpoints `/brand/mascot`, `/brand/mascot/refs`, `/brand/mascot/generate`, `/brand/reels-mix` con UI completa en Brand Tool (MascotSection + ReelsMixSection) · Director agent con system prompt de 200+ líneas, mismas tools que Scout pero con state separado · Reels Tool con pipeline `nano-banana-pro/edit + veo3-fast i2v + ffmpeg` · `ReelJobsProvider` global agregado a App.tsx.

---

## 📋 Próximos pasos

1. crear la primer campaña de meta
2. revisar si puedo seleccionar la campaña en la meta ads tool (ya con eso quedaria lista, quedaria ver si funciona toda completa)
3. descargar devuelta el nano banana + claude code SKILL.md y reescribirlo para que se entienda lo que se tiene que hacer en static ads
4. hacer scout + carrousel tool + para hacer reels
