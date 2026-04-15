# TODO — Content App

## Estado final vs 25 prompts de referencia

| # | Prompt original | Estado | Notas |
|---|---|---|---|
| 1 | Project foundation | ✅ Done | FastAPI + React, dark UI, local |
| 2 | Multi-brand client system | ⏭ Skipped | Single-brand por diseño |
| 3 | Brand kit setup | ✅ Done | Brand DNA page + brand-dna.md |
| 4 | Logo and asset uploads | ✅ Done | Product images + reference images en Brand page |
| 5 | FAL AI image generation | ✅ Done | nano-banana-2 + nano-banana-2/edit |
| 6 | Basic ad generator — Remix mode | ✅ Done | Remix Mode en Concept Ads |
| 7 | Bulk generation | ✅ Done | num_images selector + WS live progress |
| 8 | Generation history board | ✅ Done | Historial tab en Concept Ads + Static Ads |
| 9 | Download button | ✅ Done | Download en ImageGrid (card + lightbox) |
| 10 | Google Gemini prompt composer | ⏭ Replaced | Manual Planner: prompt → claude.ai → paste JSON (misma calidad, $0 extra) |
| 11 | Brand intelligence profiles | ✅ Done | Avatars: CRUD + pain points + desires + ad_angles |
| 12 | Reference ads library | ✅ Done | Galería persistente en Brand page |
| 13 | Ad format library | ✅ Done | 16 formatos en formats.json, seleccionables |
| 14 | Concept Library (custom + Gemini analysis) | ⏭ Skipped | Sin Gemini; los 16 formatos built-in cubren el caso |
| 15 | Concepts mode — AI planner | ✅ Done | Manual Planner: build-prompt + parse-plan |
| 16 | Concept plan preview UI | ✅ Done | Cards con avatar, formato, hook, ángulo antes de generar |
| 17 | Concept mode generation | ✅ Done | FAL para cada concepto + WS progress |
| 18 | Ad detail modal | ✅ Done | Click → modal con imagen + metadata (hook, angle, prompt, formato, avatar, resolución) |
| 19 | "Remix This" action | ✅ Done | Botón en modal → carga imagen como referencia en Remix Mode |
| 20 | Save as Template | ⏭ Skipped | No implementado; Reference Ads Library cubre caso similar |
| 21 | Brand reference auto-injection | ⚠️ Partial | Brand modifier (brand-dna.md) se inyecta; imágenes de reference-ads no se pasan a FAL aún |
| 22 | Delete and clean up | ✅ Done | Delete en concept outputs; avatars delete |
| 23 | Layout guard | ✅ Done | detectAspectRatio() auto-detecta y pre-setea aspect ratio en Remix Mode |
| 24 | Human archetype protection | ✅ Done | En prompts de Concepts Mode y Remix Mode |
| 25 | Export for sharing | ⏭ N/A | No aplica (no es Replit) |

## Pendiente

- ⚠️ **#21 parcial — Brand reference auto-injection**: Las imágenes de `reference-ads/` todavía no se pasan como input a FAL. Para implementarlo habría que subir las reference ads a FAL storage y pasarlas como `image_urls[]` adicionales al modelo edit.
