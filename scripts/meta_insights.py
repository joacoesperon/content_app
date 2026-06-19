#!/usr/bin/env python3
"""
Meta Ads insights — dashboard rápido de la campaña en vivo.

Uso:
    python3 scripts/meta_insights.py [date] [level]

  date:  today | yesterday | last_3d | last_7d | maximum   (default: maximum)
  level: ad | adset | campaign | account                   (default: ad)

Lee el token de .env (TOKEN_SYSTEM_USER). Solo lectura.
"""
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

AD_ACCOUNT = "act_1292662169672926"   # Jess Trading Ads (EUR)
API_VERSION = "v21.0"

# Benchmarks (de campaign1.md sección 11) para el diagnóstico automático
CTR_GOOD = 1.5
CTR_OK = 1.0
CTR_BAD = 0.8


def get_token() -> str:
    env = Path(__file__).resolve().parent.parent / ".env"
    for line in env.read_text().splitlines():
        if line.startswith("TOKEN_SYSTEM_USER="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("No encontré TOKEN_SYSTEM_USER en .env")


def fetch(token: str, date_preset: str, level: str) -> list[dict]:
    fields = ",".join([
        "campaign_name", "adset_name", "ad_name",
        "spend", "impressions", "cpm", "clicks", "ctr", "cpc",
        "inline_link_clicks", "inline_link_click_ctr", "cost_per_inline_link_click",
        "actions", "cost_per_action_type", "purchase_roas",
    ])
    params = urllib.parse.urlencode({
        "level": level,
        "fields": fields,
        "date_preset": date_preset,
        "limit": 200,
        "access_token": token,
    })
    url = f"https://graph.facebook.com/{API_VERSION}/{AD_ACCOUNT}/insights?{params}"
    with urllib.request.urlopen(url, timeout=60) as r:
        payload = json.loads(r.read().decode())
    if "error" in payload:
        raise SystemExit(f"API error: {payload['error'].get('message')}")
    return payload.get("data", [])


def action_val(actions: list[dict], *types: str) -> float:
    """Devuelve el valor de la primera action_type que matchee (por prioridad)."""
    if not actions:
        return 0.0
    by_type = {a["action_type"]: float(a["value"]) for a in actions}
    for t in types:
        if t in by_type:
            return by_type[t]
    return 0.0


def diag(ctr: float, purchases: float, lpv: float, ic: float) -> str:
    if purchases > 0:
        return "VENTA ✓"
    if ctr >= CTR_OK and (ic > 0 or lpv > 0):
        return "engancha, no cierra → LP/prueba social"
    if ctr < CTR_BAD:
        return "CTR bajo → creative/audiencia"
    if ctr >= CTR_OK:
        return "buen CTR, esperar más data"
    return "—"


def main():
    date_preset = sys.argv[1] if len(sys.argv) > 1 else "maximum"
    level = sys.argv[2] if len(sys.argv) > 2 else "ad"
    token = get_token()
    rows = fetch(token, date_preset, level)

    print(f"\n  META ADS · {AD_ACCOUNT} · {date_preset} · nivel={level}")
    print("  " + "═" * 78)

    if not rows:
        print("  Sin data todavía (campaña no lanzada o sin gasto en el período).\n")
        return

    tot_spend = tot_imp = tot_lc = tot_pur = 0.0
    for r in rows:
        name = r.get("ad_name") or r.get("adset_name") or r.get("campaign_name") or "—"
        spend = float(r.get("spend", 0))
        imp = float(r.get("impressions", 0))
        cpm = float(r.get("cpm", 0))
        link_clicks = float(r.get("inline_link_clicks", 0))
        link_ctr = float(r.get("inline_link_click_ctr", 0))
        cpc = float(r.get("cost_per_inline_link_click", 0))
        actions = r.get("actions", [])
        lpv = action_val(actions, "landing_page_view")
        ic = action_val(actions, "omni_initiated_checkout", "initiate_checkout")
        lead = action_val(actions, "lead", "offsite_conversion.fb_pixel_lead")
        pur = action_val(actions, "offsite_conversion.fb_pixel_purchase", "omni_purchase", "purchase")
        cpa = (spend / pur) if pur else 0.0
        roas = action_val(r.get("purchase_roas", []), "omni_purchase") if r.get("purchase_roas") else 0.0

        tot_spend += spend; tot_imp += imp; tot_lc += link_clicks; tot_pur += pur

        print(f"\n  ▸ {name}")
        print(f"      Gasto €{spend:>6.2f} | Impr {int(imp):>6} | CPM €{cpm:>5.2f}")
        print(f"      Link clicks {int(link_clicks):>4} | CTR {link_ctr:>4.2f}% | CPC €{cpc:>4.2f}")
        print(f"      LPV {int(lpv):>3} | InitCheckout {int(ic):>2} | Leads {int(lead):>2} | Compras {int(pur):>2}"
              + (f" | CPA €{cpa:.2f} | ROAS {roas:.2f}" if pur else ""))
        print(f"      → {diag(link_ctr, pur, lpv, ic)}")

    avg_ctr = (tot_lc / tot_imp * 100) if tot_imp else 0
    avg_cpa = (tot_spend / tot_pur) if tot_pur else 0
    print("\n  " + "─" * 78)
    print(f"  TOTAL  Gasto €{tot_spend:.2f} | Link CTR {avg_ctr:.2f}% | Compras {int(tot_pur)}"
          + (f" | CPA €{avg_cpa:.2f}" if tot_pur else ""))
    print()


if __name__ == "__main__":
    main()
