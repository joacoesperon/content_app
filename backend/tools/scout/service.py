from __future__ import annotations

import asyncio
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator

import anthropic

SYSTEM_PROMPT = """Sos scout, el estratega de contenido orgánico de JessTrading.

Tu único trabajo: investigar qué está funcionando en el nicho de trading / bots algorítmicos ahora mismo, y producir 7 briefs de posts para Instagram — cada uno apuntando a UN avatar de cliente específico con UN ángulo de persuasión fresco.

## Lo que siempre hacés primero
1. Llamá a read_brand_file con "brand-dna.md" — cargá la voz de marca, visuales y detalles del producto
2. Llamá a read_brand_file con "data/avatars.json" — cargá los perfiles de cliente
3. Llamá a read_brand_file con "scout-state.json" — chequeá qué avatar y ángulos se usaron la última vez (si el archivo no existe, continuá normalmente)

## Paso de investigación
Buscá 2-3 temas o ángulos que estén resonando en el nicho esta semana:
- Probá queries como "trading bot", "algo trading", "forex automation", "AI trading", "automated trading", "trading strategies", "trading tips", "day trading", "swing trading" combinadas con "Instagram", "social media", "content", "posts", "reels", "carousels"
- Usá lo que encontrás para informar el ángulo y el hook — no para copiar, sino para entender qué está generando interés ahora mismo

## Reglas de contenido
- UN avatar por batch — elegí el que fue usado menos recientemente, o el que más se alinea con el mood del mercado actual
- SIETE posts por batch — cada uno con un ángulo de persuasión DIFERENTE
- Nunca repitas el mismo ángulo dos veces en el mismo batch
- Siempre usá la voz de marca: premium, confiada, cercana, clara, visionaria
- Tipografía Inter siempre
- Escribí en ingles — la audiencia objetivo son traders de todo el mundo, y el inglés es el idioma del nicho

## Formato de output (para CADA uno de los 7 posts)

### Post [N] — [Nombre del Avatar] — [Ángulo de Persuasión]
**Caption:** [Caption completo para Instagram, máx 150 palabras, voz de marca, concreto]
**Brief visual:** [2-3 oraciones: qué mostrar visualmente, composición, colores, mood]
**Hashtags:** [5-8 hashtags relevantes]
**Rationale del ángulo:** [Una oración: por qué este ángulo para este avatar esta semana]

---

## Después de generar los 7 posts
1. Llamá a write_output_file con el contenido completo de los 7 posts
2. Llamá a write_brand_file con "scout-state.json" para actualizar: {"last_avatar": "...", "last_angles": [...], "last_run": "YYYY-MM-DD"}
3. Confirmá qué se guardó y dónde"""

TOOLS = [
    {
        "name": "web_search",
        "description": "Busca en la web información actual sobre contenido de trading, tendencias y qué está resonando en el nicho de trading en redes sociales",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Query de búsqueda para encontrar contenido y ángulos con tracción",
                }
            },
            "required": ["query"],
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
                    "description": "Nombre del archivo relativo al directorio de marca, ej: 'brand-dna.md' o 'data/avatars.json'",
                }
            },
            "required": ["filename"],
        },
    },
    {
        "name": "write_output_file",
        "description": "Guarda el batch de contenido generado como archivo markdown con fecha en la carpeta scout-output",
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


def _web_search(query: str) -> str:
    try:
        from ddgs import DDGS

        results = list(DDGS().text(query, max_results=5))
        if not results:
            return "No se encontraron resultados para esta búsqueda."
        lines = []
        for r in results:
            lines.append(
                f"Título: {r.get('title', '')}\nURL: {r.get('href', '')}\nSnippet: {r.get('body', '')}\n"
            )
        return "\n".join(lines)
    except Exception as e:
        return f"Error de búsqueda: {e}"


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
        output_dir = brand_dir / "scout-output"
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
        return f"scout-output/{filename}"
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
    if name == "web_search":
        return _web_search(inputs["query"])
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
            max_tokens=8096,
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
                full_path = brand_dir / output_file
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
