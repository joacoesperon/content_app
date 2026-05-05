# HACER HOY — Jess Trading $10k/mes

> Lo que tenés que hacer vos hoy para desbloquear el resto. Ordenado por dependencia: arriba = primero.
> Tiempo total estimado: **~2h 30min** si no hay verificaciones largas de Meta.

---

## 🔴 URGENTE — bloquean todo lo demás

### 1. Comprar dominio · 10 min · $10-12
- [ ] Cloudflare Registrar (más barato, ~$10/año) o Namecheap
- [ ] `jesstrading.io` (preferido) o `.com` / `.co` si no está disponible
- [ ] **Dame de vuelta:** el dominio final elegido (para configurar `NEXT_PUBLIC_SITE_URL` y meta tags)

### 2. Push del repo a GitHub · 5 min
- [ ] `git push` el branch main al remote (si no está ya)
- [ ] Verificar que `landing/` está en el repo público o privado
- [ ] **Dame de vuelta:** URL del repo si es privado y necesito acceso

### 3. Crear proyecto en Vercel + conectar dominio · 15 min
- [ ] vercel.com → Add New Project → import el repo
- [ ] **Root Directory: `landing`** (crítico, sin esto rompe)
- [ ] Framework: Next.js (auto-detecta)
- [ ] Settings → Domains → agregar `jesstrading.io`
- [ ] Seguir las instrucciones de DNS del registrador
- [ ] **Dame de vuelta:** URL pública de Vercel + status del DNS (a veces tarda hasta 1h en propagar)

---

## 🟠 META — tracking y ads (hacelo en paralelo con DNS propagando)

### 4. Meta Business Manager · 30 min
- [ ] business.facebook.com → crear Business Manager (si no existe)
- [ ] Settings → Business Info → completar datos fiscales
- [ ] Crear **ad account #1** (`JessTrading-Main`) + agregar método de pago
- [ ] Crear **ad account #2 backup** (`JessTrading-Backup`) — mismo método de pago, mantenelo pausado
- [ ] Settings → Brand Safety → **Domains → Add Domain** → `jesstrading.io`
- [ ] Meta te muestra un meta tag tipo:
  ```html
  <meta name="facebook-domain-verification" content="abc123xyz..." />
  ```
- [ ] **Dame de vuelta:** ese `content="..."` para pegarlo en `app/layout.tsx` (C6)

Copia esta metaetiqueta: <meta name="facebook-domain-verification" content="h5odawnu5owh42fee9l1qx0e8htym1" />

### 5. Meta Pixel + CAPI Access Token · 15 min
- [ ] Events Manager (business.facebook.com/events_manager2) → Connect Data Source → Web → Meta Pixel
- [ ] Nombrarlo `Jess Trading LP` → te da un **Pixel ID** (numérico)
- [ ] Settings del Pixel → **Conversions API → Generate access token**
- [ ] **Dame de vuelta:**
  - `NEXT_PUBLIC_META_PIXEL_ID=...` (público, va en código)
  - `META_CAPI_ACCESS_TOKEN=...` (secret, lo cargás vos en Vercel env vars directamente)

### 6. Sobre Special Ad Category (importante leer)
- Para bots de trading **NO** marcar "Special Ad Categories" cuando crees campañas.
- Sí seguir las "Financial Products policies" en el copy:
  - No "guaranteed returns" / "easy money" / "quick rich"
  - No screenshots de ganancias específicas sin disclaimer
  - Sí decir "past performance ≠ future results"
  - Sí incluir risk disclosure (el footer de la LP ya lo tiene ✅)

---

## 🟡 EMAIL + WHOP — más liviano pero también hoy

### 7. ConvertKit (Kit) · 10 min
- [ ] kit.com → crear cuenta gratis (hasta 1000 subs)
- [ ] Forms → New Form → "Lead Magnet — XAUUSD Guide" (tipo: Inline)
- [ ] Sequences → New Sequence → "5-Email Nurture XAUUSD" (vacía por ahora)
- [ ] Account Settings → Advanced → API → ver `API Key` y `API Secret`
- [ ] **Dame de vuelta:**
  - `CONVERTKIT_API_KEY=...`
  - `CONVERTKIT_API_SECRET=...`
  - `CONVERTKIT_LEADMAGNET_FORM_ID=...` (sale en la URL del form: `kit.com/forms/123456` → 123456)

### 8. Whop webhook · 5 min
- [ ] Whop dashboard → Developers → Webhooks → New Webhook
- [ ] **URL del endpoint:** `https://jesstrading.io/api/whop-webhook` (apuntar al dominio una vez deployado)
- [ ] Eventos: `payment.succeeded` y/o `membership.went_valid` (marcar todos los relacionados con cobro exitoso)
- [ ] Whop te da un **signing secret** — copialo
- [ ] **Dame de vuelta:** `WHOP_WEBHOOK_SECRET=...` (lo cargás en Vercel env vars)

---

## ⚙️ Cargar env vars en Vercel · 10 min

Vercel project → Settings → Environment Variables. Cargar (de a uno):

| Variable | Scope | Origen |
|----------|-------|--------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Production + Preview | paso 5 |
| `META_CAPI_ACCESS_TOKEN` | Production + Preview | paso 5 |
| `WHOP_WEBHOOK_SECRET` | Production | paso 8 |
| `CONVERTKIT_API_KEY` | Production + Preview | paso 7 |
| `CONVERTKIT_API_SECRET` | Production | paso 7 |
| `CONVERTKIT_LEADMAGNET_FORM_ID` | Production + Preview | paso 7 |
| `NEXT_PUBLIC_SITE_URL` | Production + Preview | `https://jesstrading.io` |

Después de cargarlas: Deployments → último deploy → **Redeploy** (para que tome las env vars).

---

## ✅ Checklist final del día

Cuando termines, debería ser cierto que:

- [ ] `https://jesstrading.io` carga la LP
- [ ] DevTools → Network → se ve `fbevents.js` cargado (Pixel firing)
- [ ] Meta Events Manager → **Test Events** muestra `PageView` cuando entrás
- [ ] Click "Get the bot" → Test Events muestra `InitiateCheckout`
- [ ] `https://jesstrading.io/api/whop-webhook` (GET) responde `{ "ok": true }`
- [ ] Tenés a mano para mañana: el `facebook-domain-verification` content para C6, las creds de ConvertKit para C5

---

## 📦 Lo que YO hago cuando me pasés las credenciales

| Lo que me das | Lo que hago | Tiempo |
|---|---|---|
| `facebook-domain-verification` content | C6 — pegar meta tag en layout, redeploy, verificás en Meta | 2 min |
| Creds ConvertKit | C5 — form de email capture en LP + endpoint que dispara Lead a Pixel + CAPI | ~1h |
| (cuando todo esté arriba) | Genero las 12 creatives de Concept Ads (tabla 3.C.3 de next.md) listas para subir a Meta | ~30 min |

---

## 🚫 NO hagas hoy (importante para no dispersarte)

- **No** crear campañas en Meta todavía — primero validamos que el tracking funciona end-to-end.
- **No** subir contenido al Whop store todavía — antes hay que tener el MyFXBook tracker corriendo (eso es de la semana 2).
- **No** grabar los videos del bot hoy — bookealos para el fin de semana en bloques de 1-2h.
- **No** pedirles testimonios a usuarios todavía — esperar a tener al menos 5-7 días de bot funcionando en sus cuentas.
