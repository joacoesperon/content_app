from __future__ import annotations

import asyncio
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncIterator

import anthropic

from backend.config import OUTPUTS_DIR

SYSTEM_PROMPT = """You are Scout, the organic content strategist for JessTrading.

Your job: research what's resonating in the algo trading / gold trading niche RIGHT NOW, then produce 7 Instagram post briefs following the brand's weekly content plan.

## Step 0 — Get the current date (MANDATORY FIRST CALL)
Call get_current_time BEFORE anything else. You do not know today's date from memory — your internal knowledge is stale. Use the returned `today` value as the anchor for ALL research and for the `last_run` field in scout-state.json. Use `since` (7 days ago) to scope "what's trending" queries.

## Step 1 — Load context (in this exact order)
1. read_brand_file("brand-style.md") — brand voice, visual system, image modifier. NO product details or sales arguments.
2. read_brand_file("data/avatars.json") — customer profiles. CRITICAL: the "ad_angles" field in each avatar contains outdated examples — IGNORE IT COMPLETELY. Use only: name, description, pain_points, desires, language_sample.
3. read_brand_file("content-mix.md") — weekly post distribution plan. Follow it strictly.
4. read_brand_file("data/scout-state.json") — which avatar was used last time. If file doesn't exist, continue normally.

## Step 2 — Research what traders are ACTUALLY talking about this week

**Primary source: reddit_search.** Real traders talk on Reddit — not in press-release news. This is where you find real pains, memes, viral threads, contrarian takes. Run 2–3 reddit_search calls against relevant subs:
- r/Daytrading, r/algotrading, r/Forex, r/wallstreetbets, r/Trading, r/options
- Queries should be broad and current: "gold", "xauusd", "algo", "bot", "consistent losses", "discipline", "AI trading"
- Sort by "hot" or "top" with timeframe "week" — you want what's resonating NOW, not evergreen posts
- Look for: high-upvote threads, recurring complaints, questions asked repeatedly, memes/jokes

**Fallback: web_search** for macro market news only if Reddit doesn't surface a clear angle. Do NOT use it as the primary source — it returns SEO-spam news articles that nobody reads.

Rules:
- Do NOT search for specific products, prices, or JessTrading itself.
- Note the exact topic, the subreddit/URL, upvote count if available, and how you'll use it in a post.
- If you can't find something concrete from the last 7 days, say so — do NOT invent research or fall back to generic statements like "algo trading is growing".

## Step 3 — Plan before writing
Write a PLAN block before generating any post:

PLAN:
- Today's date: [YYYY-MM-DD from get_current_time]
- Chosen avatar: [name] — reason: [why this avatar this week, based on research or rotation]
- Research insight 1: [concrete finding — thread title, subreddit, upvotes, the specific quote or pattern you noticed]
- Research insight 2: [same format — must be from the last 7 days]
- Post assignments (assign category from content-mix.md, then lever, then the CENTRAL CLAIM each post will make):
  Post 1: [category] — Lever: [lever] — Claim: [one-sentence argument this post makes]
  Post 2: [category] — Lever: [lever] — Claim: [...]
  Post 3: [category] — Lever: [lever] — Claim: [...]
  Post 4: [category] — Lever: [lever] — Claim: [...]
  Post 5: [category] — Lever: [lever] — Claim: [...]
  Post 6: [category] — Lever: [lever] — Claim: [...]
  Post 7: [category] — Lever: [lever] — Claim: [...]
- Lever check: are all 7 levers different? [yes/no — if no, replan now]
- **Claim check:** are all 7 CLAIMS substantively different (not just the same argument re-packaged)? If two posts make the same central argument with different framings, that is a FAIL — replan now. Example of failure: "execution matters more than strategy" appearing in 3 posts with different hooks.

## Step 4 — Generate 7 posts (follow the PLAN exactly)

### Post [N] — [Category] — [Avatar Name] — [Lever]
**Caption:** [Full Instagram caption, max 150 words, in English, brand voice — Premium, Confident, Approachable, Clear, Visionary. Posts 1–6: NO price, NO "lifetime access", NO "link in bio →". Post 7 only: include price, features, CTA.]

**Slides:** [total number, recommend 4 for carousel, 1 for single image]
**Slide 1 — Hook:** [English FAL prompt: describe the visual scene specifically — what elements are shown, where, what mood, lighting, any text overlay in quotes. Each slide should look visually different from the others. Do NOT repeat the same layout or composition across slides. Do NOT include the brand color/font modifier — that is added automatically by the generation tool.]
**Slide 2 — [descriptive name]:** [FAL prompt — different visual concept from slide 1]
**Slide 3 — [descriptive name]:** [FAL prompt — different visual concept]
**Slide 4 — CTA:** [FAL prompt]

These visual prompts will be sent to **fal-ai/nano-banana-2** for image generation. Write prompts that give the model a complete, specific scene to render — not style keywords.

**GOOD examples — specific scene, clear layout, text verbatim, no brand modifier:**

Good example 1 (benefit list):
"A benefit-list ad, split composition on Carbon Black (#101010) background. Left 40%: a sleek dark laptop showing a trading chart with green profit candles, moody screen glow lighting, shot from a slight angle. Right 60%: vertical stack of five benefit lines with filled Neon Green (#A5F28C) circles: 'Trades gold (XAUUSD) 24/7', 'No coding knowledge needed', 'Proven backtested strategy', 'One-time payment, lifetime access', 'Eliminates emotional trading'. Clean white sans-serif text, generous spacing. Jess Trading logo bottom right in white. 4:5 aspect ratio."

Good example 2 (us-vs-them):
"A side-by-side ad divided vertically. Left half: muted dark gray-blue (#1a1a2e) background. Right half: Carbon Black (#101010) with subtle Neon Green (#A5F28C) border glow. Center top: white circle with 'VS'. Left header: 'Manual Trading' in gray text + icon of a stressed person at a screen + list with red X marks: 'Emotional decisions', 'Can't watch markets 24/7', 'Inconsistent discipline', 'Slow reaction time', 'Burnout and stress'. Right header: 'Jess Trading Bot' in Neon Green + icon of a robot/algorithm + list with green checkmarks: '100% rule-based execution', 'Runs 24/7 nonstop', 'Zero emotional interference', 'Millisecond execution speed', 'Set it and forget it'. Jess Trading logo bottom right in white. 4:5 aspect ratio."

Good example 3 (pull-quote review):
"A review-driven ad with a solid dark background — Carbon Black (#101010) with a very subtle Neon Green (#45B14F) tint. Top half: large bold italic serif text in white with curly quotation marks reading 'I finally have consistent profits'. Directly below: five large filled Neon Green (#A5F28C) star icons. Bottom left: a dark (#1A1A1A) rounded-corner review card with: small gray circular avatar, 'James P.' in bold white, blue checkmark 'Verified Buyer'. Review body: 'Was losing money every month trying to day trade manually... Three months in and my account is growing steadily.' in bold Neon Green. Jess Trading logo bottom right. 4:5 aspect ratio."

**BAD examples — do NOT write prompts like these:**

Bad example 1 (too vague, no scene, Spanish):
"Reloj de arena con '26 weeks' en rojo suave, fondo Carbon Black, composición centrada."
→ WHY BAD: No layout, no scene, no text verbatim, one sentence with zero visual specificity.

Bad example 2 (style keywords only, no actual scene):
"Checklist visual limpio sobre fondo Carbon Black. Cuatro ítems con checkmarks en verde neón #A5F28C, tipografía Inter medium en blanco. Al pie, precio '$147' en blanco bold. Estilo minimalista tipo Apple — mucho espacio negativo. Mood: simplicidad que da confianza."
→ WHY BAD: Describes a mood and style, not a scene. No specific text in quotes, no composition details, no spatial layout.

Bad example 3 (incomplete, no layout, Spanish):
"Primer plano de un candlestick chart XAUUSD en rojo, con una línea de stop loss que se 'mueve' hacia abajo — representado con flechas punteadas en rojo. Debajo, texto bold en neon green: 'THE BOT DOESN'T MOVE THE STOP.' Background carbon black radial. Sin personas, puramente data visual."
→ WHY BAD: No slide dimensions, no composition anchors, no supporting elements — nano-banana needs a full scene description to produce a coherent layout.

**Hashtags:** [5–8 relevant hashtags in English — research and vary them, don't reuse the same pool every week]
**Rationale:** [One sentence: why this angle for this post this week]

---

## Step 5 — Save outputs
1. write_output_file with the complete content (PLAN + all 7 posts)
2. write_brand_file("data/scout-state.json") with: {"last_avatar": "...", "last_angles": [...], "last_run": "YYYY-MM-DD"}
3. Confirm what was saved and where"""

TOOLS = [
    {
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 3,
    },
    {
        "name": "get_current_time",
        "description": "Returns today's date and the date 7 days ago, both in ISO format (YYYY-MM-DD), plus the current weekday. MUST be called first, before any research, because the model's internal knowledge of the current date is unreliable.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "reddit_search",
        "description": "Search Reddit for trending discussions in a specific subreddit. Returns titles, upvote counts, comment counts, and URLs. Use this as the PRIMARY source to find what traders are actually talking about this week.",
        "input_schema": {
            "type": "object",
            "properties": {
                "subreddit": {
                    "type": "string",
                    "description": "Subreddit name without the r/ prefix (e.g. 'Daytrading', 'algotrading', 'Forex', 'wallstreetbets', 'Trading', 'options')",
                },
                "query": {
                    "type": "string",
                    "description": "Search query. Keep it broad — single terms or short phrases work best (e.g. 'xauusd', 'gold', 'consistent losses', 'bot')",
                },
                "sort": {
                    "type": "string",
                    "enum": ["hot", "top", "new", "relevance"],
                    "description": "Sort order. Use 'top' with timeframe='week' to find what resonated recently. Default 'top'.",
                },
                "timeframe": {
                    "type": "string",
                    "enum": ["day", "week", "month", "year", "all"],
                    "description": "Time window for results. Default 'week'. Only used when sort='top'.",
                },
            },
            "required": ["subreddit", "query"],
        },
    },
    {
        "name": "read_brand_file",
        "description": "Lee un archivo del directorio de marca. Usá para: brand-dna.md, data/avatars.json, scout-state.json",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Nombre del archivo relativo al directorio de marca, ej: 'brand-dna.md', 'data/avatars.json', 'data/scout-state.json'",
                }
            },
            "required": ["filename"],
        },
    },
    {
        "name": "write_output_file",
        "description": "Guarda el batch de contenido generado como archivo markdown con fecha en la carpeta outputs/scout",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "Contenido markdown completo con los 7 posts formateados según el template de output",
                }
            },
            "required": ["content"],
        },
    },
    {
        "name": "write_brand_file",
        "description": "Escribe un archivo en el directorio de marca. Usado para actualizar scout-state.json después de cada run",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Nombre del archivo relativo al directorio de marca",
                },
                "content": {
                    "type": "string",
                    "description": "Contenido a escribir en el archivo",
                },
            },
            "required": ["filename", "content"],
        },
    },
]


def _get_current_time() -> str:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=7)
    return json.dumps({
        "today": now.strftime("%Y-%m-%d"),
        "since": since.strftime("%Y-%m-%d"),
        "weekday": now.strftime("%A"),
        "iso": now.isoformat(),
    })


def _reddit_search(subreddit: str, query: str, sort: str = "top", timeframe: str = "week") -> str:
    try:
        sub = subreddit.strip().lstrip("r/").strip("/")
        params = {
            "q": query,
            "restrict_sr": "1",
            "sort": sort,
            "t": timeframe,
            "limit": "10",
        }
        url = f"https://www.reddit.com/r/{urllib.parse.quote(sub)}/search.json?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "JessTrading-Scout/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        children = data.get("data", {}).get("children", [])
        if not children:
            return f"No results for r/{sub} '{query}' ({sort}/{timeframe})."
        lines = []
        for c in children[:10]:
            p = c.get("data", {})
            lines.append(
                f"[{p.get('ups', 0)} upvotes, {p.get('num_comments', 0)} comments] "
                f"{p.get('title', '')}\n"
                f"  r/{p.get('subreddit', sub)} — https://www.reddit.com{p.get('permalink', '')}\n"
                f"  {(p.get('selftext') or '')[:300]}"
            )
        return "\n\n".join(lines)
    except Exception as e:
        return f"Reddit search error: {e}"


def _read_brand_file(filename: str, brand_dir: Path) -> str:
    try:
        path = (brand_dir / filename).resolve()
        if not str(path).startswith(str(brand_dir.resolve())):
            return "Error: acceso denegado — ruta fuera del directorio de marca"
        if not path.exists():
            return f"Archivo no encontrado: {filename}"
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return f"Error de lectura: {e}"


def _write_output_file(content: str, brand_dir: Path) -> str:
    try:
        output_dir = OUTPUTS_DIR / "scout"
        output_dir.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"{date_str}.md"
        counter = 1
        while (output_dir / filename).exists():
            filename = f"{date_str}-{counter}.md"
            counter += 1
        path = output_dir / filename
        header = f"# Scout Output — {date_str}\n\n"
        path.write_text(header + content, encoding="utf-8")
        return filename
    except Exception as e:
        return f"Error de escritura: {e}"


def _write_brand_file(filename: str, content: str, brand_dir: Path) -> str:
    try:
        path = (brand_dir / filename).resolve()
        if not str(path).startswith(str(brand_dir.resolve())):
            return "Error: acceso denegado — ruta fuera del directorio de marca"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return f"Escrito: {filename}"
    except Exception as e:
        return f"Error de escritura: {e}"


def _execute_tool(name: str, inputs: dict, brand_dir: Path) -> str:
    if name == "get_current_time":
        return _get_current_time()
    elif name == "reddit_search":
        return _reddit_search(
            inputs["subreddit"],
            inputs["query"],
            inputs.get("sort", "top"),
            inputs.get("timeframe", "week"),
        )
    elif name == "read_brand_file":
        return _read_brand_file(inputs["filename"], brand_dir)
    elif name == "write_output_file":
        return _write_output_file(inputs["content"], brand_dir)
    elif name == "write_brand_file":
        return _write_brand_file(inputs["filename"], inputs["content"], brand_dir)
    return f"Tool desconocida: {name}"


async def run_scout_stream(
    prompt: str, brand_dir: Path, api_key: str
) -> AsyncIterator[dict]:
    client = anthropic.AsyncAnthropic(api_key=api_key)
    messages = [{"role": "user", "content": prompt}]
    output_file: str | None = None

    yield {"type": "start", "message": "Scout iniciando..."}

    for _ in range(25):
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=16000,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            final_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_text = block.text

            output_content = None
            if output_file:
                full_path = OUTPUTS_DIR / "scout" / output_file
                if full_path.exists():
                    output_content = full_path.read_text(encoding="utf-8")

            yield {
                "type": "done",
                "output_file": output_file,
                "summary": final_text,
                "content": output_content,
            }
            return

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []

            for block in response.content:
                if block.type == "server_tool_use":
                    input_dict = dict(block.input) if block.input else {}
                    yield {"type": "tool_call", "tool": block.name, "input": input_dict}
                    continue
                if block.type == "web_search_tool_result":
                    content = block.content
                    count = len(content) if isinstance(content, list) else 0
                    yield {"type": "tool_result", "tool": "web_search", "preview": f"{count} results"}
                    continue
                if block.type == "tool_use":
                    input_dict = dict(block.input) if block.input else {}
                    yield {"type": "tool_call", "tool": block.name, "input": input_dict}

                    result = await asyncio.to_thread(_execute_tool, block.name, input_dict, brand_dir)
                    preview = result[:400] + "..." if len(result) > 400 else result
                    yield {"type": "tool_result", "tool": block.name, "preview": preview}

                    if block.name == "write_output_file" and not result.startswith("Error"):
                        output_file = result

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})
        else:
            yield {"type": "error", "message": f"Stop reason inesperado: {response.stop_reason}"}
            return

    yield {"type": "error", "message": "El agente alcanzó el límite de iteraciones sin completar"}
