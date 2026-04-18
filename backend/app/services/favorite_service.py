from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.favorite import Favorite
from app.models.user import User
from app.services.article_service import get_article_for_user

VALID_FAVORITE_TYPES = {"word", "phrase", "sentence"}


def validate_item_type(item_type: str) -> None:
    if item_type not in VALID_FAVORITE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="收藏类型不正确")


def create_favorite_for_user(
    db: Session,
    user: User,
    article_id: str,
    item_type: str,
    item_id: str,
    snapshot: dict[str, Any],
) -> Favorite:
    validate_item_type(item_type)
    article = get_article_for_user(db, article_id, user)

    existing = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.article_id == article.id,
            Favorite.item_type == item_type,
            Favorite.item_id == item_id,
        )
    )
    if existing:
        existing.article = article
        return existing

    favorite = Favorite(
        user_id=user.id,
        article_id=article.id,
        item_type=item_type,
        item_id=item_id,
        snapshot=snapshot,
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    favorite.article = article
    return favorite


def list_favorites_for_user(db: Session, user: User, item_type: str = "all") -> list[Favorite]:
    if item_type != "all":
        validate_item_type(item_type)

    statement = select(Favorite).where(Favorite.user_id == user.id).order_by(Favorite.created_at.desc())
    if item_type != "all":
        statement = statement.where(Favorite.item_type == item_type)

    return list(db.scalars(statement).all())


def delete_favorite_for_user(db: Session, user: User, favorite_id: str) -> None:
    favorite = db.get(Favorite, favorite_id)
    if not favorite or favorite.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="收藏不存在")

    db.delete(favorite)
    db.commit()
