from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.favorite import Favorite
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.favorite import FavoriteCreateRequest, FavoriteListResponse, FavoriteResponse
from app.services.favorite_service import create_favorite_for_user, delete_favorite_for_user, list_favorites_for_user

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


def favorite_to_response(favorite: Favorite) -> FavoriteResponse:
    return FavoriteResponse(
        id=favorite.id,
        article_id=favorite.article_id,
        article_title=favorite.article.title if favorite.article else "",
        item_type=favorite.item_type,
        item_id=favorite.item_id,
        snapshot=favorite.snapshot,
        created_at=favorite.created_at,
    )


@router.post("", response_model=FavoriteResponse)
def create_favorite(
    payload: FavoriteCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = create_favorite_for_user(
        db,
        current_user,
        article_id=payload.article_id,
        item_type=payload.item_type,
        item_id=payload.item_id,
        snapshot=payload.snapshot,
    )
    return favorite_to_response(favorite)


@router.get("", response_model=FavoriteListResponse)
def list_favorites(
    itemType: str = "all",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorites = list_favorites_for_user(db, current_user, itemType)
    return FavoriteListResponse(items=[favorite_to_response(favorite) for favorite in favorites])


@router.delete("/{favorite_id}")
def delete_favorite(
    favorite_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_favorite_for_user(db, current_user, favorite_id)
    return {"ok": True}
