from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.article import Article


def minimal_article_data(article_id: str, title: str, owner_id: str | None, source_type: str):
    return {
        "id": article_id,
        "ownerId": owner_id,
        "title": title,
        "sourceType": source_type,
        "createdAt": "2026-04-18T00:00:00Z",
        "updatedAt": "2026-04-18T00:00:00Z",
        "paragraphs": [],
        "review": {
            "keyPhrases": [],
            "familiarButShiftedWords": [],
            "longSentences": [],
            "summary": "",
        },
    }


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


def create_imported_article(owner_id: str, title: str):
    with SessionLocal() as db:
      article = Article(
          owner_id=owner_id,
          source_type="user_imported",
          title=title,
          analyzed_data=minimal_article_data("placeholder", title, owner_id, "user_imported"),
      )
      db.add(article)
      db.flush()
      article.analyzed_data = minimal_article_data(article.id, title, owner_id, "user_imported")
      db.commit()
      return article.id


def test_logged_in_user_can_read_sample_article(client: TestClient):
    token = register_and_login(client, "reader@example.com")

    list_response = client.get("/api/articles", headers=auth_headers(token))

    assert list_response.status_code == 200
    items = list_response.json()["items"]
    sample = next(item for item in items if item["sourceType"] == "sample")

    detail_response = client.get(f"/api/articles/{sample['id']}", headers=auth_headers(token))
    assert detail_response.status_code == 200
    assert detail_response.json()["article"]["sourceType"] == "sample"


def test_get_article_updates_last_read_at_for_visible_article(client: TestClient):
    token = register_and_login(client, "last-read@example.com")
    list_response = client.get("/api/articles?sourceType=sample", headers=auth_headers(token))
    assert list_response.status_code == 200
    sample = list_response.json()["items"][0]
    assert sample["lastReadAt"] is None

    detail_response = client.get(f"/api/articles/{sample['id']}", headers=auth_headers(token))

    assert detail_response.status_code == 200
    assert detail_response.json()["article"]["lastReadAt"] is not None
    updated_list_response = client.get("/api/articles?sourceType=sample", headers=auth_headers(token))
    updated = next(item for item in updated_list_response.json()["items"] if item["id"] == sample["id"])
    assert updated["lastReadAt"] is not None


def test_logged_in_user_can_read_own_imported_article(client: TestClient):
    token = register_and_login(client, "owner@example.com")
    article_id = create_imported_article(current_user_id(client, token), "My Article")

    detail_response = client.get(f"/api/articles/{article_id}", headers=auth_headers(token))

    assert detail_response.status_code == 200
    assert detail_response.json()["article"]["title"] == "My Article"


def test_user_receives_403_for_another_users_imported_article(client: TestClient):
    owner_token = register_and_login(client, "owner@example.com")
    other_token = register_and_login(client, "other@example.com")
    article_id = create_imported_article(current_user_id(client, owner_token), "Private Article")

    detail_response = client.get(f"/api/articles/{article_id}", headers=auth_headers(other_token))

    assert detail_response.status_code == 403
    assert detail_response.json()["detail"] == "你没有权限查看该文章"


def test_user_cannot_delete_sample_article(client: TestClient):
    token = register_and_login(client, "reader@example.com")
    list_response = client.get("/api/articles", headers=auth_headers(token))
    sample = next(item for item in list_response.json()["items"] if item["sourceType"] == "sample")

    delete_response = client.delete(f"/api/articles/{sample['id']}", headers=auth_headers(token))

    assert delete_response.status_code == 403
    assert delete_response.json()["detail"] == "不能删除系统示例文章"


def test_user_can_delete_own_imported_article(client: TestClient):
    token = register_and_login(client, "owner@example.com")
    article_id = create_imported_article(current_user_id(client, token), "Disposable")

    delete_response = client.delete(f"/api/articles/{article_id}", headers=auth_headers(token))
    detail_response = client.get(f"/api/articles/{article_id}", headers=auth_headers(token))

    assert delete_response.status_code == 200
    assert delete_response.json() == {"ok": True}
    assert detail_response.status_code == 404
