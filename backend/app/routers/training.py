from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.training import TrainingGenerateRequest, TrainingSetResponse
from app.services.training_service import get_or_generate_kaoyan_training

router = APIRouter(prefix="/api/articles", tags=["training"])


@router.post("/{article_id}/training/kaoyan", response_model=TrainingSetResponse)
def generate_kaoyan_training_for_article(
    article_id: str,
    payload: TrainingGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_or_generate_kaoyan_training(
        db=db,
        user=current_user,
        article_id=article_id,
        force_regenerate=payload.force_regenerate,
    )
