from typing import Any

from app.config import settings
from app.ai.providers.base import AnalysisProvider
from app.ai.providers.deepseek_provider import DeepSeekProvider
from app.ai.providers.qwen_provider import QwenProvider


def get_analysis_provider() -> AnalysisProvider:
    provider_name = settings.ai_provider.strip().lower()
    if not provider_name:
        raise RuntimeError("AI_PROVIDER 未配置")

    if not settings.ai_api_key:
        raise RuntimeError("AI_API_KEY 未配置")

    if not settings.ai_model_name:
        raise RuntimeError("AI_MODEL_NAME 未配置")

    if provider_name == "deepseek":
        return DeepSeekProvider(api_key=settings.ai_api_key, model_name=settings.ai_model_name)

    if provider_name == "qwen":
        return QwenProvider(api_key=settings.ai_api_key, model_name=settings.ai_model_name)

    raise RuntimeError(f"暂不支持 AI provider: {settings.ai_provider}")


def analyze_article_text(raw_text: str, title: str | None = None) -> dict[str, Any]:
    return get_analysis_provider().analyze_article(raw_text, title=title)
