# Jess Trading — Camino a $10k/mes

> **Producto:** Range Breakout Bot (XAUUSD + 4 pares) — $147 lifetime, sube a $197 el 1 julio
> **Objetivo:** lanzar campañas Meta el viernes 12/6 y empezar a vender. Probar de verdad, sin frenar al final.
> **Hoy:** jueves 11/6/2026

> **Ángulo de venta (honesto + agresivo, todo alineado a esto):**
> *"Trades your breakout strategy while you sleep. Your rules, executed 24/7, zero emotion. $147 once — not $97/month. 14-day refund. No hype, no guarantees."*
> Vendemos el deseo (que es real: el bot corre solo). No fabricamos pruebas.

---

## Estado actual

| Item | Estado |
|------|--------|
| Bot corriendo 24/7 en VPS | ✅ (desde 10/6) |
| Copy Whop + afiliados 40% + Telegram | ✅ |
| +439% falso fuera del Whop | ✅ |
| LP: checkout directo cableado | ✅ |
| LP: hero honesto, secciones con data falsa escondidas | ✅ |
| Pixel + CAPI + webhook Whop | ✅ testeado en vivo — Purchase server llega a Meta |
| Prompts de ads limpios (46) | ✅ |
| Static ads generadas (8 templates) | ✅ versiones elegidas |
| Compra de prueba (Purchase en Meta) | ✅ verificado (CAPI server-side) |
| Backtest real → reactivar sección LP | 🔴 hoy |
| Campaña Meta lanzada | 🔴 viernes |
| MyFXBook público + historial | 🔴 paralelo |
| Videos (hero loop + pitch) | 🔴 paralelo |
| Reviews reales | 🔴 paralelo |

**Creatives listas (versión a usar):** 46-anti-hype v1 · 44-how-it-works v1 · 42-multi-pair v1 · 27-benefit-checklist v1 · 04-features-benefits v1 · 37-promo-discount **v2** · 21-bold-statement **v2** · 07-us-vs-them **v2**

---

## Tareas — de más urgente a menos

**Camino crítico para lanzar el viernes:**

- [ ] **Sacar los números reales del backtest** (reportes MT5 Strategy Tester de los 5 pares) y pasárselos a Claude → reactivo la sección de backtest en la LP con data real.
- [ ] **Armar y lanzar la campaña Meta:** 1 campaña Cold Sales (objetivo Purchase), 1 adset, $30/día, 5-6 ads, link a la LP. Special Ad Category = None. Disclaimer de riesgo en cada ad.

**En paralelo (suben conversión, NO bloquean el lanzamiento):**

- [ ] **Hacer público el MyFXBook** + verificar en incógnito. Cuando tenga ~2 semanas, pasárselo a Claude → reactivo la sección de performance.
- [ ] **Grabar la sesión de MT5** (`video.md`): sale el hero loop de la LP + el pitch del founder. Subir el pitch al Whop store.
- [ ] **Conseguir 3-5 beta testers reales** (Telegram/conocidos que tradeen) → reviews genuinas en Whop.
- [ ] **Armar ads 41 (MyFXBook real) y 43 (founder)** en Canva con tus imágenes reales — NO se generan con la tool. Para cuando tengas MyFXBook público + foto tuya.

**Hito de éxito semana 1:** ≥3 ventas. Si no llega, el problema es la LP/oferta, no el spend.

---

## Lo que NO hacer

- No frenar en el momento de vender. Lanzar, medir, iterar con datos reales — no con suposiciones.
- No fabricar pruebas (resultados ajenos, reviews/prensa falsas, números inventados). Templates 10 y 33 = "DO NOT USE".
- No publicar el código del bot en ningún lado.
- No correr discounts. La urgencia es "$147 → $197 el 1 julio".
- No escalar el presupuesto antes de tener ≥3 ventas que confirmen que la LP convierte.
- No agregar productos nuevos hasta validar $10k/mes.

---

# Backlog técnico (app / tooling)

- [ ] Cron semanal de Scout y Director (lunes 6am)
- [ ] Hacer visible el historial de tool calls cuando termina Scout
- [ ] Agregar JobContext a Scout (sobrevivir cambio de pestaña)
- [ ] Limpiar `ddgs` de backend/requirements.txt
- [ ] Crear primera campaña de Meta
- [ ] Verificar que la Meta Ads Tool deja seleccionar la campaña y subir ads
- [ ] Dashboard que sea un dashboard de metricas de ads y metricas de engagement de contenido, osea todo lo relacionado a ads, cuanto rinden, etc, todo lo relacionado a contenido, cuanto rinden, vistas, etc, y todo lo relacionado al negocio, ventas, graficas, etc 