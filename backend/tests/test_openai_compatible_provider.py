import pytest

from app.ai.providers.openai_compatible import OpenAICompatibleProvider


class FakeResponse:
    def __init__(self, finish_reason="stop"):
        self.payload = {
            "choices": [
                {
                    "finish_reason": finish_reason,
                    "message": {
                        "content": """
                        {
                          "title": "Smoke",
                          "paragraphs": [
                            {
                              "id": "p1",
                              "sentences": [
                                {
                                  "id": "s1",
                                  "text": "Small firms come under pressure.",
                                  "translation": "小公司承压。",
                                  "tokens": [],
                                  "phrases": []
                                }
                              ]
                            }
                          ],
                          "review": {
                            "keyPhrases": [],
                            "familiarButShiftedWords": [],
                            "longSentences": [],
                            "summary": "Small firms are under pressure."
                          }
                        }
                        """
                    }
                }
            ]
        }

    def raise_for_status(self):
        pass

    def json(self):
        return self.payload


class FakeClient:
    def __init__(self, finish_reason="stop"):
        self.request_json = None
        self.finish_reason = finish_reason

    def post(self, url, headers, json):
        self.request_json = json
        return FakeResponse(finish_reason=self.finish_reason)


class SmokeProvider(OpenAICompatibleProvider):
    api_url = "https://example.test/chat/completions"


def test_provider_disables_qwen_thinking_and_allows_larger_output_tokens(monkeypatch):
    client = FakeClient()
    monkeypatch.setattr("app.ai.providers.openai_compatible.settings.ai_max_tokens", 8192)
    provider = SmokeProvider(api_key="secret", model_name="qwen3.6-plus", client=client)

    provider.analyze_article("Small firms come under pressure.", title="Smoke")

    assert client.request_json["enable_thinking"] is False
    assert client.request_json["max_tokens"] == 8192
    assert client.request_json["response_format"] == {"type": "json_object"}


def test_provider_uses_configured_read_timeout(monkeypatch):
    monkeypatch.setattr("app.ai.providers.openai_compatible.settings.ai_timeout_seconds", 420)

    provider = SmokeProvider(api_key="secret", model_name="qwen3.6-plus")

    assert provider.client.timeout.read == 420


def test_provider_reports_truncated_model_output_before_json_parse():
    client = FakeClient(finish_reason="length")
    provider = SmokeProvider(api_key="secret", model_name="qwen3.6-plus", client=client)

    with pytest.raises(RuntimeError, match="AI 输出被截断"):
        provider.analyze_article("Small firms come under pressure.", title="Smoke")
