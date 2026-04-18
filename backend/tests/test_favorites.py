from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database import SessionLocal
from app.models.article import Article
from app.models.favorite import Favorite


def register_and_login(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "nickname": email.split("@")[0]},
    )
    return response.json()["accessToken"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def current_user_id(client: TestClient, token: str) -> str:
    response = client.get("/api/auth/me", headers=auth_headers(token))
    return response.json()["id"]


def sample_article(client: TestClient, token: str) -> dict:
    response = client.get("/api/articles", headers=auth_headers(token))
    assert response.status_code == 200
    return next(item for item in response.json()["items"] if item["sourceType"] == "sample")


def create_imported_article(owner_id: str, title: str) -> str:
    raw_text = " ".join(
        [
            "Imported",
            "articles",
            "need",
            "enough",
            "English",
            "words",
            "to",
            "look",
            "like",
            "real",
            "reading",
            "material",
            "for",
            "permission",
            "tests",
            "and",
            "favorite",
            "creation",
            "checks",
            "inside",
            "the",
            "backend",
            "suite",
            "where",
            "ownership",
            "matters",
            "more",
            "than",
            "the",
            "precise",
            "content",
            "of",
            "each",
            "sentence",
            "because",
            "the",
            "article",
            "visibility",
            "helper",
            "decides",
            "whether",
            "a",
            "reader",
            "may",
            "access",
            "private",
            "study",
            "notes",
            "saved",
            "by",
            "another",
            "person",
            "during",
            "their",
            "own",
            "practice",
            "session",
            "with",
            "context",
            "reader",
            "examples",
            "and",
            "annotations",
            "that",
            "should",
            "remain",
            "isolated",
            "from",
            "other",
            "accounts",
            "unless",
            "the",
            "article",
            "is",
            "a",
            "shared",
            "sample",
            "provided",
            "by",
            "the",
            "system",
            "for",
            "everyone",
            "to",
            "read",
            "safely",
            "today",
        ]
    )
    with SessionLocal() as db:
        article = Article(
            owner_id=owner_id,
            source_type="user_imported",
            title=title,
            raw_text=raw_text,
            analyzed_data={
                "id": "placeholder",
                "ownerId": owner_id,
                "title": title,
                "sourceType": "user_imported",
                "paragraphs": [],
                "review": {
                    "keyPhrases": [],
                    "familiarButShiftedWords": [],
                    "longSentences": [],
                    "summary": "",
                },
            },
        )
        db.add(article)
        db.flush()
        article.analyzed_data["id"] = article.id
        db.commit()
        return article.id


def favorite_payload(article_id: str, item_type: str = "word", item_id: str = "w1") -> dict:
    return {
        "articleId": article_id,
        "itemType": item_type,
        "itemId": item_id,
        "snapshot": {"text": "squeeze", "translation": "挤压"},
    }


def test_create_and_list_favorite_for_visible_sample_article_includes_article_title(client: TestClient):
    token = register_and_login(client, "reader@example.com")
    article = sample_article(client, token)

    create_response = client.post(
        "/api/favorites",
        headers=auth_headers(token),
        json=favorite_payload(article["id"]),
    )
    list_response = client.get("/api/favorites", headers=auth_headers(token))

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["articleId"] == article["id"]
    assert created["articleTitle"] == article["title"]
    assert created["itemType"] == "word"
    assert created["itemId"] == "w1"
    assert created["snapshot"] == {"text": "squeeze", "translation": "挤压"}
    assert created["createdAt"]

    assert list_response.status_code == 200
    assert list_response.json() == {"items": [created]}


def test_duplicate_create_returns_same_id_and_keeps_single_favorite_row(client: TestClient):
    token = register_and_login(client, "reader@example.com")
    article = sample_article(client, token)
    payload = favorite_payload(article["id"], item_type="sentence", item_id="s1")

    first = client.post("/api/favorites", headers=auth_headers(token), json=payload)
    second = client.post("/api/favorites", headers=auth_headers(token), json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]
    with SessionLocal() as db:
        rows = db.scalars(select(Favorite)).all()
        assert len(rows) == 1


def test_phrase_list_filter_returns_only_phrase_favorites(client: TestClient):
    token = register_and_login(client, "reader@example.com")
    article = sample_article(client, token)
    word = client.post(
        "/api/favorites",
        headers=auth_headers(token),
        json=favorite_payload(article["id"], item_type="word", item_id="w1"),
    ).json()
    phrase = client.post(
        "/api/favorites",
        headers=auth_headers(token),
        json=favorite_payload(article["id"], item_type="phrase", item_id="p1"),
    ).json()

    response = client.get("/api/favorites?itemType=phrase", headers=auth_headers(token))

    assert word["itemType"] == "word"
    assert response.status_code == 200
    assert response.json() == {"items": [phrase]}


def test_delete_blocks_other_user_with_404_and_owner_can_delete(client: TestClient):
    owner_token = register_and_login(client, "owner@example.com")
    other_token = register_and_login(client, "other@example.com")
    article = sample_article(client, owner_token)
    favorite = client.post(
        "/api/favorites",
        headers=auth_headers(owner_token),
        json=favorite_payload(article["id"]),
    ).json()

    blocked = client.delete(f"/api/favorites/{favorite['id']}", headers=auth_headers(other_token))
    owner_delete = client.delete(f"/api/favorites/{favorite['id']}", headers=auth_headers(owner_token))
    list_response = client.get("/api/favorites", headers=auth_headers(owner_token))

    assert blocked.status_code == 404
    assert blocked.json()["detail"] == "收藏不存在"
    assert owner_delete.status_code == 200
    assert owner_delete.json() == {"ok": True}
    assert list_response.status_code == 200
    assert list_response.json() == {"items": []}


def test_cannot_favorite_another_users_imported_article(client: TestClient):
    owner_token = register_and_login(client, "owner@example.com")
    other_token = register_and_login(client, "other@example.com")
    article_id = create_imported_article(current_user_id(client, owner_token), "Private Practice")

    response = client.post(
        "/api/favorites",
        headers=auth_headers(other_token),
        json=favorite_payload(article_id),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "你没有权限查看该文章"


def test_invalid_item_type_returns_400_message(client: TestClient):
    token = register_and_login(client, "reader@example.com")
    article = sample_article(client, token)

    response = client.post(
        "/api/favorites",
        headers=auth_headers(token),
        json=favorite_payload(article["id"], item_type="paragraph", item_id="p1"),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "收藏类型不正确"
