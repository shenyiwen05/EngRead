from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class FavoriteCreateRequest(BaseModel):
    article_id: str = Field(alias="articleId")
    item_type: str = Field(alias="itemType")
    item_id: str = Field(alias="itemId")
    snapshot: dict[str, Any]


class FavoriteResponse(BaseModel):
    id: str
    article_id: str = Field(serialization_alias="articleId")
    article_title: str = Field(serialization_alias="articleTitle")
    item_type: str = Field(serialization_alias="itemType")
    item_id: str = Field(serialization_alias="itemId")
    snapshot: dict[str, Any]
    created_at: datetime = Field(serialization_alias="createdAt")


class FavoriteListResponse(BaseModel):
    items: list[FavoriteResponse]
