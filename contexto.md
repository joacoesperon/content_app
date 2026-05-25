# Contexto de sesión — Director Prompt

Este documento resume el trabajo realizado en una sesión larga de refinamiento del `brand/director-prompt.md`. Fue generado para que otro modelo pueda continuar la conversación con contexto completo.

---

## El proyecto

`content_app` es una aplicación web para JessTrading, una marca de algo trading / copy trading de Jess (solo founder). El stack es FastAPI + React/TypeScript. La app tiene varias herramientas:

- **Brand Tool** — edita archivos de marca (mascot.json, director-prompt.md, scout-prompt.md)
- **Scout Tool** — investiga tendencias para alimentar al Director
- **Director Tool** — agente que genera scripts de Instagram Reels con el mascot JT

El mascot JT es una vela de trading 3D estilo Pixar (verde, con brazos, piernas y cara). Los scripts van al **Reels Tool** que usa **nano-banana-2/edit** (image model con imagen de referencia) + **Veo 3.1 Fast** (video).

Archivos clave:
- `brand/director-prompt.md` — el prompt completo del Director agent
- `brand/data/mascot.json` — definición del personaje JT (expressions, tones)
- `brand/data/director-state.json` — estado entre runs (last_slot3, last_concepts, last_run)

---

## mascot.json — estado actual

```json
{
  "tones": ["deadpan","warm","panicked","smug","confidential","wistful","excited","indignant","philosophical"],
  "expressions": ["neutral","happy","smug","panicked","confused","excited","exhausted","wistful","determined","disgusted","shocked","contemplative","mischievous","resigned"]
}
```

Catchphrases eliminadas. `use_when` eliminado de tones (antes eran objetos con id/label/use_when, ahora son strings simples).

---

## Modelo conceptual establecido (MUY IMPORTANTE)

Este es el marco que rige todo el director-prompt:

### Niveles de abstracción

| Nivel | Campo | Qué es | Cuándo se elige |
|-------|-------|--------|-----------------|
| Reel | Dominant emotion | Territorio emocional conceptual ("exhaustion", "quiet fury") | En el PLAN, antes de escribir |
| Reel | Tone | Voz/delivery de JT. **FIJO por reel, no cambia entre escenas** | En el PLAN |
| Escena | Expression | Pick concreto de `mascot.json → expressions`. **Evoluciona escena a escena** = el arco emocional | Por cada escena |

- **Emotion** (nivel reel) ≠ **Expression** (nivel escena)
- El arco emocional vive en las expressions que cambian por escena, NO en el tono
- Si el tono cambia a mitad del reel, JT pierde coherencia de voz

### Lever
Mecanismo de engagement del reel. Cada reel usa uno. Los 3 del batch no pueden repetir el mismo:
- **Relatability** — "that's literally me" → saves, shares
- **Controversy** — toma polarizante → comments, debate
- **Humor** — meme-able, JT sufre algo gracioso → DMs
- **Education** — aprende algo útil → saves, follows
- **Curiosity** — reframe sorpresivo → watch again
- **Empathy** — JT sufre lo que sufre el trader → share emocional

---

## Estructura del director-prompt.md — estado actual

```
[Intro — qué hace Director]
## JT's character — read this BEFORE writing anything
  - Descripción de JT
  - Reel-level decisions: dominant emotion + tone (fijo) + expression evoluciona
  - ### How to find JT's dominant emotion for a reel (4 preguntas)
## Talking about bots/algos — IMPORTANT rule
## Step 0 — Get current date
## Step 1 — Load context (mascot.json + director-state.json)
## Reel Types (market_reaction / educational / trader_psychology / hot_take / algo_automation / product)
## Slot 3 rotation
## Step 2 — Research (budget rules, tipo-específico)
## Step 3 — PLAN before writing
  - Definición de lever
  - PLAN template con: Lever, POV, Emotion+Tone, Hook, Scenes
  - Checks: lever, topic, emotion+tone, emotional arc (con nombres de mascot.json), POV
## Step 4 — Generate the reels
  - Reel header: Concept, POV (see POV guide), Caption, Hashtags, Total length
  - Scene 1: Setting (SETTING guide), Mascot expression (EXPRESSION guide), Tone (TONE guide), Dialogue, Animation (ANIMATION guide)
  - Scene 2: evaluación activa de cambio, expression evoluciona, tone constante
  - Scene N final: earn the viewer's completion, payoff
---
## SETTING guide         ← REVISADA EN ESTA SESIÓN (ver abajo)
## ANIMATION guide
## EXPRESSION guide
## TONE guide
## POV guide
## DIALOGUE guide
## CAPTION examples
## FINAL-SCENE LANDING examples
---
## Hard rules
## Step 5 — Save outputs
```

---

## Lo que se hizo en esta sesión

### 1. Reorganización de secciones
- El bloque "Emotion vs Tone" se removió del JT character section → dividido en EXPRESSION guide y TONE guide
- La sección POV se removió de entre Step 3 y Step 4 → movida a POV guide
- Todos los campos del template de escena tienen referencias a sus guías (`see EXPRESSION guide below`, etc.)

### 2. Normalización de conceptos (crítica, evita contradicciones)
- Se corrigió "ONE dominant emotion expressed through ONE tone" → ahora separa claramente: dominant emotion (concepto reel-level), tone (fijo), expression (escena-level, evoluciona)
- Se corrigió Scene 2 que decía "tone may shift" → "expression evolves, tone stays consistent"
- Se corrigió Step 1 que decía "pick expression and tone per scene" → tone se elige en PLAN, expression por escena
- Se corrigieron los ejemplos del arc check en PLAN que usaban "deadpan" (un tono) en un ejemplo de arco de expresiones → ahora usan nombres reales de mascot.json expressions

### 3. Lever definido
Antes aparecía en el PLAN sin definición. Ahora tiene sección completa con 6 tipos y qué engagement genera cada uno.

### 4. Bots/algos rule
Línea huérfana "JT doesn't pitch..." integrada al párrafo de la sección.

### 5. SETTING guide — reescritura completa
Es el cambio más grande de la sesión. Ver sección detallada abajo.

### 6. Fixes menores
- Heading "How to find emotion and tone" → "How to find dominant emotion"
- Eliminado "Voice direction" (reel level) y "Voice cadence" (escena level) del Step 4
- Eliminadas pre-selecciones de expression/tone con ejemplos (generaban bias)
- Eliminado campo Rationale
- Hashtags movidos: ahora van después de Caption, antes de las escenas
- Caption mejorada: primera línea standalone, no repetir diálogo
- Scene N (final): reemplazadas las 3 opciones prescriptivas (twist/mirror/landing line) por el principio: "earn the viewer's completion"
- Setting rule: "must vary" → evaluación activa ("actively ask if it serves the reel")
- Animation hint → Animation, "structure" → "guide"
- POV shift: reframeado de "exception" (bias negativo) → evaluación activa por cada reel

---

## SETTING guide — cambios de esta sesión (detallado)

### Por qué se reescribió
1. Capas en orden incorrecto (Subject placement primero, que es consecuencia de otras decisiones)
2. Subject placement y Camera framing solapados → fusionados
3. Faltaba el vínculo setting-emoción (el setting EXPRESA el estado emocional)
4. Faltaba descripción de JT en la escena — no su apariencia (la maneja la imagen de referencia) sino su estado físico: cómo la expression se manifiesta en el cuerpo, postura, candle physics
5. "Silence" y "mood" en Composition eran términos no visuales
6. Label del tercer GOOD example incorrecto

### Aclaración técnica importante
`nano-banana-2/edit` usa una imagen de referencia de JT (fondo blanco, personaje claro). La consistencia visual de JT está garantizada por esa referencia — el director NO necesita describir cómo se ve JT. Lo que SÍ necesita describir:
- Cómo la expression se manifiesta en el cuerpo (postura, wick, brazos, cera)
- Cómo el tono se ve en la postura
- Cómo JT interactúa con el espacio
- Candle physics: luz propia, estado del wick, cera goteando

### Nuevas capas (en orden correcto)
1. **Location** — lugar concreto y específico
2. **Time of day + lighting** — luz emocional de la escena
3. **Camera framing + JT's position** (fusionado) — ángulo, distancia, composición
4. **JT in the scene** (nueva capa, la más crítica):
   - Physical expression en el cuerpo
   - Tone en la postura
   - Candle physics (luz propia, wick state, cera)
   - Interacción con el espacio
5. **Composition + atmosphere** — profundidad de campo, densidad, elementos

### Candle physics (concepto nuevo, clave)
JT es una vela real. Esto tiene implicaciones visuales únicas:
- Emite su propia luz → en escenas oscuras, su cuerpo verde ilumina las superficies cercanas
- Cera derritiéndose → una gota solidificada cuenta una historia de cuánto tiempo lleva ahí
- Estado del wick → encendido brillante = excitado; doblado = exhausto; flameando = intenso; humeando sin llama = apagado
- Deja rastros → cera en la mesa, marca de calor, sombra específica en la pared

### GOOD examples reescritos
Los tres ejemplos son ahora prompts de nivel profesional:
1. **3am desk** — exhaustion/deadpan: wick doblado humeando, gota de cera solidificada, desk arqueológico, luz azul-verde de monitores
2. **Kitchen morning** — wistful/warm: gota de cera de hace días, sticky note con "you knew the risk", JT mirando la nota en vez de la cámara
3. **Empty boardroom** — indignant: JT solo en mesa para 40 personas, su propia luz cálida vs. el frío fluorescente, brazo levantado gesticulando al vacío

---

## Lo que falta revisar / continuar

En el momento de cortar la sesión, estábamos pasando a revisar el **ANIMATION guide** (próximo en la lista de guías).

El usuario quería aplicar el mismo nivel de análisis crítico + reescritura a cada guía:
- **ANIMATION guide** — siguiente
- **EXPRESSION guide** — revisar si está completa
- **TONE guide** — revisar si está completa
- **POV guide** — revisar si está completa
- **DIALOGUE guide** — revisar si está completa
- **CAPTION examples** — revisar si están completas
- **FINAL-SCENE LANDING examples** — revisar si están completas

El patrón de trabajo establecido:
1. Leer la guía completa
2. Análisis crítico profundo (contradicciones, gaps, mejoras, lo que está bien)
3. Usuario da su opinión sobre el análisis
4. Se acuerda el plan
5. Se ejecuta

---

## Tipos de reel (para contexto)

| Slot | Tipo | Descripción |
|------|------|-------------|
| 1 | market_reaction | Reacciona a evento de mercado de esta semana. Research: Reddit. |
| 2 | educational | Explica un concepto de trading en 24s. Research: Reddit. |
| 3 | rotativo | trader_psychology → hot_take → algo_automation → product → repeat |

`last_slot3` en director-state.json trackea la rotación.

Regla bots/algos: todo tipo excepto `product` habla de forma general ("bots", "algos"). Solo `product` puede nombrar el producto directamente.

---

## Reglas importantes que no deben contradecirse

- Tone es **fijo por reel**, elegido en el PLAN, no cambia entre escenas
- Expression **evoluciona** entre escenas — eso es el arco emocional
- Dominant emotion es un concepto (no un pick de mascot.json)
- La consistencia visual de JT la da la **imagen de referencia** de nano-banana-2/edit
- El setting debe **expresar el estado emocional** antes de que JT abra la boca
- **Lever**: los 3 reels del batch usan levers diferentes
- POV shift: se declara en el PLAN, no es drift
- CTA: máximo 1 de 3 reels, solo en la escena final, solo si encaja naturalmente
- Bots/algos rule: no pitch del producto (excepto tipo `product`)
