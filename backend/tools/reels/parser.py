"""
Parse Director output markdown files into structured Reel data.

Director output format reference:
    ## Reel N — Category — Avatar — Lever
    **Concept:** ...
    **Total length:** 24s (3 scenes × 8s)
    **Voice direction (overall):** ...

    #### Scene 1 (0:00–0:08)
    **Setting:** ...
    **Mascot expression:** smug
    **Tone id:** deadpan
    **Dialogue:** "..."
    **On-screen text:** "..."
    **Animation hint:** ...

    #### Scene 2 ...

    **Hashtags:** ...
    **Rationale:** ...
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Scene:
    number: int
    setting: str
    expression: str
    tone_id: str
    dialogue: str
    animation_hint: str


@dataclass
class Reel:
    number: int
    category: str
    avatar: str
    lever: str
    concept: str
    total_length: str
    voice_direction: str = ""
    caption: str = ""
    scenes: list[Scene] = field(default_factory=list)
    hashtags: str = ""
    rationale: str = ""

    @property
    def slug(self) -> str:
        slug_parts = [f"reel-{self.number}"]
        for s in [self.category.split(":")[0], self.lever]:
            clean = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
            if clean:
                slug_parts.append(clean)
        return "-".join(slug_parts)[:60]


REEL_HEADER_RE = re.compile(
    r"^##\s+Reel\s+(\d+)\s+[—-]\s+(.+?)\s+[—-]\s+(.+?)\s+[—-]\s+(.+?)\s*$",
    re.MULTILINE,
)

SCENE_HEADER_RE = re.compile(
    r"^#{3,4}\s+Scene\s+(\d+)\b.*$",
    re.MULTILINE,
)


def parse_director_file(path: Path) -> list[Reel]:
    if not path.exists():
        raise FileNotFoundError(f"Director file not found: {path}")
    text = path.read_text(encoding="utf-8")
    headers = list(REEL_HEADER_RE.finditer(text))
    if not headers:
        return []
    reels: list[Reel] = []
    for i, m in enumerate(headers):
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        body = text[start:end]

        reel = Reel(
            number=int(m.group(1)),
            category=m.group(2).strip(),
            avatar=m.group(3).strip(),
            lever=m.group(4).strip(),
            concept=_extract_field(body, "Concept"),
            total_length=_extract_field(body, "Total length"),
            voice_direction=_extract_field(body, r"Voice direction(?:\s*\(overall\))?"),
            caption=_extract_field(body, "Caption"),
            scenes=_extract_scenes(body),
            hashtags=_extract_field(body, "Hashtags"),
            rationale=_extract_field(body, "Rationale"),
        )
        reels.append(reel)
    return reels


def _extract_field(body: str, field_name: str) -> str:
    pattern = rf"\*\*{field_name}:\*\*\s*(.+?)(?=\n\s*\*\*|\n\s*####|\n\s*---|\Z)"
    m = re.search(pattern, body, re.DOTALL)
    if not m:
        return ""
    return m.group(1).strip().strip('"')


def _extract_scenes(body: str) -> list[Scene]:
    scenes: list[Scene] = []
    headers = list(SCENE_HEADER_RE.finditer(body))
    for i, m in enumerate(headers):
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(body)
        scene_body = body[start:end]

        scenes.append(Scene(
            number=int(m.group(1)),
            setting=_extract_field(scene_body, "Setting"),
            expression=_extract_field(scene_body, r"Mascot expression"),
            tone_id=_extract_field(scene_body, r"Tone id"),
            dialogue=_extract_field(scene_body, "Dialogue"),
            animation_hint=_extract_field(scene_body, r"Animation hint"),
        ))
    scenes.sort(key=lambda s: s.number)
    return scenes
