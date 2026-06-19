# Campaña 1 — Cold Sales (Meta) · Jess Trading Bot

> **Tu primera campaña. Leéla entera una vez antes de tocar Meta.** No es un instructivo para apretar botones — es para que entiendas *por qué* cada cosa está donde está. Si entendés el porqué, después podés iterar solo.

---

## 0. TL;DR — qué vamos a hacer y por qué

Una sola campaña, un solo conjunto de anuncios (ad set), 6 creatives, **$30/día**, dirigida a traders de habla inglesa en países de alto poder adquisitivo, optimizada para **compras**, llevando tráfico frío a la landing → checkout de Whop.

**El objetivo real de la semana 1 NO es ganar plata. Es:**
1. Que Meta apruebe los anuncios y no te banee la cuenta (nicho financiero = vigilado).
2. Que el píxel empiece a juntar data de conversión.
3. Descubrir qué creative engancha (CTR) y si la landing convierte.
4. Idealmente, 1-3 ventas que prueben que el embudo funciona.

La rentabilidad llega **después** de iterar (semanas 2-4) y cuando vuelva la prueba social (MyFXBook, reviews). Quien espera ROAS positivo el día 1 con tráfico frío y sin prueba social, se frustra y apaga todo antes de tiempo. Eso es tirar plata. **El gasto de la semana 1 es matrícula, y se mide contra esos 4 hitos, no contra ventas.**

---

## 1. La matemática honesta (para que no te asustes ni te ilusiones de más)

```
Presupuesto:  $30/día × 7 = $210/semana
Producto:     $147 (neto ~$135 después de fee de Whop)

Para empatar en la primera venta: CPA < $147
Punto de equilibrio semanal:      ~1,4 ventas ($210 / $147)
```

| Escenario semana 1 | Ventas | CPA | Lectura |
|--------------------|--------|-----|---------|
| Malo | 0 | — | Normal si el creative o la oferta no enganchan. Hay que iterar. |
| Esperable | 1-2 | $100-210 | El embudo funciona pero todavía no es rentable. Bien para empezar. |
| Bueno | 3+ | <$70 | El embudo convierte. Acá empezás a escalar. |

**Realidad sin endulzar:** tráfico frío + producto financiero de $147 + **cero prueba social hoy** (escondimos backtest y MyFXBook hasta tener data real) = la conversión directa va a ser baja al principio. Es esperable. Por eso la sección 14 (roadmap) es tan importante: el motor de ventas real de las próximas semanas no es solo esta campaña, es **lead-gen + nurture + retargeting + prueba social volviendo**.

> Plata de aprendizaje realista hasta tener el embudo afinado: **$300-600 en 2-3 semanas.** Si no estás listo para eso, mejor saberlo ahora.

---

## 2. El embudo completo (dónde encaja esta campaña)

```
   ┌───────────────────────────────────────────────────────────┐
   │  CAMPAÑA 1 (esta) — Cold → Venta directa                   │
   │                                                            │
   │  Anuncio Meta ──► Landing (jesstrading.xyz) ──► Whop $147   │
   │       │                    │                               │
   │       │                    └──► no compra ──► (retargeting,│
   │       │                                        Campaña 3)  │
   │       └──► Píxel: ViewContent, InitiateCheckout, Purchase  │
   └───────────────────────────────────────────────────────────┘

   ┌───────────────────────────────────────────────────────────┐
   │  CAMPAÑA 2 (semana 2) — Cold → Lead → Nurture              │
   │  Anuncio ──► Landing (guía gratis) ──► email ──► 5 mails   │
   │                                          ──► venta $147    │
   └───────────────────────────────────────────────────────────┘
```

Esta Campaña 1 hace dos cosas: intenta vender directo **y** llena el píxel/audiencias para el retargeting (Campaña 3). Aunque venda poco al principio, está construyendo el activo.

---

## 3. La decisión clave: objetivo y evento de optimización

**Objetivo de campaña: `Ventas` (Sales).**
Es el único objetivo que le dice a Meta "buscame gente que compre". Los otros (Tráfico, Interacción) traen clics baratos que no compran.

**Evento de optimización: `Compra` (Purchase).**
El píxel ya dispara Purchase server-side (lo verificaste). Queremos que Meta optimice hacia el evento que nos importa y aprender tu CPA real.

### ⚠️ El tradeoff que tenés que entender (acá se equivocan todos los principiantes)

Meta optimiza mejor cuando un ad set junta **~50 conversiones por semana**. Con $30/día y un producto de $147 vas a estar MUY lejos de 50 compras/semana → el ad set va a quedar en *"Learning Limited"* (aprendizaje limitado). **Eso es esperado y no es un error.** Simplemente Meta no tiene volumen para optimizar fino.

Dos formas de manejarlo:

- **Si podés estirar a $40-50/día:** dale. Una campaña de Compra con $40-50/día tiene chance real de optimizar. Es la diferencia más impactante que podés hacer.
- **Si $30/día es el techo:** dejalo en Compra igual para aprender tu CPA real, pero seguí la **regla de rescate** de abajo.

> **Regla de rescate:** si después de **~$150 de gasto** tenés 0 compras PERO sí tenés clics buenos (CTR >1%), visitas a la landing y algún *Initiate Checkout* → cambiá el evento de optimización a **`Initiate Checkout`** (pasa más seguido → más señal para Meta), o encendé la Campaña 2 (lead-gen, leads baratos). No sigas quemando en Purchase sin señal.

---

## 4. A quién le hablamos (targeting) y por qué

### Geografía — **US, Reino Unido, Canadá, Australia** (Tier-1 inglés)
Por qué: un producto de **$147 USD** necesita compradores con poder adquisitivo en dólares y costumbre de pagar con tarjeta online. Los CPM son más caros que en países baratos, pero **pagás por calidad de comprador, no por volumen de clics**. El tráfico barato de países de bajos ingresos llena de curiosos que no pagan $147 y sube el riesgo de reembolsos. Para una campaña de Compra, calidad > volumen.
(Más adelante podés sumar Nueva Zelanda, Irlanda, Singapur si querés más alcance.)

### Edad — **25 a 55**
Por qué: traders con capital propio y poder de decisión. Excluimos <25 para bajar curiosos sin tarjeta/refunds. >55 raramente adopta bots de MT5.

### Género — **Todos**
El público de trading skewea fuertemente a hombres; el algoritmo lo va a notar solo. No lo restrinjas a mano (limita el aprendizaje).

### Audiencia — **Advantage+ Audience con una semilla de intereses**
En 2024+ Meta funciona mejor con audiencia amplia + el creative haciendo de filtro, que con stacks de intereses ultra-finos. Pero como tu píxel es nuevo y no tiene historial, le damos una **semilla** para que arranque en la dirección correcta:

> Intereses semilla: *Forex, MetaTrader 4/5, Trading de divisas, Oro (XAUUSD), Day trading, Análisis técnico, Trading algorítmico, MQL5, Expert Advisor, Trading psychology.*

Meta va a usar eso como punto de partida y después expande hacia quien realmente convierte.

---

## 5. Los avatares: dolor → solución (esto es lo que cada anuncio ataca)

| Avatar | Su dolor real | Qué siente | La solución que le damos |
|--------|---------------|-----------|--------------------------|
| **Trader intermedio** | Sabe la estrategia pero rompe sus propias reglas | "Sé qué hacer y aun así me saboteo" | Ejecución mecánica: el bot sigue las reglas que él no sostiene |
| **Trader agotado** | Vive pegado a la pantalla, quemado | "Estoy todo el día mirando gráficos, no tengo vida" | Automatización 24/7: deja de babysittear el mercado |
| **Trader principiante** | No confía en sí mismo, pierde | "No entiendo lo suficiente, sigo perdiendo" | Un sistema transparente que no depende de su pericia |
| **Inversor pasivo** | Tiene capital, no tiempo de aprender | "Quiero entrar pero no voy a aprender gráficos" | Plug-and-play: setup de 8 min, corre solo |
| **Emprendedor digital** | Piensa en ROI/activos, no hobbies | "Quiero un activo, pago una vez" | $147 one-time, como SaaS para tu capital |

Cada uno de los 6 anuncios de abajo le pega a uno o dos de estos.

---

## 6. Los 6 anuncios — creative + copy listo para pegar

**Reglas de copy (compliance de Meta para nicho financiero):**
- ❌ Prohibido: "guaranteed", "risk-free", "make money", "passive income", "get rich", promesas de % de ganancia.
- ✅ Usamos: "automate", "rule-based", "removes emotional execution", "lifetime", "refund".
- ✅ Disclaimer de riesgo al final de cada uno (lo exige Meta y baja el rechazo).
- **Special Ad Category = None** (es software, no crédito/vivienda/empleo).

**URL de destino (todas):** `https://jesstrading.xyz`
**Parámetros de URL (pegar una vez a nivel campaña, sección "Tracking" → "URL parameters"):**
```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```
Así en Whop/analytics ves qué anuncio trajo cada visita.

---

### ▸ Ad 1 — `anti-hype` (gancho honesto / pattern interrupt)
**Imagen:** `outputs/static_ads/46-anti-hype-honest/anti-hype-honest_v1.png`
**Avatar:** intermedio + agotado · **Por qué:** todo el nicho promete riqueza; el que dice "no te voy a hacer rico" frena el scroll y genera confianza inmediata.

**Primary text:**
```
Every trading bot promises to make you rich. This one won't.

What it does: it runs your breakout strategy 24/7 and removes the trades you shouldn't take — the revenge entry, the widened stop, the 3am "just this once."

It's not magic. It's the discipline you can't always hold yourself. Range breakout automation for MetaTrader 5 — XAUUSD + 4 major forex pairs. $147 once, lifetime. 14-day refund.

Trading involves risk. Past performance does not guarantee future results.
```
**Headline:** `The honest trading bot — $147 once`
**Description:** `Range breakout automation for MT5`
**CTA button:** `Learn More`

---

### ▸ Ad 2 — `us-vs-them` (problema/solución)
**Imagen:** `outputs/static_ads/07-us-vs-them/us-vs-them_v2.png`
**Avatar:** agotado · **Por qué:** nombra el dolor (trading manual emocional) y ofrece el contraste exacto.

**Primary text:**
```
Manual trading vs. the bot:

You — emotional decisions, can't watch the charts 24/7, break your own rules.
The bot — 100% rule-based, runs nonstop, follows the plan every single time.

You already know the strategy. You just can't execute it like a machine at 11pm after two losses. So let the machine do it.

Range breakout bot for MetaTrader 5. $147 once, lifetime license, 14-day refund.

Trading involves risk. Past performance does not guarantee future results.
```
**Headline:** `Stop being the weak link in your strategy`
**Description:** `Rule-based execution, 24/7`
**CTA button:** `Learn More`

---

### ▸ Ad 3 — `how-it-works` (educación / transparencia)
**Imagen:** `outputs/static_ads/44-how-it-works/how-it-works_v1.png`
**Avatar:** principiante + intermedio · **Por qué:** los traders desconfían de las cajas negras; mostrar el mecanismo genera confianza.

**Primary text:**
```
How the bot actually works (no black box):

1. It records the daily range during set session hours.
2. Places a buy stop above and a sell stop below.
3. When price breaks out, one triggers and the other cancels.

All positions close at the session end. You see exactly what it does and why — that's the point. Works on XAUUSD + 4 major forex pairs, settings included.

$147 once. 14-day refund. Trading involves risk; past performance does not guarantee future results.
```
**Headline:** `See exactly how it trades`
**Description:** `Transparent range breakout system`
**CTA button:** `Learn More`

---

### ▸ Ad 4 — `multi-pair` (diferenciador / valor)
**Imagen:** `outputs/static_ads/42-multi-pair/multi-pair_v1.png`
**Avatar:** intermedio · **Por qué:** la mayoría de los bots son solo-oro o genéricos; 5 pares por un pago es valor concreto.

**Primary text:**
```
Not just gold.

The same range breakout system runs on 5 markets — XAUUSD, EURUSD, GBPUSD, USDJPY and EURJPY — each with pre-configured settings included in the guide.

One bot, one $147 payment, five pairs. No subscription. Set it on MetaTrader 5 and it trades the breakout while you sleep.

14-day refund. Trading involves risk; past performance does not guarantee future results.
```
**Headline:** `5 markets. One breakout system.`
**Description:** `$147 lifetime, no subscription`
**CTA button:** `Learn More`

---

### ▸ Ad 5 — `benefit-checklist` (respuesta directa / cierre)
**Imagen:** `outputs/static_ads/27-benefit-checklist/benefit-checklist_v1.png`
**Avatar:** amplio (principiante + inversor pasivo) · **Por qué:** lista escaneable + CTA + precio = anuncio de conversión clásico.

**Primary text:**
```
Built for traders who want a system, not stress:

✓ Trades XAUUSD + 4 forex pairs automatically
✓ No coding or experience needed
✓ One-time $147 — lifetime, no subscription
✓ Setup video + guide included (~8 minutes)

It risks a fixed 1% per trade by default and follows the rules you can't always follow yourself. 14-day refund if it's not for you.

Trading involves risk. Past performance does not guarantee future results.
```
**Headline:** `Automate your breakout strategy — $147`
**Description:** `Setup in 8 minutes, no coding`
**CTA button:** `Get Offer`

---

### ▸ Ad 6 — `promo-urgency` (urgencia / oferta)
**Imagen:** `outputs/static_ads/37-promo-discount/promo-discount_v2.png`
**Avatar:** amplio (el que duda) · **Por qué:** la urgencia real ($147→$197 el 1 julio) empuja a actuar al indeciso.

**Primary text:**
```
Launch price ends July 1.

The range breakout bot is $147 right now — one-time, lifetime license for 2 MT5 accounts. On July 1 it goes to $197 and stays there.

Trades XAUUSD + 4 major pairs, 24/7, with a fixed 1% risk per trade. 8-minute setup. 14-day refund, no questions.

If you've been on the fence, this is the moment. Trading involves risk; past performance does not guarantee future results.
```
**Headline:** `$147 until July 1 — then $197`
**Description:** `Lifetime license, 14-day refund`
**CTA button:** `Get Offer`

> **Backups** (para rotar cuando una se canse en la semana 2): `21-bold-statement v2` y `04-features-benefits v1`.

---

## 7. Presupuesto, puja y horario

| Parámetro | Valor | Por qué |
|-----------|-------|---------|
| Presupuesto | **$30/día** a nivel ad set (o $40-50 si podés) | Concentrado en un solo ad set para que Meta optimice |
| Tipo de puja | **Highest volume / Lowest cost** (default) | Sin data previa, dejá que Meta busque libre. Nada de cost cap todavía |
| Horario | **Continuo, 24hs** | A $30/día no fragmentes con dayparting; Meta necesita correr para aprender |
| Presupuesto: campaña o ad set | Ad set (ABO) | Con un solo ad set da igual; ABO te da control claro |

---

## 8. Ubicaciones (placements)

**Recomendado para v1: `Manual placements` → solo Feeds.**
- Facebook Feed
- Instagram Feed
- Instagram Explore

**Por qué:** tus creatives son **1:1 y 4:5** (cuadradas/verticales), perfectas para Feed. NO tenés versiones 9:16, así que Stories y Reels las mostrarían con bordes feos y gastarían presupuesto en mal formato. Cuando tengas el video (pitch/hero) hacés un ad set de Reels aparte.
(Si preferís simpleza total, Advantage+ placements funciona, pero a $30/día concentrar en Feed rinde más.)

---

## 9. Nomenclatura (para no perderte después)

```
Campaña:  JT | Cold Sales | Purchase | Launch
Ad set:   Cold | T1-EN | 25-55 | Advantage+
Ads:      anti-hype · us-vs-them · how-it-works · multi-pair · benefit-checklist · promo-urgency
```
Nombrá los ads igual que el `utm_content` para cruzar la data fácil.

---

## 10. Paso a paso en Meta Ads Manager (primera vez)

1. **Ads Manager** → botón verde **`+ Create`**.
2. **Objetivo:** elegí **`Sales`** → Continue.
3. **Special Ad Category:** dejá **`None`** (no marques nada). → nombrá la campaña (ver sección 9).
4. **Advantage Campaign Budget:** dejalo **OFF** para esta primera (control a nivel ad set).
5. Nivel **Ad set:**
   - **Conversion location:** Website.
   - **Performance goal / Optimization event:** `Maximize number of conversions` → evento **`Purchase`**.
   - **Pixel:** seleccioná tu píxel `1927145034653778`.
   - **Budget:** Daily, **$30** (o $40-50).
   - **Audience:** Advantage+ Audience → agregá los intereses semilla (sección 4). Edad 25-55. Ubicaciones US, UK, CA, AU. Idioma: English.
   - **Placements:** Manual → solo los 3 Feeds (sección 8).
6. Nivel **Ads** (repetir 6 veces, uno por creative):
   - **Identity:** tu página de Facebook + Instagram.
   - **Format:** Single image.
   - **Media:** subí la imagen (ruta en sección 6).
   - **Primary text / Headline / Description:** copiá de la sección 6.
   - **CTA button:** el que indica cada ad.
   - **Website URL:** `https://jesstrading.xyz`
   - (Los UTM van a nivel campaña en "URL parameters", o pegalos acá en cada ad.)
7. **Review** → revisá que los 6 ads tengan imagen, copy, CTA y URL.
8. **Publish.** Meta los manda a revisión (puede tardar de minutos a ~24hs). En nicho financiero a veces rebota — si rechaza un ad, leé el motivo y ajustá el copy (casi siempre es una palabra prohibida).

---

## 11. Métricas — qué mirar y qué es bueno/malo

Estas son las que importan, en orden del embudo:

| Métrica | Qué mide | Benchmark | Si está mal... |
|---------|----------|-----------|----------------|
| **CPM** | Costo por 1000 impresiones | $15-40 (Tier-1 trading) | >$50 = audiencia muy chica o creative flageado |
| **CTR (link)** | Si el creative engancha | >1% ok · >1,5% bueno · <0,8% malo | **La señal temprana #1.** Bajo = creative/audiencia |
| **CPC (link)** | Costo por clic al sitio | $0,50-2 | >$3 = audiencia cara o creative débil |
| **Landing Page Views** | Llegaron a la LP | ~80%+ de los clics | Muchos clics, pocas LPV = LP lenta o rebotan |
| **Initiate Checkout** | Clickearon "Get the bot" | — | Mide si la LP convence |
| **Purchase / CPA** | La venta y su costo | CPA <$147 empata; <$70-100 ideal | El número que define todo |
| **ROAS** | Ingreso / gasto | Semana 1 suele <1; apuntá a 1,5x+ | — |

### Diagnóstico rápido (esto es oro, aprendelo)
- **CTR alto + 0 ventas** → el anuncio convence pero **la LP/oferta no cierra**. Problema de landing o de falta de prueba social. (Hoy: te falta MyFXBook/reviews → esperado.)
- **CTR bajo (<0,8%)** → el **creative o la audiencia** no resuenan. Cambiá creative o semilla.
- **CTR alto + CPC alto + CPM alto** → audiencia cara; probá ampliar geo o intereses.
- **Muchas LPV + pocos Initiate Checkout** → la LP no genera deseo/confianza suficiente.
- **Initiate Checkout sí, Purchase no** → fricción en el checkout de Whop o duda final de precio.

---

## 12. Reglas de decisión (cuándo NO tocar, cuándo matar, cuándo escalar)

1. **NO toques nada los primeros 3-4 días / ~$100.** Cada edición reinicia la fase de aprendizaje. El error #1 del principiante es manosear la campaña todos los días. **Set it and leave it.**
2. **Leé la data recién a los ~$100-150 de gasto.** Antes, los números son ruido.
3. **Matar un AD (no el ad set):** si después de ~$50-60 totales un ad tiene CTR <0,6% y cero interacción, pausá *ese ad* y dejá correr los demás.
4. **Escalar:** si un creative gana (buen CTR + ventas a CPA aceptable), subí el presupuesto **20% cada 2-3 días**. Saltos grandes reinician el aprendizaje.
5. **Si 0 ventas a $150-200 pero buen CTR + LPV + checkouts** → aplicá la *regla de rescate* (sección 3): cambiá a optimizar `Initiate Checkout` o encendé la Campaña 2.
6. **Nunca pauses al ganador.** Pausá perdedores rápido; dejá correr a los que funcionan.

---

## 13. Planilla de seguimiento diaria (registrá esto cada día)

Hacé una Google Sheet con estas columnas. 2 minutos por día:

```
Fecha | Gasto | Impresiones | CPM | Clics | CTR | CPC | LPV | InitCheckout | Compras | CPA | Notas
```
Whop es la fuente de verdad de las ventas reales (cruzalo con lo que dice Meta).

---

## 14. Roadmap — lo que viene después (el sistema completo)

Esta campaña sola no es el negocio. Es el primer ladrillo. El motor de ventas real se arma así:

**Campaña 2 — Cold Lead-Gen (encender semana 2, cuando esté el nurture en MailerLite)**
- Objetivo: Leads. Anuncio → LP (guía gratis) → email → secuencia de 5 mails → venta.
- Por qué: los leads son baratos ($2-8 c/u). A $30/día son 4-15 leads/día = lista real. El nurture vende con confianza durante 7 días. **Para un producto sin prueba social, este camino suele rendir MÁS que la venta fría directa.** Construye un activo (lista de emails) que es tuyo para siempre.

**Campaña 3 — Retargeting Warm (encender cuando tengas ~300-500 visitantes)**
- Audiencia: visitó la LP últimos 14 días y no compró + suscriptores que abrieron pero no compraron.
- Creatives: manejo de objeciones, urgencia ($147→$197), prueba social cuando la tengas. CTA directo a checkout.
- Por qué: el warm convierte 3-5x más barato que el frío. **Acá es donde van a salir muchas de las ventas.**

**Lookalikes (semana 4+):** cuando tengas ≥100 compradores o una lista de leads decente, creá un Lookalike 1% de compradores. Es la audiencia fría más rentable que existe.

**Palancas que suben TODA la conversión (en paralelo):**
- MyFXBook público → reactivar sección LP (prueba en vivo).
- Números reales del backtest → reactivar sección LP.
- 3-5 reviews reales en Whop.
- Video pitch del founder → creative de Reels (nuevo ad set 9:16).

> A medida que vuelve la prueba social, la conversión fría sube y el CPA baja. Por eso la Campaña 1 de hoy es el piso, no el techo.

---

## 15. Checklist pre-lanzamiento (antes de apretar Publish)

- [ ] LP redeployada con TODOS los arreglos honestos (incluido el último barrido del offer-stack).
- [ ] Compra de prueba → `Purchase` confirmado en Meta Events Manager. ✅ (ya verificado)
- [ ] Dominio verificado en Meta. ✅
- [ ] Método de pago activo en la ad account. ✅
- [ ] Special Ad Category = **None**.
- [ ] Disclaimer de riesgo en los 6 copys. ✅ (ya incluido arriba)
- [ ] Las 6 imágenes descargadas y listas para subir.
- [ ] UTMs configurados.

---

## 16. El plan de 7 días

| Día | Acción |
|-----|--------|
| **Viernes** | Armar la campaña (secciones 6 + 10), publicar. **No tocar más.** |
| Sáb-Dom | Dejar correr. Mirar solo que los ads se aprueben y empiecen a gastar. |
| Lunes | Primera lectura real (~$100-120 gastados). Llenar la planilla. |
| Mar-Mié | Pausar el/los ad(s) claramente perdedores. Nada más. |
| Jueves | ¿Hubo ventas? Aplicar reglas de decisión (sección 12). Si 0 ventas + buen CTR → regla de rescate o encender Campaña 2. |
| **Fin de semana** | Sumar la prueba social que tengas lista (backtest real, MyFXBook) → reactivar secciones LP → la conversión sube para la semana 2. |

**Hito de éxito semana 1:** ads aprobados + píxel juntando data + al menos un creative con CTR >1% + idealmente 1-3 ventas. Si eso pasa, vamos bien y escalamos. Si no, iteramos con datos — no apagamos por miedo.

---

## 17. Monitoreo en vivo (vos + Claude juntos)

El token de Meta (`TOKEN_SYSTEM_USER` en `.env`) tiene permisos de lectura de ads (`ads_read`, `read_insights`, `attribution_read`). Eso significa que **no tenés que mirar las métricas solo** — Claude las puede leer en vivo desde la API y decidimos juntos.

**Ad account:** `act_1292662169672926` (Jess Trading Ads, EUR).

**El comando:**
```
python3 scripts/meta_insights.py [periodo] [nivel]
  periodo: today | yesterday | last_3d | last_7d | maximum   (default: maximum)
  nivel:   ad | adset | campaign | account                   (default: ad)
```
Devuelve un dashboard por anuncio: gasto, CPM, link CTR, CPC, LPV, InitCheckout, compras, CPA, ROAS + un **diagnóstico automático** por creative (engancha/no cierra, CTR bajo, etc.) según los benchmarks de la sección 11.

**El flujo de trabajo:**
1. Lanzás el viernes.
2. Cada vez que quieras, me decís *"fijate las métricas"* → corro el script → te digo qué pasa y qué hacer según las reglas de la sección 12.
3. Acciones de escritura (pausar un ad perdedor, subir presupuesto) — el token también puede hacerlas, pero **solo las ejecuto con tu OK explícito cada vez** (es tu plata). Por defecto: yo leo y te recomiendo, vos clickeás.

> Cuando esté corriendo unos días podemos pasar a un chequeo diario fijo si querés.
