from app.ai.training_prompts import build_kaoyan_training_messages
from app.models.training import ArticleTrainingSet
from app.schemas.training import TrainingSetResponse
from fastapi.testclient import TestClient


def test_training_model_has_expected_table_name():
    assert ArticleTrainingSet.__tablename__ == "article_training_sets"


def test_training_response_serializes_camel_case_fields():
    response = TrainingSetResponse(
        id="set1",
        article_id="article1",
        exam_profile="kaoyan",
        question_count=1,
        questions=[
            {
                "id": "q1",
                "order": 1,
                "questionType": "detail",
                "testedAbility": "detail_location",
                "stem": "What does the author suggest?",
                "options": [
                    {"label": "A", "text": "A correct option", "sourceSentenceIds": ["s1"], "role": "correct_evidence"},
                    {"label": "B", "text": "A wrong option", "sourceSentenceIds": ["s2"], "role": "distractor_evidence"},
                    {"label": "C", "text": "Unsupported", "sourceSentenceIds": [], "role": "unsupported"},
                    {"label": "D", "text": "Another wrong option", "sourceSentenceIds": ["s3"], "role": "distractor_evidence"},
                ],
                "answer": "A",
                "sourceSentenceIds": ["s1"],
                "explanation": "定位第 1 句。",
                "trapAnalysis": {"B": "偷换概念", "C": "原文未支持", "D": "扩大范围"},
            }
        ],
        created_at="2026-04-25T00:00:00Z",
        updated_at="2026-04-25T00:00:00Z",
    )

    payload = response.model_dump(by_alias=True)
    assert payload["articleId"] == "article1"
    assert payload["examProfile"] == "kaoyan"
    assert payload["questionCount"] == 1


def test_kaoyan_training_prompt_contains_rule_library_and_article_sentences():
    article = {
        "title": "Market Pressure",
        "paragraphs": [
            {
                "id": "p1",
                "order": 1,
                "sentences": [
                    {"id": "s1", "order": 1, "text": "Firms are under pressure.", "translation": "企业承压。"},
                ],
            }
        ],
    }

    messages = build_kaoyan_training_messages(article)
    joined = "\n".join(message["content"] for message in messages)

    assert "考研阅读命题人" in joined
    assert "detail" in joined
    assert "concept_swap" in joined
    assert "s1" in joined
    assert "Firms are under pressure." in joined


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def _register_user(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "nickname": email.split("@")[0], "inviteCode": "sywww"},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def _first_sample_article_id(client: TestClient, token: str) -> str:
    response = client.get("/api/articles?sourceType=sample", headers=_auth_headers(token))
    assert response.status_code == 200
    return response.json()["items"][0]["id"]


def _fake_training_payload(article):
    first_sentence_id = article["paragraphs"][0]["sentences"][0]["id"]
    return {
        "questions": [
            {
                "id": "q1",
                "order": 1,
                "questionType": "detail",
                "testedAbility": "detail_location",
                "stem": "According to the passage, what can be learned?",
                "options": [
                    {"label": "A", "text": "The supported answer.", "sourceSentenceIds": [first_sentence_id], "role": "correct_evidence"},
                    {"label": "B", "text": "A concept swap.", "sourceSentenceIds": [first_sentence_id], "role": "distractor_evidence"},
                    {"label": "C", "text": "An unsupported claim.", "sourceSentenceIds": [], "role": "unsupported"},
                    {"label": "D", "text": "An expanded claim.", "sourceSentenceIds": [first_sentence_id], "role": "distractor_evidence"},
                ],
                "answer": "A",
                "sourceSentenceIds": [first_sentence_id],
                "explanation": "定位原文第 1 句。",
                "trapAnalysis": {"B": "偷换概念", "C": "原文未支持", "D": "扩大范围"},
            }
        ]
    }


def _patch_training_generation(monkeypatch, fake_training):
    try:
        from app.services import training_service
    except ImportError:
        return
    monkeypatch.setattr(training_service, "generate_kaoyan_training", fake_training)


def test_generate_kaoyan_training_for_visible_article(client: TestClient, monkeypatch):
    token = _register_user(client, "kaoyan-training@example.com")
    article_id = _first_sample_article_id(client, token)
    _patch_training_generation(monkeypatch, _fake_training_payload)

    response = client.post(
        f"/api/articles/{article_id}/training/kaoyan",
        headers=_auth_headers(token),
        json={"forceRegenerate": False},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["articleId"] == article_id
    assert payload["examProfile"] == "kaoyan"
    assert payload["questionCount"] == 1
    assert payload["questions"][0]["answer"] == "A"


def test_kaoyan_training_uses_cached_set_without_regeneration(client: TestClient, monkeypatch):
    token = _register_user(client, "kaoyan-cache@example.com")
    article_id = _first_sample_article_id(client, token)
    calls = {"count": 0}

    def fake_training(article):
        calls["count"] += 1
        return _fake_training_payload(article)

    _patch_training_generation(monkeypatch, fake_training)
    first = client.post(f"/api/articles/{article_id}/training/kaoyan", headers=_auth_headers(token), json={})
    second = client.post(f"/api/articles/{article_id}/training/kaoyan", headers=_auth_headers(token), json={})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert calls["count"] == 1
