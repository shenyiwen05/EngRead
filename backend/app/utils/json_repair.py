import re


def repair_json_text(raw_text: str) -> str:
    text = _strip_markdown_fence(raw_text.strip())
    return re.sub(r",\s*([}\]])", r"\1", text)


def _strip_markdown_fence(raw_text: str) -> str:
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", raw_text, flags=re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return raw_text
