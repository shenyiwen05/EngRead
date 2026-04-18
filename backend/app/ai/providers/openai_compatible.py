from typing import Any

import httpx

from app.config import settings
from app.ai.parser import parse_ai_analysis
from app.ai.prompts import build_analysis_messages


class OpenAICompatibleProvider:
    api_url: str

    def __init__(self, api_key: str, model_name: str, client: httpx.Client | None = None):
        self.api_key = api_key
        self.model_name = model_name
        timeout = httpx.Timeout(settings.ai_timeout_seconds, connect=15.0)
        self.client = client or httpx.Client(timeout=timeout)

    def analyze_article(self, raw_text: str, title: str | None = None) -> dict[str, Any]:
        response = self.client.post(
            self.api_url,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json={
                "model": self.model_name,
                "messages": build_analysis_messages(raw_text, title=title),
                "temperature": 0.2,
                "max_tokens": settings.ai_max_tokens,
                "enable_thinking": False,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        body = response.json()
        choice = body["choices"][0]
        if choice.get("finish_reason") == "length":
            raise RuntimeError(f"AI 输出被截断，请提高 AI_MAX_TOKENS 或缩短文章后重试（当前 {settings.ai_max_tokens}）")

        content = choice["message"]["content"]
        return parse_ai_analysis(content)
