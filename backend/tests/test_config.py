from app.config import Settings


def test_settings_parse_cors_origins_from_environment(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://engread.pages.dev, http://localhost:5173,",
    )

    settings = Settings()

    assert settings.cors_origin_list == ["https://engread.pages.dev", "http://localhost:5173"]
