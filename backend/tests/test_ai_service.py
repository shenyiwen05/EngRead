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
    assert "phrase 必须提供 meaningInSentence" in content
    assert "不要只给词组字面意思或留空" in content
    assert "只有当主干、修饰信息、逻辑、阅读提示都能写出实质内容时才输出 breakdown" in content
    assert "不要输出 mainClause 这类英文字段名解释用户" in content


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


class FakeTrainingProvider:
    def generate_json(self, messages):
        assert any("考研阅读命题人" in message["content"] for message in messages)
        return {
            "questions": [
                {
                    "id": "q1",
                    "order": 1,
                    "questionType": "detail",
                    "testedAbility": "detail_location",
                    "stem": "What is suggested?",
                    "options": [
                        {"label": "A", "text": "Correct", "sourceSentenceIds": ["s1"], "role": "correct_evidence"},
                        {"label": "B", "text": "Wrong", "sourceSentenceIds": ["s2"], "role": "distractor_evidence"},
                        {"label": "C", "text": "Unsupported", "sourceSentenceIds": [], "role": "unsupported"},
                        {"label": "D", "text": "Wrong again", "sourceSentenceIds": ["s3"], "role": "distractor_evidence"},
                    ],
                    "answer": "A",
                    "sourceSentenceIds": ["s1"],
                    "explanation": "定位第 1 句。",
                    "trapAnalysis": {"B": "偷换概念", "C": "原文未支持", "D": "扩大范围"},
                }
            ]
        }


def test_generate_kaoyan_training_uses_training_prompt(monkeypatch):
    monkeypatch.setattr(ai_service, "get_analysis_provider", lambda: FakeTrainingProvider())
    article = {
        "title": "Market Pressure",
        "paragraphs": [
            {"id": "p1", "sentences": [{"id": "s1", "text": "Firms are under pressure.", "translation": "企业承压。"}]},
        ],
    }

    result = ai_service.generate_kaoyan_training(article)

    assert result["questions"][0]["questionType"] == "detail"
