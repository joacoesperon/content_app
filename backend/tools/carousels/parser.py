"""
Parse Scout output markdown files into structured Post data.

Scout output format reference (strict):
    ## Post N — Category — Avatar — Lever
    **Caption:**
    ...caption text...
    **Slides:** K
    **Slide 1 — Hook:**
    "FAL prompt in quotes..."
    **Slide 2 — Label:**
    "FAL prompt..."
    **Hashtags:** #a #b
    **Rationale:** ...
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Slide:
    number: int
    label: str
    prompt: str


@dataclass
class Post:
    number: int
    category: str
    avatar: str
    lever: str
    caption: str
    slides: list[Slide] = field(default_factory=list)
    hashtags: str = ""
    rationale: str = ""

    @property
    def slug(self) -> str:
        """Slug used for output folder, e.g. 'post-1-persuasion-aspiration'."""
        slug_parts = [f"post-{self.number}"]
        # category word + lever, lowercased, non-alnum → dash
        for s in [self.category.split(":")[0], self.lever]:
            clean = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
            if clean:
                slug_parts.append(clean)
        return "-".join(slug_parts)[:60]


POST_HEADER_RE = re.compile(
    r"^##\s+Post\s+(\d+)\s+[—-]\s+(.+?)\s+[—-]\s+(.+?)\s+[—-]\s+(.+?)\s*$",
    re.MULTILINE,
)


def parse_scout_file(path: Path) -> list[Post]:
    """Parse a Scout markdown file into a list of Post objects."""
    if not path.exists():
        raise FileNotFoundError(f"Scout file not found: {path}")

    text = path.read_text(encoding="utf-8")
    headers = list(POST_HEADER_RE.finditer(text))
    if not headers:
        return []

    posts: list[Post] = []
    for i, m in enumerate(headers):
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        body = text[start:end]

        post = Post(
            number=int(m.group(1)),
            category=m.group(2).strip(),
            avatar=m.group(3).strip(),
            lever=m.group(4).strip(),
            caption=_extract_caption(body),
            slides=_extract_slides(body),
            hashtags=_extract_field(body, "Hashtags"),
            rationale=_extract_field(body, "Rationale"),
        )
        posts.append(post)
    return posts


def _extract_caption(body: str) -> str:
    """Caption lives between **Caption:** and **Slides:**."""
    m = re.search(
        r"\*\*Caption:\*\*\s*\n(.+?)(?=\n\*\*Slides:\*\*|\n\*\*Slide\s+\d+)",
        body,
        re.DOTALL,
    )
    return m.group(1).strip() if m else ""


def _extract_slides(body: str) -> list[Slide]:
    """Find every **Slide N — Label:** followed by a quoted prompt."""
    slides: list[Slide] = []
    # Match: **Slide 1 — Hook:** \n "prompt..."
    # Prompt can span multiple lines, terminated by the closing quote on its own.
    pattern = re.compile(
        r"\*\*Slide\s+(\d+)\s+[—-]\s+([^:*]+?):\*\*\s*\n\"(.+?)\"(?=\s*\n\s*(?:\*\*|$))",
        re.DOTALL,
    )
    for m in pattern.finditer(body):
        num = int(m.group(1))
        label = m.group(2).strip()
        prompt = m.group(3).strip()
        # normalize any internal whitespace
        prompt = re.sub(r"\s+", " ", prompt)
        slides.append(Slide(number=num, label=label, prompt=prompt))
    slides.sort(key=lambda s: s.number)
    return slides


def _extract_field(body: str, field_name: str) -> str:
    m = re.search(
        rf"\*\*{re.escape(field_name)}:\*\*\s*(.+?)(?=\n\*\*|\n---|\Z)",
        body,
        re.DOTALL,
    )
    if not m:
        return ""
    return m.group(1).strip()
