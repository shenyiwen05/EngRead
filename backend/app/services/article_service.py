import math
import re
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.config import settings
from app.ai.parser import parse_ai_analysis
from app.database import SessionLocal
from app.models.analysis_log import AnalysisLog
from app.models.article import Article
from app.models.user import User
from app.sample_data import build_sample_article
from app.schemas.article import ArticleAnalyzeRequest
from app.services.ai_service import analyze_article_text


def seed_sample_article(db: Session) -> None:
    existing = db.scalar(select(Article).where(Article.source_type == "sample"))
    if existing:
        return

    article = Article(
        owner_id=None,
        source_type="sample",
        title="Why Small Firms Feel the Squeeze",
        topic="Business",
        difficulty="B2",
        estimated_reading_minutes=4,
        analyzed_data={"pending": True},
    )
    db.add(article)
    db.flush()
    article.analyzed_data = build_sample_article(article.id)
    db.commit()


def visible_articles_statement(user: User, source_type: str | None = None) -> Select[tuple[Article]]:
    statement = select(Article)
    if source_type == "sample":
        statement = statement.where(Article.source_type == "sample")
    elif source_type == "user_imported":
        statement = statement.where(Article.source_type == "user_imported", Article.owner_id == user.id)
    else:
        statement = statement.where(
            (Article.source_type == "sample")
            | ((Article.source_type == "user_imported") & (Article.owner_id == user.id))
        )

    return statement.order_by(Article.created_at.desc())


def list_visible_articles(db: Session, user: User, source_type: str | None = None) -> list[Article]:
    normalized = None if source_type in (None, "all") else source_type
    return list(db.scalars(visible_articles_statement(user, normalized)).all())


def get_article_for_user(db: Session, article_id: str, user: User) -> Article:
    article = db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

    if article.source_type == "sample":
        return article

    if article.owner_id == user.id:
        return article

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="你没有权限查看该文章")


def delete_article_for_user(db: Session, article_id: str, user: User) -> None:
    article = get_article_for_user(db, article_id, user)
    if article.source_type == "sample":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="不能删除系统示例文章")

    db.delete(article)
    db.commit()


def mark_article_read(db: Session, article: Article) -> Article:
    article.last_read_at = datetime.now(timezone.utc)
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def create_imported_article_draft(db: Session, user: User, payload: ArticleAnalyzeRequest) -> Article:
    raw_text = payload.raw_text.strip()
    validate_import_word_count(raw_text)
    title = payload.title.strip() if payload.title else None

    article = Article(
        owner_id=user.id,
        source_type="user_imported",
        title=title or "未命名文章",
        raw_text=raw_text,
        analyzed_data={"pending": True},
        analysis_status="analyzing",
        estimated_reading_minutes=estimate_reading_minutes(raw_text),
    )
    db.add(article)
    db.flush()
    article.analyzed_data = build_draft_analysis(article, raw_text)
    db.add(
        AnalysisLog(
            user_id=user.id,
            article_id=article.id,
            model_name=settings.ai_model_name or settings.ai_provider or None,
            status="running",
        )
    )
    db.commit()
    db.refresh(article)
    return article


def run_article_analysis(article_id: str) -> None:
    with SessionLocal() as db:
        article = db.get(Article, article_id)
        if not article or article.source_type != "user_imported":
            return

        try:
            analyzed_data = parse_ai_analysis(analyze_article_text(article.raw_text or "", title=article.title))
        except Exception as exc:
            article.analysis_status = "failed"
            article.analysis_error_message = "文章分析失败，请稍后重试"
            log = _analysis_log_for_article(db, article)
            log.status = "failed"
            log.error_message = str(exc)
            db.commit()
            return

        article.title = analyzed_data.get("title") or article.title
        article.topic = analyzed_data.get("topic")
        article.difficulty = analyzed_data.get("difficulty")
        article.estimated_reading_minutes = analyzed_data.get("estimatedReadingMinutes")
        article.analysis_status = "ready"
        article.analysis_error_message = None
        article.analyzed_data = with_article_metadata(article, analyzed_data)
        log = _analysis_log_for_article(db, article)
        log.status = "success"
        log.error_message = None
        db.commit()


def _analysis_log_for_article(db: Session, article: Article) -> AnalysisLog:
    log = db.scalar(select(AnalysisLog).where(AnalysisLog.article_id == article.id))
    if log:
        return log

    log = AnalysisLog(
        user_id=article.owner_id,
        article_id=article.id,
        model_name=settings.ai_model_name or settings.ai_provider or None,
        status="running",
    )
    db.add(log)
    db.flush()
    return log


def analyze_imported_article(db: Session, user: User, payload: ArticleAnalyzeRequest) -> Article:
    raw_text = payload.raw_text.strip()
    validate_import_word_count(raw_text)
    title = payload.title.strip() if payload.title else None

    try:
        analyzed_data = parse_ai_analysis(analyze_article_text(raw_text, title=title))
    except Exception as exc:
        db.add(
            AnalysisLog(
                user_id=user.id,
                article_id=None,
                model_name=settings.ai_model_name or settings.ai_provider or None,
                status="failed",
                error_message=str(exc),
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="文章分析失败，请稍后重试",
        ) from exc

    article = Article(
        owner_id=user.id,
        source_type="user_imported",
        title=analyzed_data.get("title") or title or "未命名文章",
        raw_text=raw_text,
        analyzed_data={"pending": True},
        topic=analyzed_data.get("topic"),
        difficulty=analyzed_data.get("difficulty"),
        estimated_reading_minutes=analyzed_data.get("estimatedReadingMinutes"),
    )
    db.add(article)
    db.flush()
    article.analyzed_data = with_article_metadata(article, analyzed_data)
    db.add(
        AnalysisLog(
            user_id=user.id,
            article_id=article.id,
            model_name=settings.ai_model_name or settings.ai_provider or None,
            status="success",
        )
    )
    db.commit()
    db.refresh(article)
    return article


def get_article_analysis_status_for_user(db: Session, article_id: str, user: User) -> Article:
    return get_article_for_user(db, article_id, user)


def estimate_reading_minutes(raw_text: str) -> int:
    word_count = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", raw_text))
    return max(1, math.ceil(word_count / 200))


def validate_import_word_count(raw_text: str) -> None:
    word_count = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", raw_text))
    if word_count < 80:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文章少于 80 个英文词，暂不开始分析。")
    if word_count > 2500:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文章超过 2500 个英文词，请先缩短。")


def build_draft_analysis(article: Article, raw_text: str) -> dict[str, Any]:
    paragraphs = []
    paragraph_texts = [item.strip() for item in re.split(r"\n\s*\n+", raw_text.strip()) if item.strip()]
    if not paragraph_texts and raw_text.strip():
        paragraph_texts = [raw_text.strip()]

    for paragraph_index, paragraph_text in enumerate(paragraph_texts, start=1):
        paragraphs.append(
            {
                "id": f"p{paragraph_index}",
                "order": paragraph_index,
                "originalText": paragraph_text,
                "sentences": [
                    {
                        "id": f"s{paragraph_index}_{sentence_index}",
                        "order": sentence_index,
                        "text": sentence_text,
                        "translation": "",
                        "isLongSentence": False,
                        "tokens": [],
                        "phrases": [],
                    }
                    for sentence_index, sentence_text in enumerate(split_draft_sentences(paragraph_text), start=1)
                ],
            }
        )

    return with_article_metadata(
        article,
        {
            "title": article.title,
            "topic": article.topic,
            "difficulty": article.difficulty,
            "estimatedReadingMinutes": article.estimated_reading_minutes,
            "paragraphs": paragraphs,
            "review": {
                "keyPhrases": [],
                "familiarButShiftedWords": [],
                "longSentences": [],
                "summary": "",
            },
        },
    )


def split_draft_sentences(paragraph_text: str) -> list[str]:
    matches = re.findall(r"[^.!?]+(?:[.!?]+[\"')\]]*)?", paragraph_text)
    sentences = [match.strip() for match in matches if match.strip()]
    return sentences or [paragraph_text.strip()]


def with_article_metadata(article: Article, analyzed_data: dict[str, Any]) -> dict[str, Any]:
    data = dict(analyzed_data)
    data["id"] = article.id
    data["ownerId"] = article.owner_id
    data["title"] = article.title
    data["sourceType"] = article.source_type
    data["analysisStatus"] = article.analysis_status
    data["analysisErrorMessage"] = article.analysis_error_message
    return data


def article_to_detail(article: Article) -> dict[str, Any]:
    data = dict(article.analyzed_data)
    data["id"] = article.id
    data["ownerId"] = article.owner_id
    data["title"] = article.title
    data["sourceType"] = article.source_type
    data["topic"] = article.topic
    data["difficulty"] = article.difficulty
    data["estimatedReadingMinutes"] = article.estimated_reading_minutes
    data["analysisStatus"] = article.analysis_status
    data["analysisErrorMessage"] = article.analysis_error_message
    data["createdAt"] = article.created_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    data["updatedAt"] = article.updated_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    if article.last_read_at:
        data["lastReadAt"] = article.last_read_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return data
