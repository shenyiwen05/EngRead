from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+pysqlite:///./context_reader.db"
    jwt_secret_key: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    ai_provider: str = ""
    ai_api_key: str = ""
    ai_model_name: str = ""
    ai_max_tokens: int = 8192

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
