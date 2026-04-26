from typing import Any, Protocol


class AnalysisProvider(Protocol):
    def analyze_article(self, raw_text: str, title: str | None = None) -> dict[str, Any]:
        pass

    def generate_json(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        pass
