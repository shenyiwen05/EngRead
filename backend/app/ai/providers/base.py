from typing import Protocol, Any


class AnalysisProvider(Protocol):
    def analyze_article(self, raw_text: str, title: str | None = None) -> dict[str, Any]:
        pass
