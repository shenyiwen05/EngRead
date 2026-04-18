import pytest

from app.ai.prompts import build_analysis_messages
from app.services import ai_service


class FakeProvider:
    calls = []

    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name

    def analyze_article(self, raw_text: str, title: str | None = None):
        self.calls.append((self.api_key, self.model_name, raw_text, title))
        return {"title": title or "Untitled", "paragraphs": [], "review": {"summary": ""}}


def test_build_analysis_messages_enforce_structured_reader_contract():
    messages = build_analysis_messages("Small firms come under pressure.", title="Market Note")
    content = "\n".join(message["content"] for message in messages)

    assert "strict JSON" in content
    assert "paragraphs" in content
    assert "sentences" in content
    assert "phraseId" in content
    assert "不要编造" in content
    assert "只为可点击的重点词" in content
    assert "普通重点词 token 必须包含 explanation" in content
    assert "每 100 个英文词目标提供 6 到 10 个可点击学习点" in content
    assert "每个自然段通常提供 4 到 8 个可点击学习点" in content
    assert "信息量高的句子可以选择 1 个词组和 2 个重点词" in content
    assert "外刊高频动词" in content
    assert "不要为冠词、普通代词、普通介词" in content
    assert "省略空数组之外的空字段" in content
    assert "不超过 20 个汉字" in content
    assert "阅读、点击、展开时不得再次调用 AI" in content


def test_analyze_article_text_selects_deepseek_provider(monkeypatch):
    FakeProvider.calls = []
    monkeypatch.setattr(ai_service.settings, "ai_provider", "deepseek")
    monkeypatch.setattr(ai_service.settings, "ai_api_key", "secret")
    monkeypatch.setattr(ai_service.settings, "ai_model_name", "deepseek-chat")
    monkeypatch.setattr(ai_service, "DeepSeekProvider", FakeProvider)

    result = ai_service.analyze_article_text("Small firms come under pressure.", title="Market Note")

    assert result["title"] == "Market Note"
    assert FakeProvider.calls == [("secret", "deepseek-chat", "Small firms come under pressure.", "Market Note")]


def test_analyze_article_text_selects_qwen_provider(monkeypatch):
    FakeProvider.calls = []
    monkeypatch.setattr(ai_service.settings, "ai_provider", "qwen")
    monkeypatch.setattr(ai_service.settings, "ai_api_key", "secret")
    monkeypatch.setattr(ai_service.settings, "ai_model_name", "qwen-plus")
    monkeypatch.setattr(ai_service, "QwenProvider", FakeProvider)

    result = ai_service.analyze_article_text("Small firms come under pressure.")

    assert result["title"] == "Untitled"
    assert FakeProvider.calls == [("secret", "qwen-plus", "Small firms come under pressure.", None)]


def test_analyze_article_text_requires_api_key(monkeypatch):
    monkeypatch.setattr(ai_service.settings, "ai_provider", "deepseek")
    monkeypatch.setattr(ai_service.settings, "ai_api_key", "")
    monkeypatch.setattr(ai_service.settings, "ai_model_name", "deepseek-chat")

    with pytest.raises(RuntimeError, match="AI_API_KEY"):
        ai_service.analyze_article_text("Small firms come under pressure.")
