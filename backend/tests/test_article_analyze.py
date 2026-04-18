from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.analysis_log import AnalysisLog
from app.models.article import Article
from app.services import article_service


IMPORT_TEXT = (
    "Small firms are facing a difficult year as borrowing costs remain high and customers delay purchases. "
    "Many owners say the pressure is manageable, but they are watching cash flow more closely than before. "
    "Analysts expect conditions to improve gradually if inflation keeps falling and banks become less cautious. "
    "For now, companies are trying to protect staff, reduce waste, and focus on clients who still need essential services. "
    "That strategy is not dramatic, but it gives smaller businesses a practical way to survive uncertain months."
)


def register_and_login(client: TestClient, email: str):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "nickname": email.split("@")[0]},
    )
    return response.json()["accessToken"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def current_user_id(client: TestClient, token: str):
    response = client.get("/api/auth/me", headers=auth_headers(token))
    return response.json()["id"]


def analyzed_payload(title: str, raw_text: str):
    first_sentence = raw_text.split(".")[0] + "."
    return {
        "title": title,
        "topic": "Business",
        "difficulty": "B2",
        "estimatedReadingMinutes": 3,
        "paragraphs": [
            {
                "id": "p1",
                "order": 1,
                "originalText": raw_text,
                "sentences": [
                    {
                        "id": "s1",
                        "order": 1,
                        "text": first_sentence,
                        "translation": "小公司正面临艰难的一年。",
                        "isLongSentence": False,
                        "tokens": [],
                        "phrases": [],
                    }
                ],
            }
        ],
        "review": {
            "keyPhrases": [],
            "familiarButShiftedWords": [],
            "longSentences": [],
            "summary": "Small firms are under financial pressure.",
        },
    }


def test_analyze_creates_draft_article_and_queues_background_analysis(client: TestClient, monkeypatch):
    token = register_and_login(client, "importer@example.com")
    user_id = current_user_id(client, token)
    scheduled: list[str] = []

    def fake_analyze_article_text(raw_text: str, title: str | None = None):
        raise AssertionError("AI should not run before the draft response is returned")

    monkeypatch.setattr("app.services.article_service.analyze_article_text", fake_analyze_article_text, raising=False)
    monkeypatch.setattr(
        "app.routers.articles.schedule_article_analysis",
        lambda background_tasks, article_id: scheduled.append(article_id),
        raising=False,
    )

    response = client.post(
        "/api/articles/analyze",
        json={"title": "My Imported Article", "rawText": IMPORT_TEXT},
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    article_id = body["articleId"]
    assert body["status"] == "analyzing"
    assert scheduled == [article_id]

    detail_response = client.get(f"/api/articles/{article_id}", headers=auth_headers(token))
    assert detail_response.status_code == 200
    article = detail_response.json()["article"]
    assert article["id"] == article_id
    assert article["ownerId"] == user_id
    assert article["sourceType"] == "user_imported"
    assert article["analysisStatus"] == "analyzing"
    assert article["title"] == "My Imported Article"
    assert article["paragraphs"][0]["originalText"] == IMPORT_TEXT
    assert article["paragraphs"][0]["sentences"][0]["translation"] == ""
    assert article["paragraphs"][0]["sentences"][0]["tokens"] == []

    status_response = client.get(f"/api/articles/{article_id}/analysis-status", headers=auth_headers(token))
    assert status_response.status_code == 200
    assert status_response.json() == {"articleId": article_id, "status": "analyzing", "errorMessage": None}

    with SessionLocal() as db:
        stored = db.get(Article, article_id)
        assert stored is not None
        assert stored.owner_id == user_id
        assert stored.source_type == "user_imported"
        assert stored.raw_text == IMPORT_TEXT
        assert stored.analysis_status == "analyzing"
        log = db.query(AnalysisLog).filter(AnalysisLog.article_id == article_id).one()
        assert log.user_id == user_id
        assert log.status == "running"


def test_background_analysis_marks_article_ready_and_detail_uses_cached_analysis(client: TestClient, monkeypatch):
    token = register_and_login(client, "ready@example.com")
    calls: list[str] = []

    def fake_analyze_article_text(raw_text: str, title: str | None = None):
        calls.append(raw_text)
        return analyzed_payload(title or "Untitled", raw_text)

    monkeypatch.setattr("app.services.article_service.analyze_article_text", fake_analyze_article_text, raising=False)
    monkeypatch.setattr("app.routers.articles.schedule_article_analysis", lambda background_tasks, article_id: None, raising=False)

    response = client.post(
        "/api/articles/analyze",
        json={"title": "Ready Article", "rawText": IMPORT_TEXT},
        headers=auth_headers(token),
    )
    article_id = response.json()["articleId"]

    article_service.run_article_analysis(article_id)

    status_response = client.get(f"/api/articles/{article_id}/analysis-status", headers=auth_headers(token))
    assert status_response.status_code == 200
    assert status_response.json() == {"articleId": article_id, "status": "ready", "errorMessage": None}

    detail_response = client.get(f"/api/articles/{article_id}", headers=auth_headers(token))
    assert detail_response.status_code == 200
    article = detail_response.json()["article"]
    assert article["analysisStatus"] == "ready"
    assert article["title"] == "Ready Article"
    assert article["paragraphs"][0]["sentences"][0]["translation"] == "小公司正面临艰难的一年。"
    assert calls == [IMPORT_TEXT]

    with SessionLocal() as db:
        stored = db.get(Article, article_id)
        assert stored is not None
        assert stored.analysis_status == "ready"
        log = db.query(AnalysisLog).filter(AnalysisLog.article_id == article_id).one()
        assert log.status == "success"


def test_background_analysis_failure_keeps_draft_article_and_records_failed_log(client: TestClient, monkeypatch):
    token = register_and_login(client, "failure@example.com")

    def fake_analyze_article_text(raw_text: str, title: str | None = None):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr("app.services.article_service.analyze_article_text", fake_analyze_article_text, raising=False)
    monkeypatch.setattr("app.routers.articles.schedule_article_analysis", lambda background_tasks, article_id: None, raising=False)

    response = client.post(
        "/api/articles/analyze",
        json={"title": "Will Fail", "rawText": IMPORT_TEXT},
        headers=auth_headers(token),
    )
    article_id = response.json()["articleId"]

    article_service.run_article_analysis(article_id)

    status_response = client.get(f"/api/articles/{article_id}/analysis-status", headers=auth_headers(token))
    assert status_response.status_code == 200
    assert status_response.json() == {
        "articleId": article_id,
        "status": "failed",
        "errorMessage": "文章分析失败，请稍后重试",
    }

    detail_response = client.get(f"/api/articles/{article_id}", headers=auth_headers(token))
    assert detail_response.status_code == 200
    article = detail_response.json()["article"]
    assert article["analysisStatus"] == "failed"
    assert article["paragraphs"][0]["originalText"] == IMPORT_TEXT

    with SessionLocal() as db:
        stored = db.get(Article, article_id)
        assert stored is not None
        assert stored.source_type == "user_imported"
        assert stored.analysis_status == "failed"
        assert stored.analysis_error_message == "文章分析失败，请稍后重试"
        log = db.query(AnalysisLog).filter(AnalysisLog.article_id == article_id).one()
        assert log.status == "failed"
        assert log.error_message == "provider unavailable"


def test_background_analysis_invalid_ai_output_keeps_failed_draft_article(client: TestClient, monkeypatch):
    token = register_and_login(client, "invalid-output@example.com")

    def fake_analyze_article_text(raw_text: str, title: str | None = None):
        return {"title": "Broken", "paragraphs": []}

    monkeypatch.setattr("app.services.article_service.analyze_article_text", fake_analyze_article_text, raising=False)
    monkeypatch.setattr("app.routers.articles.schedule_article_analysis", lambda background_tasks, article_id: None, raising=False)

    response = client.post(
        "/api/articles/analyze",
        json={"title": "Broken", "rawText": IMPORT_TEXT},
        headers=auth_headers(token),
    )
    article_id = response.json()["articleId"]

    article_service.run_article_analysis(article_id)

    with SessionLocal() as db:
        stored = db.get(Article, article_id)
        assert stored is not None
        assert stored.analysis_status == "failed"
        log = db.query(AnalysisLog).filter(AnalysisLog.article_id == article_id).one()
        assert log.status == "failed"
        assert "review" in log.error_message


def test_analyze_rejects_article_with_fewer_than_80_english_words(client: TestClient, monkeypatch):
    token = register_and_login(client, "short-import@example.com")
    monkeypatch.setattr("app.routers.articles.schedule_article_analysis", lambda background_tasks, article_id: None, raising=False)

    response = client.post(
        "/api/articles/analyze",
        json={"title": "Too Short", "rawText": "This article is too short."},
        headers=auth_headers(token),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "文章少于 80 个英文词，暂不开始分析。"


def test_analyze_rejects_article_with_more_than_2500_english_words(client: TestClient, monkeypatch):
    token = register_and_login(client, "long-import@example.com")
    monkeypatch.setattr("app.routers.articles.schedule_article_analysis", lambda background_tasks, article_id: None, raising=False)
    raw_text = " ".join(["market"] * 2501)

    response = client.post(
        "/api/articles/analyze",
        json={"title": "Too Long", "rawText": raw_text},
        headers=auth_headers(token),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "文章超过 2500 个英文词，请先缩短。"
