from fastapi.testclient import TestClient

from app.main import app


def test_invalid_email_returns_message(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={"email": "bad-email", "password": "password123", "nickname": "bad", "inviteCode": "sywww"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "邮箱格式不正确"


def test_short_password_returns_message(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={"email": "reader@example.com", "password": "short", "nickname": "reader", "inviteCode": "sywww"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "密码长度不足"


def test_duplicate_email_returns_message(client: TestClient):
    payload = {"email": "reader@example.com", "password": "password123", "nickname": "reader", "inviteCode": "sywww"}
    first = client.post("/api/auth/register", json=payload)
    second = client.post("/api/auth/register", json=payload)

    assert first.status_code == 200
    assert second.status_code == 400
    assert second.json()["detail"] == "邮箱已被注册"


def test_register_rejects_invalid_invite_code(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={"email": "reader@example.com", "password": "password123", "nickname": "reader", "inviteCode": "wrong"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "邀请码无效"


def test_successful_register_returns_access_token_and_user(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={"email": "reader@example.com", "password": "password123", "nickname": "reader", "inviteCode": "sywww"},
    )

    body = response.json()
    assert response.status_code == 200
    assert body["accessToken"]
    assert body["user"]["email"] == "reader@example.com"
    assert body["user"]["nickname"] == "reader"


def test_invite_code_allows_only_five_registrations(client: TestClient):
    for index in range(5):
        response = client.post(
            "/api/auth/register",
            json={
                "email": f"reader{index}@example.com",
                "password": "password123",
                "nickname": f"reader{index}",
                "inviteCode": "sywww",
            },
        )
        assert response.status_code == 200

    sixth = client.post(
        "/api/auth/register",
        json={"email": "reader5@example.com", "password": "password123", "nickname": "reader5", "inviteCode": "sywww"},
    )

    assert sixth.status_code == 400
    assert sixth.json()["detail"] == "邀请码已用完"


def test_login_failure_returns_message(client: TestClient):
    response = client.post(
        "/api/auth/login",
        json={"email": "reader@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "邮箱或密码错误"


def test_login_success_and_me(client: TestClient):
    client.post(
        "/api/auth/register",
        json={"email": "reader@example.com", "password": "password123", "nickname": "reader", "inviteCode": "sywww"},
    )

    login_response = client.post(
        "/api/auth/login",
        json={"email": "reader@example.com", "password": "password123"},
    )

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "reader@example.com"
