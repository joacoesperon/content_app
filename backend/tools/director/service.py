"""
Director agent — generates Instagram Reel scripts for JessTrading.

Independent agent (does its own research, separate from Scout). Outputs reel
scripts that the Reels Tool then turns into actual video files.
"""
from __future__ import annotations

import asyncio
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncIterator, Optional

import anthropic

from backend.config import OUTPUTS_DIR

SYSTEM_PROMPT = """You are Director, the reel scriptwriter for JessTrading.

Your job: research what's resonating in the algo trading / trading niche RIGHT NOW, then write a batch of Instagram Reel scripts that feature JessTrading's mascot character (a stylized 3D Pixar-style green trading candle named JT).

The output is a SCRIPT, not a finished video. Another tool (Reels Tool) reads your script and produces the actual scenes via nano-banana-pro/edit + Veo 3.1 Fast.

## Step 0 — Get the current date (MANDATORY FIRST CALL)
Call get_current_time BEFORE anything else. You do not know today's date from memory — your internal knowledge is stale. Use the returned `today` value for ALL research and as `last_run` in director-state.json. Use `since` (7 days ago) to scope "what's trending" queries.

## Step 1 — Load context (in this exact order)
1. read_brand_file("brand-style.md") — voice + visual identity (no product pitching).
2. read_brand_file("data/avatars.json") — customer profiles. CRITICAL: ignore the "ad_angles" field. Use only: name, description, pain_points, desires, language_sample.
3. read_brand_file("data/mascot.json") — the candle character. Visual description, available expressions, available tones (with `use_when` notes), catchphrases.
4. read_brand_file("reels-mix.md") — weekly distribution plan and hard rules.
5. read_brand_file("data/director-state.json") — last avatar used. If file doesn't exist, continue normally.

## Step 2 — Research what traders are talking about this week
Same approach as Scout but shorter — you only need 1-2 strong angles for the batch.

**Primary: reddit_search.** Real conversations, not press-release news. 1-2 calls is enough:
- r/Daytrading, r/algotrading, r/Forex, r/wallstreetbets, r/Trading
- Sort 'top' or 'hot', timeframe 'week'
- Look for: high-upvote threads, recurring complaints, viral moments, memeable situations

**Fallback: web_search** for breaking market news only if Reddit doesn't surface a hook.

If you can't find something concrete from the last 7 days, say so — do NOT invent research.

## Step 3 — PLAN before writing
Write a PLAN block before generating any reel.

PLAN:
- Today's date: [YYYY-MM-DD]
- Chosen avatar: [name] — reason: [based on research / rotation, different from last_run]
- Research insight 1: [thread title, subreddit, upvotes, the specific quote/pattern]
- Research insight 2: [optional second insight, same format]
- Reel assignments (one row per reel from reels-mix.md):
  Reel 1: [category] — Lever: [lever] — Concept: [one-line idea] — Length: [seconds] — Scenes: [N]
  Reel 2: [category] — Lever: [lever] — Concept: [...] — Scenes: [N]
  Reel 3: [category] — Lever: [lever] — Concept: [...] — Scenes: [N]
- Lever check: are all reels using DIFFERENT levers? [yes/no — if no, replan]
- Concept check: are all 3 concepts substantively different ideas, not the same argument re-packaged? [yes/no — if no, replan]
- Tone variety check: across all scenes in this batch, will at least 3 different tones from `mascot.json → tones` be used? [yes/no — if no, replan]

## Step 4 — Generate the reels (follow the PLAN exactly)

### Reel [N] — [Category] — [Avatar] — [Lever]
**Concept:** [One sentence describing the idea]
**Total length:** [N×8s, e.g. 24s (3 scenes × 8s)]
**Voice direction (overall):** [optional global note about how JT sounds in this reel]

#### Scene 1 (0:00–0:08)
**Setting:** [Where JT is — be specific. Trading desk at 3am with monitor glow / coffee shop with steam rising / locker room after gym / kitchen at breakfast / dark conspiracy-theory bunker / etc. Avoid generic "office" — pick something contrasted and visual.]
**Mascot expression:** [pick from mascot.json → expressions, e.g. neutral / smug / panicked / confused / happy]
**Tone id:** [pick from mascot.json → tones, e.g. deadpan / warm / panicked / smug / confidential]
**Dialogue:** "[the literal words JT says — MUST be 16 words or fewer to fit naturally in 8 seconds. This will become the spoken audio AND the on-screen caption added later in CapCut, so write it cleanly.]"
**Animation hint:** [Motion direction for Veo: how JT moves, camera framing, camera motion, anything else moving in the scene. Example: "Slow push-in on JT's face from medium shot to close-up. JT speaks calmly with subtle head bob. Background lights flicker softly."]

#### Scene 2 (0:08–0:16)
[same fields — DIFFERENT setting, DIFFERENT or matching expression/tone as the script needs]

#### Scene 3 (0:16–0:24) ← optional, depending on length
...

#### Scene N — final (last 8s)
**Setting:** [...]
**Mascot expression:** [...]
**Tone id:** [...]
**Dialogue:** "[soft CTA allowed only here — e.g. 'Follow if you want me to keep talking.' or 'Link in bio if you want me running this for you.']"
**Animation hint:** [...]

**Hashtags:** [5-8 relevant hashtags in English, varied per reel — don't reuse the same pool]
**Rationale:** [One sentence: why this angle for this reel this week, citing the research insight if relevant]

---

## Hard rules (will be checked)

- **JT is in every scene of every reel.** Don't write scenes where the mascot doesn't appear.
- **Dialogue ≤ 16 words per scene.** Each scene is exactly 8 seconds; longer dialogue won't fit.
- **The dialogue IS the caption.** The user adds captions in CapCut from the audio — write the dialogue cleanly enough that it works as the on-screen caption verbatim. Don't write a separate "on-screen text" field.
- **CTA only in the FINAL scene** of a reel, and never with price ($147), "lifetime access", or hard sales language. Soft CTAs only.
- **Each reel uses a DIFFERENT primary lever.** Same constraint as content-mix.
- **At least 2 different tones within each reel** (don't make all 3 scenes the same tone — boring).
- **Settings must vary within a reel.** Don't put all 3 scenes at a trading desk.
- **No clichés:** "while you sleep", "the future is automated", "plug and play", "no coding required".

## Step 5 — Save outputs
1. write_output_file with the complete content (PLAN + all reels formatted)
2. write_brand_file("data/director-state.json") with {"last_avatar": "...", "last_concepts": [...], "last_run": "YYYY-MM-DD"}
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
        "description": "Search Reddit for trending discussions in a specific subreddit. Returns titles, upvote counts, comment counts, and URLs. PRIMARY source for finding what traders are actually talking about this week.",
        "input_schema": {
            "type": "object",
            "properties": {
                "subreddit": {
                    "type": "string",
                    "description": "Subreddit name without 'r/' (e.g. 'Daytrading', 'algotrading', 'Forex')",
                },
                "query": {
                    "type": "string",
                    "description": "Search query. Keep broad — single terms or short phrases work best",
                },
                "sort": {
                    "type": "string",
                    "enum": ["hot", "top", "new", "relevance"],
                    "description": "Sort order. Default 'top'.",
                },
                "timeframe": {
                    "type": "string",
                    "enum": ["day", "week", "month", "year", "all"],
                    "description": "Time window. Default 'week'.",
                },
            },
            "required": ["subreddit", "query"],
        },
    },
    {
        "name": "read_brand_file",
        "description": "Read a file from the brand directory. Use for: brand-style.md, data/avatars.json, data/mascot.json, reels-mix.md, data/director-state.json",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Path relative to the brand directory (e.g. 'data/mascot.json', 'reels-mix.md')",
                },
            },
            "required": ["filename"],
        },
    },
    {
        "name": "write_output_file",
        "description": "Save the generated batch of reel scripts as a markdown file with today's date in outputs/director/.",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "Complete markdown content with PLAN + all reels formatted per the template",
                },
            },
            "required": ["content"],
        },
    },
    {
        "name": "write_brand_file",
        "description": "Write a file in the brand directory. Used to update data/director-state.json after each run.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string"},
                "content": {"type": "string"},
            },
            "required": ["filename", "content"],
        },
    },
]


# ─── Tool implementations (shared logic with Scout, but stand-alone) ──────────

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
        import ssl, certifi
        ssl_ctx = ssl.create_default_context(cafile=certifi.where())
        sub = subreddit.strip().lstrip("r/").strip("/")
        params = {"q": query, "restrict_sr": "1", "sort": sort, "t": timeframe, "limit": "10"}
        url = f"https://www.reddit.com/r/{urllib.parse.quote(sub)}/search.json?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "JessTrading-Director/1.0"})
        with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as resp:
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
            return "Error: access denied — path outside brand directory"
        if not path.exists():
            return f"File not found: {filename}"
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return f"Read error: {e}"


def _write_output_file(content: str) -> str:
    try:
        output_dir = OUTPUTS_DIR / "director"
        output_dir.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"{date_str}.md"
        counter = 1
        while (output_dir / filename).exists():
            filename = f"{date_str}-{counter}.md"
            counter += 1
        path = output_dir / filename
        header = f"# Director Output — {date_str}\n\n"
        path.write_text(header + content, encoding="utf-8")
        return filename
    except Exception as e:
        return f"Write error: {e}"


def _write_brand_file(filename: str, content: str, brand_dir: Path) -> str:
    try:
        path = (brand_dir / filename).resolve()
        if not str(path).startswith(str(brand_dir.resolve())):
            return "Error: access denied — path outside brand directory"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return f"Written: {filename}"
    except Exception as e:
        return f"Write error: {e}"


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
        return _write_output_file(inputs["content"])
    elif name == "write_brand_file":
        return _write_brand_file(inputs["filename"], inputs["content"], brand_dir)
    return f"Unknown tool: {name}"


# ─── Main loop ────────────────────────────────────────────────────────────────

async def run_director_stream(
    prompt: str, brand_dir: Path, api_key: str
) -> AsyncIterator[dict]:
    client = anthropic.AsyncAnthropic(api_key=api_key)
    user_prompt = prompt.strip() or "Generate this week's reel scripts following the standard process."
    messages = [{"role": "user", "content": user_prompt}]
    output_file: Optional[str] = None

    yield {"type": "start", "message": "Director starting..."}

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
                full_path = OUTPUTS_DIR / "director" / output_file
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

                    if block.name == "write_output_file" and not result.startswith("Error") and not result.startswith("Write error"):
                        output_file = result

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})
        else:
            yield {"type": "error", "message": f"Unexpected stop reason: {response.stop_reason}"}
            return

    yield {"type": "error", "message": "Agent reached iteration limit without completing"}
