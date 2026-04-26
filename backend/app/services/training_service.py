from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.training import ArticleTrainingSet
from app.models.user import User
from app.schemas.training import TrainingSetResponse
from app.services.ai_service import generate_kaoyan_training
from app.services.article_service import get_article_for_user


def _response_from_model(training_set: ArticleTrainingSet) -> TrainingSetResponse:
    questions = training_set.payload["questions"]
    return TrainingSetResponse(
        id=training_set.id,
        article_id=training_set.article_id,
        exam_profile="kaoyan",
        question_count=len(questions),
        questions=questions,
        created_at=training_set.created_at,
        updated_at=training_set.updated_at,
    )


def get_or_generate_kaoyan_training(
    db: Session,
    user: User,
    article_id: str,
    force_regenerate: bool = False,
) -> TrainingSetResponse:
    article = get_article_for_user(db, article_id, user)
    existing = db.scalar(
        select(ArticleTrainingSet).where(
            ArticleTrainingSet.article_id == article.id,
            ArticleTrainingSet.owner_id == user.id,
            ArticleTrainingSet.exam_profile == "kaoyan",
        )
    )

    if existing and not force_regenerate:
        return _response_from_model(existing)

    payload = generate_kaoyan_training(article.analyzed_data)
    if existing:
        existing.payload = payload
        db.commit()
        db.refresh(existing)
        return _response_from_model(existing)

    training_set = ArticleTrainingSet(
        article_id=article.id,
        owner_id=user.id,
        exam_profile="kaoyan",
        payload=payload,
    )
    db.add(training_set)
    db.commit()
    db.refresh(training_set)
    return _response_from_model(training_set)
