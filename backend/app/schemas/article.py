from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ArticleListItem(BaseModel):
    id: str
    title: str
    source_type: str = Field(serialization_alias="sourceType")
    topic: str | None = None
    difficulty: str | None = None
    estimated_reading_minutes: int | None = Field(default=None, serialization_alias="estimatedReadingMinutes")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    last_read_at: datetime | None = Field(default=None, serialization_alias="lastReadAt")


class ArticleListResponse(BaseModel):
    items: list[ArticleListItem]


class ArticleDetailResponse(BaseModel):
    article: dict[str, Any]


class ArticleAnalyzeRequest(BaseModel):
    title: str | None = None
    raw_text: str = Field(validation_alias="rawText", min_length=1)


class ArticleAnalyzeResponse(BaseModel):
    article_id: str = Field(serialization_alias="articleId")
    status: str


class ArticleAnalysisStatusResponse(BaseModel):
    article_id: str = Field(serialization_alias="articleId")
    status: str
    error_message: str | None = Field(default=None, serialization_alias="errorMessage")
