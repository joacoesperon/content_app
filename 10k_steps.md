# Jess Trading — Plan para llegar a $10k/mes

> **Objetivo:** $10,000 USD en revenue mensual de ventas del bot XAUUSD ($147 launch → $197) en los próximos 90 días.
> **Fecha base:** 2026-04-29
> **Meta operativa:** ~70 ventas/mes ($147) o ~51 ventas/mes ($197). Promedio ~2 ventas/día.

## Estado actual — 2026-05-05

| Item | Estado |
|------|--------|
| Dominio `jesstrading.xyz` | ✅ comprado (Namecheap) |
| LP en producción (`https://jesstrading.xyz`) | ✅ live (Next.js 14 + Vercel) |
| Meta Business Manager | ✅ creado |
| Meta Pixel `1927145034653778` + CAPI | ✅ configurado y deployado |
| Domain verification Meta (DNS TXT) | ✅ agregado en Namecheap, propagando (~72h) |
| Whop webhook → CAPI Purchase | ✅ endpoint live, secret en Vercel |
| Ad account #1 (`JessTrading-Main`) | ✅ creado con método de pago |
| Ad account #2 backup | ⏳ bloqueado por Meta (~3-4 semanas de historial) |
| MailerLite (email capture) | 🔴 pendiente — crear cuenta y pasar API token |
| MyFXBook tracker | 🔴 pendiente — semana 2 |
| Testimonios | 🔴 pendiente — semana 2 |
| Campañas Meta activas | 🔴 pendiente — semana 4 |

---

## 0. Diagnóstico — dónde estás hoy (sin endulzarlo)

### Lo que TENÉS (activos reales)
| Activo | Estado | Calidad |
|--------|--------|---------|
| Producto (bot XAUUSD, .ex5 + tutorial + video) | ✅ entregable | Validable |
| Brand DNA documentado | ✅ completo | Premium, coherente, sin clichés |
| 5 Avatares con pain/desire/objections/language | ✅ completo | Muy bien definidos |
| Whop store (whop.com/joined/jesstrading/) | ⚠️ existe | **Sin fotos, sin descripción persuasiva, sin testimonios** |
| Contenido orgánico Instagram | ✅ corriendo | 1 carrusel/día + 3 reels/semana |
| Scout (contenido orgánico AI) | ✅ funcionando | Output de calidad — `outputs/scout/2026-04-22.md` lo demuestra |
| Static Ads tool (40 templates) | ✅ funcional | **No corrida ni una vez — `outputs/static_ads/` vacío** |
| Concept Ads tool | ✅ funcional | 4 UGC testimonials generados — falta diversidad de formato |
| Meta Ads tool (uploader) | ✅ funcional | **Cero campañas lanzadas** |
| Affiliate program 40% | ✅ existe en Whop | **Sin afiliados activos** |

### Lo que NO TENÉS (los bottlenecks reales)
1. **Landing page propia (pre-Whop)** — el Whop pelado va a matar las ventas pagadas. Esta es la falla #1.
2. **Product images / screenshots** — `brand/product-images/` está vacío. Sin esto no hay social proof visual.
3. **Testimonios reales** — para un producto de trading, sin esto el CPA se va a $200+ en Meta.
4. **Resultados verificables del bot** — backtests, equity curve real, MyFXBook/FXBlue tracker público. Sin esto no hay conversión.
5. **Email list / nurture** — mandar tráfico frío directo a comprar a $147 es 2-3% conversion en el mejor caso. Con email previo es 8-12%.
6. **Pixel de Meta + Conversions API** — sin esto, optimizás campañas a ciegas.
7. **Cuenta de Meta Business sin restricciones financieras** — trading es categoría restringida; te van a bloquear ads sin un setup correcto.
8. **Reference ads de competencia** — `brand/reference-ads/` vacío. No tenés benchmark de qué ya funciona en el nicho.

### El veredicto honesto
Tenés un producto digital sólido y la mejor stack de generación de contenido que vi en un solo-founder. Lo que te falta es **infraestructura de conversión y validación**. El gap entre "puedo generar 200 ads premium" y "vendo $10k/mes" no es más ads — es la página que reciben, la confianza que construís antes de pedir el cobro, y el sistema de medición que te dice qué está funcionando.

---

## 1. La matemática del $10k/mes (números reales)

### Escenarios

| Escenario | CPA | LP Conversion | Ventas/mes | Ad spend | Revenue | ROAS |
|-----------|-----|---------------|------------|----------|---------|------|
| **Conservador** (Whop pelado, sin nurture) | $90 | 1.2% | 70 | $6,300 | $10,290 | 1.6x ❌ |
| **Realista** (LP + retargeting + algunos testimonios) | $50 | 2.5% | 70 | $3,500 | $10,290 | 2.9x ✅ |
| **Optimista** (LP fuerte + email nurture + UGC + afiliados) | $30 | 4% | 70 | $2,100 | $10,290 | 4.9x 🚀 |

**Conclusión:** Sin la inversión en conversión, no llegás a $10k/mes con margen sano. El gasto en ads se come las ventas. El target tiene que ser ROAS ≥ 2.5x sostenido.

### Costos a considerar (que no son solo el ad spend)
- **Whop fee:** ~3-5% + procesamiento. $147 → ~$135 neto.
- **Refunds:** En productos de trading, expecta 10-15% de refund rate los primeros 30 días.
- **Affiliates:** 40% comisión = $58.80 por venta vía afiliado. **Las ventas por afiliado dan menos margen pero CAC = 0.**
- **Tools:** MailerLite (gratis hasta 1k subs), dominio ~$12/año (Namecheap), Vercel hosting (gratis), Stripe vía Whop, Meta Pixel (gratis), MyFXBook tracker (gratis).

### Revenue real esperado por escenario realista

```
70 ventas brutas × $147 = $10,290
- Whop fees (~4%):           -$412
- Refunds (12%):           -$1,235
- Ad spend:                -$3,500
─────────────────────────────────
Profit neto operativo:     ~$5,143
```

Para que sea negocio de verdad de $10k profit/mes necesitás llegar a ~$15-17k revenue/mes — pero pongamos primero $10k revenue como hito de validación.

---

## 2. La tesis estratégica central

> **La conversión es el cuello de botella. Todo lo demás amplifica o desperdicia ese cuello.**

Esto significa que las próximas 4 semanas no se trata de "lanzar más ads" sino de **construir la infraestructura que hace que cada visitante valga 3x más**.

### La arquitectura objetivo (qué tiene que existir antes de gastar fuerte en ads)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Tráfico                                                        │
│  ┌─────────┐    ┌──────────┐    ┌──────────────┐                │
│  │ Cold ad │───▶│  LP      │───▶│ Whop checkout│                │
│  │ (Meta)  │    │ propia   │    │              │                │
│  └─────────┘    └──────────┘    └──────────────┘                │
│       │              │                                          │
│       │              ├──▶ no compra ──▶ Email nurture (5 días)  │
│       │              │                  │                       │
│       │              │                  ▼                       │
│       │              │         Reoferta (urgencia $147→$197)    │
│       │              │                                          │
│       │              ├──▶ retargeting Meta (warm)               │
│       │              │                                          │
│       │              └──▶ Pixel + Conversions API               │
│       │                                                         │
│       ▼                                                         │
│   Lead magnet ad ──▶ Landing lead ──▶ Email capture ──▶ Nurture │
│   (free PDF/video)                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Orgánico Instagram (Scout + Carousels) ──▶ alimenta retargeting
                                       └──▶ social proof en LP
```

### La decisión que define todo: hybrid (no direct sale puro, no funnel largo puro)

- **Cold tráfico de avatares warm** (`trader_intermedio`, `trader_agotado`) → directo a LP de venta. Estos avatares ya están en el mercado, ya saben que existen bots, su objeción es de confianza no de educación.
- **Cold tráfico de avatares cold** (`trader_principiante`, `inversor_pasivo`, `emprendedor_digital`) → lead magnet (PDF/webinar) → email nurture → venta. Estos necesitan educación antes de comprar.
- **Retargeting** (toda visita a LP que no compra) → secuencia de 5 emails + ads de retargeting con testimonial/objeción/oferta.

---

## 3. Plan operativo por área

### A) Producto y oferta

El producto está OK. Lo que necesita es **packaging de oferta** y **prueba**.

#### A.1 — Crear evidencia verificable (semana 1-2, no negociable)
- **MyFXBook o FXBlue tracker público del bot** corriendo desde una cuenta real con $1,000-5,000 USD. Que cualquiera pueda entrar al link y ver el equity curve en vivo. **Sin esto, ninguna de las ads va a convertir.**
- **Backtest documentado** de XAUUSD desde 2020-2026 (5 años) con: drawdown máximo, win rate, profit factor, average trade duration, Sharpe ratio. Exportar como PDF de 1 página.
- **3-5 video screenshots cortos (5-15 seg)** del bot ejecutando trades en MT5. Mostrar la entrada, el SL, el TP, el cierre. Esto va en LP, en ads, en orgánico.

#### A.2 — Endurecer la oferta (semana 1)
La oferta actual ("$147 lifetime, one-time, 40% affiliate") está bien pero le falta urgencia y bonus stack para empujar la conversión:

**Oferta propuesta para LP:**
```
JESS TRADING — XAUUSD ALGORITHMIC BOT

  $147 launch price (next 60 days, then $197 forever)

  ✓ Lifetime license — pay once, run forever
  ✓ XAUUSD strategy with 15-year verified backtest
  ✓ Step-by-step setup guide (PDF + video, ~8 min)
  ✓ Optimized parameter sets for $1k / $5k / $10k accounts
  ✓ Telegram support channel (private)
  ✓ Monthly market update video (private)
  ✓ 14-day refund window — no questions asked

  + Bonus 1: "Risk Calibration Sheet" (Excel)
  + Bonus 2: 3-part video course on broker selection + VPS setup
  + Bonus 3: Affiliate program (earn $58.80 per referral)

  Total declared value: $497
  Today: $147
```

El "valor declarado" no es vender humo — es enmarcar el producto para que $147 se sienta como descuento, no como precio.

#### A.3 — 14-day money back (alarga el tiempo de decisión)
Whop permite refunds. Activarlo y ponerlo arriba de todo en la LP. Reduce CAC porque baja el riesgo percibido del comprador.

#### A.4 — Producto físico/digital secundario (semana 4+, opcional)
Si hay margen de tiempo, agregar un **bundle premium** ($297) que incluya el bot + 30-min de onboarding 1:1. Solo ~5 personas/mes pueden agarrarlo (escasez real de tu tiempo). Ratio 60/40 — la mayoría van al $147, pero el $297 levanta el AOV.

---

### B) Conversión — la landing page pre-Whop (PRIORIDAD #1)

#### B.1 — La decisión técnica
**Decisión tomada:** LP en **Next.js 14** (App Router) deployada en Vercel en `jesstrading.xyz`. Stack: Tailwind CSS con brand tokens, Meta Pixel + CAPI integrados, Whop webhook configurado. **Ya está live y funcional.**

El botón final manda a Whop con `?ref=lp_main` (parámetro tracking).

#### B.2 — Estructura de la LP (mobile-first, Meta tráfico es 80%+ mobile)

```
[1] HERO (above the fold)
   - Headline: "The bot that trades XAUUSD while you sleep — built on 5 years of verified data."
   - Subheadline: "$147 lifetime. Setup in 8 minutes. No coding. Live results below."
   - CTA primary: "Get the bot — $147" → Whop
   - Secondary: "See live performance" (scroll anchor)
   - Visual: video loop del MT5 ejecutando un trade real (no animación, no stock)

[2] LIVE PERFORMANCE SECTION
   - Embed del MyFXBook widget o screenshot actualizado semanalmente
   - Botón "Verify on MyFXBook ↗"
   - Stats: equity curve YTD, drawdown, win rate
   - Disclaimer fino: "Past performance is not indicative of future results"

[3] WHO THIS IS FOR / WHO THIS IS NOT FOR
   - Ladito A: "If you trade XAUUSD manually 4+ hours a day…"
                "If you have a strategy but break your own rules…"
                "If you have capital but no time to chart…"
   - Ladito B (NOT FOR): "Looking for get-rich-quick? This isn't it."
                        "Won't learn anything? Wrong product."
                        "Account < $500? Wait until you have a real bankroll."
   - Esto FILTRA — paradójicamente sube conversion (los que se identifican lean in más)

[4] HOW IT WORKS — 3 STEPS
   - Step 1: Buy & receive (.ex5 file + setup PDF)
   - Step 2: Connect to MT5 (8-min video walkthrough)
   - Step 3: Bot runs 24/7 on your VPS or local machine

[5] WHAT'S INCLUDED (oferta stack del A.2)

[6] BACKTEST PROOF
   - Gráfico equity 2020-2026
   - Stats table: Profit Factor, Sharpe, Max DD, Win Rate
   - Botón "Download full backtest PDF" (lead magnet sutil — pide email)

[7] TESTIMONIALS / SOCIAL PROOF
   - 3-5 video testimonials (priorizá video sobre texto)
   - Si no tenés videos: text testimonials con foto + nombre + handle de IG/Twitter
   - Si no tenés ninguno: Founders Story + "Beta testers" callout (8 traders están corriéndolo, results inside Telegram)

[8] FAQ (las objeciones literales de los avatares)
   - "What if the market changes?"
   - "Do I need coding knowledge?"
   - "What broker do I need?"
   - "Minimum capital?"
   - "What's the drawdown?"
   - "Can I get a refund?"
   - "Is this a signals service?" (no, es el bot completo)

[9] FINAL CTA + URGENCIA REAL
   - "Price goes from $147 → $197 on [fecha real]. Lifetime access until then."
   - Botón grande
   - Disclaimer regulatorio (riesgo de trading, etc.) — protege tu negocio

[10] FOOTER — Risk disclosure completo, Terms, Privacy, Refund policy
```

#### B.3 — Tracking obligatorio en LP
- Meta Pixel base + eventos: `ViewContent`, `InitiateCheckout` (al click al botón), `Lead` (al submit del PDF download), `Purchase` (vía Whop webhook → Conversions API server-side)
- Google Analytics 4 (gratis, da insights complementarios)
- Hotjar o Microsoft Clarity (gratis) — graba sesiones, ves dónde la gente abandona

#### B.4 — La trampa a evitar
**No** sobre-diseñes la LP. Mobile, rápida, scannable. Texto > imagen. La LP actual ya tiene las 10 secciones — el foco ahora es llenar los placeholders (MyFXBook, testimonios, video del bot).

---

### C) Tráfico pagado — arquitectura de campañas Meta

#### C.1 — Pre-flight (semana 1, antes de gastar $1)
1. Verificar **Meta Business Manager** y solicitar **categoría especial: "Financial products and services"** (sin esto, las ads se rechazan masivo).
2. Configurar **Conversions API** server-side (vía Whop webhook → tu server → Meta CAPI). Esto es no negociable post-iOS 14.5 — sin CAPI tu signal está roto.
3. Crear el **Pixel** y dispararlo en LP + Whop (Whop permite custom code en checkout).
4. Crear **2 ad accounts** desde el principio. Si Meta te baja uno (alta probabilidad en finanzas), tenés backup.
5. Audiencia retargeting: "Visitantes de LP últimos 30 días que no compraron".
6. Audiencia lookalike: empezar vacía, llenar a la 4ta semana cuando tengas ≥100 compradores.

#### C.2 — Estructura de campañas (3 campañas paralelas desde semana 3)

##### Campaign 1 — Cold Sales (Conversion → Purchase)
- **Avatares:** trader_intermedio, trader_agotado (los que YA saben qué es un bot)
- **Budget:** $30/día por adset, 2 adsets paralelos = $60/día
- **Adsets:**
  - Adset A: Interest stack — Forex Trading + MetaTrader 5 + XAUUSD + Algorithmic trading
  - Adset B: Interest stack — Day Trading + Trading psychology + Forex automation
- **Creatives por adset:** 4-6 ads simultáneos (rotación + Meta optimiza)
- **Formatos a testear** (en este orden):
  - Video UGC-style 15-30s (selfie de trader frustrado → solución)
  - Static stat card (resultado del backtest, neon green)
  - Split screen "Manual vs Bot" (typical Jess Trading)
  - Carousel de 4 slides (problem → agitate → solve → CTA)
  - Testimonial card (cuando tengas testimonios reales)
- **Objetivo:** Purchase event
- **Optimization:** Lowest cost, después Cost Cap a $50 cuando tengas 50+ compras

##### Campaign 2 — Cold Lead Generation (Conversion → Lead)
- **Avatares:** trader_principiante, inversor_pasivo, emprendedor_digital
- **Lead magnet:** PDF "5 Reasons Manual Traders Lose Money on Gold (And the Mathematical Fix)"
- **Budget:** $20/día
- **Flujo:** ad → LP simple con email capture → PDF entregado por email → secuencia de 5 emails
- **Por qué este flujo:** estos avatares no compran a los 3 minutos. El email los marina y los devuelve.
- **Email sequence (5 emails en 7 días):**
  1. Día 0: PDF entregado + bienvenida
  2. Día 1: "Why I built this bot (founder story)"
  3. Día 3: "The 3 mistakes that killed my first $1k account"
  4. Día 5: Caso real / testimonial / equity curve update
  5. Día 7: Soft offer ($147, link a LP de venta)

##### Campaign 3 — Retargeting Warm
- **Audiencia:** LP visitors últimos 14 días que NO compraron + email subscribers que abrieron pero no clickearon offer
- **Budget:** $15/día
- **Creatives diferentes a los de Cold:**
  - Objection-handling ads (cada ad ataca 1 FAQ)
  - Urgencia: "Price goes to $197 on [fecha]"
  - Founder story video corto
  - Reviews/testimonios stack
- **CTA:** directo a LP con coupon code (`COMEBACK10` o similar — solo $10 off pero psicológicamente potente)

#### C.3 — Creative briefs específicos para Concept Ads tool (las 12 primeras ads)

Concretamente, estas son las primeras 12 conceptos que mandarías a generar (cada uno con 2 imágenes para A/B):

| # | Avatar | Format | Hook | Angle |
|---|--------|--------|------|-------|
| 1 | trader_intermedio | bold_billboard | "Your strategy doesn't fail. Your execution does." | Aspiration / consistency |
| 2 | trader_intermedio | before_after | "Before: 47% winrate, missing entries. After: 47% winrate, every entry taken." | Same strategy, perfect execution |
| 3 | trader_agotado | ugc_testimonial | "I was glued to charts for 9 hours a day. Now the bot runs while I'm at the gym." | Time freedom |
| 4 | trader_agotado | stat_infographic | "8 trades closed last week. I was asleep for 6 of them." | Passive automation |
| 5 | trader_principiante | problem_callout | "You don't need to understand the market. The bot does." | Permission to start |
| 6 | inversor_pasivo | trust_builder | "Verified on MyFXBook. Live account. $5,000 → $7,340 in 6 months." | Verifiable proof |
| 7 | inversor_pasivo | listicle_benefits | "5 things this bot does that you can't: never sleeps, never panics, never overrides its rules, never sizes wrong, never breaks discipline." | Bot vs human limitations |
| 8 | emprendedor_digital | authority_expert | "$147 once. Lifetime. Like SaaS for your capital." | Aligned with their mental model |
| 9 | trader_intermedio | curiosity_gap | "The 1 line of code that handles XAUUSD's $4,000 volatility spike." | Curiosity / technical credibility |
| 10 | trader_agotado | pas_framework | "Pain: lost $400 yesterday because you stepped away for coffee. Agitate: this happens 3x a week. Solve: bot doesn't drink coffee." | PAS classic |
| 11 | inversor_pasivo | offer_promotion | "Lifetime license. $147. Goes to $197 in [X] days." | Urgency + simplicity |
| 12 | trader_intermedio | social_proof_stack | "8 traders in our private Telegram. Combined +$23k last month." | Community + results |

Generás esto en una sola corrida con `concept_ads`. Cada uno con 2 imágenes = 24 creatives totales para arrancar.

#### C.4 — Reglas de optimización (cuándo matar / escalar / pivotar)
- **Mata el adset** si después de **$50 spend** y **<1 purchase** + CTR <0.8%
- **Escalá el adset** (incremento del 20% del budget cada 2 días) si CPA está por debajo del target ($50) y ROAS >2x
- **Cambia creative** si CTR es bueno (>1.5%) pero conversion en LP es <1% (es problema de LP, no de ad)
- **Cambia audience** si CTR es <0.8% y CPM es >$30 (ad no resuena con esa audiencia)
- **Nunca pauses los ganadores** — paral los perdedores rápido, dejá que los ganadores corran

---

### D) Contenido orgánico — su nuevo rol

El contenido orgánico que ya estás corriendo (Scout, 7 posts/semana) **no cambia**, pero su rol estratégico se redefine:

#### D.1 — Funciones del orgánico en el sistema completo
1. **Social proof para tráfico pagado.** Cuando alguien clickea un ad y duda, abre tu Instagram. Si ven contenido constante, premium, con engagement → converción +30-50%.
2. **Retargeting natural.** Los visitantes de LP que te empiezan a seguir orgánicamente terminan comprando 7-30 días después.
3. **Source de UGC y testimonios.** Los comentarios y DMs de IG son tu mejor research de objeciones.
4. **Reducción del CAC a largo plazo.** Account con 5k+ followers + engagement reduce CAC porque la audiencia está pre-warmed.

#### D.2 — Cambios concretos al orgánico
- **Post 7 (CTA semanal)**: cambialo de "follow @jesstrading" o link bio a "**comment 'BOT' to get the link**" — DMs automáticas convierten 4-8x mejor que clicks de link in bio.
- **Reels prioritarios**: 3 reels/semana. Aumentá el budget de tiempo en reels — son el mejor surface de descubrimiento en 2026. Convertí 2 de los 7 carruseles en Reels (Scout te genera el script si le agregás categoría "Reel").
- **Stories diarias**: 3-5 stories/día con: trade ejecutado en vivo (con disclaimer), screenshot del MyFXBook, FAQ, polls. Stories es el surface de **conversión** del orgánico. Linkear Whop desde stories cuando tengas >10k followers.
- **Pin posts en perfil**: 3 posts pinned permanentes — (1) hero post con resultado, (2) FAQ del bot, (3) testimonial.

#### D.3 — Coordinación orgánico ↔ pagado
Cada semana:
- Mirá qué post orgánico tuvo MÁS engagement (saves + shares > likes).
- Tomá el caption + visual y convertilo en ad pagada (Boost o creative nuevo).
- Esto es el "winner pipeline" — los winners orgánicos suelen ser winners pagados.

#### D.4 — Carousels Tool (Fase 1 del todo.md)
Esto sigue siendo prioridad **media-alta** pero NO es el cuello de botella para $10k. Es escalabilidad de orgánico. Construilo en paralelo, **no antes** de levantar la LP y las primeras campañas.

---

## 4. Sistema de medición — el dashboard que te dice si vas

### KPIs primarios (semana a semana)
| KPI | Target semana 4 | Target semana 8 | Target semana 12 |
|-----|-----------------|-----------------|------------------|
| Visitas LP/día | 100 | 300 | 500 |
| LP conversion rate | 1.5% | 2.5% | 3.5% |
| CPA (cold) | $80 | $55 | $40 |
| ROAS (cold) | 1.8x | 2.7x | 3.5x |
| Email subscribers | 100 | 500 | 1500 |
| Email → sale conversion | 2% | 4% | 6% |
| Ventas/mes | 12 | 40 | 70+ |
| Revenue/mes | $1,764 | $5,880 | $10,290 |

### KPIs secundarios (monitor pero no obsesionarse)
- Followers IG, engagement rate, save rate
- Affiliate signups y ventas vía afiliado
- Refund rate (mantener <15%)
- Average session duration en LP (>40 seg = bueno)

### Dashboard mínimo viable
- Sheet de Google con: spend daily, purchases daily, CPA daily, revenue daily.
- Meta Ads Manager para campaign-level deepdive.
- Whop dashboard para purchases reales (single source of truth).
- Hotjar para qualitative LP insights.

### When to pivot (señales de problema)
- **Semana 4 sin 5 ventas pagadas:** problema de LP (no de ads). Volvé al copy de la LP.
- **CTR alto + CPA alto:** los ads convencen pero la LP no cierra. Mismo problema.
- **CPA bajo pero refund rate >25%:** el ad/LP está sobre-prometiendo. Bajar el tono.
- **Cuenta de Meta restringida:** tener backup ad account listo desde día 1, switch en horas.

---

## 5. Roadmap 90 días (semana por semana)

### Semana 1 (29 abr → 5 may) — INFRAESTRUCTURA ✅ casi completa
**Objetivo:** Tener el sistema técnico listo. Cero ads aún.

- [x] Comprar dominio `jesstrading.xyz`
- [x] LP en Next.js deployada en Vercel — live en `https://jesstrading.xyz`
- [x] Meta Business Manager + Pixel `1927145034653778` + CAPI
- [x] Verificar dominio en Meta (DNS TXT agregado, propagando)
- [x] Whop webhook → Meta CAPI Purchase event — live y testeado
- [ ] **MailerLite** — crear cuenta gratis + pasar API token a Claude para armar el form de email capture en LP
- [ ] Configurar MyFXBook tracker en cuenta real (poner $1k mínimo, dejar correr)
- [ ] Crear backup ad account #2 (bloqueado por Meta ~semana 4)

### Semana 2 (6 may → 12 may) — CONTENIDO DE PROOF
**Objetivo:** Generar todo el material que la LP necesita.

- [ ] Grabar 3-5 videos cortos del bot ejecutando trades en MT5
- [ ] Generar el backtest PDF (5 años XAUUSD, 1 página)
- [ ] Tomar screenshots premium del bot + MetaTrader interface (esto va en `brand/product-images/`)
- [ ] Pedir testimonios a los primeros 5-8 usuarios (ofrecer descuento o copia gratis si necesario)
- [ ] Si no hay usuarios: hacerte vos un "founder story" de 60 segundos a cámara
- [ ] Crear el lead magnet PDF: "5 Reasons Manual Traders Lose Money on Gold (And the Mathematical Fix)" — 8-10 páginas

### Semana 3 (13 may → 19 may) — LANDING + EMAIL SEQUENCE
**Objetivo:** LP lista, email sequence escrita, todo testeado.

- [ ] Construir LP completa (estructura sección 3.B.2)
- [ ] Conectar Pixel en LP, testear con Meta Pixel Helper
- [ ] Conectar Whop con tracking parameter
- [ ] Escribir 5-email nurture sequence + setup en MailerLite
- [ ] Test end-to-end: ad → LP → checkout → email → received product
- [ ] Mobile UX review (la mayoría del tráfico va a ser mobile)
- [ ] Speed test: LP debe cargar en <2 seg en mobile 4G

### Semana 4 (20 may → 26 may) — PRIMER LAUNCH (CONTROL)
**Objetivo:** Lanzar ads pequeñas, recolectar primer data.

- [ ] Generar primeras 24 creatives via concept_ads (la tabla 3.C.3)
- [ ] Lanzar Campaign 1 (Cold Sales) con $30/día — 1 adset, 4 creatives
- [ ] Lanzar Campaign 2 (Lead Gen) con $20/día — 1 adset, 4 creatives
- [ ] **Total spend semana 4: ~$350**
- [ ] Daily check: CTR, CPC, CPA, conversion rate
- [ ] **Hito éxito:** ≥3 ventas en la semana

### Semana 5-6 (27 may → 9 jun) — TUNING
- [ ] Pausar perdedores, escalar ganadores 20% cada 2 días
- [ ] Generar 12 creatives nuevos basados en lo que funcionó
- [ ] Activar Campaign 3 (Retargeting) cuando tengas ≥500 visitantes LP
- [ ] Iterar copy de LP basado en Hotjar/feedback
- [ ] **Hito:** 10+ ventas/semana, ROAS >2x

### Semana 7-8 (10 jun → 23 jun) — ESCALADO MEDIO
- [ ] Subir budget total a ~$120/día
- [ ] Lanzar 4-6 nuevos creatives por semana
- [ ] Empezar campaña Lookalike (1% LAL desde compradores)
- [ ] Activar programa de afiliados activo: outreach a 20 micro-influencers de trading
- [ ] **Hito:** 25+ ventas/semana

### Semana 9-12 (24 jun → 21 jul) — ESCALADO PESADO
- [ ] Budget total ~$200/día
- [ ] 3 campañas paralelas full-throttle
- [ ] Pivotar precio: aumentar a $197 cuando llegues a 100 ventas totales (urgencia real para los rezagados)
- [ ] Lanzar bundle premium $297 (con onboarding 1:1)
- [ ] Carousels Tool empieza a deployar contenido orgánico automatizado
- [ ] **Hito final:** $10k+ revenue mes 3 (mes calendario completo)

---

## 6. Riesgos específicos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Cuenta Meta restringida por contenido financiero | **Alta** | 2 ad accounts desde día 1, copy sin "guaranteed/easy money", Special Ad Category activado |
| Whop no soporta custom Pixel/CAPI suficiente | Media | Confirmar pre-launch, tener fallback de checkout en Stripe directo si necesario |
| Refund rate >25% (regulatorio + insatisfacción) | Media | LP honesta, no sobre-prometer, soporte rápido en Telegram las primeras 48h post-compra |
| MyFXBook tracker se ve mal (drawdown agudo) | Media | No empezar el tracker hasta tener 1 mes de data. Si pasa: comunicar abierto, mostrar recovery |
| Saturación de creative (CPA sube semana 6+) | Alta | Pipeline de 12+ creatives nuevos cada semana via concept_ads |
| Avatares cold no convierten (lead → sale <2%) | Media | Tener email seq listo para iterar, A/B test subject lines, tighten lead magnet promise |
| Founder burnout (sos solo) | Alta | Automatizar Scout + Carousels + emails. NO escalar manualmente. Cuando 70 ventas/mes esté validado, contratar VA part-time |
| Refund spike después de launch ads agresivas | Media | Filtrar audiencias (excluir <22 años, excluir países de baja calidad de tráfico) |
| Competidor copia tu LP / ads | Baja-Media | Tu MyFXBook tracker público es el moat. Lo que importa es la prueba viva, no el copy |

---

## 7. Anexos accionables

### Anexo A — Email sequence de 5 emails (drafts iniciales)

**Email 1 — Día 0 — Bienvenida + entrega**
```
Subject: Your free guide is here (+ a confession)

Hey [first name],

Here's your guide: [link]

Now for the confession.

I built this guide for one reason: most XAUUSD traders are losing money for the SAME reason — and it has nothing to do with the strategy.

Read it. If by page 3 you don't see yourself in there, delete this email and the guide. Won't waste your time.

If you do see yourself — reply and tell me which mistake hit hardest. I read every reply.

— Jess
```

**Email 2 — Día 1 — Founder story**
```
Subject: I lost $4,000 the day I "fixed" my strategy

True story.

[Founder narrative: el momento del trader_intermedio cuando saboteás tu propio sistema, y cómo eso te llevó a construir el bot]

— Jess
```

**Email 3 — Día 3 — Educación / objection handling**
```
Subject: "But the bot won't understand context"

This is the #1 thing people tell me about algo bots.

Here's the thing — it's true. The bot doesn't understand context.

But neither does your emotional state at 11 PM after 3 losing trades.

[Reframe: la "context understanding" no es la edge; consistency es la edge.]

— Jess
```

**Email 4 — Día 5 — Social proof / equity curve**
```
Subject: 47 days ago vs today

Quick update — here's what the bot did over the last 47 days on a real $5,000 account:

[Embed equity curve image]

— Jess
P.S. You can verify this live on MyFXBook here: [link]
```

**Email 5 — Día 7 — Soft offer**
```
Subject: This is the only email I'll send you about price

[first name], here's the deal.

The bot is $147 right now. In ~30 days it goes to $197 — and stays there.

Lifetime access. One-time payment. 14-day refund window.

If the math in the guide made sense to you, this is the moment.

[CTA button]

If now isn't the right time, no hard feelings — I'll keep sending you free content. But I won't email you about price again.

— Jess
```

### Anexo B — FAQ exacto para LP (con respuestas)

```
Q: Will the bot work if the market changes?
A: The strategy was backtested across 2020 (Covid crash), 2022 (rate hikes), 2024-2025 (XAUUSD record highs). It uses adaptive position sizing, not fixed levels. See the 5-year backtest here: [link].

Q: Do I need coding knowledge?
A: No. Drop the .ex5 file in your MT5 folder, attach to a XAUUSD chart. The 8-minute video walks you through it.

Q: What broker do I need?
A: Any broker that allows MT5 + EAs and has XAUUSD (gold) with reasonable spreads. Recommended brokers list inside the buyer area.

Q: Minimum capital?
A: $500 minimum. Optimal is $2,000+. The "Risk Calibration Sheet" bonus shows you exactly what to set per account size.

Q: What's the drawdown?
A: Max historical drawdown is 14.2% (5-year backtest). Live performance: see the MyFXBook tracker linked in the LP.

Q: Can I get a refund?
A: Yes — 14 days, no questions asked. Refund button inside Whop.

Q: Is this signals or a bot?
A: Bot. It executes trades automatically on your account. No signals to copy manually.

Q: What if I have multiple accounts?
A: One license = one MT5 instance. If you need more, contact support — extra licenses are 50% off.

Q: How is this different from other bots?
A: Built for XAUUSD specifically (most bots are forex-generic). Lifetime payment vs subscription. Live verifiable tracker vs cherry-picked backtests. 40% affiliate commission means real results spread word-of-mouth.

Q: Will Jess Trading still be around in 5 years?
A: I'm a solo founder. The product is the .ex5 file you download — it's yours forever even if the company doesn't exist. Updates are pushed via the private Telegram (currently 8 traders, growing).
```

### Anexo C — Lead magnet (estructura del PDF)

**"5 Reasons Manual Traders Lose Money on Gold (And the Mathematical Fix)"**

Pages outline:
1. Cover + Disclaimer
2. The XAUUSD volatility problem (data, real spike charts)
3. Reason #1: Fatigue degrades execution accuracy after 4h (cite study, ICUE 2024 if real)
4. Reason #2: The "moved-stop" pattern (your own data, anonymized)
5. Reason #3: Position sizing inconsistency
6. Reason #4: Weekend-news trades kill returns
7. Reason #5: The cost of "discretion"
8. The mathematical fix — rule-based execution
9. The economics of automation: $147 vs hours saved
10. Who I am + soft CTA to bot

8-10 páginas, formato premium (cohesionado con el brand DNA), entregado por email.

### Anexo D — Affiliate outreach template (para semana 7+)

```
Subject: Your audience trades XAUUSD — interested in 40% commission?

Hi [name],

Watched your video on [specific topic]. The point about [insert specific takeaway from their content] was sharp.

I built a bot for XAUUSD that's been running live since [date]. $147 lifetime, no subscription. Live MyFXBook tracker here: [link]

Affiliate program is 40% — that's $58.80 per sale. Custom landing page with your name/branding if you want it.

Not asking for a "pitch session" — here's the affiliate signup link if you want to plug in: [link]
And here's the bot if you want to try it for review: [discount code, full price refunded]

Either way, props on the [video/post/whatever].

— Jess
```

---

## 8. Lo que NO hay que hacer (para no distraerse del path crítico)

- **No** agregar productos nuevos en los próximos 90 días. Vendé el bot. Validá el funnel.
- **No** construir copytrading / Learn Platform / etc. hasta tener $10k validado.
- **No** entrar en YouTube long-form todavía — es 1 año de runway. Reels primero.
- **No** intentar competir con cuentas de "millonarios trading" en estética. Tu edge es **transparencia + premium fintech**, no flex.
- **No** correr discounts agresivos. Mantené $147 firme. La urgencia es "$147 → $197 en X días" no "50% off!!".
- **No** discutir con haters en comments. Bloqueá rápido, mantené el feed limpio.
- **No** publicar resultados que no podés sostener. Si el bot tiene una semana mala, mostrala — la transparencia ES tu marketing.

---

## 9. El primer dominó — qué hacer mañana 30 abr

Ordenado por impacto/esfuerzo:

1. ~~Comprar el dominio~~ ✅ `jesstrading.xyz`
2. ~~Setup Meta BM + Pixel + CAPI + Whop webhook~~ ✅
3. **Empezar MyFXBook tracker** con cuenta real $1k+ — 30 min de setup, 30 días de wait. **Próximo paso urgente.**
4. **Crear cuenta MailerLite** (gratis) + pasar API token para que Claude arme el form de email capture en LP — 10 min.
5. **Bookear 3h del fin de semana** para grabar los videos del bot ejecutando trades en MT5.
6. **Reach out a tus primeros 5 buyers** pidiendo testimonio — ofrecé $30 refund o feature en IG a cambio.

Si en 7 días tenés ✓ dominio ✓ MyFXBook corriendo ✓ Meta BM aprobado ✓ 5 testimonios solicitados, vas en camino.

Si una semana después de hoy no hiciste eso — el problema no es la estrategia, es la ejecución. Y ahí volvemos al brand DNA del bot: *strategy on paper vs. execution in real time*.

---

**Recap de la tesis en una línea:**
> Construí la conversión primero (LP + tracking + proof), después gastá en ads. Sin LP propia y MyFXBook público, todo dólar de Meta es un dólar tirado.
