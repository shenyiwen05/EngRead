from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.article import (
    ArticleAnalyzeRequest,
    ArticleAnalyzeResponse,
    ArticleAnalysisStatusResponse,
    ArticleDetailResponse,
    ArticleListItem,
    ArticleListResponse,
)
from app.services.article_service import (
    article_to_detail,
    create_imported_article_draft,
    delete_article_for_user,
    get_article_analysis_status_for_user,
    get_article_for_user,
    list_visible_articles,
    mark_article_read,
    run_article_analysis,
)

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("", response_model=ArticleListResponse)
def list_articles(
    sourceType: str = "all",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    articles = list_visible_articles(db, current_user, sourceType)
    return ArticleListResponse(items=[ArticleListItem.model_validate(article, from_attributes=True) for article in articles])


@router.post("/analyze", response_model=ArticleAnalyzeResponse)
def analyze_article(
    payload: ArticleAnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = create_imported_article_draft(db, current_user, payload)
    schedule_article_analysis(background_tasks, article.id)
    return ArticleAnalyzeResponse(article_id=article.id, status=article.analysis_status)


def schedule_article_analysis(background_tasks: BackgroundTasks, article_id: str) -> None:
    background_tasks.add_task(run_article_analysis, article_id)


@router.get("/{article_id}/analysis-status", response_model=ArticleAnalysisStatusResponse)
def get_article_analysis_status(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = get_article_analysis_status_for_user(db, article_id, current_user)
    return ArticleAnalysisStatusResponse(
        article_id=article.id,
        status=article.analysis_status,
        error_message=article.analysis_error_message,
    )


@router.get("/{article_id}", response_model=ArticleDetailResponse)
def get_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = get_article_for_user(db, article_id, current_user)
    article = mark_article_read(db, article)
    return ArticleDetailResponse(article=article_to_detail(article))


@router.delete("/{article_id}")
def delete_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_article_for_user(db, article_id, current_user)
    return {"ok": True}
