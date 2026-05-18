from __future__ import annotations

import asyncio
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncIterator

import anthropic

from backend.config import OUTPUTS_DIR, BRAND_DIR

def _load_system_prompt() -> str:
    return (BRAND_DIR / "scout-prompt.md").read_text(encoding="utf-8")


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
        "description": "Lee un archivo del directorio de marca. Usá para: brand-style.md, data/avatars.json, content-mix.md, data/scout-state.json",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Nombre del archivo relativo al directorio de marca, ej: 'brand-style.md', 'data/avatars.json', 'content-mix.md', 'data/scout-state.json'",
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
        import ssl, certifi
        ssl_ctx = ssl.create_default_context(cafile=certifi.where())
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
            system=_load_system_prompt(),
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
