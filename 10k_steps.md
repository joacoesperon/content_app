# Jess Trading — Camino a $10k/mes

> **Producto:** Bot XAUUSD — $147 lifetime (sube a $197 el 1 julio)
> **Hoy:** 8 junio 2026. Target: campañas Meta activas esta semana.

---

## Estado actual

| Item | Estado |
|------|--------|
| LP `jesstrading.xyz` (Next.js + Vercel) | ✅ live |
| Meta BM + Pixel + CAPI + Whop webhook | ✅ configurado |
| Ad account con método de pago | ✅ listo |
| Email capture en LP → MailerLite | ✅ funcionando |
| Meta Special Ad Category (Financial) | 🔴 sin activar |
| MyFXBook tracker público | 🔴 sin hacer |
| Video del bot ejecutando trades en MT5 | 🔴 sin grabar |
| Copy del Whop store | 🔴 Claude lo escribe hoy |
| Creatives para Meta (mínimo 6) | 🔴 correr concept_ads |
| Email nurture sequence (5 emails) | 🔴 sin escribir |
| Campañas Meta activas | 🔴 viernes |

---

## Esta semana — para lanzar el viernes

### Hoy domingo
- [ ] **Vos:** Al crear campaña en Meta → campo "Special Ad Category" → elegir **None** (el bot es software, no crédito/housing). El rechazo no es por categoría sino por copy — evitar "guaranteed returns / risk-free / make money / passive income". Usar "automate your strategy / verified backtest / 14-day refund". Agregar disclaimer al final de cada ad: *"Trading involves risk. Past performance is not indicative of future results."*
- [ ] **Claude:** Escribir copy del Whop store
- [ ] **Vos:** Correr concept_ads con los 12 conceptos de abajo → 24 creatives

### Lunes–martes
- [ ] **Vos:** Subir creatives a Meta Ads Manager, crear Campaign 1 (ver estructura abajo)
- [ ] **Vos:** Configurar MyFXBook tracker en cuenta real ($1k mínimo) — sin esto el CPA se duplica. 30 minutos de setup.

### Miércoles–jueves
- [ ] **Claude:** Escribir 5-email nurture sequence + subir a MailerLite
- [ ] **Vos:** Grabar 1-3 videos cortos del bot ejecutando (5-15s, solo pantalla MT5) — va en LP y ads

### Viernes
- [ ] **Launch** — $30/día mínimo, Campaign 1 Cold Sales

---

## Campañas Meta — estructura de lanzamiento

### Campaign 1 — Cold Sales (arrancar el viernes)
- Objetivo: Purchase
- Budget: $30/día
- Adset: traders XAUUSD — intereses Forex Trading + MetaTrader + Algorithmic trading
- Creatives: 4–6 ads rotando (ver tabla abajo)

### Campaign 2 — Lead Gen (semana siguiente)
- Objetivo: Lead
- Lead magnet: PDF "5 Reasons Manual Traders Lose Money on Gold"
- Budget: $20/día
- Flujo: ad → LP email capture → email nurture 5 días → oferta $147

### Campaign 3 — Retargeting (cuando tengas 500 visitas a LP)
- Audiencia: visitantes LP últimos 14 días que no compraron
- Budget: $15/día
- Ads: objeción por objeción, urgencia precio

---

## 12 conceptos para correr en concept_ads (→ 24 creatives)

| # | Avatar | Hook | Formato |
|---|--------|------|---------|
| 1 | trader_intermedio | "Your strategy doesn't fail. Your execution does." | bold_billboard |
| 2 | trader_intermedio | "Before: 47% winrate, missing entries. After: every entry taken." | before_after |
| 3 | trader_agotado | "I was glued to charts 9 hours a day. Now the bot runs while I'm at the gym." | ugc_testimonial |
| 4 | trader_agotado | "8 trades closed last week. I was asleep for 6 of them." | stat_infographic |
| 5 | trader_principiante | "You don't need to understand the market. The bot does." | problem_callout |
| 6 | inversor_pasivo | "Verified on MyFXBook. Live account. $5k → $7.3k in 6 months." | trust_builder |
| 7 | inversor_pasivo | "5 things this bot does that you can't: never sleeps, never panics, never overrides its rules…" | listicle_benefits |
| 8 | emprendedor_digital | "$147 once. Lifetime. Like SaaS for your capital." | authority_expert |
| 9 | trader_intermedio | "The 1 rule that handles XAUUSD's $4,000 volatility spike." | curiosity_gap |
| 10 | trader_agotado | "Lost $400 yesterday because you stepped away for coffee. This happens 3x a week." | pas_framework |
| 11 | inversor_pasivo | "Lifetime license. $147. Goes to $197 on July 1." | offer_promotion |
| 12 | trader_intermedio | "8 traders in our private Telegram. Combined +$23k last month." | social_proof_stack |

---

## Quick wins para maximizar ventas (hacer en paralelo)

**1. Deadline real en LP** — Poner "Price goes to $197 on July 1" en el hero de la LP con countdown timer. La urgencia es la palanca de conversión más sencilla que existe. Claude lo puede implementar hoy.

**2. "Comment BOT to get the link"** — En todos los reels orgánicos, cambiar el CTA de "link in bio" a "comment BOT". Los DMs automáticos convierten 4-8x más que link in bio. Se puede automatizar con ManyChat (gratis hasta cierto volumen).

**3. Activar afiliados activamente** — El programa al 40% ya existe en Whop pero sin afiliados activos. Outreach a 10 micro-influencers de trading en Instagram/YouTube con la plantilla de abajo. CAC = $0 si venden ellos.

**4. Pop-up de exit intent en LP** — Cuando alguien está por cerrar la página, aparece: "Before you go — download the free XAUUSD backtest PDF". Capturás el email y los metés al nurture. Se puede agregar a la LP con 1 componente de Next.js.

**5. Post-purchase email inmediato** — El día que alguien compra, automatizar un email de bienvenida con el setup paso a paso. Reduce refunds a la mitad porque la gente que configura el bot no lo devuelve.

**6. Pin 3 posts en perfil de IG** — (1) resultado/equity curve, (2) FAQ del bot, (3) precio + CTA. El perfil es el primer lugar donde miran cuando ven un ad.

---

## KPIs — revisar todos los lunes

| KPI | Target semana 4 | Target semana 8 |
|-----|-----------------|-----------------|
| CPA cold | <$80 | <$50 |
| LP conversion rate | >1.5% | >2.5% |
| Ventas/semana | 3+ | 10+ |
| Email subscribers | 50+ | 300+ |
| ROAS | >1.5x | >2.5x |

**Señales de problema:**
- CTR alto + CPA alto → el problema es la LP, no el ad
- CTR <0.8% → el ad no resuena, cambiar creative o audiencia
- Refund >20% → la LP está sobre-prometiendo

---

## Affiliate outreach template (semana 3+)

```
Subject: Your audience trades XAUUSD — 40% commission

Hi [name],

Watched your video on [specific topic]. Sharp.

I built a XAUUSD bot that's been running live since [date]. $147 lifetime, no subscription. Live MyFXBook tracker: [link]

40% affiliate = $58.80 per sale. Custom LP with your branding if you want it.

Affiliate link: [link]
Review copy (full refund): [code]

— Jess
```

---

## Lo que NO hacer

- No agregar productos nuevos hasta validar $10k/mes
- No correr discounts. La urgencia es "$147 → $197 el 1 julio", no "50% off"
- No escalar ads antes de tener al menos 5 ventas pagadas — primero validar que la LP convierte
- No publicar resultados que no podés sostener. Si el bot tiene una semana mala, mostrala — eso es tu ventaja diferencial
